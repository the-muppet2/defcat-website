// components/decks/detail/DeckHeader.tsx
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
import { Eye, Heart, Calendar } from 'lucide-react'
import { GlowingEffect } from '@/components/ui/glowEffect'
import { ManaSymbols } from '@/components/decks/ManaSymbols'
import type { Deck, DecklistCardWithCard } from '@/types/core'

interface DeckHeaderProps {
  deck: Deck
  cards: DecklistCardWithCard[]
}

export function DeckHeader({ deck, cards }: DeckHeaderProps) {
  const commanderCards = cards.filter((dc) => dc.board === 'commanders')
  const colorIdentity = deck.color_identity || []

  return (
    <div className="relative">
      {/* Glow effect layer */}
      <div className="absolute inset-[-3px] pointer-events-none">
        <GlowingEffect
          blur={0}
          borderWidth={3}
          spread={80}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
      </div>

      {/* Content card */}
      <div className="relative bg-card border-3 border-border rounded-2xl shadow-xl">
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {deck.deck_title || deck.name}
              </h1>

              {/* Author */}
              {deck.player_username && (
                <p className="text-muted-foreground">
                  by <span className="text-primary font-medium">{deck.player_username}</span>
                </p>
              )}

              {/* Commanders + Stats on same line */}
              <div className="flex flex-wrap items-center gap-3">
                {commanderCards.map((cmd, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent text-foreground border border-border font-medium text-md"
                  >
                    {cmd.cards?.name || 'Unknown'}
                  </span>
                ))}
                <span className="text-border mx-1">|</span>
                <StatChip icon={Eye} value={deck.view_count?.toLocaleString() || '0'} />
                <StatChip icon={Heart} value={deck.like_count?.toLocaleString() || '0'} />
                {deck.last_updated_at && (
                  <StatChip
                    icon={Calendar}
                    value={new Date(deck.last_updated_at).toLocaleDateString()}
                  />
                )}
              </div>
            </div>

            {/* Color Identity */}
            {colorIdentity.length > 0 && (
              <div className="flex items-center gap-2">
                <ManaSymbols mana={colorIdentity} size="3x" />
              </div>
            )}
          </div>

          {/* Description */}
          {deck.description && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-muted-foreground leading-relaxed">
                {deck.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatChip({
  icon: Icon,
  value
}: {
  icon: React.ComponentType<{ className?: string }>
  value: string
}) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
