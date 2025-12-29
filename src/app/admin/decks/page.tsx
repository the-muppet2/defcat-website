/**
 * Admin Deck Management Page
 * Lists all decks with edit/delete capabilities
 */

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { DecksList } from '@/components/admin/DecksList'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { requireAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminDecksPage() {
  await requireAdmin()

  const supabase = await createClient()

  // Fetch all decks with minimal data including owner info
  const { data: rawDecks, error } = await supabase
    .from('moxfield_decks')
    .select('id, moxfield_id, public_id, name, raw_data, created_at, view_count, owner_profile_id, author_username, user_hidden')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching decks:', error)
  }

  // Transform the data to extract commanders and color_identity from raw_data
  const decks = rawDecks?.map((deck) => {
    const rawData = deck.raw_data as Record<string, unknown> | null
    const commandersData = rawData?.commanders

    let commanders: string[] = []
    if (commandersData) {
      if (Array.isArray(commandersData)) {
        commanders = commandersData.map((c: { name?: string; card?: { name?: string } }) => c?.card?.name || c?.name || '').filter(Boolean)
      } else if (typeof commandersData === 'object') {
        commanders = Object.values(commandersData as Record<string, { card?: { name?: string }; name?: string }>)
          .map((c) => c?.card?.name || c?.name || '')
          .filter(Boolean)
      }
    }

    const colorIdentity = rawData?.colorIdentity as string[] | undefined

    return {
      id: deck.id,
      moxfield_id: deck.moxfield_id || '',
      public_id: deck.public_id || '',
      name: deck.name || 'Untitled Deck',
      commanders: commanders.length > 0 ? commanders : null,
      color_identity: colorIdentity && colorIdentity.length > 0 ? colorIdentity : null,
      created_at: deck.created_at || new Date().toISOString(),
      view_count: deck.view_count,
      owner_profile_id: deck.owner_profile_id || null,
      author_username: deck.author_username || null,
      user_hidden: deck.user_hidden || false,
    }
  })

  return (
    <div className="container mx-auto px-4 py-8" data-page="admin-decks">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Deck Management</h1>
            <p className="text-muted-foreground mt-1">{decks?.length || 0} decks total</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="outline"
                    className="border-purple-500/20 hover:bg-purple-500/10 text-purple-500"
                  >
                    <Link href="/admin/decks/import">
                      <Plus className="h-4 w-4 mr-2" />
                      Import Deck
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manually import a single deck by Moxfield URL</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Decks List */}
        <DecksList decks={decks || []} />
      </div>
    </div>
  )
}
