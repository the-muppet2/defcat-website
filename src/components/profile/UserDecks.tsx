'use client'

import Link from 'next/link'
import { Check, Eye, EyeOff, Loader2, Pencil, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ManaSymbols } from '@/components/decks/ManaSymbols'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase/generated'

type EnhancedDeck = Database['public']['Views']['decks_enhanced']['Row']

interface DeckSettings {
  user_hidden: boolean
  user_title: string | null
  user_description: string | null
}

interface UserDecksProps {
  moxfieldUsername: string | null
}

export function UserDecks({ moxfieldUsername }: UserDecksProps) {
  const [decks, setDecks] = useState<EnhancedDeck[]>([])
  const [deckSettings, setDeckSettings] = useState<Record<number, DeckSettings>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingDeck, setEditingDeck] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState<number | null>(null)
  const supabase = createClient()

  const fetchUserDecks = useCallback(async () => {
    if (!moxfieldUsername) {
      setIsLoading(false)
      return
    }

    try {
      // First get the user's profile ID for direct ownership lookup
      const { data: userData } = await supabase.auth.getUser()
      const profileId = userData?.user?.id

      // Query moxfield_decks directly with multiple attribution methods:
      // 1. Direct owner_profile_id match (most reliable)
      // 2. author_username match (from Moxfield API)
      // 3. Fallback to player_username in decks_enhanced view
      let deckIds: number[] = []

      if (profileId) {
        // Get decks directly owned by this profile
        const { data: ownedDecks } = await supabase
          .from('moxfield_decks')
          .select('id')
          .eq('owner_profile_id', profileId)

        if (ownedDecks) {
          deckIds = ownedDecks.map(d => d.id)
        }
      }

      // Also get decks where author_username matches moxfield_username
      const { data: authorDecks } = await supabase
        .from('moxfield_decks')
        .select('id')
        .ilike('author_username', moxfieldUsername)

      if (authorDecks) {
        for (const d of authorDecks) {
          if (!deckIds.includes(d.id)) {
            deckIds.push(d.id)
          }
        }
      }

      // Fallback: also check decks_enhanced player_username for legacy deck name parsing
      const { data: enhancedByName } = await supabase
        .from('decks_enhanced')
        .select('id')
        .ilike('player_username', moxfieldUsername)

      if (enhancedByName) {
        for (const d of enhancedByName) {
          if (d.id && !deckIds.includes(d.id)) {
            deckIds.push(d.id)
          }
        }
      }

      if (deckIds.length === 0) {
        setDecks([])
        setDeckSettings({})
        setIsLoading(false)
        return
      }

      // Now fetch full deck data for all matched IDs
      const { data: enhancedData, error: enhancedError } = await supabase
        .from('decks_enhanced')
        .select('id, name, format, view_count, like_count, comment_count, mainboard_count, last_updated_at, public_id, moxfield_id, player_username, user_title, commanders, color_string, description')
        .in('id', deckIds)
        .order('last_updated_at', { ascending: false })

      if (enhancedError) throw enhancedError

      // Get user settings from moxfield_decks for these deck IDs
      const settingsMap: Record<number, { user_hidden: boolean | null; user_title: string | null; user_description: string | null }> = {}

      if (deckIds.length > 0) {
        const { data: settingsData } = await supabase
          .from('moxfield_decks')
          .select('id, user_hidden, user_title, user_description')
          .in('id', deckIds)

        for (const s of settingsData || []) {
          settingsMap[s.id] = {
            user_hidden: s.user_hidden,
            user_title: s.user_title,
            user_description: s.user_description,
          }
        }
      }

      // Merge enhanced data with settings
      const transformedDecks: EnhancedDeck[] = []
      const settings: Record<number, DeckSettings> = {}

      for (const deck of enhancedData || []) {
        const deckId = deck.id!
        const deckSetting = settingsMap[deckId]

        // Apply user overrides to deck title/description
        // user_title from moxfield_decks takes priority, then user_title from view, then name
        const displayTitle = deckSetting?.user_title || deck.user_title || deck.name
        const displayDescription = deckSetting?.user_description || deck.description

        transformedDecks.push({
          ...deck,
          user_title: displayTitle,
          description: displayDescription,
        } as EnhancedDeck)

        settings[deckId] = {
          user_hidden: deckSetting?.user_hidden ?? false,
          user_title: deckSetting?.user_title ?? null,
          user_description: deckSetting?.user_description ?? null,
        }
      }

      setDecks(transformedDecks)
      setDeckSettings(settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks')
    } finally {
      setIsLoading(false)
    }
  }, [moxfieldUsername, supabase])

  useEffect(() => {
    fetchUserDecks()
  }, [fetchUserDecks])

  const toggleVisibility = async (deckId: number) => {
    const currentSettings = deckSettings[deckId]
    if (!currentSettings) return

    setSaving(deckId)
    try {
      const response = await fetch(`/api/decks/${deckId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_hidden: !currentSettings.user_hidden }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update visibility')
      }

      setDeckSettings(prev => ({
        ...prev,
        [deckId]: { ...prev[deckId], user_hidden: !currentSettings.user_hidden }
      }))
    } catch (err) {
      console.error('Failed to toggle visibility:', err)
    } finally {
      setSaving(null)
    }
  }

  const startEditing = (deckId: number, deck: EnhancedDeck) => {
    const settings = deckSettings[deckId]
    setEditingDeck(deckId)
    setEditTitle(settings?.user_title || '')
    setEditDescription(settings?.user_description || '')
  }

  const cancelEditing = () => {
    setEditingDeck(null)
    setEditTitle('')
    setEditDescription('')
  }

  const saveEdits = async (deckId: number) => {
    setSaving(deckId)
    try {
      const response = await fetch(`/api/decks/${deckId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_title: editTitle || null,
          user_description: editDescription || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      setDeckSettings(prev => ({
        ...prev,
        [deckId]: {
          ...prev[deckId],
          user_title: editTitle || null,
          user_description: editDescription || null,
        }
      }))

      // Refresh decks to get updated display
      await fetchUserDecks()
      setEditingDeck(null)
    } catch (err) {
      console.error('Failed to save edits:', err)
    } finally {
      setSaving(null)
    }
  }

  if (!moxfieldUsername) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Set your Moxfield username to see your decks here</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-destructive py-8">
        <p>{error}</p>
      </div>
    )
  }

  if (decks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No decks found for username: {moxfieldUsername}</p>
      </div>
    )
  }

  const cost = true

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">
        Found {decks.length} deck{decks.length !== 1 ? 's' : ''}
      </p>
      <Accordion type="single" collapsible className="w-full">
        {decks.map((deck) => {
          const settings = deckSettings[deck.id!]
          const isHidden = settings?.user_hidden ?? false
          const isEditing = editingDeck === deck.id
          const isSaving = saving === deck.id

          return (
            <AccordionItem key={deck.id} value={`deck-${deck.id}`} className={isHidden ? 'opacity-60' : ''}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-2">
                    {isHidden && <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium">{deck.user_title || deck.name}</span>
                  </div>
                  {deck.color_string && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {deck.color_string.split('').map((symbol, idx) => (
                        <ManaSymbols key={`${symbol}-${idx}`} mana={symbol} cost={cost} className="h-4 w-4 inline-block align-text-bottom gap-1" />
                      ))}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {/* Commander info */}
                  {deck.commanders && (deck.commanders as string[]).length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Commander:</span>
                      <span className="ml-2 font-medium">
                        {(deck.commanders as string[]).join(' / ')}
                      </span>
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Views:</span>
                      <span className="ml-2 font-medium">
                        {deck.view_count?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Likes:</span>
                      <span className="ml-2 font-medium">
                        {deck.like_count?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Comments:</span>
                      <span className="ml-2 font-medium">
                        {deck.comment_count?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cards:</span>
                      <span className="ml-2 font-medium">{deck.mainboard_count || 0}</span>
                    </div>
                  </div>

                  {deck.last_updated_at && (
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(deck.last_updated_at).toLocaleDateString()}
                    </div>
                  )}

                  {/* Edit form */}
                  {isEditing ? (
                    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Custom Title</label>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Leave empty to use default"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Custom Description</label>
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Add a description for your deck..."
                          rows={3}
                          className="text-sm resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdits(deck.id!)}
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          <span className="ml-1">Save</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4" />
                          <span className="ml-1">Cancel</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Action buttons */
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link href={`/decks/${deck.moxfield_id}`}>
                        <Button size="sm" variant="default">
                          View Deck
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(deck.id!, deck)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant={isHidden ? 'secondary' : 'outline'}
                        onClick={() => toggleVisibility(deck.id!)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isHidden ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Show
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
