// components/decks/detail/DeckDetailLayout.tsx
'use client'

import { useState } from 'react'
import { DeckHeader } from './DeckHeader'
import { DeckTabs } from './DeckTabs'
import { DeckSidebar } from './DeckSidebar'
import type {Deck, DecklistCardWithCard } from '@/types'

interface DeckDetailLayoutProps {
  deck: Deck
  cards: DecklistCardWithCard[]
}

export function DeckDetailLayout({ deck, cards }: DeckDetailLayoutProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const toggleTypeFilter = (type: string) => {
    setSelectedType(selectedType === type ? null : type)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-[1600px] space-y-6 py-6">
        {/* Commander Header - Full Width Above Columns */}
        <DeckHeader deck={deck} cards={cards} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Content - Left Side (2/3) */}
          <div className="lg:col-span-2 space-y-6 relative">
            <DeckTabs
              deck={deck}
              cards={cards}
              selectedType={selectedType}
              onTypeSelect={toggleTypeFilter}
            />
          </div>

          {/* Sidebar - Right Side (1/3) */}
          <div id="deck-sidebar">
            <DeckSidebar cards={cards} />
          </div>
        </div>
      </div>
    </div>
  )
}