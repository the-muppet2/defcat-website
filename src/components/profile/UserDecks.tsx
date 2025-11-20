'use client'

import { ExternalLink, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase/generated'

type MoxfieldDeck = Database['public']['Tables']['moxfield_decks']['Row']

interface UserDecksProps {
  moxfieldUsername: string | null
}

export function UserDecks({ moxfieldUsername }: UserDecksProps) {
  const [decks, setDecks] = useState<MoxfieldDeck[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUserDecks() {
      if (!moxfieldUsername) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('moxfield_decks')
          .select('id, name, format, view_count, like_count, comment_count, mainboard_count, last_updated_at, moxfield_url')
          .eq('author_username', moxfieldUsername)
          .neq('author_username', 'DefCatMtg')
          .order('last_updated_at', { ascending: false })

        if (fetchError) throw fetchError

        setDecks(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load decks')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserDecks()
  }, [moxfieldUsername, supabase])

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

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">
        Found {decks.length} deck{decks.length !== 1 ? 's' : ''}
      </p>
      <Accordion type="single" collapsible className="w-full">
        {decks.map((deck) => (
          <AccordionItem key={deck.id} value={`deck-${deck.id}`}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-medium">{deck.name}</span>
                <span className="text-xs text-muted-foreground">
                  {deck.format || 'Unknown Format'}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
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
                    <span className="text-muted-foreground">Mainboard:</span>
                    <span className="ml-2 font-medium">{deck.mainboard_count || 0} cards</span>
                  </div>
                </div>

                {deck.last_updated_at && (
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(deck.last_updated_at).toLocaleDateString()}
                  </div>
                )}

                {deck.moxfield_url && (
                  <a
                    href={deck.moxfield_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-[var(--mana-color)] hover:brightness-110 transition-all"
                  >
                    View on Moxfield
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
