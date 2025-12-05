import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RawDataCommander {
  card?: { name?: string }
  name?: string
}

function extractCommanders(rawData: Record<string, unknown> | null): string[] {
  if (!rawData?.commanders) return []

  const commanders = rawData.commanders
  if (Array.isArray(commanders)) {
    return commanders.map((c: RawDataCommander) => c?.card?.name || c?.name || '').filter(Boolean)
  }
  if (typeof commanders === 'object' && commanders !== null) {
    return Object.values(commanders as Record<string, RawDataCommander>)
      .map((c) => c?.card?.name || c?.name || '')
      .filter(Boolean)
  }
  return []
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('moxfield_decks')
      .select('moxfield_id, name, view_count, like_count, last_updated_at, public_url, raw_data, user_hidden')
      .or('user_hidden.is.null,user_hidden.eq.false')
      .order('view_count', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Failed to fetch decks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const decks = (data || []).map((deck) => {
      const rawData = deck.raw_data as Record<string, unknown> | null

      const colorIdentity = rawData?.colorIdentity
      const commanders = extractCommanders(rawData)

      return {
        id: deck.moxfield_id,
        name: deck.name,
        commanders,
        color_identity: Array.isArray(colorIdentity) ? colorIdentity : [],
        bracket: typeof rawData?.bracket === 'number' ? rawData.bracket : null,
        description: typeof rawData?.description === 'string' ? rawData.description : null,
        view_count: deck.view_count,
        like_count: deck.like_count,
        updated_at: deck.last_updated_at,
      }
    })

    return NextResponse.json({ decks })
  } catch (err) {
    console.error('Unexpected error fetching decks:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
