// components/mobile/MobileDeckList.tsx
'use client'

import { Filter, Search } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { MobileDeckCard } from './MobileDeckCard'
import { MobileFilterSheet } from './MobileFilterSheet'
import type { EnhancedDeck } from '@/types'

interface MobileDeckListProps {
  decks: EnhancedDeck[]
  isLoading?: boolean
  error?: Error | null
}

export const MobileDeckList = memo(function MobileDeckList({
  decks = [],
  isLoading = false,
  error = null,
}: MobileDeckListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [invertColors, setInvertColors] = useState(false)
  const [selectedBracket, setSelectedBracket] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredDecks = useMemo(() => {
    let filtered = [...decks]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (deck) =>
          deck.deck_title?.toLowerCase().includes(query) ||
          deck.commanders?.some((cmd) => 
            (typeof cmd === 'string' ? cmd : cmd.cards?.name || '').toLowerCase().includes(query)
          ) ||
          (deck.description || null)?.toLowerCase().includes(query)
      )
    }

    // Color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter((deck) => {
        let deckColors = deck.color_identity || []
        if (deckColors.length === 0) {
          deckColors = ['C']
        }

        let targetColors = [...selectedColors]
        if (targetColors.includes('WUBRG')) {
          targetColors = targetColors.filter((c) => c !== 'WUBRG')
          targetColors.push('W', 'U', 'B', 'R', 'G')
        }

        if (invertColors) {
          if (targetColors.includes('C')) {
            return deckColors.length > 0 && !deckColors.includes('C')
          }
          return !targetColors.some((color) => deckColors.includes(color))
        } else {
          const sortedDeck = [...deckColors].sort().join('')
          const sortedTarget = [...targetColors].sort().join('')
          return sortedDeck === sortedTarget
        }
      })
    }

    // Bracket filter
    if (selectedBracket) {
      filtered = filtered.filter((deck) => deck.bracket === Number(selectedBracket))
    }

    return filtered
  }, [decks, searchQuery, selectedColors, invertColors, selectedBracket])

  const toggleColor = (color: string) => {
    if (color === 'clear-all') {
      setSelectedColors([])
      return
    }
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedColors([])
    setInvertColors(false)
    setSelectedBracket('')
  }

  const hasActiveFilters =
    !!searchQuery || selectedColors.length > 0 || !!selectedBracket

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent animate-pulse" />
            <div className="flex-1 h-10 rounded-xl bg-accent animate-pulse" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-accent animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive font-medium mb-2">Error loading decks</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 glass-tinted-strong border-b border-tinted">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Filter Button */}
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="flex-shrink-0 p-2.5 rounded-xl btn-tinted transition-smooth active:scale-98 relative touch-target elevation-1"
            >
              <Filter className="h-5 w-5" />
              {hasActiveFilters && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-tinted rounded-full animate-pulse-tinted elevation-2" />
              )}
            </button>

            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search decks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-tinted w-full pl-10 pr-4 py-3 rounded-xl text-base focus-ring-tinted transition-smooth touch-target"
              />
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Active:</span>
              {selectedColors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedColors([])}
                  className="badge-tinted px-2 py-1 rounded-full text-xs whitespace-nowrap flex items-center gap-1"
                >
                  <span>Colors ({selectedColors.length})</span>
                  <span className="text-xs">×</span>
                </button>
              )}
              {selectedBracket && (
                <button
                  type="button"
                  onClick={() => setSelectedBracket('')}
                  className="badge-tinted px-2 py-1 rounded-full text-xs whitespace-nowrap flex items-center gap-1"
                >
                  <span>Bracket {selectedBracket}</span>
                  <span className="text-xs">×</span>
                </button>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-tinted hover:brightness-110 font-medium whitespace-nowrap ml-auto"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="px-4 pb-2 pt-1 text-sm text-muted-foreground text-center font-medium">
          {filteredDecks.length} {filteredDecks.length === 1 ? 'deck' : 'decks'}
        </div>
      </header>

      {/* Deck List */}
      <div className="px-4 py-4 space-y-4 pb-24">
        {filteredDecks.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground mb-1">
              {hasActiveFilters ? 'No decks match your filters' : 'No decks available'}
            </p>
            {hasActiveFilters && (
              <button
              type="button"
                onClick={clearFilters}
                className="text-sm text-tinted font-medium hover:brightness-110 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredDecks.map((deck) => (
            <MobileDeckCard key={deck.id} deck={deck} />
          ))
        )}
      </div>

      {/* Filter Sheet */}
      <MobileFilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedColors={selectedColors}
        onColorToggle={toggleColor}
        invertColors={invertColors}
        onInvertToggle={() => setInvertColors(!invertColors)}
        selectedBracket={selectedBracket}
        onBracketChange={setSelectedBracket}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  )
})
