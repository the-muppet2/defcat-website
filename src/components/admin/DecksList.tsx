'use client'

import { Edit, ExternalLink, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GlowingEffect } from '@/components/ui/glowEffect'
import { Input } from '@/components/ui/input'

interface Deck {
  id: number
  moxfield_id: string
  public_id: string
  name: string
  commanders: string[] | null
  color_identity: string[] | null
  created_at: string
  view_count: number | null
}

interface DecksListProps {
  decks: Deck[]
}

export function DecksList({ decks }: DecksListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDecks = decks.filter((deck) => {
    const query = searchQuery.toLowerCase()

    // Search by name
    if (deck.name?.toLowerCase().includes(query)) return true

    // Search by moxfield ID
    if (deck.moxfield_id?.toLowerCase().includes(query)) return true

    // Search by commanders
    if (deck.commanders?.some((cmd) => cmd?.toLowerCase().includes(query))) return true

    // Search by color identity
    if (deck.color_identity?.join('').toLowerCase().includes(query)) return true

    return false
  })

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search decks by name, commander, or Moxfield ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 input-tinted"
        />
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Found {filteredDecks.length} of {decks.length} decks
        </p>
      )}

      {/* Decks List */}
      {filteredDecks.length === 0 ? (
        <div className="relative rounded-2xl border p-2 md:rounded-3xl md:p-3">
          <GlowingEffect
            blur={0}
            borderWidth={3}
            spread={80}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <Card className="card-glass border-0 p-8 relative">
            <div className="text-center text-muted-foreground">
              <p className="mb-2">
                {searchQuery ? 'No decks found matching your search' : 'No decks found'}
              </p>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              )}
            </div>
          </Card>
        </div>
      ) : (
        filteredDecks.map((deck) => (
          <div key={deck.id} className="relative rounded-2xl border p-2 md:rounded-3xl md:p-3">
            <GlowingEffect
              blur={0}
              borderWidth={3}
              spread={80}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
            />
            <Card className="glass-card border-0 hover:shadow-lg transition-shadow relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold truncate">{deck.name}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {/* Commanders */}
                      {deck.commanders && deck.commanders.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Commanders:</span>
                          <span>{deck.commanders.join(', ')}</span>
                        </div>
                      )}

                      {/* Color Identity */}
                      {deck.color_identity && deck.color_identity.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Colors:</span>
                          <span>{deck.color_identity.join('')}</span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Views:</span>
                        <span>{deck.view_count || 0}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      Moxfield ID: {deck.moxfield_id}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/decks/${deck.moxfield_id}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/decks/${deck.moxfield_id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  )
}
