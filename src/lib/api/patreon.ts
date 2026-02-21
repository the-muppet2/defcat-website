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

interface PatreonRelationshipRef {
  data: { id: string; type: string } | null
}

interface PatreonRelationshipRefList {
  data: Array<{ id: string; type: string }>
}

interface PatreonMemberItem {
  id: string
  type: 'member'
  attributes: {
    currently_entitled_amount_cents: number
    patron_status: string
  }
  relationships?: {
    campaign?: PatreonRelationshipRef
    currently_entitled_tiers?: PatreonRelationshipRefList
  }
}

interface PatreonTierItem {
  id: string
  type: 'tier'
  attributes: {
    title: string
    amount_cents: number
  }
}

interface PatreonCampaignItem {
  id: string
  type: 'campaign'
  attributes: {
    creation_name: string
  }
}

type PatreonIncludedItem = PatreonMemberItem | PatreonTierItem | PatreonCampaignItem

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
  included?: PatreonIncludedItem[]
}

/**
 * Determine user's tier based on Patreon pledge amount
 * Thresholds match Patreon tier pricing:
 * - ArchMage: $250+ (Arch Mage [Custom Video])
 * - Wizard: $85+ (Court Wizard)
 * - Duke: $50+ (Duke [Custom Deck!])
 * - Emissary: $30+ (Foreign Emissary [Deck Roast / Fix])
 * - Knight: $10+ (Knight of the Square Table)
 * - Citizen: <$10 (Citizen of the Land [Discord Access])
 */
export function determineTier(pledgeAmountCents: number): PatreonTier {
  if (pledgeAmountCents >= 25000) return 'ArchMage'
  if (pledgeAmountCents >= 8500) return 'Wizard'
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
    'https://www.patreon.com/api/oauth2/v2/identity?include=memberships,memberships.campaign,memberships.currently_entitled_tiers&fields[user]=email,full_name,social_connections&fields[member]=currently_entitled_amount_cents,patron_status&fields[tier]=title,amount_cents&fields[campaign]=creation_name',
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

  // Extract user ID
  const patreonId = data.data.id

  // Separate included items by type
  const members = (data.included?.filter((i): i is PatreonMemberItem => i.type === 'member')) ?? []
  const tiers = (data.included?.filter((i): i is PatreonTierItem => i.type === 'tier')) ?? []
  const campaigns = (data.included?.filter((i): i is PatreonCampaignItem => i.type === 'campaign')) ?? []

  logger.info('Patreon membership data retrieved', {
    patreonId,
    members: members.map((m) => ({
      id: m.id,
      patronStatus: m.attributes.patron_status,
      pledgeCents: m.attributes.currently_entitled_amount_cents,
      campaignId: m.relationships?.campaign?.data?.id,
    })),
    tiers: tiers.map((t) => ({
      id: t.id,
      title: t.attributes.title,
      amountCents: t.attributes.amount_cents,
    })),
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.attributes.creation_name,
    })),
    hasDiscordLinked: !!discordId,
  })

  // Filter to active memberships
  const activeMembers = members.filter(
    (m) =>
      m.attributes.patron_status === 'active_patron' ||
      m.attributes.patron_status === 'declined_patron'
  )

  // Pick the right membership: filter by campaign ID if configured, else use highest pledge
  const campaignId = process.env.PATREON_CAMPAIGN_ID
  let activeMembership: PatreonMemberItem | undefined

  if (campaignId) {
    activeMembership = activeMembers.find(
      (m) => m.relationships?.campaign?.data?.id === campaignId
    )
    if (!activeMembership && activeMembers.length > 0) {
      logger.warn('No membership found for configured campaign, check PATREON_CAMPAIGN_ID', {
        patreonId,
        configuredCampaignId: campaignId,
        availableCampaignIds: activeMembers.map((m) => m.relationships?.campaign?.data?.id),
      })
    }
  } else {
    // No campaign ID configured - pick membership with highest pledge
    activeMembership = activeMembers.sort(
      (a, b) => b.attributes.currently_entitled_amount_cents - a.attributes.currently_entitled_amount_cents
    )[0]

    if (activeMembers.length > 1) {
      logger.warn(
        'Multiple active memberships found. Set PATREON_CAMPAIGN_ID env var to filter to your campaign.',
        {
          patreonId,
          memberships: activeMembers.map((m) => ({
            campaignId: m.relationships?.campaign?.data?.id,
            pledgeCents: m.attributes.currently_entitled_amount_cents,
          })),
        }
      )
    }
  }

  // Get pledge amount from membership
  let pledgeAmountCents = activeMembership?.attributes.currently_entitled_amount_cents || 0

  // Fallback: if $0 but active, check entitled tier objects for amount
  if (
    pledgeAmountCents === 0 &&
    activeMembership?.attributes.patron_status === 'active_patron'
  ) {
    // Find tiers linked to this specific membership (don't fall back to unrelated tiers)
    const entitledTierIds =
      activeMembership.relationships?.currently_entitled_tiers?.data?.map((t) => t.id) ?? []
    const entitledTier = tiers.find((t) => entitledTierIds.includes(t.id))

    if (entitledTier) {
      pledgeAmountCents = entitledTier.attributes.amount_cents
      logger.warn('Patreon API $0 bug: using tier amount_cents as fallback', {
        patreonId,
        membershipId: activeMembership.id,
        tierTitle: entitledTier.attributes.title,
        tierAmountCents: entitledTier.attributes.amount_cents,
      })
    } else {
      logger.warn('Patreon API $0 bug: active_patron with no entitled tier data', {
        patreonId,
        membershipId: activeMembership.id,
      })
    }
  }

  if (!activeMembership) {
    logger.warn('No active Patreon membership found', {
      patreonId,
      includedCount: data.included?.length ?? 0,
      memberStatuses: members.map((m) => m.attributes.patron_status),
    })
  }

  const tier = determineTier(pledgeAmountCents)

  logger.info('Patreon tier determined', {
    patreonId,
    pledgeAmountCents,
    tier,
    campaignId: activeMembership?.relationships?.campaign?.data?.id,
    patronStatus: activeMembership?.attributes.patron_status ?? 'no_membership',
  })

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
