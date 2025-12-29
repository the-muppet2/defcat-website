/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
/** biome-ignore-all lint/correctness/noConstantCondition: <explanation> */
/** biome-ignore-all lint/style/noNonNullAssertion: <explanation> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
'use client'

import { ChevronDown, ChevronUp, ExternalLink, Filter, X, Shuffle, Loader2 } from 'lucide-react'
import Link from '@/components/auth/ProtectedLink'
import { memo, useMemo, useState } from 'react'
import { ManaSymbols } from '@/components/decks/ManaSymbols'
import { RoastButton } from '@/components/decks/RoastButton'
import { useDecksInfinite } from '@/lib/hooks/useDecks'
import { cn } from '@/lib/utils'
import { ColorIdentity } from '@/types/colors'
import { bracketOptions } from '@/types/core'
import type { EnhancedDeck } from '@/types'

// Memoized deck row component
const DeckRow = memo(function DeckRow({ deck }: { deck: EnhancedDeck }) {
  return (
    <tr className="border-b border-tinted hover:bg-accent-tinted transition-all">
      <td className="py-4 px-4">
        <Link
          href={`/decks/${deck.moxfield_id}`}
          className="block hover:text-[var(--mana-color)] transition-colors"
        >
          <div className="font-medium">{deck.deck_title}</div>
          <div className="text-xs text-muted-foreground line-clamp-1 mt-1">{deck.description}</div>
        </Link>
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-wrap gap-1">
          {deck.commanders?.map((cmd, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 rounded bg-accent-tinted border border-tinted"
            >
              {typeof cmd === 'string' ? cmd : cmd.cards?.name || 'Unknown'}
            </span>
          ))}
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex justify-center">
          {deck.color_identity && <ManaSymbols mana={deck.color_identity} size="sm" />}
        </div>
      </td>
      <td className="py-4 px-4 text-right">{deck.view_count?.toLocaleString()}</td>
      <td className="py-4 px-4 text-right">{deck.like_count?.toLocaleString()}</td>
      <td className="py-4 px-4 text-right text-sm text-muted-foreground">
        {deck.updated_at ? new Date(deck.updated_at).toLocaleDateString() : '-'}
      </td>
      <td className="py-4 px-4 text-center">
        <a
          href={deck.moxfield_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[var(--mana-color)] hover:brightness-110 transition-all"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </td>
      <td className="py-4 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          {deck.moxfield_url && <RoastButton moxfieldUrl={deck.moxfield_url} variant="icon-only" />}
        </div>
      </td>
    </tr>
  )
})

export default function DesktopDecksPage() {
  const { data, isLoading: loading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useDecksInfinite()
  const decks = useMemo(() => data?.pages?.flatMap(page => page.decks) ?? [], [data])
  const totalDecks = data?.pages?.[0]?.total ?? 0
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [invertColors, setInvertColors] = useState(false)
  const [selectedBracket, setSelectedBracket] = useState<string>('')
  const [sortBy, setSortBy] = useState<
    'name' | 'commanders' | 'color_identity' | 'view_count' | 'like_count' | 'updated_at'
  >('view_count')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(true)

  const filteredDecks = useMemo(() => {
    let filtered = [...decks]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (deck) =>
          deck.deck_title!.toLowerCase().includes(query) ||
          deck.commanders?.some((cmd) => String(cmd).toLowerCase().includes(query)) ||
          (deck.description || null)?.toLowerCase().includes(query)
      )
    }

    // Color filter with exact match and inversion
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
          // Replace WUBRG with actual 5 colors
          targetColors = targetColors.filter(c => c !== 'WUBRG')
          targetColors.push('W', 'U', 'B', 'R', 'G')
        }

        if (invertColors) {
          // Inversion: show decks that do NOT contain ANY of the selected colors
          // Special case: if selecting C with inversion, show all colored decks
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

    // Bracket filter
    if (selectedBracket) {
      filtered = filtered.filter((deck) => deck.bracket === Number(selectedBracket))
    }

    filtered.sort((a, b) => {
      const sortKey = sortBy === 'name' ? 'deck_title' : sortBy
      let aVal: any = a[sortKey as keyof typeof a]
      let bVal: any = b[sortKey as keyof typeof b]

      if (sortBy === 'updated_at') {
        aVal = new Date(aVal || 0).getTime()
        bVal = new Date(bVal || 0).getTime()
      }

      if (sortBy === 'name' || sortBy === 'commanders') {
        const aStr = sortBy === 'commanders' ? aVal?.[0] || '' : aVal
        const bStr = sortBy === 'commanders' ? bVal?.[0] || '' : bVal
        return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
      }

      if (sortBy === 'color_identity') {
        const aLen = aVal?.length || 0
        const bLen = bVal?.length || 0
        return sortOrder === 'asc' ? aLen - bLen : bLen - aLen
      }

      return sortOrder === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0)
    })
    return filtered
  }, [decks, searchQuery, selectedColors, invertColors, selectedBracket, sortBy, sortOrder])

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    )
  }

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({
    column,
  }: {
    column: 'name' | 'commanders' | 'color_identity' | 'view_count' | 'like_count' | 'updated_at'
  }) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar with tinted styling */}
      <aside
        className={cn(
          'border-r border-tinted sidebar-tinted backdrop-blur-sm transition-all duration-300',
          showFilters ? 'w-72' : 'w-0 overflow-hidden'
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Filters</h2>
            <button
              onClick={() => setShowFilters(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent-tinted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search with tinted input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Search</label>
            <input
              type="text"
              placeholder="Deck or commander..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-accent-tinted border border-tinted text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mana-color)] focus:border-[var(--mana-color)] transition-all"
            />
          </div>

          {/* Color Identity with mana symbols */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-muted-foreground">
                Color Identity
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInvertColors(!invertColors)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
                    invertColors
                      ? "bg-[var(--mana-color)]/20 text-[var(--mana-color)] ring-1 ring-[var(--mana-color)]"
                      : "bg-accent-tinted text-muted-foreground hover:text-foreground"
                  )}
                  title={invertColors ? "Showing decks WITHOUT selected colors" : "Showing decks WITH exact selected colors"}
                >
                  <Shuffle className="h-3 w-3" />
                  {invertColors ? 'Inverted' : 'Invert'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedColors.length === 7) {
                      setSelectedColors([])
                    } else {
                      setSelectedColors(['W', 'U', 'B', 'R', 'G', 'C', 'WUBRG'])
                    }
                  }}
                  className="text-xs text-[var(--mana-color)] hover:brightness-110 transition-all"
                >
                  {selectedColors.length === 7 ? 'Clear' : 'All'}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {ColorIdentity.ORDER.map((letter) => {
                const colorInfo = ColorIdentity.getColorInfo(letter)
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => toggleColor(letter)}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg transition-all duration-200 w-full',
                      selectedColors.includes(letter)
                        ? 'bg-accent-tinted ring-2'
                        : 'hover:bg-accent-tinted/50 hover:opacity-100'
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
                        fontSize: '24px',
                        color: selectedColors.includes(letter) ? colorInfo.color : undefined,
                      }}
                    />
                    <span className="text-base font-medium">{colorInfo.name}</span>
                  </button>
                )
              })}
              {selectedColors.includes('WUBRG') ? (
                <div
                  className="rounded-lg p-[2px] transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${ColorIdentity.Colors.W}, ${ColorIdentity.Colors.U}, ${ColorIdentity.Colors.B}, ${ColorIdentity.Colors.R}, ${ColorIdentity.Colors.G})`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleColor('WUBRG')}
                    className="flex items-center gap-3 p-2 rounded-[6px] transition-all duration-200 w-full bg-card"
                  >
                    <div className="flex gap-0.5">
                      {['W', 'U', 'B', 'R', 'G'].map((letter) => {
                        const colorInfo = ColorIdentity.getColorInfo(letter)
                        return (
                          <i
                            key={letter}
                            className={colorInfo.className}
                            style={{ fontSize: '16px' }}
                          />
                        )
                      })}
                    </div>
                    <span className="text-base font-medium">5-Color</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleColor('WUBRG')}
                  className="flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-accent-tinted/50  hover:opacity-100 w-full"
                >
                  <div className="flex gap-0.5">
                    {['W', 'U', 'B', 'R', 'G'].map((letter) => {
                      const colorInfo = ColorIdentity.getColorInfo(letter)
                      return (
                        <i
                          key={letter}
                          className={colorInfo.className}
                          style={{ fontSize: '16px' }}
                        />
                      )
                    })}
                  </div>
                  <span className="text-base font-medium">5-Color</span>
                </button>
              )}
            </div>
          </div>

          {/* Bracket Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Bracket
            </label>
            <div className="flex flex-col gap-2">
              {bracketOptions.map((bracket) => (
                <button
                  key={bracket.value}
                  type="button"
                  onClick={() => setSelectedBracket(selectedBracket === bracket.value ? '' : bracket.value)}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 rounded-lg transition-all duration-200 text-left w-full',
                    selectedBracket === bracket.value
                      ? 'bg-[var(--mana-color)]/10 ring-2 ring-[var(--mana-color)]'
                      : 'bg-accent-tinted/50 hover:bg-accent-tinted  hover:opacity-100'
                  )}
                >
                  <span className="font-medium text-sm">{bracket.label}</span>
                  <span className="text-xs text-muted-foreground">{bracket.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedColors.length > 0 || selectedBracket) && (
            <div className="pt-4 border-t border-tinted">
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedColors([])
                  setInvertColors(false)
                  setSelectedBracket('')
                }}
                className="w-full px-4 py-2 rounded-lg bg-[var(--mana-color)]/10 hover:bg-[var(--mana-color)]/20 text-[var(--mana-color)] font-medium transition-all"
              >
                Show All Decks
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content with tinted elements */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 bg-card-tinted/80 backdrop-blur-md border-b border-tinted px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showFilters && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-tinted hover:bg-[var(--accent-tinted)] border border-tinted transition-all"
                >
                  <Filter className="h-4 w-4" />
                  Show Filters
                </button>
              )}
              <h1 className="text-2xl font-bold">Decklist Database</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredDecks.length} / {totalDecks} decks
            </div>
          </div>
        </header>

        {/* Table with tinted styling */}
        <div className="p-6 flex flex-col h-[calc(100vh-80px)]">
          {loading ? (
            <div className="text-center text-muted-foreground py-20">Loading decks...</div>
          ) : error ? (
            <div className="text-center text-destructive py-20">Error loading decks</div>
          ) : (
            <div className="relative rounded-2xl border p-2 md:rounded-3xl md:p-3 flex-1 flex flex-col overflow-hidden">
              <div className="overflow-auto flex-1" onScroll={(e) => {
                const target = e.target as HTMLDivElement
                const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100
                if (bottom && hasNextPage && !isFetchingNextPage) {
                  fetchNextPage()
                }
              }}>
                <table className="w-full min-w-[800px]">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-tinted">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"
                        >
                          Deck Name
                          {sortBy === 'name' ? (
                            <SortIcon column="name" />
                          ) : (
                            <div className="h-4 w-4 opacity-30 hover:opacity-60">
                              <ChevronUp className="h-4 w-4" />
                            </div>
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                        <button
                          onClick={() => handleSort('commanders')}
                          className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"
                        >
                          Commander(s)
                          {sortBy === 'commanders' ? (
                            <SortIcon column="commanders" />
                          ) : (
                            <div className="h-4 w-4 opacity-30 hover:opacity-60">
                              <ChevronUp className="h-4 w-4" />
                            </div>
                          )}
                        </button>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">
                        <button
                          onClick={() => handleSort('color_identity')}
                          className="flex items-center gap-2 mx-auto hover:text-foreground transition-colors cursor-pointer"
                        >
                          Colors
                          {sortBy === 'color_identity' ? (
                            <SortIcon column="color_identity" />
                          ) : (
                            <div className="h-4 w-4 opacity-30 hover:opacity-60">
                              <ChevronUp className="h-4 w-4" />
                            </div>
                          )}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        <button
                          onClick={() => handleSort('view_count')}
                          className="flex items-center gap-2 ml-auto hover:text-foreground transition-colors cursor-pointer"
                        >
                          Views
                          {sortBy === 'view_count' ? (
                            <SortIcon column="view_count" />
                          ) : (
                            <div className="h-4 w-4 opacity-30 hover:opacity-60">
                              <ChevronUp className="h-4 w-4" />
                            </div>
                          )}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        <button
                          onClick={() => handleSort('like_count')}
                          className="flex items-center gap-2 ml-auto hover:text-foreground transition-colors cursor-pointer"
                        >
                          Likes
                          {sortBy === 'like_count' ? (
                            <SortIcon column="like_count" />
                          ) : (
                            <div className="h-4 w-4 opacity-30 hover:opacity-60">
                              <ChevronUp className="h-4 w-4" />
                            </div>
                          )}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                        <button
                          onClick={() => handleSort('updated_at')}
                          className="flex items-center gap-2 ml-auto hover:text-foreground transition-colors cursor-pointer"
                        >
                          Updated
                          {sortBy === 'updated_at' ? (
                            <SortIcon column="updated_at" />
                          ) : (
                            <div className="h-4 w-4 opacity-30 hover:opacity-60">
                              <ChevronUp className="h-4 w-4" />
                            </div>
                          )}
                        </button>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Link
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDecks.map((deck) => (
                      <DeckRow key={deck.moxfield_id} deck={deck} />
                    ))}
                  </tbody>
                </table>

                {/* Loading indicator inside scrollable area */}
                <div className="py-4 flex justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading more decks...</span>
                    </div>
                  )}
                  {!hasNextPage && decks.length > 0 && (
                    <span className="text-muted-foreground text-sm">All {totalDecks} decks loaded</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
