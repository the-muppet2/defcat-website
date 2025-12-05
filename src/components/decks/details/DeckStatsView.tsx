// components/decks/detail/DeckStatsView.tsx
import { TypeFilterBar } from './TypeFilterBar'
import { ManaCurve, TypeDistribution, ColorDistribution } from '@/components/decks'
import type { DecklistCardWithCard } from '@/types/core'

interface DeckStatsViewProps {
  cards: DecklistCardWithCard[]
  selectedType: string | null
  onTypeSelect: (type: string) => void
}

export function DeckStatsView({ cards, selectedType, onTypeSelect }: DeckStatsViewProps) {
  const mainboardCards = cards.filter((dc) => dc.board === 'mainboard')

  const filteredCards = mainboardCards.filter(
    (dc) => !selectedType || dc.cards?.type_line?.includes(selectedType)
  )

  return (
    <>
      <TypeFilterBar cards={cards} selectedType={selectedType} onTypeSelect={onTypeSelect} />

      <div className="space-y-8">
        {/* Mana Curve */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">Mana Curve</h3>
          <ManaCurve cards={filteredCards} />
        </div>

        {/* Color & Type Distribution - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Color Distribution</h3>
            <ColorDistribution
              cards={cards.map((card) => ({ ...card, quantity: card.quantity ?? 0 }))}
              selectedType={selectedType}
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Type Distribution</h3>
            <TypeDistribution deckCards={filteredCards} />
          </div>
        </div>
      </div>
    </>
  )
}