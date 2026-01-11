// components/mobile/MobileDeckCard.tsx
'use client'

import { Eye, Heart, ExternalLink, Flame } from 'lucide-react'
import Link from '@/components/auth/ProtectedLink'
import { memo } from 'react'
import { ManaSymbols } from '@/components/decks/ManaSymbols'
import { cn } from '@/lib/utils'
import type { EnhancedDeck } from '@/types'

interface MobileDeckCardProps {
  deck: EnhancedDeck
  className?: string
}

export const MobileDeckCard = memo(function MobileDeckCard({
  deck,
  className,
}: MobileDeckCardProps) {
  const formattedDate = new Date(deck?.updated_at || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  // Get commander image URL from the first commander
  const getCommanderImageUrl = () => {
    if (!deck.commanders || deck.commanders.length === 0) {
      return '/images/placeholder-commander.jpg'
    }
    const firstCommander = deck.commanders[0]
    if (typeof firstCommander === 'string') {
      return '/images/placeholder-commander.jpg'
    }
    const card = firstCommander.cards
    if (card?.cached_image_url) {
      return card.cached_image_url
    }
    if (card?.scryfall_id) {
      return `https://cards.scryfall.io/art_crop/front/${card.scryfall_id[0]}/${card.scryfall_id[1]}/${card.scryfall_id}.jpg`
    }
    return '/images/placeholder-commander.jpg'
  }

  const commanderImageUrl = getCommanderImageUrl()

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-card border border-tinted',
        'elevation-2 hover:elevation-4',
        'transition-smooth',
        'hover:border-tinted-strong',
        className
      )}
    >
      {/* Clickable Card Area */}
      <Link href={`/decks/${deck.id}`} className="block active:scale-98 transition-transform">
        {/* Commander Image Header */}
        <div className="relative h-36 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${commanderImageUrl})`,
              filter: 'brightness(0.4) blur(8px)',
              transform: 'scale(1.1)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />

          {/* Color Identity Badge */}
          {deck.color_identity && deck.color_identity.length > 0 && (
            <div className="absolute top-2 right-2">
              <div className="glass-tinted-strong p-1.5 rounded-lg">
                <ManaSymbols mana={deck.color_identity} size="sm" shadow />
              </div>
            </div>
          )}

          {/* Bracket Badge */}
          {deck.bracket && (
            <div className="absolute top-2 left-2">
              <div className="badge-tinted-primary px-2 py-1 rounded-md text-xs font-semibold">
                Bracket {deck.bracket}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Deck Name */}
          <h3 className="font-bold text-lg line-clamp-2 mb-1.5 leading-tight">
            {deck.name}
          </h3>

          {/* Commander Name */}
          {deck.commanders && deck.commanders.length > 0 && (
            <p className="text-sm text-tinted font-semibold line-clamp-1 mb-2.5">
              {deck.commanders.map(cmd => 
                typeof cmd === 'string' ? cmd : cmd.cards?.name || ''
              ).join(' & ')}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                {deck.view_count?.toLocaleString() || 0}
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                {deck.like_count?.toLocaleString() || 0}
              </span>
            </div>
            <span className="text-muted-foreground">{formattedDate}</span>
          </div>
        </div>
      </Link>
    </div>
  )
})
