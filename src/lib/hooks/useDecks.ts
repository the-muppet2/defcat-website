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
        .select('moxfield_id, moxfield_url, name, raw_data, view_count, like_count, last_updated_at', { count: 'exact' })
        .range(from, to)
        .order('view_count', { ascending: false })

      if (error) throw error

      const decks = (data || []).map(
        (deck): EnhancedDeck => ({
          id: deck.moxfield_id,
          moxfield_id: deck.moxfield_id,
          moxfield_url: deck.moxfield_url,
          name: deck.name,
          commanders: deck.raw_data?.commanders?.map((c: any) => c.name).filter(Boolean) || [],
          color_identity: deck.raw_data?.colorIdentity || [],
          color_string: null,
          format: null,
          description: deck.raw_data?.description || null,
          view_count: deck.view_count,
          like_count: deck.like_count,
          comment_count: null,
          author_display_name: null,
          auto_bracket: null,
          bracket: null,
          cards_fetched_at: null,
          created_at: null,
          updated_at: deck.last_updated_at,
          visibility: null,
        } as unknown as EnhancedDeck)
      )

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
        .select('moxfield_id, moxfield_url, name, raw_data, format, view_count, like_count, comment_count, created_at, last_updated_at')
        .eq('moxfield_id', id)
        .single()

      if (error) throw error

      return {
        id: data.moxfield_id,
        moxfield_id: data.moxfield_id,
        moxfield_url: data.moxfield_url,
        commanders: data.raw_data?.commanders?.map((c: any) => c.name).filter(Boolean) || [],
        color_identity: data.raw_data?.colorIdentity || [],
        format: data.format,
        description: data.raw_data?.description || null,
        view_count: data.view_count,
        like_count: data.like_count,
        comment_count: data.comment_count,
        created_at: data.created_at,
        updated_at: data.last_updated_at,
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
 * @param id - The moxfield_id of the deck
 */
export function useDecklist(id: string) {
  return useQuery({
    queryKey: ['decklist', id],
    queryFn: async (): Promise<DeckCard[]> => {
      if (!id) return []

      const supabase = createClient()

      // Query decklist_cards directly using moxfield_id
      // Only fetch mainboard and commanders, exclude sideboard and maybeboard
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
            cached_image_url
          )
        `)
        .eq('moxfield_deck_id', id)
        .in('board', ['mainboard', 'commanders'])

      if (error) throw error
      return (data as DeckCard[]) || []
    },
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  })
}

/**
 * Combined hook to fetch both deck info and decklist
 * Returns both the deck metadata and its cards
 */
export function useDeck(id: string) {
  const deckInfo = useDeckInfo(id)
  const decklist = useDecklist(id)

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
