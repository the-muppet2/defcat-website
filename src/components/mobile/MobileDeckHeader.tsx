// components/mobile/MobileDeckHeader.tsx
'use client'

import { memo } from 'react'
import { MobileBackButton } from '@/components/layout/BackButton'
import type { DecklistCardWithCard, Deck, DeckInfo } from '@/types'

interface MobileDeckHeaderProps {
  deck: Deck & Partial<DeckInfo>
  cards: DecklistCardWithCard[]
}

export const MobileDeckHeader = memo(function MobileDeckHeader({
  deck,
  cards,
}: MobileDeckHeaderProps) {
  const commanderCards = cards.filter((dc) => dc.board === 'commanders')

  const getCardImageUrl = (card: any, artCrop = false) => {
    if (!artCrop && card?.cached_image_url) return card.cached_image_url
    if (card?.scryfall_id) {
      const imageType = artCrop ? 'art_crop/front' : 'normal/front'
      return `https://cards.scryfall.io/${imageType}/${card.scryfall_id[0]}/${card.scryfall_id[1]}/${card.scryfall_id}.jpg`
    }
    return null
  }

  const commanderImageUrls = commanderCards
    .map((cmd) => getCardImageUrl(cmd.cards, true))
    .filter(Boolean) as string[]

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-tinted-xl">
      {/* Background Image */}
      {commanderImageUrls.length > 0 && (
        <div className="absolute inset-0">
          {commanderImageUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Commander ${idx + 1}`}
              className="h-full w-full object-cover"
              style={{
                opacity: 1 / commanderImageUrls.length,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80" />
        </div>
      )}

      {/* Content */}
      <div className="relative p-4 pb-5">
        {/* Back Button */}
        <MobileBackButton className="mb-4" />

        {/* Color Identity Badge */}
        {deck.color_identity && deck.color_identity.length > 0 && (
          <div className="inline-flex items-center gap-1.5 glass-tinted-strong rounded-full px-4 py-2 mb-4 border border-white/20 elevation-2">
            {(deck.color_identity || []).map((color, idx) => (
              <i key={idx} className={`ms ms-${color.toLowerCase()} ms-cost`} style={{ fontSize: '20px' }} />
            ))}
          </div>
        )}

        {/* Deck Title */}
        <div className="mb-4">
          {deck.event_date_std && (
            <p className="text-white/80 font-medium text-base mb-1.5">
              {deck.event_date_std}
            </p>
          )}
          {(deck.username || deck.author_username) && (
            <p className="text-tinted text-lg font-bold mb-2">
              {deck.username || deck.author_username}
            </p>
          )}
          {deck.deck_title && deck.deck_title !== 'Custom Deck' && (
            <h1 className="text-2xl font-bold text-white leading-tight">
              {deck.deck_title}
            </h1>
          )}
        </div>

        {/* Commanders */}
        <div className="flex flex-wrap gap-2 mb-4">
          {commanderCards.map((cmd, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1.5 rounded-full glass-tinted-strong text-white border border-white/30 font-semibold text-sm elevation-1"
            >
              {cmd.cards?.name || cmd.card_name}
            </span>
          ))}
        </div>

        {/* Description */}
        {deck.description && (
          <p className="text-white/90 text-sm leading-relaxed line-clamp-3">
            {deck.description}
          </p>
        )}
      </div>
    </div>
  )
})
