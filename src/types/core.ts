import { Database } from './supabase/generated'

export type Deck = Database['public']['Views']['decks_enhanced']['Row']
export type DeckInsert = Database['public']['Tables']['moxfield_decks']['Insert']
export type DeckUpdate = Database['public']['Tables']['moxfield_decks']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Card = Database['public']['Tables']['cards']['Row']
export type CardInsert = Database['public']['Tables']['cards']['Insert']
export type CardUpdate = Database['public']['Tables']['cards']['Update']

export type DecklistCard = Database['public']['Tables']['decklist_cards']['Row']
export type DecklistCardInsert = Database['public']['Tables']['decklist_cards']['Insert']
export type DecklistCardUpdate = Database['public']['Tables']['decklist_cards']['Update']

export type CreditType = Database['public']['Tables']['credit_types']['Row']
export type Tier = Database['public']['Tables']['tiers']['Row']
export type UserCredits = Database['public']['Tables']['user_credits']['Row']

export type _DeckSubmission = Database['public']['Tables']['deck_submissions']['Row']
export type DeckSubmissionInsert = Database['public']['Tables']['deck_submissions']['Insert']
export type DeckSubmissionUpdate = Database['public']['Tables']['deck_submissions']['Update']

// Database Views
export type DeckInfo = Database['public']['Views']['mox_decks']['Row']
export type FullCard = Database['public']['Views']['deck_list_view']['Row']

// JSON type from database
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]


export type DeckWithCards = Deck & {
  decklist_cards: (DecklistCard & {
    cards: Card
  })[]
}

export type DecklistCardWithCard = DecklistCard & {
  cards: Card | null
}

export type FullDeck = Deck & {
  commanders: DecklistCardWithCard[]
  mainboard: DecklistCardWithCard[]
  sideboard: DecklistCardWithCard[]
}

// Helper for joined deck card data
export interface DeckCard {
  quantity: number
  board: string
  cards: {
    name: string
    mana_cost: string | null
    type_line: string | null
    cmc: number | null
    scryfall_id: string | null
    cached_image_url: string | null
    layout: string | null
  } | null
}

export interface User {
  id: string
  email: string
  patreonId?: string
  patreonTier?: PatreonTier
  moxfieldId?: string
  role: UserRole
}

export interface Session {
  user: User
  accessToken: string
  expiresAt: number
}

export interface DeckFilters {
  commanders?: string[]
  colors?: string[]
  archetype?: string
  search?: string
}

export type PatreonTier = 'Citizen' | 'Knight' | 'Emissary' | 'Duke' | 'Wizard' | 'ArchMage'

export const PATREON_TIERS: PatreonTier[] = [
  'Citizen',
  'Knight',
  'Emissary',
  'Duke',
  'Wizard',
  'ArchMage',
]

export const TIER_RANKS: Record<PatreonTier, number> = {
  Citizen: 0,
  Knight: 1,
  Emissary: 2,
  Duke: 3,
  Wizard: 4,
  ArchMage: 5,
}

export type UserRole = 'user' | 'member' | 'admin' | 'moderator' | 'developer'
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  member: 1,
  moderator: 2,
  admin: 3,
  developer: 4,
}

export const bracketOptions = [
  { value: '1', label: 'Bracket 1', description: 'Casual, precon level' },
  { value: '2', label: 'Bracket 2', description: 'Focused casual' },
  { value: '3', label: 'Bracket 3', description: 'Optimized casual' },
  { value: '4', label: 'Bracket 4', description: 'High power' },
  { value: '5', label: 'Bracket 5', description: 'Fringe competitive' },
] as const

export const defCatBracketOptions = [
  { value: 'bracket1', label: 'Bracket 1', description: 'Casual, precon level' },
  { value: 'bracket2', label: 'Bracket 2', description: 'Focused casual' },
  { value: 'bracket3', label: 'Bracket 3', description: 'Optimized casual' },
  { value: 'bracket4', label: 'Bracket 4', description: 'High power' },
  { value: 'bracket5', label: 'Bracket 5', description: 'Fringe competitive' },
  { value: 'cedh', label: 'cEDH', description: 'Perfect tournament optimized deck' },
  { value: 'wild', label: 'GO WILD', description: "I DON'T CARE GO FOR IT DEFCAT" },
] as const

export type ScryfallImageSize = 'png' | 'art' | 'lg' | 'md' | 'sm'
export type CardFace = 'front' | 'back'

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
}

export interface ApiError {
  message: string
  code: string
  details?: unknown
}

/**
 * Lightweight deck type with flattened metadata from raw_data JSONB.
 * This type is backed by the decks_enhanced database view for optimal query performance.
 * Does NOT include card arrays or raw_data - use EnhancedDeck or helper functions when cards are needed.
 *
 * Includes:
 * - All base deck fields (id, moxfield_id, name, format, etc.)
 * - Flattened properties: color_identity, description, moxfield_url, bracket, has_primer, etc.
 * - Parsed name components: event_date, player_username, deck_title
 * - Computed properties: color_string, total_cards
 * - Author info: author_display_name (from Moxfield createdByUser)
 *
 * @example
 * ```typescript
 * const deck: DeckEnhanced = await supabase
 *   .from('decks_enhanced')
 *   .select('*')
 *   .eq('moxfield_id', id)
 *   .single()
 *
 * console.log(deck.color_identity) // ["W", "U", "B", "G"]
 * console.log(deck.moxfield_url) // "https://www.moxfield.com/decks/abc123"
 * console.log(deck.total_cards) // 100
 * console.log(deck.event_date) // "07/29"
 * console.log(deck.player_username) // "Belaras"
 * console.log(deck.deck_title) // "Alex Custom Deck"
 * ```
 */
export type DeckEnhanced = Database['public']['Views']['decks_enhanced']['Row'] & {
  color_identity: string[] // Override Json type with proper array type
}

/**
 * Commander with individual color identity for per-chip coloring
 */
export interface CommanderInfo {
  name: string
  colors: string[]
}

/**
 * Full deck type with all metadata AND card arrays for detail pages.
 * Extends DeckEnhanced with optional card lists.
 * Use getDeckWithCards() helper function to fetch this data.
 *
 * @example
 * ```typescript
 * const deck: EnhancedDeck = await getDeckWithCards(id)
 * console.log(deck.commanders?.[0].cards?.name) // "Atraxa, Praetors' Voice"
 * console.log(deck.mainboard?.length) // 99
 * console.log(deck.color_identity) // ["W", "U", "B", "G"]
 * console.log(deck.moxfield_url) // "https://www.moxfield.com/decks/abc123"
 * ```
 */
export type EnhancedDeck = DeckEnhanced & {
  commanders?: DecklistCardWithCard[]
  commanderInfos?: CommanderInfo[]
  mainboard?: DecklistCardWithCard[]
  sideboard?: DecklistCardWithCard[]
  maybeboard?: DecklistCardWithCard[]
}