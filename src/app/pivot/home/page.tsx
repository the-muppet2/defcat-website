'use client'

import { ChevronDown, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DeckCard } from '@/components/decks/DeckCard'
import { FeaturedVideo } from '@/components/home/FeaturedVideo'
import { RotatingAds } from '@/components/home/RotatingAds'
import { SocialMediaLinks } from '@/components/home/SocialMediaLinks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { getDecks } from '@/lib/data/deck-helpers'

export default function ExampleHomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [bracketLevel, setBracketLevel] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTagsDropdown, setShowTagsDropdown] = useState(false)
  const [featuredVideoId, setFeaturedVideoId] = useState<string>('')

  const tagsDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch featured video ID from site_config
  useEffect(() => {
    async function fetchFeaturedVideo() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'featured_video_id')
        .single()

      console.log('Featured video fetch:', { data, error })

      if (data && !error) {
        const videoId = data.value || ''
        console.log('Setting featured video ID to:', videoId)
        setFeaturedVideoId(videoId)
      }
    }
    fetchFeaturedVideo()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target as Node)) {
        setShowTagsDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch all decks
  const { data: allDecks, isLoading: searchLoading } = useDecks()

  // Client-side filtering
  const searchResults = useMemo(() => {
    if (!allDecks) return []

    let filtered = allDecks

    // Search by name or commanders
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (deck) =>
          deck.name?.toLowerCase().includes(query) ||
          deck.commanders?.some((cmd) => cmd?.toLowerCase().includes(query))
      )
    }

    // Filter by bracket level
    if (bracketLevel) {
      filtered = filtered.filter((deck) => deck.bracket === bracketLevel)
    }

    // Filter by colors
    if (selectedColors.length > 0) {
      filtered = filtered.filter((deck) =>
        selectedColors.every((color) => deck.color_identity?.includes(color))
      )
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((deck) =>
        selectedTags.some((tag) => deck.description?.toLowerCase().includes(tag.toLowerCase()))
      )
    }

    return filtered.slice(0, 12) // Limit to 12 results
  }, [allDecks, searchQuery, selectedColors, bracketLevel, selectedTags])

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
              <div className="flex justify-center gap-3 mb-6">
                {[
                  { symbol: 'W', color: '#fffbd5' },
                  { symbol: 'U', color: '#0e68ab' },
                  { symbol: 'B', color: '#a855f7' },
                  { symbol: 'R', color: '#d3202a' },
                  { symbol: 'G', color: '#00733e' },
                  { symbol: 'C', color: '#888' },
                ].map(({ symbol, color }) => (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => {
                      if (selectedColors.includes(symbol)) {
                        setSelectedColors(selectedColors.filter((c) => c !== symbol))
                      } else {
                        setSelectedColors([...selectedColors, symbol])
                      }
                    }}
                    className={`transition-all duration-300 rounded-full p-2 ${
                      selectedColors.includes(symbol)
                        ? 'scale-100 opacity-100 ring-2 bg-accent-tinted'
                        : 'scale-90 hover:opacity-80 hover:scale-95'
                    }`}
                    style={
                      selectedColors.includes(symbol)
                        ? ({ '--tw-ring-color': color } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <i className={`ms ms-${symbol.toLowerCase()} text-2xl`} />
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bracket-level" className="text-sm text-muted-foreground mb-2 block">Bracket Level</label>
                  <select
                    id="bracket-level"
                    value={bracketLevel}
                    onChange={(e) => setBracketLevel(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg glass border border-white/10 text-foreground bg-background focus:outline-none focus:ring-2 [&>option]:bg-background [&>option]:text-foreground"
                    style={
                      {
                        '--tw-ring-color': 'var(--mana-color)',
                      } as React.CSSProperties
                    }
                  >
                    <option value="">All Brackets</option>
                    <option value="1">Bracket 1</option>
                    <option value="2">Bracket 2</option>
                    <option value="3">Bracket 3</option>
                    <option value="4">Bracket 4</option>
                  </select>
                </div>

                <div className="relative" ref={tagsDropdownRef}>
                  <div className="text-sm text-muted-foreground mb-2 block">Tags</div>
                  <button
                    type="button"
                    onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                    className="w-full px-4 py-3 rounded-lg glass border border-white/10 text-foreground bg-background focus:outline-none focus:ring-2 flex items-center justify-between"
                    style={
                      {
                        '--tw-ring-color': 'var(--mana-color)',
                      } as React.CSSProperties
                    }
                  >
                    <span className="text-sm">
                      {selectedTags.length === 0 ? 'All Tags' : `${selectedTags.length} selected`}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showTagsDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {showTagsDropdown && (
                    <div className="absolute z-50 w-full mt-2 p-2 rounded-lg glass border border-white/10 bg-card shadow-lg space-y-1">
                      {['combo', 'aggro', 'control', 'tribal'].map((tag) => (
                        <label
                          key={tag}
                          className="flex items-center gap-2 cursor-pointer hover:bg-accent-tinted p-2 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTags([...selectedTags, tag])
                              } else {
                                setSelectedTags(selectedTags.filter((t) => t !== tag))
                              }
                            }}
                            className="w-4 h-4 rounded border-border bg-background text-[var(--mana-color)] focus:ring-[var(--mana-color)]"
                          />
                          <span className="text-sm capitalize">{tag}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search Results */}
            {hasSearchQuery && (
              <div className="mb-16">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        </section>

        {/* Rotating Advertisements */}
        <RotatingAds />

        {/* Featured YouTube Video */}
        <FeaturedVideo title="Today's Featured Video" videoId={featuredVideoId} />

        {/* Premium Stats */}
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Premium Member Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass border-white/10 bg-card-tinted">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: 'var(--mana-color)' }}>
                    175+
                  </div>
                  <p className="text-muted-foreground">Exclusive Decks</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/10 bg-card-tinted">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: 'var(--mana-color)' }}>
                    100+
                  </div>
                  <p className="text-muted-foreground">Video Tutorials</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/10 bg-card-tinted">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold mb-2" style={{ color: 'var(--mana-color)' }}>
                    24/7
                  </div>
                  <p className="text-muted-foreground">Discord Support</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Media Links */}
        <SocialMediaLinks />
      </div>
    </div>
  )
}
