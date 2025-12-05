/**
 * Patreon API Client
 * Handles fetching user membership data and tier information
 */

import type { PatreonTier } from '@/types/core'
import { logger } from '@/lib/observability/logger'

interface PatreonSocialConnections {
  discord?: {
    user_id: string
    url?: string
  } | null
  twitter?: {
    user_id: string
    url?: string
  } | null
  youtube?: {
    user_id: string
    url?: string
  } | null
  twitch?: {
    user_id: string
    url?: string
  } | null
}

interface PatreonMember {
  data: {
    id: string
    attributes: {
      email: string
      full_name: string
      patron_status: string | null
      social_connections?: PatreonSocialConnections
    }
    relationships: {
      memberships: {
        data: Array<{ id: string; type: string }>
      }
    }
  }
  included?: Array<{
    id: string
    type: string
    attributes: {
      currently_entitled_amount_cents: number
      patron_status: string
    }
  }>
}

/**
 * Determine user's tier based on Patreon pledge amount
 */
export function determineTier(pledgeAmountCents: number): PatreonTier {
  if (pledgeAmountCents >= 25000) return 'ArchMage'
  if (pledgeAmountCents >= 16500) return 'Wizard'
  if (pledgeAmountCents >= 5000) return 'Duke'
  if (pledgeAmountCents >= 3000) return 'Emissary'
  if (pledgeAmountCents >= 1000) return 'Knight'
  return 'Citizen'
}

export interface PatreonMembershipResult {
  tier: PatreonTier
  patreonId: string
  discordId: string | null
}

/**
 * Fetch user's Patreon membership data including social connections
 */
export async function fetchPatreonMembership(
  accessToken: string
): Promise<PatreonMembershipResult> {
  const response = await fetch(
    'https://www.patreon.com/api/oauth2/v2/identity?include=memberships&fields[user]=email,full_name,social_connections&fields[member]=currently_entitled_amount_cents,patron_status',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    logger.error('Patreon API request failed', undefined, {
      status: response.status,
      statusText: response.statusText,
    })
    throw new Error(`Patreon API error: ${response.statusText}`)
  }

  const data: PatreonMember = await response.json()

  // Extract Discord ID from social connections
  const discordId = data.data.attributes.social_connections?.discord?.user_id || null

  logger.debug('Patreon membership data retrieved', {
    patreonId: data.data.id,
    patronStatus: data.included?.[0]?.attributes.patron_status,
    hasDiscordLinked: !!discordId,
  })

  // Extract user ID
  const patreonId = data.data.id

  // Find active membership
  const activeMembership = data.included?.find(
    (item) =>
      item.type === 'member' &&
      (item.attributes.patron_status === 'active_patron' ||
        item.attributes.patron_status === 'declined_patron')
  )

  // Determine tier from pledge amount
  const pledgeAmountCents = activeMembership?.attributes.currently_entitled_amount_cents || 0
  const tier = determineTier(pledgeAmountCents)

  return { tier, patreonId, discordId }
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
  const params = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: process.env.PATREON_CLIENT_ID!,
    client_secret: process.env.PATREON_CLIENT_SECRET!,
    redirect_uri: redirectUri,
  })

  const response = await fetch('https://www.patreon.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error('Patreon token exchange failed', undefined, {
      status: response.status,
      statusText: response.statusText,
    })
    throw new Error(`Patreon token exchange failed: ${response.statusText}`)
  }

  const data = await response.json()
  logger.info('Patreon token exchange successful')
  return data.access_token
}
