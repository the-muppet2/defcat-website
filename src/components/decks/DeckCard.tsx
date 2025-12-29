// components/deck/DeckCard.tsx
'use client'

import { ExternalLink, Eye, Heart } from 'lucide-react'
import Link from '@/components/auth/ProtectedLink'
import { memo, type CSSProperties } from 'react'
import { CommanderImage } from '@/components/decks/Commander'
import { ManaSymbols } from '@/components/decks/ManaSymbols'
import { cn } from '@/lib/utils'
import type { Deck, CommanderInfo } from '@/types/core'
import { LightweightDeck } from '@/lib/hooks/useDecks'
import { MoxfieldDeck } from '@/types'

// RGB values for mana colors (for inline chip styles)
const MANA_RGB: Record<string, string> = {
  W: '180, 160, 100',
  U: '30, 64, 175',
  B: '109, 40, 217',
  R: '185, 28, 28',
  G: '21, 128, 61',
}

// Get chip style based on commander's color identity
function getCommanderChipStyle(colors: string[]): CSSProperties {
  if (!colors || colors.length === 0) {
    return {}
  }

  // 5-color: rainbow gradient
  if (colors.length >= 5) {
    return {
      background: 'linear-gradient(135deg, rgba(180,160,100,0.25), rgba(30,64,175,0.25), rgba(109,40,217,0.25), rgba(185,28,28,0.25), rgba(21,128,61,0.25))',
      borderColor: 'rgba(180, 160, 100, 0.4)',
      boxShadow: '0 0 8px rgba(180, 160, 100, 0.15)',
    }
  }

  // Multi-color: gradient between colors
  if (colors.length > 1) {
    const rgbValues = colors.map(c => MANA_RGB[c]).filter(Boolean)
    const gradientStops = rgbValues.map((rgb, i) => {
      const percent = (i / (rgbValues.length - 1)) * 100
      return `rgba(${rgb}, 0.20) ${percent}%`
    }).join(', ')

    return {
      background: `linear-gradient(135deg, ${gradientStops})`,
      borderColor: `rgba(${rgbValues[0]}, 0.35)`,
      boxShadow: `0 0 6px rgba(${rgbValues[0]}, 0.12)`,
    }
  }

  // Single color
  const rgb = MANA_RGB[colors[0]]
  if (!rgb) return {}

  return {
    background: `rgba(${rgb}, 0.18)`,
    borderColor: `rgba(${rgb}, 0.35)`,
    boxShadow: `0 0 6px rgba(${rgb}, 0.12)`,
  }
}

interface DeckCardProps {
  deck: Deck | LightweightDeck | MoxfieldDeck
  className?: string
  variant?: 'default' | 'compact' | 'featured'
}

// Helper to normalize deck properties across different types
function normalizeDeck(deck: Deck | LightweightDeck | MoxfieldDeck) {
  const isMoxfield = 'publicId' in deck

  // Extract commanders based on deck type
  let commanders: string[] = []
  let commanderInfos: CommanderInfo[] = []

  if (isMoxfield) {
    const moxDeck = deck as MoxfieldDeck
    if (moxDeck.boards?.commanders?.cards) {
      const cardEntries = Object.values(moxDeck.boards.commanders.cards)
      commanders = cardEntries.map(c => c.card.name)
      commanderInfos = cardEntries.map(c => ({
        name: c.card.name,
        colors: c.card.color_identity?.map(String) || []
      }))
    }
  } else {
    const dbDeck = deck as Deck | LightweightDeck
    const cmds = dbDeck.commanders
    if (Array.isArray(cmds)) {
      commanders = cmds.map(c => String(c)).filter(c => c && c !== 'null')
    }
    // Check for commanderInfos on enhanced deck types
    const infos = (dbDeck as { commanderInfos?: CommanderInfo[] }).commanderInfos
    if (Array.isArray(infos)) {
      commanderInfos = infos
    }
  }

  // Extract color identity based on deck type
  let colorIdentity: string[] = []
  if (isMoxfield) {
    const colors = (deck as MoxfieldDeck).boards?.colorIdentity || []
    colorIdentity = Array.isArray(colors) ? colors.map(c => String(c)) : []
  } else {
    const dbDeck = deck as Deck | LightweightDeck
    const colors = dbDeck.color_identity
    if (Array.isArray(colors)) {
      colorIdentity = colors.map(c => String(c))
    } else if (typeof colors === 'string') {
      colorIdentity = [colors]
    }
  }

  return {
    id: isMoxfield ? (deck as MoxfieldDeck).publicId : deck.id,
    name: deck.name,
    description: deck.description || null,
    commanders,
    commanderInfos,
    color_identity: colorIdentity,
    format: isMoxfield ? (deck as MoxfieldDeck).format : (deck as Deck).format || null,
    view_count: isMoxfield ? (deck as MoxfieldDeck).viewCount : (deck as Deck | LightweightDeck).view_count || 0,
    like_count: isMoxfield ? (deck as MoxfieldDeck).likeCount : (deck as Deck | LightweightDeck).like_count || 0,
    updated_at: isMoxfield
      ? (deck as MoxfieldDeck).boards?.lastUpdatedAtUtc
      : (deck as Deck | LightweightDeck).updated_at || new Date().toISOString(),
    moxfield_url: isMoxfield ? (deck as MoxfieldDeck).publicUrl : (deck as Deck).moxfield_url || null,
  }
}

export const DeckCard = memo(function DeckCard({
  deck,
  className,
  variant = 'default',
}: DeckCardProps) {
  const normalized = normalizeDeck(deck)
  const formattedDate = new Date(normalized.updated_at || Date.now()).toISOString().split('T')[0]

  if (variant === 'compact') {
    return (
      <Link href={`/decks/${normalized.id}`}>
        <div
          className={cn(
            'group card-tinted-glass hover-tinted rounded-xl p-4 transition-all duration-300',
            'hover:shadow-tinted-glow hover:scale-[1.01] cursor-pointer',
            className
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-tinted transition-colors">
              {normalized.name}
            </h3>
            {normalized.color_identity && normalized.color_identity.length > 0 && (
              <ManaSymbols
                mana={normalized.color_identity}
                size="sm"
                shadow
                className="group-hover:opacity-100 transition-opacity flex-shrink-0"
              />
            )}
          </div>

          {normalized.commanders && normalized.commanders.length > 0 && (
            <div className="mb-3">
              <span className="text-sm text-muted-foreground line-clamp-1">
                {normalized.commanders.join(' & ')}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {normalized.view_count?.toLocaleString() || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {normalized.like_count?.toLocaleString() || 0}
              </span>
            </div>
            <span>{formattedDate}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'card-tinted-glass shadow-tinted-lg',
        'p-6 transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-tinted-xl',
        variant === 'featured' && 'shimmer-tinted',
        className
      )}
    >
      <div className="relative flex gap-6">
        {/* Commander Image */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              'relative h-80 w-56 overflow-hidden rounded-xl',
              'border-2 border-tinted shadow-tinted-lg',
              'group-hover:shadow-tinted-glow transition-all duration-300'
            )}
          >
            <CommanderImage commanders={normalized.commanders || []} className="h-full w-full" />

            {/* Color Identity Indicators */}
            {normalized.color_identity && normalized.color_identity.length > 0 && (
              <div className="absolute left-2 top-2 drop-shadow-lg">
                <ManaSymbols mana={normalized.color_identity} size="2x" shadow />
              </div>
            )}

            {/* Commander Name Overlay */}
            {normalized.commanders && normalized.commanders.length > 0 && (
              <div className="absolute inset-x-0 bottom-0 p-3 glass-tinted-strong">
                <div className="text-xs font-medium text-white line-clamp-2">
                  {normalized.commanders.join(' & ')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deck Information */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <div className="mb-4">
            <div className="mb-2 flex items-start justify-between gap-4">
              <h2 className="text-3xl font-bold">{normalized.name}</h2>
              {normalized.format && (
                <span className="badge-tinted-primary px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wider">
                  {normalized.format}
                </span>
              )}
            </div>

            {/* Commanders with per-card color tinting */}
            {normalized.commanders && normalized.commanders.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {normalized.commanders.map((commander: string, i) => {
                  const info = normalized.commanderInfos[i]
                  // Use commander's colors if available, otherwise fall back to deck colors
                  const colors = info?.colors?.length ? info.colors : normalized.color_identity
                  const chipStyle = getCommanderChipStyle(colors)
                  return (
                    <span
                      key={commander}
                      className="px-3 py-1 rounded-lg text-sm border"
                      style={chipStyle}
                    >
                      {commander}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 hover-tinted px-2 py-1 rounded-md">
                <Eye className="h-4 w-4" />
                <span>{normalized.view_count?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 hover-tinted px-2 py-1 rounded-md">
                <Heart className="h-4 w-4" />
                <span>{normalized.like_count?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {normalized.description && (
            <div className="mb-4 flex-1">
              <p className="line-clamp-6 text-sm leading-relaxed text-muted-foreground">
                {normalized.description}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-tinted pt-4">
            <span className="text-sm text-muted-foreground">{formattedDate}</span>
            {normalized.moxfield_url && (
              <a
                href={normalized.moxfield_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'group/link flex items-center gap-2 rounded-lg px-4 py-2',
                  'btn-tinted text-sm font-medium',
                  'transition-all duration-300'
                )}
              >
                View on Moxfield
                <ExternalLink className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Optional featured indicator */}
      {variant === 'featured' && (
        <div className="absolute top-4 right-4">
          <span className="badge-tinted-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider pulse-tinted">
            Featured
          </span>
        </div>
      )}
    </div>
  )
})
