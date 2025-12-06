'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth/client'
import { useAuthOverlay } from '@/components/auth/AuthRequiredOverlay'
import { TIER_RANKS, type PatreonTier } from '@/types/core'

const BYPASS_ROLES = ['admin', 'moderator', 'developer']

interface UseProtectedRouteOptions {
  requiredTier?: PatreonTier
  requireAuth?: boolean
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { requiredTier = 'Duke', requireAuth = true } = options
  const { isAuthenticated, profile, isLoading } = useAuth()
  const { showAuthOverlay, showTierOverlay } = useAuthOverlay()

  useEffect(() => {
    if (isLoading) return

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
  }, [isLoading, isAuthenticated, profile, requiredTier, requireAuth, showAuthOverlay, showTierOverlay])

  return {
    isLoading,
    isAuthorized: isAuthenticated && (
      BYPASS_ROLES.includes(profile.role) ||
      (profile.tier && profile.tier in TIER_RANKS && TIER_RANKS[profile.tier as PatreonTier] >= TIER_RANKS[requiredTier])
    )
  }
}
