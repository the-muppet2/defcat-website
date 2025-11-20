// app/decks/page.mobile.tsx
'use client'

import { useMemo } from 'react'
import { useDecksInfinite } from '@/lib/hooks/useDecks'
import { MobileDeckList } from '@/components/mobile/MobileDeckList'

export default function MobileDecksPage() {
  const { data, isLoading, error } = useDecksInfinite()
  const decks = useMemo(() => data?.pages?.flatMap(page => page.decks) ?? [], [data])

  return (
    <MobileDeckList 
      decks={decks} 
      isLoading={isLoading} 
      error={error ? new Error(error.message) : null}
    />
  )
}
