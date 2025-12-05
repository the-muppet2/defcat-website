import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface Commander {
  name: string
  scryfall_id: string
}

interface UpdateDeckBody {
  name: string
  owner: string
  description?: string
  commanders: Commander[]
  owner_profile_id?: string | null
}

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function verifyAdminAccess(request: NextRequest): Promise<{ success: true; userId: string } | { success: false; response: NextResponse }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized - No authorization header' },
        { status: 401 }
      )
    }
  }

  const browserSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error: userError } = await browserSupabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  if (userError || !user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }
  }

  const supabase = getSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'moderator', 'developer'].includes(profile.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
  }

  return { success: true, userId: user.id }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    // Verify admin access
    const authResult = await verifyAdminAccess(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = getSupabaseClient()
    const body: UpdateDeckBody = await request.json()

    const { name, owner, commanders, owner_profile_id } = body

    // Validate required fields
    if (!name || !owner || !commanders || commanders.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Ensure all commander cards exist in cards table
    const newCardIds: string[] = []
    
    for (const commander of commanders) {
      if (!commander.scryfall_id) {
        return NextResponse.json(
          { error: `Missing scryfall_id for commander: ${commander.name}` },
          { status: 400 }
        )
      }

      // Check if card exists
      const { data: existingCard } = await supabase
        .from('cards')
        .select('id, scryfall_id, cached_image_url')
        .eq('scryfall_id', commander.scryfall_id)
        .single()

      if (!existingCard) {
        // Fetch card data from Scryfall
        const scryfallResponse = await fetch(
          `https://api.scryfall.com/cards/${commander.scryfall_id}`
        )

        if (!scryfallResponse.ok) {
          return NextResponse.json(
            { error: `Failed to fetch card data for: ${commander.name}` },
            { status: 500 }
          )
        }

        const cardData = await scryfallResponse.json()

        // Create card entry
        const { data: newCard, error: insertError } = await supabase
          .from('cards')
          .insert({
            id: cardData.id,
            name: cardData.name,
            scryfall_id: cardData.id,
            mana_cost: cardData.mana_cost,
            cmc: cardData.cmc,
            type_line: cardData.type_line,
            oracle_text: cardData.oracle_text,
            colors: cardData.colors,
            color_identity: cardData.color_identity,
            rarity: cardData.rarity,
            set_code: cardData.set,
            set_name: cardData.set_name,
            image_url: cardData.image_uris?.normal,
            prices: cardData.prices,
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('Error inserting card:', insertError)
          return NextResponse.json(
            { error: `Failed to create card entry for: ${commander.name}` },
            { status: 500 }
          )
        }

        newCardIds.push(newCard.id)
      } else if (!existingCard.cached_image_url) {
        newCardIds.push(existingCard.id)
      }
    }

    // Get current deck data to preserve other fields
    const { data: currentDeck } = await supabase
      .from('moxfield_decks')
      .select('raw_data')
      .eq('moxfield_id', id)
      .single()

    const rawData = currentDeck?.raw_data || {}

    // Update commanders in raw_data
    const updatedRawData = {
      ...rawData,
      commanders: commanders.map(c => ({
        card: {
          name: c.name,
          id: c.scryfall_id,
        }
      })),
    }

    // Update the deck
    const { data: updatedDeck, error: updateError } = await supabase
      .from('moxfield_decks')
      .update({
        name,
        author_username: owner,
        raw_data: updatedRawData,
        owner_profile_id: owner_profile_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('moxfield_id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating deck:', updateError)
      return NextResponse.json(
        { error: 'Failed to update deck' },
        { status: 500 }
      )
    }

    if (newCardIds.length > 0) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const cacheUrl = `${supabaseUrl}/functions/v1/cache-images`
      
      fetch(cacheUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardIds: newCardIds,
        }),
      }).catch(err => {
        console.warn('Failed to trigger image caching:', err)
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedDeck,
      newCardsCreated: commanders.filter(c => 
        newCardIds.includes(c.scryfall_id)
      ).length,
      imageCacheTriggered: newCardIds.length > 0,
    })
  } catch (error) {
    console.error('Error in PATCH /api/admin/decks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Verify admin access
    const authResult = await verifyAdminAccess(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('moxfield_decks')
      .delete()
      .eq('moxfield_id', id)

    if (error) {
      console.error('Error deleting deck:', error)
      return NextResponse.json(
        { error: 'Failed to delete deck' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/decks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
