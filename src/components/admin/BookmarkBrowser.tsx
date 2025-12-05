'use client'

import { useMediaQuery } from '@uidotdev/usehooks'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'

type DeckItem = {
  deckId: string
  name: string
  url: string
  format: string
  lastUpdated: string
  isImported: boolean
}

export function DeckURLSelector({
  bookmarkId: _bookmarkId = 'xpGzQ',
  onSelect,
}: {
  bookmarkId?: string
  onSelect?: (deck: DeckItem) => void
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [selectedDeck, setSelectedDeck] = React.useState<DeckItem | null>(null)
  const [decks, setDecks] = React.useState<DeckItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchDecks = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Fetch bookmark from Moxfield
      const response = await fetch(
        `https://api2.moxfield.com/v1/bookmarks/xpGzQ?decksPageSize=100`,
        {
          headers: {
            accept: 'application/json',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch bookmark: ${response.status}`)
      }

      const bookmark = await response.json()

      // Get existing decks from your database
      const { data: existingDecks } = await supabase
        .from('decks')
        .select('moxfield_id')
        .in(
          'moxfield_id',
          bookmark.decks.data.map((d: any) => d.deck.publicId)
        )

      const existingDeckIds = new Set(existingDecks?.map((d) => d.moxfield_id) || [])

      // Transform to DeckItem format
      const transformedDecks: DeckItem[] = bookmark.decks.data.map((item: any) => ({
        deckId: item.deck.publicId,
        name: item.deck.name,
        url: `https://moxfield.com/decks/${item.deck.publicId}`,
        format: item.deck.format,
        lastUpdated: item.deck.lastUpdatedAtUtc,
        isImported: existingDeckIds.has(item.deck.publicId),
      }))

      setDecks(transformedDecks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (open && decks.length === 0) {
      fetchDecks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, decks.length])

  const handleSelect = (deck: DeckItem) => {
    setSelectedDeck(deck)
    onSelect?.(deck)
  }

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[300px] justify-start">
            {selectedDeck ? (
              <span className="truncate">{selectedDeck.name}</span>
            ) : (
              <>+ Select Deck to Import</>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <DeckList
            setOpen={setOpen}
            setSelectedDeck={handleSelect}
            decks={decks}
            loading={loading}
            error={error}
            onRefresh={fetchDecks}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selectedDeck ? (
            <span className="truncate">{selectedDeck.name}</span>
          ) : (
            <>+ Select Deck to Import</>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t max-h-[80vh] overflow-y-auto">
          <DeckList
            setOpen={setOpen}
            setSelectedDeck={handleSelect}
            decks={decks}
            loading={loading}
            error={error}
            onRefresh={fetchDecks}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function DeckList({
  setOpen,
  setSelectedDeck,
  decks,
  loading,
  error,
  onRefresh,
}: {
  setOpen: (open: boolean) => void
  setSelectedDeck: (deck: DeckItem) => void
  decks: DeckItem[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}) {
  return (
    <Command>
      <div className="flex items-center border-b px-3">
        <CommandInput placeholder="Search decks..." className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading} className="ml-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>
      <CommandList>
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading decks from Moxfield...
          </div>
        ) : error ? (
          <div className="py-6 text-center text-sm text-destructive">
            {error}
            <Button variant="link" size="sm" onClick={onRefresh} className="ml-2">
              Try again
            </Button>
          </div>
        ) : (
          <>
            <CommandEmpty>No decks found.</CommandEmpty>
            <CommandGroup>
              {decks.map((deck) => (
                <CommandItem
                  key={deck.deckId}
                  value={`${deck.name} ${deck.format}`}
                  onSelect={() => {
                    setSelectedDeck(deck)
                    setOpen(false)
                  }}
                  className="flex flex-col items-start gap-1 py-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{deck.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {deck.format}
                      </Badge>
                      {deck.isImported && (
                        <Badge variant="secondary" className="text-xs">
                          ✓ Imported
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{deck.url}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )
}
