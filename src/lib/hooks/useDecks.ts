/**
 * React Query Hooks for Deck Data
 * Replaces the old DeckProvider context with React Query for better caching and performance
 */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */

'use client'

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { EnhancedDeck, DeckCard } from '@/types/core'

const DECKS_PER_PAGE = 50

/**
 * Commander with individual color identity for per-chip coloring
 */
export interface CommanderInfo {
  name: string
  colors: string[]
}

/**
 * Lightweight deck type for list views
 */
export interface LightweightDeck {
  id: string
  name: string
  commanders: string[]
  commanderInfos?: CommanderInfo[]
  color_identity: string[]
  bracket: number | null
  description: string | null
  view_count: number
  like_count: number
  updated_at: string
}

/**
 * Hook to fetch all decks with minimal data for fast client-side filtering
 * Optimized for search/filter UIs - only fetches fields needed for display
 */
export function useDecks() {
  return useQuery({
    queryKey: ['decks-lightweight'],
    queryFn: async (): Promise<LightweightDeck[]> => {
      const response = await fetch('/api/decks/lightweight')
      if (!response.ok) {
        throw new Error('Failed to fetch decks')
      }
      const data = await response.json()
      return data.decks || []
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  })
}

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

type CommanderData = {
  card?: { name?: string; color_identity?: string[] }
  name?: string
  color_identity?: string[]
}

/**
 * Extract commanders with their individual color identities
 * Used for per-chip color tinting in the UI
 */
function extractCommanderInfos(rawData: Record<string, unknown> | null): CommanderInfo[] {
  if (!rawData?.commanders) return []

  const commanders = rawData.commanders
  const results: CommanderInfo[] = []

  const processCommander = (c: CommanderData) => {
    const name = c?.card?.name || c?.name
    const colors = c?.card?.color_identity || c?.color_identity || []
    if (name) {
      results.push({ name, colors: Array.isArray(colors) ? colors : [] })
    }
  }

  if (Array.isArray(commanders)) {
    for (const c of commanders) { processCommander(c as CommanderData) }
  } else if (typeof commanders === 'object') {
    for (const c of Object.values(commanders as Record<string, CommanderData>)) {
      processCommander(c)
    }
  }

  return results
}

/**
 * Extract color identity from Moxfield raw_data
 * Checks multiple locations and computes from commanders as fallback
 */
function extractColorIdentity(rawData: Record<string, unknown> | null): string[] {
  // Check top-level colorIdentity (RawMoxData format)
  if (Array.isArray(rawData?.colorIdentity) && rawData.colorIdentity.length > 0) {
    return rawData.colorIdentity as string[]
  }

  // Check nested boards.colorIdentity (MoxfieldDeck format)
  const boards = rawData?.boards as Record<string, unknown> | undefined
  if (Array.isArray(boards?.colorIdentity) && (boards.colorIdentity as string[]).length > 0) {
    return boards.colorIdentity as string[]
  }

  // Fallback: compute from commander cards' color_identity
  const commanders = rawData?.commanders
  if (commanders) {
    const colorSet = new Set<string>()

    // Handle array format
    if (Array.isArray(commanders)) {
      for (const c of commanders) {
        const cmdColors = (c as { card?: { color_identity?: string[] }; color_identity?: string[] })?.card?.color_identity
          || (c as { color_identity?: string[] })?.color_identity
        if (Array.isArray(cmdColors)) {
          for (const color of cmdColors) { colorSet.add(color) }
        }
      }
    }
    // Handle object format (keyed by card ID)
    else if (typeof commanders === 'object') {
      for (const c of Object.values(commanders as Record<string, unknown>)) {
        const cmdColors = (c as { card?: { color_identity?: string[] }; color_identity?: string[] })?.card?.color_identity
          || (c as { color_identity?: string[] })?.color_identity
        if (Array.isArray(cmdColors)) {
          for (const color of cmdColors) { colorSet.add(color) }
        }
      }
    }

    if (colorSet.size > 0) {
      // Return in WUBRG order
      const order = ['W', 'U', 'B', 'R', 'G']
      return order.filter(c => colorSet.has(c))
    }
  }

  return []
}

/**
 * Hook to fetch decks with infinite scroll pagination
 * Loads decks in batches for better performance
 */
export function useDecksInfinite() {
  return useInfiniteQuery({
    queryKey: ['decks-infinite'],
    queryFn: async ({ pageParam = 0 }): Promise<{ decks: EnhancedDeck[]; nextPage: number | null; total: number }> => {
      const supabase = createClient()

      const from = pageParam * DECKS_PER_PAGE
      const to = from + DECKS_PER_PAGE - 1

      const { data, error, count } = await supabase
        .from('moxfield_decks')
        .select('moxfield_id, public_id, name, public_url, raw_data, view_count, like_count, last_updated_at, author_username, user_hidden', { count: 'exact' })
        .or('user_hidden.is.null,user_hidden.eq.false')
        .range(from, to)
        .order('view_count', { ascending: false })

      if (error) throw error

      const decks = (data || []).map((deck): EnhancedDeck => {
        const rawData = deck.raw_data as Record<string, unknown> | null
        const colorIdentity = extractColorIdentity(rawData)
        const commanders = extractCommanders(rawData)
        const commanderInfos = extractCommanderInfos(rawData)

        return {
          id: deck.moxfield_id,
          public_id: deck.moxfield_id,
          moxfield_id: deck.moxfield_id,
          moxfield_url: deck.public_url || `https://www.moxfield.com/decks/${deck.moxfield_id}`,
          name: deck.name,
          deck_title: deck.name,
          commanders,
          commanderInfos,
          color_identity: colorIdentity,
          color_string: colorIdentity.length > 0 ? colorIdentity.join('') : null,
          format: null,
          description: typeof rawData?.description === 'string' ? rawData.description : null,
          view_count: deck.view_count,
          like_count: deck.like_count,
          comment_count: null,
          author_display_name: (rawData?.createdByUser as { displayName?: string })?.displayName || deck.author_username || null,
          auto_bracket: null,
          bracket: typeof rawData?.bracket === 'number' ? rawData.bracket : null,
          main_card_id: typeof rawData?.mainCardId === 'string' ? rawData.mainCardId : null,
          cards_fetched_at: null,
          created_at: null,
          updated_at: deck.last_updated_at,
          visibility: null,
        } as unknown as EnhancedDeck
      })

      const hasMore = (pageParam + 1) * DECKS_PER_PAGE < (count || 0)

      return {
        decks,
        nextPage: hasMore ? pageParam + 1 : null,
        total: count || 0,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  })
}

/**
 * Hook to fetch a single deck by moxfield_id
 * Useful for deck detail pages to avoid fetching all decks
 */
export function useDeckInfo(id: string) {
  return useQuery({
    queryKey: ['deckInfo', id],
    queryFn: async (): Promise<EnhancedDeck | null> => {
      if (!id) return null

      const supabase = createClient()
      const { data, error } = await supabase
        .from('moxfield_decks')
        .select('id, moxfield_id, public_id, public_url, name, format, visibility, mainboard_count, sideboard_count, commanders_count, like_count, view_count, comment_count, is_legal, created_at, fetched_at, cards_fetched_at, last_updated_at, author_username, author_name, raw_data')
        .eq('moxfield_id', id)
        .limit(1)

      if (error) throw error
      if (!data || data.length === 0) throw new Error('Deck not found')

      const deck = data[0]
      const rawData = deck.raw_data as Record<string, unknown> | null
      const colorIdentity = extractColorIdentity(rawData)

      return {
        id: deck.id,
        moxfield_id: deck.moxfield_id,
        name: deck.name,
        deck_title: deck.name,
        format: deck.format,
        public_id: deck.public_id,
        public_url: deck.public_url,
        moxfield_url: deck.public_url || `https://www.moxfield.com/decks/${deck.moxfield_id}`,
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
        updated_at: deck.last_updated_at,
        author_display_name: (rawData?.createdByUser as { displayName?: string })?.displayName || deck.author_name,
        player_username: deck.author_username,
        color_identity: colorIdentity,
        color_string: colorIdentity.join(''),
        description: typeof rawData?.description === 'string' ? rawData.description : null,
        bracket: typeof rawData?.bracket === 'number' ? rawData.bracket : null,
        auto_bracket: typeof rawData?.autoBracket === 'number' ? rawData.autoBracket : null,
        has_primer: typeof rawData?.hasPrimer === 'boolean' ? rawData.hasPrimer : false,
        is_shared: typeof rawData?.isShared === 'boolean' ? rawData.isShared : false,
        bookmark_count: typeof rawData?.bookmarkCount === 'number' ? rawData.bookmarkCount : 0,
        commanders: extractCommanders(rawData),
        main_card_id: typeof rawData?.mainCardId === 'string' ? rawData.mainCardId : null,
        event_date: null,
        total_cards: deck.mainboard_count,
      } as EnhancedDeck
    },
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  })
}

/**
 * Hook to fetch deck cards (decklist)
 * Fetches all cards in a deck's mainboard
 * @param moxfieldId - The moxfield_id of the deck (used for decklist_cards FK)
 */
export function useDecklist(moxfieldId: string | undefined) {
  return useQuery({
    queryKey: ['decklist', moxfieldId],
    queryFn: async (): Promise<DeckCard[]> => {
      if (!moxfieldId) return []

      const supabase = createClient()

      // Query decklist_cards using moxfield_id (the FK column)
      const { data, error } = await supabase
        .from('decklist_cards')
        .select(`
          quantity,
          board,
          cards (
            name,
            mana_cost,
            type_line,
            cmc,
            scryfall_id,
            cached_image_url,
            layout
          )
        `)
        .eq('moxfield_deck_id', moxfieldId)
        .in('board', ['mainboard', 'commanders'])

      if (error) throw error
      return (data as DeckCard[]) || []
    },
    enabled: !!moxfieldId,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  })
}

/**
 * Combined hook to fetch both deck info and decklist
 * @param publicId - The public_id used in URLs
 * Returns both the deck metadata and its cards
 */
export function useDeck(publicId: string) {
  const deckInfo = useDeckInfo(publicId)
  // Use moxfield_id from deck info to fetch cards (decklist_cards FK uses moxfield_id)
  const decklist = useDecklist(deckInfo.data?.moxfield_id)

  return {
    data: deckInfo.data,
    cards: decklist.data,
    isLoading: deckInfo.isLoading || decklist.isLoading,
    error: deckInfo.error || decklist.error,
    isError: deckInfo.isError || decklist.isError,
    refetch: () => {
      deckInfo.refetch()
      decklist.refetch()
    },
  }
}
