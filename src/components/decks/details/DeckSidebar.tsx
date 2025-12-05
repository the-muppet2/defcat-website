// components/decks/detail/DeckSidebar.tsx
/** biome-ignore-all lint/performance/noImgElement: <explanation> */
import { GlowingEffect } from '@/components/ui/glowEffect'
import type { DecklistCardWithCard } from '@/types/core'

interface DeckSidebarProps {
  
  cards: DecklistCardWithCard[]
}

export function DeckSidebar({ cards }: DeckSidebarProps) {
  const commanderCards = cards.filter((dc) => dc.board === 'commanders')

  const getCardImageUrl = (card: DecklistCardWithCard['cards']) => {
    if (!card) return null
    if (card.cached_image_url) return card.cached_image_url
    if (card.scryfall_id) {
      return `https://cards.scryfall.io/normal/front/${card.scryfall_id[0]}/${card.scryfall_id[1]}/${card.scryfall_id}.jpg`
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Commander Card Images */}
      {commanderCards.length > 0 && (
        <div id="commander-images" className="relative rounded-2xl border md:rounded-2xl">
          <GlowingEffect
            blur={0}
            borderWidth={3}
            spread={80}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <div className="bg-card border-0 rounded-2xl p-3 shadow-xl relative">
            <div className={`grid gap-2 ${commanderCards.length > 1 ? 'grid-cols-2' : 'grid-cols-1 max-w-[300px]'}`}>
              {commanderCards.map((cmd, idx) => {
                const imageUrl = getCardImageUrl(cmd.cards)
                return imageUrl ? (
                  <img
                    key={idx}
                    src={imageUrl}
                    alt={cmd.cards?.name || 'Commander'}
                    className="w-full rounded-lg shadow-lg"
                  />
                ) : null
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}