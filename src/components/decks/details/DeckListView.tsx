// components/decks/detail/DeckListView.tsx
import { memo } from 'react'
import { TypeFilterBar } from './TypeFilterBar'
import { CardPreview } from '@/components/decks'
import type { DecklistCardWithCard } from '@/types/core'

interface DeckListViewProps {
  cards: DecklistCardWithCard[]
  selectedType: string | null
  onTypeSelect: (type: string) => void
}

const CardTypeSection = memo(function CardTypeSection({ type, typeCards }: { type: string; typeCards: DecklistCardWithCard[] }) {
  const cardCount = typeCards.reduce((sum, dc) => sum + (dc.quantity ?? 0), 0)

  // Special handling for Commander label - singular if 1, plural if multiple
  const displayLabel = type === 'Commander' && cardCount === 1 ? 'Commander' : `${type}s`

  return (
    <div>
      <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-primary/20">
        <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <span className="text-primary">{displayLabel}</span>
        </h3>
        <span className="text-xs md:text-sm font-semibold text-primary bg-primary/10 px-2 md:px-3 py-1 rounded-full">
          {cardCount} {cardCount === 1 ? 'card' : 'cards'}
        </span>
      </div>

      <div className="space-y-1">
        {typeCards.map((dc, idx) => (
          <CardPreview
            key={`${dc.cards?.name || 'unknown'}-${idx}`}
            card={dc.cards}
            quantity={dc.quantity || 0}
          />
        ))}
      </div>
    </div>
  )
})

export function DeckListView({ cards, selectedType, onTypeSelect }: DeckListViewProps) {
  const CARD_TYPES = [
    'Commander',
    'Creature',
    'Instant',
    'Sorcery',
    'Artifact',
    'Enchantment',
    'Planeswalker',
    'Battle',
    'Tribal',
    'Land',
  ]

  return (
    <>
      <TypeFilterBar cards={cards} selectedType={selectedType} onTypeSelect={onTypeSelect} />

      <div className="space-y-8 max-h-[400px] sm:max-h-[500px] md:max-h-[600px] lg:max-h-[700px] overflow-y-auto">
        {CARD_TYPES.map((type) => {
          // Special handling for commanders
          const typeCards = type === 'Commander'
            ? cards.filter((dc) => dc.board === 'commanders')
            : cards.filter((dc) => dc.board !== 'commanders' && dc.cards?.type_line?.includes(type))

          if (typeCards.length === 0) return null

          // Hide section if a different type is selected
          if (selectedType && selectedType !== type) return null

          return <CardTypeSection key={type} type={type} typeCards={typeCards} />
        })}
      </div>
    </>
  )
}