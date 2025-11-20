// app/decks/[id]/page.mobile.tsx
'use client'

import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import { useDeck } from '@/lib/hooks/useDecks'
import { MobileDeckHeader } from '@/components/mobile/MobileDeckHeader'
import { MobileDeckTabs } from '@/components/mobile/MobileDeckTabs'
import { MobileCardList } from '@/components/mobile/MobileCardList'
import { MobileActionBar } from '@/components/mobile/MobileActionBar'
import { DeckVisualView } from '@/components/decks/details/DeckVisualView'
import { DeckStatsView } from '@/components/decks/details/DeckStatsView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function MobileDeckDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: deck, cards, isLoading, error } = useDeck(id)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <div className="h-64 rounded-2xl bg-accent animate-pulse" />
        <div className="h-96 rounded-2xl bg-accent animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive font-medium mb-2">Error loading deck</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!deck) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 space-y-4">
        {/* Header with commander image and deck info */}
        <MobileDeckHeader deck={deck} cards={cards || []} />

        {/* Tabs with swipeable content */}
        <MobileDeckTabs
          deck={deck}
          cards={cards || []}
          selectedType={selectedType}
          onTypeSelect={setSelectedType}
          listView={
            <MobileCardList
              cards={cards || []}
              selectedType={selectedType}
              onTypeSelect={setSelectedType}
            />
          }
          visualView={
            <DeckVisualView
              cards={cards || []}
              selectedType={selectedType}
              onTypeSelect={setSelectedType}
            />
          }
          statsView={
            <DeckStatsView
              cards={cards || []}
              selectedType={selectedType}
              onTypeSelect={setSelectedType}
            />
          }
        />
      </div>

      {/* Fixed bottom action bar */}
      <MobileActionBar
        moxfieldUrl={deck.moxfield_url || deck.moxfield_url}
        deckName={deck.name || deck.deck_title || 'Deck'}
        deckOwnerId={deck.user_id}
      />
    </div>
  )
}
