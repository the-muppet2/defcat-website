'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth/client'
import { useAuthOverlay } from '@/components/auth/AuthRequiredOverlay'
import { TIER_RANKS, type PatreonTier } from '@/types/core'

const BYPASS_ROLES = ['admin', 'moderator', 'developer']

interface UseProtectedRouteOptions {
  requiredTier?: PatreonTier
  requireAuth?: boolean
  /** When true, bypass tier check entirely. When undefined, defer the check (useful while loading ownership data). */
  bypass?: boolean
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { requiredTier = 'Knight', requireAuth = true, bypass } = options
  const { isAuthenticated, profile, isLoading } = useAuth()
  const { showAuthOverlay, showTierOverlay, hideOverlay } = useAuthOverlay()

  useEffect(() => {
    if (isLoading) return

    // If bypass is explicitly true, dismiss any overlay
    if (bypass === true) {
      hideOverlay()
      return
    }

    // If bypass is undefined, defer the check (ownership still loading)
    if (bypass === undefined) return

    if (requireAuth && !isAuthenticated) {
      showAuthOverlay()
      return
    }

    if (isAuthenticated && requiredTier) {
      const hasBypassRole = BYPASS_ROLES.includes(profile.role)
      if (!hasBypassRole) {
        const userTierRank = profile.tier && profile.tier in TIER_RANKS
          ? TIER_RANKS[profile.tier as PatreonTier]
          : 0
        const requiredTierRank = TIER_RANKS[requiredTier]

        if (userTierRank < requiredTierRank) {
          showTierOverlay()
        }
      }
    }
  }, [isLoading, isAuthenticated, profile, requiredTier, requireAuth, bypass, showAuthOverlay, showTierOverlay, hideOverlay])

  return {
    isLoading,
    isAuthorized: bypass === true || (isAuthenticated && (
      BYPASS_ROLES.includes(profile.role) ||
      (profile.tier && profile.tier in TIER_RANKS && TIER_RANKS[profile.tier as PatreonTier] >= TIER_RANKS[requiredTier])
    ))
  }
}
