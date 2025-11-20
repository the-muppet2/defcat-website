/**
 * Admin Deck Edit Page
 * Edit individual deck metadata
 */

import { notFound } from 'next/navigation'
import { DeckEditForm } from '@/components/forms/DeckEditForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireModerator } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminDeckEditPage({ params }: PageProps) {
  await requireModerator()

  const { id } = await params
  const supabase = await createClient()

  const { data: deck, error } = await supabase
    .from('moxfield_decks')
    .select('id, moxfield_id, moxfield_url, name, raw_data, format, view_count, like_count, comment_count, mainboard_count, sideboard_count, author_username, created_at, updated_at')
    .eq('moxfield_id', id)
    .single()

  if (error || !deck) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8" data-page="admin-deck-edit">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gradient">Edit Deck</h1>
          <p className="text-muted-foreground mt-1">{deck.name}</p>
        </div>

        {/* Edit Form */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Deck Details</CardTitle>
            <CardDescription>Update deck metadata and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <DeckEditForm deck={deck} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
