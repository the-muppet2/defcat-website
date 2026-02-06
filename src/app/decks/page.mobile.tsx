// app/decks/page.mobile.tsx
'use client'

import { useEffect, useMemo } from 'react'
import { useDecksInfinite } from '@/lib/hooks/useDecks'
import { MobileDeckList } from '@/components/mobile/MobileDeckList'

export default function MobileDecksPage() {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useDecksInfinite()
  const decks = useMemo(() => data?.pages?.flatMap(page => page.decks) ?? [], [data])

  // Auto-fetch all pages so mobile filters work on complete dataset
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <MobileDeckList 
      decks={decks} 
      isLoading={isLoading} 
      error={error ? new Error(error.message) : null}
    />
  )
}
