/**
 * Supabase Client for Middleware
 * Use this in Next.js middleware for session management
 */
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { db } from '@/types/supabase'

// Tiers that can access protected content (Duke and above)
const ALLOWED_TIERS = ['Duke', 'Wizard', 'ArchMage']
// Roles that bypass tier checks
const BYPASS_ROLES = ['admin', 'moderator', 'developer']

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/patreon',
  '/auth/patreon-callback',
  '/about',
]

// Routes that start with these prefixes are public
const PUBLIC_PREFIXES = [
  '/api/',
  '/_next/',
  '/auth/',
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<db>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))

  // Allow public routes without auth
  if (isPublicRoute) {
    return supabaseResponse
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // For admin routes, check authentication (tier check handled below)
  if (pathname.startsWith('/admin')) {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'user'

    // Only admin/moderator/developer can access admin routes
    if (!BYPASS_ROLES.includes(userRole)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // For all other protected routes, check tier (Duke+) or role
  const { data: profile } = await supabase
    .from('profiles')
    .select('patreon_tier, role')
    .eq('id', user.id)
    .single()

  const userTier = profile?.patreon_tier || 'Citizen'
  const userRole = profile?.role || 'user'

  // Allow if user has bypass role or allowed tier
  if (BYPASS_ROLES.includes(userRole) || ALLOWED_TIERS.includes(userTier)) {
    return supabaseResponse
  }

  // User is authenticated but doesn't have required tier - redirect to upgrade page or home
  const url = request.nextUrl.clone()
  url.pathname = '/'
  return NextResponse.redirect(url)
}
