/**
 * API Route: Finish Deck Submission
 * Admin endpoint to complete a submission - imports deck, links owner, marks complete
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface FinishSubmissionBody {
  moxfieldUrl: string
  ownerProfileId?: string | null
}

function extractMoxfieldId(url: string): string | null {
  // Handle various Moxfield URL formats:
  // https://www.moxfield.com/decks/abc123
  // https://moxfield.com/decks/abc123
  // abc123 (just the ID)
  const patterns = [
    /moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]+)$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  return null
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body: FinishSubmissionBody = await request.json()
    const { moxfieldUrl, ownerProfileId } = body

    if (!moxfieldUrl) {
      return NextResponse.json(
        { success: false, error: 'Moxfield URL is required' },
        { status: 400 }
      )
    }

    const moxfieldId = extractMoxfieldId(moxfieldUrl)
    if (!moxfieldId) {
      return NextResponse.json(
        { success: false, error: 'Invalid Moxfield URL format' },
        { status: 400 }
      )
    }

    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const browserSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const {
      data: { user },
      error: userError,
    } = await browserSupabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator', 'developer'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get submission info
    const { data: submission, error: submissionError } = await adminSupabase
      .from('deck_submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Fetch deck from Moxfield API
    const moxfieldApiUrl = `https://api2.moxfield.com/v3/decks/all/${moxfieldId}`
    const moxfieldResponse = await fetch(moxfieldApiUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!moxfieldResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch deck from Moxfield: ${moxfieldResponse.status}`,
        },
        { status: 404 }
      )
    }

    const deckData = await moxfieldResponse.json()

    // Determine owner_profile_id:
    // 1. Use explicitly provided ownerProfileId (admin override)
    // 2. Fall back to the submission's user_id (automatic linking to submitter)
    const effectiveOwnerId = ownerProfileId ?? submission.user_id ?? null

    // Transform and upsert deck into moxfield_decks table
    const transformedDeck = {
      moxfield_id: deckData.id,
      name: deckData.name,
      public_id: deckData.publicId,
      public_url: deckData.publicUrl || `https://www.moxfield.com/decks/${moxfieldId}`,
      format: deckData.format,
      author_name: deckData.createdByUser?.displayName || null,
      author_username: deckData.createdByUser?.userName || null,
      mainboard_count: deckData.mainboardCount || 0,
      sideboard_count: deckData.sideboardCount || 0,
      commanders_count: Object.keys(deckData.boards?.commanders?.cards || {}).length,
      created_at: deckData.createdAtUtc,
      last_updated_at: deckData.lastUpdatedAtUtc,
      visibility: deckData.visibility,
      like_count: deckData.likeCount || 0,
      view_count: deckData.viewCount || 0,
      comment_count: deckData.commentCount || 0,
      is_legal: deckData.isLegal ?? true,
      raw_data: deckData,
      owner_profile_id: effectiveOwnerId,
      fetched_at: new Date().toISOString(),
    }

    const { data: upsertedDeck, error: deckError } = await adminSupabase
      .from('moxfield_decks')
      .upsert(transformedDeck, {
        onConflict: 'moxfield_id',
        ignoreDuplicates: false,
      })
      .select('id, moxfield_id, name')
      .single()

    if (deckError) {
      console.error('Error upserting deck:', deckError)
      return NextResponse.json(
        { success: false, error: `Failed to save deck: ${deckError.message}` },
        { status: 500 }
      )
    }

    // Process cards from deck (commanders and mainboard)
    const cardsToUpsert: Array<{
      id: string
      name: string
      scryfall_id: string | null
      mana_cost: string | null
      cmc: number | null
      type_line: string | null
      oracle_text: string | null
      colors: string[] | null
      color_identity: string[] | null
      rarity: string | null
      set_code: string | null
      set_name: string | null
      image_url: string | null
      prices: unknown
    }> = []

    const boardNames = ['commanders', 'mainboard', 'sideboard']
    for (const boardName of boardNames) {
      const board = deckData.boards?.[boardName]
      if (!board?.cards) continue

      for (const cardData of Object.values(board.cards) as Array<{ card: Record<string, unknown> }>) {
        const card = cardData.card
        cardsToUpsert.push({
          id: card.id as string,
          name: card.name as string,
          scryfall_id: (card.scryfall_id as string) || null,
          mana_cost: (card.mana_cost as string) || null,
          cmc: (card.cmc as number) || null,
          type_line: (card.type_line as string) || null,
          oracle_text: (card.oracle_text as string) || null,
          colors: (card.colors as string[]) || null,
          color_identity: (card.color_identity as string[]) || null,
          rarity: (card.rarity as string) || null,
          set_code: (card.set as string) || null,
          set_name: (card.set_name as string) || null,
          image_url: (card.cardKingdomUrl as string) || null,
          prices: card.prices || null,
        })
      }
    }

    // Upsert cards
    if (cardsToUpsert.length > 0) {
      const { error: cardsError } = await adminSupabase.from('cards').upsert(cardsToUpsert, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })

      if (cardsError) {
        console.warn('Failed to upsert cards:', cardsError)
      }
    }

    // Trigger image caching (fire and forget)
    if (cardsToUpsert.length > 0) {
      const cardIds = cardsToUpsert.map((c) => c.id)
      const cacheUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cache-images`

      fetch(cacheUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardIds }),
      }).catch((err) => {
        console.warn('Image cache trigger failed (non-blocking):', err.message)
      })
    }

    // Update submission status to completed
    const { error: updateError } = await adminSupabase
      .from('deck_submissions')
      .update({
        status: 'completed',
        deck_list_url: moxfieldUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating submission:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deckImported: true,
      deckId: upsertedDeck.moxfield_id,
      deckName: upsertedDeck.name,
      ownerLinked: !!effectiveOwnerId,
      ownerSource: ownerProfileId ? 'manual' : (submission.user_id ? 'submitter' : 'none'),
      cardsProcessed: cardsToUpsert.length,
    })
  } catch (error) {
    console.error('Finish submission error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
