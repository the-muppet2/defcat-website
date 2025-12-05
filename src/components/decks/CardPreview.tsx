/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/performance/noImgElement: <explanation> */
/** biome-ignore-all lint/style/useImportType: <explanation> */
// biome-ignore assist/source/organizeImports: <explanation>
import { useState, useEffect, memo } from 'react'
import { ManaCost } from '@/components/decks/ManaSymbols'
import { DeckCard, ScryfallImageSize, CardFace } from '@/types/core'

/**
 * Construct Scryfall image URL from scryfall_id
 * Format: https://cards.scryfall.io/{size}/{side}/{first_char}/{second_char}/{scryfall_id}.jpg
 * Example: 373a4e3e-6244-43e8-80ac-f5508db9ce57 -> /3/7/373a4e3e-6244-43e8-80ac-f5508db9ce57.jpg
 */
function getScryfallImageUrl(
  scryfallId: string,
  size: ScryfallImageSize = 'png',
  side: CardFace = 'front'
): string {
  const imgExt = size !== 'png' ? 'jpg' : 'png'
  return `https://cards.scryfall.io/${size}/${side}/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.${imgExt}`
}

/**
 * Get card image URL - prefers cached version, falls back to Scryfall
 */
function getCardImageUrl(card: DeckCard['cards']): string | null {
  // Prefer cached image
  if (card?.cached_image_url) {
    return card.cached_image_url
  }
  // Fallback to Scryfall
  if (card?.scryfall_id) {
    return getScryfallImageUrl(card.scryfall_id)
  }

  return null
}

export const CardPreview = memo(function CardPreview({ card, quantity }: { card: DeckCard['cards']; quantity: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const [previewPosition, setPreviewPosition] = useState<{ top: number; left: number } | null>(null)

  // Get the proper image URL - cached first, then Scryfall
  const imageUrl = getCardImageUrl(card)

  // Calculate position based on commander images container
  useEffect(() => {
    if (isHovered) {
      const commanderEl = document.getElementById('commander-images')
      if (commanderEl) {
        const rect = commanderEl.getBoundingClientRect()
        const containerCenter = rect.left + rect.width / 2
        setPreviewPosition({
          top: rect.bottom + 16, // 16px gap below commander images
          left: containerCenter, // center of commander images
        })
      }
    }
  }, [isHovered])

  // Determine what to display for mana cost
  // If card has mana_cost, use it; otherwise construct from CMC
  const displayCost = card?.mana_cost && card.mana_cost.trim() !== ''
    ? card.mana_cost
    : card?.cmc
      ? `{${Math.floor(card.cmc)}}`
      : null

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all cursor-pointer group border border-transparent hover:border-border">
        <span className="font-mono text-muted-foreground text-sm w-8 flex-shrink-0 font-semibold">
          {quantity}×
        </span>
        <span className="flex-1 text-foreground font-medium group-hover:text-primary transition-colors">
          {card?.name}
        </span>
        {displayCost && (
          <div className="flex-shrink-0">
            <ManaCost cost={displayCost} />
          </div>
        )}
      </div>

      {/* Card Image Preview on Hover - dynamically positioned below commander images */}
      {isHovered && imageUrl && previewPosition && (
        <div
          className="fixed pointer-events-none z-[9999] -translate-x-1/2"
          style={{
            top: `${previewPosition.top}px`,
            left: `${previewPosition.left}px`,
            scale: '1.2',
          }}
        >
          <div className="rounded-xl shadow-2xl overflow-hidden w-[180px] lg:w-[200px] border-2 border-primary">
            <img src={imageUrl} alt={card?.name} className="w-full h-auto block" />
          </div>
        </div>
      )}
    </div>
  )
})
