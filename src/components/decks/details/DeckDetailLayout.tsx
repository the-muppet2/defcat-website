// components/decks/detail/DeckDetailLayout.tsx
'use client'

import { useState } from 'react'
import { ArrowLeft, Check, Share2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RoastButton } from '@/components/decks/RoastButton'
import { DeckHeader } from './DeckHeader'
import { DeckTabs } from './DeckTabs'
import { DeckSidebar } from './DeckSidebar'
import type { DeckWithCards, Deck, DecklistCardWithCard } from '@/types'

interface DeckDetailLayoutProps {
  deck: Deck
  cards: DecklistCardWithCard[]
}

export function DeckDetailLayout({ deck, cards }: DeckDetailLayoutProps) {
  const [copied, setCopied] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleTypeFilter = (type: string) => {
    setSelectedType(selectedType === type ? null : type)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-[1600px]">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="ghost" className="hover:bg-accent">
            <Link href="/decks">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Decks
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {deck.moxfield_url && <RoastButton moxfieldUrl={deck.moxfield_url} variant="default" />}
            <Button variant="outline" onClick={handleShare} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Share
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Main Content - Left Side (2/3) */}
  <div className="lg:col-span-2 space-y-6 relative">
    {/* Background Image Layer */}
    <div 
      className="absolute top-0 left-0 right-0 bottom-0 -z-10 opacity-20 rounded-2xl"
      style={{
        backgroundImage: `url("https://cards.scryfall.io/art_crop/front/c/c/cc30e027-8cb8-4b06-a24a-6ad49d6a2cf3.jpg")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background/90" />
    </div>

    {/* Content */}
    <DeckHeader deck={deck} cards={cards} />
    <DeckTabs 
      deck={deck} 
      cards={cards} 
      selectedType={selectedType}
      onTypeSelect={toggleTypeFilter}
    />
  </div>

  {/* Sidebar - Right Side (1/3) */}
  <DeckSidebar 
    deck={deck} 
    cards={cards}
    selectedType={selectedType}
  />
</div>
      </div>
    </div>
  )
}