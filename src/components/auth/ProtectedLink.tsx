'use client'

import NextLink from 'next/link'
import { type ComponentProps, type MouseEvent } from 'react'
import { useAuth } from '@/lib/auth/client'
import { useAuthOverlay } from './AuthRequiredOverlay'
import { TIER_RANKS, type PatreonTier } from '@/types/core'

const BYPASS_ROLES = ['admin', 'moderator', 'developer']

// Define protected route patterns and their tier requirements
const PROTECTED_ROUTES: Array<{ pattern: RegExp; tier: PatreonTier }> = [
  { pattern: /^\/decks\/[^/]+/, tier: 'Duke' },      // /decks/[id] requires Duke+
  { pattern: /^\/profile\/[^/]+/, tier: 'Citizen' }, // /profile/[id] requires Citizen+
]

function getRequiredTier(pathname: string): PatreonTier | null {
  for (const route of PROTECTED_ROUTES) {
    if (route.pattern.test(pathname)) {
      return route.tier
    }
  }
  return null
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => route.pattern.test(pathname))
}

type LinkProps = ComponentProps<typeof NextLink>

export function Link(props: LinkProps) {
  const { onClick, children, href, ...rest } = props
  const { isAuthenticated, profile, isLoading } = useAuth()
  const { showAuthOverlay, showTierOverlay } = useAuthOverlay()

  // Get the pathname from href
  const pathname = typeof href === 'string' ? href : href.pathname || ''
  const requiredTier = getRequiredTier(pathname)

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // If not a protected route, proceed normally
    if (!requiredTier) {
      if (onClick) {
        (onClick as (e: MouseEvent<HTMLAnchorElement>) => void)(e)
      }
      return
    }

    // If still loading auth state, let the navigation proceed
    // The middleware will handle it as fallback
    if (isLoading) {
      if (onClick) {
        (onClick as (e: MouseEvent<HTMLAnchorElement>) => void)(e)
      }
      return
    }

    // Check auth first
    if (!isAuthenticated) {
      e.preventDefault()
      showAuthOverlay()
      return
    }

    // Check tier if authenticated
    const hasBypassRole = BYPASS_ROLES.includes(profile.role)
    if (!hasBypassRole) {
      const userTierRank = profile.tier && profile.tier in TIER_RANKS
        ? TIER_RANKS[profile.tier as PatreonTier]
        : 0
      const requiredTierRank = TIER_RANKS[requiredTier]

      if (userTierRank < requiredTierRank) {
        e.preventDefault()
        showTierOverlay()
        return
      }
    }

    // All checks passed, proceed with navigation
    if (onClick) {
      (onClick as (e: MouseEvent<HTMLAnchorElement>) => void)(e)
    }
  }

  return (
    <NextLink {...rest} href={href} onClick={handleClick}>
      {children}
    </NextLink>
  )
}

// Also export as default for easy import replacement
export default Link

// Keep the explicit ProtectedLink for backwards compatibility
export const ProtectedLink = Link
