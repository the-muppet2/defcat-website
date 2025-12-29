'use client'

import { Loader2, Search, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DeckCard } from '@/components/decks/DeckCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDecks } from '@/lib/hooks/useDecks'
import { ColorIdentity } from '@/types/colors'
import { cn } from '@/lib/utils'

export default function ExampleHomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [bracketLevel, setBracketLevel] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [invertColors, setInvertColors] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  // Fetch all decks
  const { data: allDecks, isLoading: searchLoading } = useDecks()

  // Client-side filtering - matches deck vault page behavior
  const searchResults = useMemo(() => {
    if (!allDecks) return []

    let filtered = [...allDecks]

    // Search by name or commanders
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (deck) =>
          deck.name?.toLowerCase().includes(query) ||
          deck.commanders?.some((cmd) => cmd?.toLowerCase().includes(query)) ||
          deck.description?.toLowerCase().includes(query)
      )
    }

    // Filter by bracket level
    if (bracketLevel) {
      filtered = filtered.filter((deck) => deck.bracket === parseInt(bracketLevel))
    }

    // Color filter with exact match and inversion (same as deck vault)
    if (selectedColors.length > 0) {
      filtered = filtered.filter((deck) => {
        // Treat null, undefined, or empty array as colorless ['C']
        let deckColors = deck.color_identity || []
        if (deckColors.length === 0) {
          deckColors = ['C']
        }

        // Build the target color set (handle WUBRG special case)
        let targetColors = [...selectedColors]
        if (targetColors.includes('WUBRG')) {
          targetColors = targetColors.filter(c => c !== 'WUBRG')
          targetColors.push('W', 'U', 'B', 'R', 'G')
        }

        if (invertColors) {
          // Inversion: show decks that do NOT contain ANY of the selected colors
          if (targetColors.includes('C')) {
            return deckColors.length > 0 && !deckColors.includes('C')
          }
          return !targetColors.some(color => deckColors.includes(color))
        } else {
          // Exact match: deck must have exactly these colors (in any order)
          const sortedDeck = [...deckColors].sort().join('')
          const sortedTarget = [...targetColors].sort().join('')
          return sortedDeck === sortedTarget
        }
      })
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((deck) =>
        selectedTags.some((tag) => deck.description?.toLowerCase().includes(tag.toLowerCase()))
      )
    }

    return filtered.slice(0, 12) // Limit to 12 results
  }, [allDecks, searchQuery, selectedColors, invertColors, bracketLevel, selectedTags])

  const hasSearchQuery =
    searchQuery.trim() || bracketLevel || selectedColors.length > 0 || selectedTags.length > 0

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(farthest-corner at 50% 0%, var(--bg-tinted) 0%, var(--background) 100%)',
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background pointer-events-none" />

      <div className="relative">
        {/* Hero Section */}
        <section className="pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1
                className="text-5xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--gradient-start), var(--gradient-end))`,
                }}
              >
                Defcat's Commander Deck Vault
              </h1>
              <p className="text-xl text-muted-foreground">
                The Internet's #1 Commander Deck Collection
              </p>
            </div>
          </div>

            {/* Search Section */}
            <div className="w-full max-w-3xl mx-auto mb-16">
              <div className="relative mb-6">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for commanders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-2xl glass border border-white/10 text-foreground text-lg placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all"
                  style={
                    {
                      '--tw-ring-color': 'var(--mana-color)',
                    } as React.CSSProperties
                  }
                />
              </div>

              {/* Color Filter Symbols */}
              <div className="flex flex-col items-center gap-3 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setInvertColors(!invertColors)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      invertColors
                        ? "bg-[var(--mana-color)]/20 text-[var(--mana-color)] ring-1 ring-[var(--mana-color)]"
                        : "bg-accent-tinted text-muted-foreground hover:text-foreground"
                    )}
                    title={invertColors ? "Showing decks WITHOUT selected colors" : "Showing decks WITH exact selected colors"}
                  >
                    <Shuffle className="h-4 w-4" />
                    {invertColors ? 'Inverted' : 'Invert'}
                  </button>
                  {selectedColors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedColors([])}
                      className="text-sm text-[var(--mana-color)] hover:brightness-110 transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex justify-center gap-3">
                  {ColorIdentity.ORDER.map((letter) => {
                    const colorInfo = ColorIdentity.getColorInfo(letter)
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => {
                          if (selectedColors.includes(letter)) {
                            setSelectedColors(selectedColors.filter((c) => c !== letter))
                          } else {
                            setSelectedColors([...selectedColors, letter])
                          }
                        }}
                        className={cn(
                          'transition-all duration-300 rounded-full p-2',
                          selectedColors.includes(letter)
                            ? 'ring-2 bg-accent-tinted'
                            : 'hover:bg-accent-tinted/50'
                        )}
                        style={
                          selectedColors.includes(letter)
                            ? ({ '--tw-ring-color': colorInfo.color } as React.CSSProperties)
                            : undefined
                        }
                      >
                        <i
                          className={colorInfo.className}
                          style={{
                            fontSize: '32px',
                            color: selectedColors.includes(letter) ? colorInfo.color : undefined,
                          }}
                        />
                      </button>
                    )
                  })}
                  {/* 5-Color option */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedColors.includes('WUBRG')) {
                        setSelectedColors(selectedColors.filter((c) => c !== 'WUBRG'))
                      } else {
                        setSelectedColors([...selectedColors, 'WUBRG'])
                      }
                    }}
                    className={cn(
                      'transition-all duration-300 rounded-full p-2 flex items-center gap-0.5',
                      selectedColors.includes('WUBRG')
                        ? 'ring-2 ring-[var(--mana-color)] bg-accent-tinted'
                        : 'hover:bg-accent-tinted/50'
                    )}
                    title="5-Color"
                  >
                    {['W', 'U', 'B', 'R', 'G'].map((c) => (
                      <i
                        key={c}
                        className={ColorIdentity.getClassName(c)}
                        style={{ fontSize: '14px' }}
                      />
                    ))}
                  </button>
                </div>
              </div>

            </div>

            {/* Search Results - Full width container */}
            {hasSearchQuery && (
              <div className="max-w-7xl mx-auto px-6 mb-16">
                {searchLoading ? (
                  <Card className="glass border-white/10 bg-card-tinted">
                    <CardContent className="p-12 flex items-center justify-center">
                      <Loader2
                        className="h-12 w-12 animate-spin"
                        style={{ color: 'var(--mana-color)' }}
                      />
                    </CardContent>
                  </Card>
                ) : searchResults && searchResults.length > 0 ? (
                  <div>
                    <h3 className="text-2xl font-bold mb-6">
                      Found {searchResults.length} deck
                      {searchResults.length !== 1 ? 's' : ''}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {searchResults.map((deck) => (
                        <DeckCard key={deck.id} deck={deck} variant="compact" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <Card className="glass border-white/10 bg-card-tinted">
                    <CardContent className="p-12 text-center">
                      <h3 className="text-2xl font-bold mb-4">No decks found</h3>
                      <p className="text-muted-foreground mb-6">
                        Try adjusting your search filters
                      </p>
                      <Button
                        onClick={() => {
                          setSearchQuery('')
                          setBracketLevel('')
                          setSelectedColors([])
                          setSelectedTags([])
                        }}
                        className="btn-tinted-primary shadow-tinted-glow"
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
        </section>
      </div>
    </div>
  )
}
