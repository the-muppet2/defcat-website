'use client'

import { CheckCircle2, Edit, ExternalLink, EyeOff, Loader2, Search, Trash2, UserCheck, UserX, X } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GlowingEffect } from '@/components/ui/glowEffect'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

interface Deck {
  id: number
  moxfield_id: string
  public_id: string
  name: string
  commanders: string[] | null
  color_identity: string[] | null
  created_at: string
  view_count: number | null
  owner_profile_id: string | null
  author_username: string | null
  user_hidden: boolean
}

interface UserSearchResult {
  id: string
  email: string
  moxfield_username: string | null
  patreon_tier: string | null
}

interface DecksListProps {
  decks: Deck[]
}

export function DecksList({ decks: initialDecks }: DecksListProps) {
  const [decks, setDecks] = useState(initialDecks)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false)

  // Per-deck user search state
  const [activeSearchDeckId, setActiveSearchDeckId] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserSearchResult[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [assigningDeckId, setAssigningDeckId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ deckId: string; type: 'success' | 'error'; text: string } | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const unassignedCount = decks.filter(d => !d.owner_profile_id).length

  const filteredDecks = decks.filter((deck) => {
    // Filter by assignment status
    if (showUnassignedOnly && deck.owner_profile_id) return false

    const query = searchQuery.toLowerCase()
    if (!query) return true

    // Search by name
    if (deck.name?.toLowerCase().includes(query)) return true
    // Search by moxfield ID
    if (deck.moxfield_id?.toLowerCase().includes(query)) return true
    // Search by commanders
    if (deck.commanders?.some((cmd) => cmd?.toLowerCase().includes(query))) return true
    // Search by color identity
    if (deck.color_identity?.join('').toLowerCase().includes(query)) return true
    // Search by author username
    if (deck.author_username?.toLowerCase().includes(query)) return true

    return false
  })

  const handleUserSearch = useCallback((query: string, deckId: string) => {
    setUserSearch(query)
    setActiveSearchDeckId(deckId)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 2) {
      setUserResults([])
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingUsers(true)
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setUserResults(data.users || [])
      } catch {
        setUserResults([])
      } finally {
        setSearchingUsers(false)
      }
    }, 300)
  }, [])

  const handleAssignUser = async (deckMoxfieldId: string, userId: string, userEmail: string) => {
    setAssigningDeckId(deckMoxfieldId)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setMessage({ deckId: deckMoxfieldId, type: 'error', text: 'Not authenticated' })
        return
      }

      const response = await fetch(`/api/admin/decks/${deckMoxfieldId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ owner_profile_id: userId }),
      })

      if (response.ok) {
        // Update local state
        setDecks(prev => prev.map(d =>
          d.moxfield_id === deckMoxfieldId
            ? { ...d, owner_profile_id: userId }
            : d
        ))
        setMessage({ deckId: deckMoxfieldId, type: 'success', text: `Assigned to ${userEmail}` })
        // Clear search
        setActiveSearchDeckId(null)
        setUserSearch('')
        setUserResults([])
      } else {
        const error = await response.json()
        setMessage({ deckId: deckMoxfieldId, type: 'error', text: error.error || 'Failed to assign' })
      }
    } catch {
      setMessage({ deckId: deckMoxfieldId, type: 'error', text: 'Failed to assign user' })
    } finally {
      setAssigningDeckId(null)
    }
  }

  const closeSearch = () => {
    setActiveSearchDeckId(null)
    setUserSearch('')
    setUserResults([])
  }

  return (
    <div className="space-y-4">
      {/* Search Bar and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search decks by name, commander, or Moxfield ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-tinted"
          />
        </div>
        <Button
          variant={showUnassignedOnly ? 'default' : 'outline'}
          onClick={() => setShowUnassignedOnly(!showUnassignedOnly)}
          className={showUnassignedOnly ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          <UserX className="h-4 w-4 mr-2" />
          Unassigned ({unassignedCount})
        </Button>
      </div>

      {/* Results Count */}
      {(searchQuery || showUnassignedOnly) && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredDecks.length} of {decks.length} decks
          {showUnassignedOnly && ' (unassigned only)'}
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
                {searchQuery || showUnassignedOnly ? 'No decks found matching your filters' : 'No decks found'}
              </p>
              {(searchQuery || showUnassignedOnly) && (
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setShowUnassignedOnly(false) }}>
                  Clear filters
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
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold truncate">{deck.name}</h3>
                      {deck.owner_profile_id ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                          <UserCheck className="h-3 w-3" />
                          Assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <UserX className="h-3 w-3" />
                          Unassigned
                        </span>
                      )}
                      {deck.user_hidden && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                          <EyeOff className="h-3 w-3" />
                          Hidden
                        </span>
                      )}
                    </div>

                    {/* Commanders on separate lines */}
                    {deck.commanders && deck.commanders.length > 0 && (
                      <div className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium">Commanders:</span>
                        <ul className="ml-4 mt-1">
                          {deck.commanders.map((cmd) => (
                            <li key={cmd}>{cmd}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">

                      {deck.color_identity && deck.color_identity.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Colors:</span>
                          <span>{deck.color_identity.join('')}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <span className="font-medium">Views:</span>
                        <span>{deck.view_count || 0}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      Moxfield ID: {deck.moxfield_id}
                      {deck.author_username && <span className="ml-3">Author: {deck.author_username}</span>}
                    </div>

                    {/* Success/Error Message */}
                    {message?.deckId === deck.moxfield_id && (
                      <div className={`mt-2 text-xs flex items-center gap-1 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message.type === 'success' ? <CheckCircle2 className="h-3 w-3" /> : null}
                        {message.text}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex gap-2">
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

                    {/* Quick Assign - only show for unassigned decks */}
                    {!deck.owner_profile_id && (
                      <div className="relative">
                        {activeSearchDeckId === deck.moxfield_id ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1">
                              <Input
                                value={userSearch}
                                onChange={(e) => handleUserSearch(e.target.value, deck.moxfield_id)}
                                placeholder="Search user..."
                                className="h-8 text-xs w-40"
                                autoFocus
                              />
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={closeSearch}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            {searchingUsers && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                              </div>
                            )}
                            {userResults.length > 0 && (
                              <div className="absolute right-0 top-10 z-20 w-64 bg-popover border rounded-lg shadow-lg max-h-48 overflow-auto">
                                {userResults.map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    className="w-full px-3 py-2 text-left hover:bg-muted/50 border-b last:border-0 text-xs"
                                    onClick={() => handleAssignUser(deck.moxfield_id, user.id, user.email)}
                                    disabled={assigningDeckId === deck.moxfield_id}
                                  >
                                    <p className="font-medium truncate">{user.email}</p>
                                    <p className="text-muted-foreground">
                                      {user.moxfield_username || 'No Moxfield'}
                                      {user.patreon_tier && ` - ${user.patreon_tier}`}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-8 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            onClick={() => setActiveSearchDeckId(deck.moxfield_id)}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Assign Owner
                          </Button>
                        )}
                      </div>
                    )}
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
