/** DO NOT REMOVE OR RENAME THIS FILE!
 * 
 * Next.js Middleware
 * Runs on Edge Runtime before every request
 * Handles broad authentication and route-level authorization
 *
 * Access Control:
 * - Public routes: Landing page only (/)
 * - Protected routes: Require Duke+ tier or admin/mod/dev role
 * - Admin routes: Require admin/moderator/developer role
 */
/** biome-ignore-all assist/source/organizeImports: <explanation> */
/** biome-ignore-all lint/correctness/noUnusedImports: <explanation> */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/observability/logger'
import { type PatreonTier, TIER_RANKS } from './types/core'

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Default minimum tier for protected content
const DEFAULT_MINIMUM_TIER: PatreonTier = 'Duke'
// Roles that bypass tier checks and can access admin
const BYPASS_ROLES = ['admin', 'moderator', 'developer']

const PUBLIC_ROUTES = [
  '/',
  '/decks',
  '/auth/login',
  '/auth/patreon',
  '/auth/patreon-callback',
  '/auth/signup',
  '/api/webhooks',
]

// Routes with specific tier requirements
const TIER_ROUTES: Array<{ pattern: RegExp; tier: PatreonTier }> = [
  { pattern: /^\/decks\/[^/]+/, tier: 'Duke' },     // /decks/[id] requires Duke+
  { pattern: /^\/profile(\/|$)/, tier: 'Citizen' }, // /profile and /profile/[id] require Citizen+
  { pattern: /^\/home\/?$/, tier: 'Citizen' },      // /home requires Citizen+
]

function isPublicRoute(pathname: string): boolean {
  // Exact match for public routes (don't match subroutes except for specific prefixes)
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true
  }
  // Auth routes are public
  if (pathname.startsWith('/auth/')) {
    return true
  }
  // API routes handle their own auth
  if (pathname.startsWith('/api/')) {
    return true
  }
  return false
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin')
}

function getRequiredTier(pathname: string): PatreonTier {
  for (const route of TIER_ROUTES) {
    if (route.pattern.test(pathname)) {
      return route.tier
    }
  }
  return DEFAULT_MINIMUM_TIER
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = generateRequestId()

  // Public routes don't need auth
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next()
    response.headers.set('X-Request-ID', requestId)
    return response
  }

  logger.debug('Processing protected route', { requestId, pathname })

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not authenticated - let through, client-side overlay will handle it
  if (!user) {
    logger.debug('Unauthenticated user on protected route', { requestId, pathname })
    response.headers.set('X-Request-ID', requestId)
    response.headers.set('X-Auth-Required', 'true')
    return response
  }

  // Get user profile with tier and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, patreon_tier')
    .eq('id', user.id)
    .single<{ role: string | null; patreon_tier: string | null }>()

  const userRole = profile?.role || 'user'
  const userTier = (profile?.patreon_tier as PatreonTier) || null

  // Admin routes require bypass role
  if (isAdminRoute(pathname)) {
    if (!BYPASS_ROLES.includes(userRole)) {
      logger.warn('User lacks admin access', { requestId, pathname, userRole, userId: user.id })
      const homeUrl = new URL('/', request.url)
      homeUrl.searchParams.set('error', 'unauthorized')
      const redirectResponse = NextResponse.redirect(homeUrl)
      redirectResponse.headers.set('X-Request-ID', requestId)
      return redirectResponse
    }
    response.headers.set('X-Request-ID', requestId)
    return response
  }

  // All other routes require minimum tier OR bypass role
  const requiredTier = getRequiredTier(pathname)
  const hasBypassRole = BYPASS_ROLES.includes(userRole)
  const userTierRank = userTier ? (TIER_RANKS[userTier] ?? 0) : 0
  const requiredTierRank = TIER_RANKS[requiredTier]
  const hasSufficientTier = userTierRank >= requiredTierRank

  logger.info('Access check', {
    requestId,
    pathname,
    userTier,
    userTierRank,
    requiredTier,
    requiredTierRank,
    hasSufficientTier,
    hasBypassRole
  })

  // Tier check - let through, client-side overlay will handle it
  if (!hasBypassRole && !hasSufficientTier) {
    logger.debug('User lacks required tier for route', {
      requestId,
      pathname,
      userTier,
      userRole,
      requiredTier,
      userId: user.id
    })
    response.headers.set('X-Request-ID', requestId)
    response.headers.set('X-Tier-Required', requiredTier)
    return response
  }

  logger.debug('User authorized for protected route', { requestId, pathname, userRole, userTier, userId: user.id })
  response.headers.set('X-Request-ID', requestId)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}