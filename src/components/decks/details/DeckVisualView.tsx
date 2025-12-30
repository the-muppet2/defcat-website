// components/decks/detail/DeckVisualView.tsx
'use client'

import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { TypeFilterBar } from './TypeFilterBar'
import type { DecklistCardWithCard } from '@/types'

interface DeckVisualViewProps {
  cards: DecklistCardWithCard[]
  selectedType: string | null
  onTypeSelect: (type: string) => void
}

interface VirtualCardProps {
  dc: DecklistCardWithCard
  isFlipped: boolean
  onToggleFlip: (cardName: string) => void
  onHover: (cardName: string | null, rect: DOMRect | null) => void
}

const DFC = ['transform', 'modal_dfc', 'reversible_card', 'double_faced_token', 'art_series']

const VirtualCard = memo(function VirtualCard({ dc, isFlipped, onToggleFlip, onHover }: VirtualCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isDFC = (dc.cards?.layout && DFC.includes(dc.cards.layout)) ||
  (dc.cards?.type_line?.includes('//') && !['adventure', 'split', 'flip'].includes(dc.cards?.layout || ''))
  const isFlipCard = dc.cards?.layout === 'flip'
  const isBattle = dc.cards?.type_line?.toLowerCase().includes('battle')
  const cardName = dc.cards?.name || ''

  const frontImageUrl =
    dc.cards?.cached_image_url ||
    (dc.cards?.scryfall_id
      ? `https://cards.scryfall.io/normal/front/${dc.cards.scryfall_id[0]}/${dc.cards.scryfall_id[1]}/${dc.cards.scryfall_id}.jpg`
      : null)
  const backImageUrl = dc.cards?.scryfall_id
    ? `https://cards.scryfall.io/normal/back/${dc.cards.scryfall_id[0]}/${dc.cards.scryfall_id[1]}/${dc.cards.scryfall_id}.jpg`
    : null

  if (!frontImageUrl) return null

  // For battles: animate Z rotation (90 -> 0) during the Y flip
  // For flip cards: rotate 180 degrees on Z axis (same image, upside down)
  // For DFC: Y-axis flip to show different back image
  const getFlipTransform = () => {
    if (isFlipCard) {
      return isFlipped ? 'rotateZ(180deg)' : 'rotateZ(0deg)'
    }
    if (isBattle) {
      return isFlipped
        ? 'rotateY(-180deg) rotateZ(0deg) translate(0px, 0px)'
        : 'rotateY(0deg) rotateZ(90deg) translate(-90px, -50px)'
    }
    return isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
  }

  // Battle cards always need extra vertical space to accommodate the landscape orientation
  // Keep padding constant so it doesn't cause jumps during flip
  const battlePadding = isBattle ? { paddingTop: '20%', paddingBottom: '20%' } : {}

  const handleMouseEnter = () => {
    if (cardRef.current) {
      onHover(cardName, cardRef.current.getBoundingClientRect())
    }
  }

  const handleMouseLeave = () => {
    onHover(null, null)
  }

  return (
    <div
      ref={cardRef}
      className="relative group"
      style={{
        perspective: isFlipCard ? undefined : '1000px',
        ...battlePadding,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative rounded-lg border-2 border-border hover:border-primary shadow-lg"
        style={{
          transformStyle: isFlipCard ? undefined : 'preserve-3d',
          transform: getFlipTransform(),
          transition: 'transform 0.5s ease-in-out',
          transformOrigin: 'center center',
        }}
      >
        {/* Front Face */}
        <div
          className="relative w-full flex items-center justify-center"
          style={isFlipCard ? {} : {
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <img
            src={frontImageUrl}
            alt={dc.cards?.name || ''}
            className="w-full h-auto rounded-lg"
          />
          {dc.quantity! > 1 && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground font-bold text-sm rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
              {dc.quantity}
            </div>
          )}
        </div>

        {/* Back Face */}
        {isDFC && backImageUrl && (
          <div
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <img
              src={backImageUrl}
              alt={`${dc.cards?.name || ''} (back)`}
              className="w-full h-auto rounded-lg"
            />
            {dc.quantity! > 1 && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground font-bold text-sm rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                {dc.quantity}
              </div>
            )}
          </div>
        )}

        {/* DFC Flip Button - inside the transform container so it stays on the card */}
        {isDFC && (
          <button
            type="button"
            onClick={() => onToggleFlip(cardName)}
            className="absolute bg-black/70 backdrop-blur-sm rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-black/90 transition-colors cursor-pointer z-20"
            style={{
              top: '8px',
              left: '8px',
            }}
            title={isFlipped ? 'Show front face' : 'Show back face'}
          >
            <i
              className="ms ms-ability-duels-dfc text-white"
              style={{ fontSize: '16px' }}
            />
          </button>
        )}
      </div>

      {/* Flip Card Button - outside transform so it stays fixed while card rotates */}
      {isFlipCard && (
        <button
          type="button"
          onClick={() => onToggleFlip(cardName)}
          className="absolute bg-black/70 backdrop-blur-sm rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-black/90 transition-colors cursor-pointer z-30"
          style={{
            top: '8px',
            left: '8px',
          }}
          title={isFlipped ? 'Show normal orientation' : 'Flip card upside down'}
        >
          <i
            className="ms ms-ability-duels-dfc text-white"
            style={{ fontSize: '16px' }}
          />
        </button>
      )}
    </div>
  )
})

export function DeckVisualView({ cards, selectedType, onTypeSelect }: DeckVisualViewProps) {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [columns, setColumns] = useState(4)
  const [hoveredCard, setHoveredCard] = useState<{ name: string; rect: DOMRect; card: DecklistCardWithCard } | null>(null)
  const visualGridRef = useRef<HTMLDivElement>(null)

  const toggleCardFlip = useCallback((cardName: string) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cardName)) {
        newSet.delete(cardName)
      } else {
        newSet.add(cardName)
      }
      return newSet
    })
  }, [])

  // Clear manual flips when filter changes
  useEffect(() => {
    setFlippedCards(new Set())
  }, [selectedType])

  // Responsive column detection
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      if (width < 640) setColumns(2)
      else if (width < 768) setColumns(3)
      else setColumns(4)
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  // Filter and prepare cards
  const visualCards = cards
    .filter((dc) => !selectedType || dc.cards?.type_line?.includes(selectedType))
    .filter((dc) => {
      const frontImageUrl =
        dc.cards?.cached_image_url ||
        (dc.cards?.scryfall_id
          ? `https://cards.scryfall.io/normal/front/${dc.cards.scryfall_id[0]}/${dc.cards.scryfall_id[1]}/${dc.cards.scryfall_id}.jpg`
          : null)
      return frontImageUrl !== null
    })

  // Group cards into rows
  const cardRows: typeof visualCards[] = []
  for (let i = 0; i < visualCards.length; i += columns) {
    cardRows.push(visualCards.slice(i, i + columns))
  }

  // Virtual grid setup - responsive row height based on columns
  // Magic cards have 63:88 aspect ratio (width:height)
  // Estimate: 2 cols = ~280px, 3 cols = ~220px, 4 cols = ~180px per row
  const estimatedRowHeight = columns === 2 ? 280 : columns === 3 ? 220 : 180

  const rowVirtualizer = useVirtualizer({
    count: cardRows.length,
    getScrollElement: () => visualGridRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 2,
  })

  return (
    <>
      <TypeFilterBar cards={cards} selectedType={selectedType} onTypeSelect={onTypeSelect} />

      <div ref={visualGridRef} className="h-[600px] overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = cardRows[virtualRow.index]
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className="gap-4 px-1"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  }}
                >
                  {row.map((dc, idx) => {
                    const isDFC = (dc.cards?.layout && DFC.includes(dc.cards.layout)) ||
                      (dc.cards?.type_line?.includes('//') && !['adventure', 'split', 'flip'].includes(dc.cards?.layout || ''))
                    const cardName = dc.cards?.name || ''

                    const manuallyFlipped = flippedCards.has(cardName)
                    const isFlipped = isDFC ? !manuallyFlipped : manuallyFlipped

                    return (
                      <VirtualCard
                        key={idx}
                        dc={dc}
                        isFlipped={isFlipped}
                        onToggleFlip={toggleCardFlip}
                        onHover={(name, rect) => {
                          if (name && rect) {
                            setHoveredCard({ name, rect, card: dc })
                          } else {
                            setHoveredCard(null)
                          }
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Hover preview - positioned below commander images like list view */}
      {hoveredCard && (() => {
        const commanderEl = document.getElementById('commander-images')
        if (!commanderEl) return null
        const rect = commanderEl.getBoundingClientRect()
        const containerCenter = rect.left + rect.width / 2
        return (
          <div
            className="fixed pointer-events-none z-[9999] -translate-x-1/2"
            style={{
              top: rect.bottom + 16,
              left: containerCenter,
            }}
          >
            <div className="bg-card border-2 border-primary rounded-xl overflow-hidden shadow-2xl w-[180px] lg:w-[200px]">
              <img
                src={
                  hoveredCard.card.cards?.cached_image_url ||
                  (hoveredCard.card.cards?.scryfall_id
                    ? `https://cards.scryfall.io/normal/front/${hoveredCard.card.cards.scryfall_id[0]}/${hoveredCard.card.cards.scryfall_id[1]}/${hoveredCard.card.cards.scryfall_id}.jpg`
                    : '')
                }
                alt={hoveredCard.card.cards?.name || ''}
                className="w-full h-auto"
              />
            </div>
          </div>
        )
      })()}
    </>
  )
}