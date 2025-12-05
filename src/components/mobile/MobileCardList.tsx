// components/mobile/MobileCardList.tsx
'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { memo, useState } from 'react'
import { CardPreview } from '@/components/decks'

import type { DecklistCardWithCard } from '@/types/core'

interface MobileCardListProps {
  cards: DecklistCardWithCard[]
  selectedType: string | null
  onTypeSelect: (type: string) => void
}

function CardTypeSection({
  type,
  typeCards,
  isExpanded,
  onToggle,
}: {
  type: string
  typeCards: DecklistCardWithCard[]
  isExpanded: boolean
  onToggle: () => void
}) {
  const cardCount = typeCards.reduce((sum, dc) => sum + (dc.quantity ?? 0), 0)
  const displayLabel = type === 'Commander' && cardCount === 1 ? 'Commander' : `${type}s`

  return (
    <div className="border-b border-tinted/30 last:border-b-0">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-accent-tinted/30 hover:bg-accent-tinted/50 transition-smooth active:scale-[0.99]"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-tinted">
            {displayLabel}
          </h3>
          <span className="badge-tinted px-1.5 py-0.5 rounded text-xs font-bold">
            {cardCount}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-tinted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Card List - Collapsible */}
      {isExpanded && (
        <div className="px-2 py-2 space-y-0.5 bg-background/30">
          {typeCards.map((dc, idx) => (
            <CardPreview
              key={`${dc.cards?.name || 'unknown'}-${idx}`}
              card={dc.cards}
              quantity={dc.quantity ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const MobileCardList = memo(function MobileCardList({
  cards,
  selectedType,
  onTypeSelect: _onTypeSelect,
}: MobileCardListProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['Commander', 'Creature', 'Instant', 'Sorcery'])
  )

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

  const toggleSection = (type: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedSections(new Set(CARD_TYPES))
  }

  const collapseAll = () => {
    setExpandedSections(new Set())
  }

  const totalCards = cards.reduce((sum, dc) => sum + (dc.quantity ?? 0), 0)

  return (
    <div className="relative">
      {/* Quick Actions Bar */}
      <div className="bg-accent-tinted/50 border-b border-tinted px-3 py-2 rounded-t-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-semibold">
            {totalCards} cards
          </span>
          <div className="flex gap-3">
            <button
              onClick={expandAll}
              className="text-xs text-tinted hover:brightness-110 font-bold transition-smooth active:scale-98"
            >
              Expand
            </button>
            <button
              onClick={collapseAll}
              className="text-xs text-tinted hover:brightness-110 font-bold transition-smooth active:scale-98"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Card Type Sections */}
      <div className="pb-4 max-h-[500px] overflow-y-auto">
        {CARD_TYPES.map((type) => {
          const typeCards =
            type === 'Commander'
              ? cards.filter((dc) => dc.board === 'commanders')
              : cards.filter(
                  (dc) => dc.board !== 'commanders' && dc.cards?.type_line?.includes(type)
                )

          if (typeCards.length === 0) return null
          if (selectedType && selectedType !== type) return null

          return (
            <CardTypeSection
              key={type}
              type={type}
              typeCards={typeCards}
              isExpanded={expandedSections.has(type)}
              onToggle={() => toggleSection(type)}
            />
          )
        })}
      </div>
    </div>
  )
})
