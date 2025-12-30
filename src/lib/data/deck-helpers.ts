import { createClient } from '@/lib/supabase/server'
import type {
  DeckEnhanced,
  DecklistCardWithCard,
  EnhancedDeck,
} from '@/types/core'

/**
 * Extract commander names from Moxfield raw_data.commanders
 * Handles both array and object formats
 */
function extractCommanders(rawData: Record<string, unknown> | null): string[] {
  if (!rawData?.commanders) return []

  const commanders = rawData.commanders
  if (Array.isArray(commanders)) {
    return commanders.map((c: { card?: { name?: string }; name?: string }) => c?.card?.name || c?.name || '').filter(Boolean)
  }
  if (typeof commanders === 'object' && commanders !== null) {
    return Object.values(commanders as Record<string, { card?: { name?: string }; name?: string }>)
      .map((c) => c?.card?.name || c?.name || '')
      .filter(Boolean)
  }
  return []
}

/**
 * Fetch lightweight deck metadata from moxfield_decks table.
 * This is optimal for listing pages and search results.
 * Does NOT include card arrays.
 *
 * @param moxfieldId - The Moxfield deck ID
 * @returns Deck with flattened metadata
 * @throws Error if deck not found or database error occurs
 */
export async function getDeckMetadata(
  moxfieldId: string
): Promise<DeckEnhanced> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('moxfield_decks')
    .select('*')
    .eq('moxfield_id', moxfieldId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch deck metadata: ${error.message}`)
  }

  if (!data) {
    throw new Error(`Deck not found: ${moxfieldId}`)
  }

  const rawData = data.raw_data as Record<string, unknown> | null

  return {
    id: data.id,
    moxfield_id: data.moxfield_id,
    name: data.name,
    format: data.format,
    public_id: data.public_id,
    public_url: data.public_url,
    moxfield_url: data.public_url,
    visibility: data.visibility,
    mainboard_count: data.mainboard_count,
    sideboard_count: data.sideboard_count,
    commanders_count: data.commanders_count,
    like_count: data.like_count,
    view_count: data.view_count,
    comment_count: data.comment_count,
    is_legal: data.is_legal,
    created_at: data.created_at,
    fetched_at: data.fetched_at,
    cards_fetched_at: data.cards_fetched_at,
    last_updated_at: data.last_updated_at,
    author_display_name: (rawData?.createdByUser as { displayName?: string })?.displayName || data.author_name,
    color_identity: Array.isArray(rawData?.colorIdentity) ? rawData.colorIdentity : [],
    description: typeof rawData?.description === 'string' ? rawData.description : null,
    bracket: typeof rawData?.bracket === 'number' ? rawData.bracket : null,
    auto_bracket: typeof rawData?.autoBracket === 'number' ? rawData.autoBracket : null,
    has_primer: typeof rawData?.hasPrimer === 'boolean' ? rawData.hasPrimer : false,
    is_shared: typeof rawData?.isShared === 'boolean' ? rawData.isShared : false,
    bookmark_count: typeof rawData?.bookmarkCount === 'number' ? rawData.bookmarkCount : 0,
    commanders: extractCommanders(rawData),
    main_card_id: typeof rawData?.mainCardId === 'string' ? rawData.mainCardId : null,
    color_string: Array.isArray(rawData?.colorIdentity) ? (rawData.colorIdentity as string[]).join('') : '',
    deck_title: data.name,
    player_username: data.author_username,
  } as DeckEnhanced
}

/**
 * Fetch cards for a specific board (commanders, mainboard, sideboard, etc.)
 *
 * @param moxfieldId - The Moxfield deck ID
 * @param board - The board type (e.g., 'commanders', 'mainboard', 'sideboard')
 * @returns Array of cards with full card details
 */
export async function getDeckCards(
  moxfieldId: string,
  board: string
): Promise<DecklistCardWithCard[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('decklist_cards')
    .select(
      `
      *,
      cards (
        id,
        name,
        mana_cost,
        type_line,
        cmc,
        scryfall_id,
        cached_image_url,
        color_identity,
        colors,
        oracle_text,
        rarity,
        layout
      )
    `
    )
    .eq('moxfield_deck_id', moxfieldId)
    .eq('board', board)

  if (error) {
    throw new Error(`Failed to fetch deck cards: ${error.message}`)
  }

  return (data || []) as DecklistCardWithCard[]
}

/**
 * Fetch all cards for a deck (commanders, mainboard, sideboard).
 * Returns an object with separate arrays for each board type.
 *
 * @param moxfieldId - The Moxfield deck ID
 * @returns Object containing card arrays for each board
 */
export async function getAllDeckCards(moxfieldId: string): Promise<{
  commanders: DecklistCardWithCard[]
  mainboard: DecklistCardWithCard[]
  sideboard: DecklistCardWithCard[]
  maybeboard: DecklistCardWithCard[]
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('decklist_cards')
    .select(
      `
      *,
      cards (
        id,
        name,
        mana_cost,
        type_line,
        cmc,
        scryfall_id,
        cached_image_url,
        color_identity,
        colors,
        oracle_text,
        rarity,
        layout
      )
    `
    )
    .eq('moxfield_deck_id', moxfieldId)

  if (error) {
    throw new Error(`Failed to fetch deck cards: ${error.message}`)
  }

  const cards = (data || []) as DecklistCardWithCard[]

  return {
    commanders: cards.filter((c) => c.board === 'commanders'),
    mainboard: cards.filter((c) => c.board === 'mainboard'),
    sideboard: cards.filter((c) => c.board === 'sideboard'),
    maybeboard: cards.filter((c) => c.board === 'maybeboard'),
  }
}

/**
 * Fetch complete deck with metadata AND all card lists.
 * This is the most comprehensive fetch, ideal for deck detail pages.
 *
 * @param moxfieldId - The Moxfield deck ID
 * @returns Complete deck with metadata and all cards
 * @throws Error if deck not found or database error occurs
 *
 * @example
 * ```typescript
 * const deck = await getDeckWithCards('abc123')
 * console.log(deck.name)
 * console.log(deck.commanders?.[0].cards?.name)
 * console.log(deck.mainboard?.length)
 * ```
 */
export async function getDeckWithCards(
  moxfieldId: string
): Promise<EnhancedDeck> {
  const [metadata, cards] = await Promise.all([
    getDeckMetadata(moxfieldId),
    getAllDeckCards(moxfieldId),
  ])

  return {
    ...metadata,
    ...cards,
  }
}

/**
 * Transform a lightweight deck by adding card data to it.
 * Useful when you already have the deck metadata and want to add cards.
 *
 * @param deck - The lightweight deck metadata
 * @param cards - The card data to add
 * @returns Enhanced deck with metadata and cards
 *
 * @example
 * ```typescript
 * const deck = await getDeckMetadata('abc123')
 * const commanders = await getDeckCards('abc123', 'commanders')
 * const mainboard = await getDeckCards('abc123', 'mainboard')
 * const enhanced = toDeckEnhanced(deck, { commanders, mainboard })
 * ```
 */
export function toDeckEnhanced(
  deck: DeckEnhanced,
  cards: {
    commanders?: DecklistCardWithCard[]
    mainboard?: DecklistCardWithCard[]
    sideboard?: DecklistCardWithCard[]
    maybeboard?: DecklistCardWithCard[]
  }
): EnhancedDeck {
  return {
    ...deck,
    commanders: cards.commanders,
    mainboard: cards.mainboard,
    sideboard: cards.sideboard,
    maybeboard: cards.maybeboard,
  }
}

/**
 * Fetch multiple decks with metadata (no cards).
 * Useful for listing pages with pagination.
 *
 * @param options - Query options (limit, offset, filters)
 * @returns Array of lightweight deck metadata
 *
 * @example
 * ```typescript
 * const decks = await getDecks({ limit: 20, offset: 0 })
 * ```
 */
export async function getDecks(options?: {
  limit?: number
  offset?: number
  orderBy?: {
    column: string
    ascending?: boolean
  }
}): Promise<DeckEnhanced[]> {
  const supabase = await createClient()

  let query = supabase.from('moxfield_decks').select('*')

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? false,
    })
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch decks: ${error.message}`)
  }

  // Transform moxfield_decks rows to DeckEnhanced format
  return (data || []).map((deck) => {
    const rawData = deck.raw_data as Record<string, unknown> | null

    return {
      id: deck.id,
      moxfield_id: deck.moxfield_id,
      name: deck.name,
      format: deck.format,
      public_id: deck.public_id,
      public_url: deck.public_url,
      moxfield_url: deck.public_url,
      visibility: deck.visibility,
      mainboard_count: deck.mainboard_count,
      sideboard_count: deck.sideboard_count,
      commanders_count: deck.commanders_count,
      like_count: deck.like_count,
      view_count: deck.view_count,
      comment_count: deck.comment_count,
      is_legal: deck.is_legal,
      created_at: deck.created_at,
      fetched_at: deck.fetched_at,
      cards_fetched_at: deck.cards_fetched_at,
      last_updated_at: deck.last_updated_at,
      author_display_name: (rawData?.createdByUser as { displayName?: string })?.displayName || deck.author_name,
      color_identity: Array.isArray(rawData?.colorIdentity) ? rawData.colorIdentity : [],
      description: typeof rawData?.description === 'string' ? rawData.description : null,
      bracket: typeof rawData?.bracket === 'number' ? rawData.bracket : null,
      auto_bracket: typeof rawData?.autoBracket === 'number' ? rawData.autoBracket : null,
      has_primer: typeof rawData?.hasPrimer === 'boolean' ? rawData.hasPrimer : false,
      is_shared: typeof rawData?.isShared === 'boolean' ? rawData.isShared : false,
      bookmark_count: typeof rawData?.bookmarkCount === 'number' ? rawData.bookmarkCount : 0,
      commanders: extractCommanders(rawData),
      main_card_id: typeof rawData?.mainCardId === 'string' ? rawData.mainCardId : null,
      color_string: Array.isArray(rawData?.colorIdentity) ? (rawData.colorIdentity as string[]).join('') : '',
      deck_title: deck.name,
      player_username: deck.author_username,
    } as DeckEnhanced
  })
}
