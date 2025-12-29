/**
 * API Route for updating user-controlled deck settings
 * Allows deck authors to update visibility, title, and description
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'


interface UpdateDeckSettingsBody {
  user_hidden?: boolean
  user_title?: string | null
  user_description?: string | null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // Get deck ownership info from moxfield_decks
    const { data: deck, error: deckError } = await adminClient
      .from('moxfield_decks')
      .select('id, owner_profile_id')
      .eq('id', parseInt(id, 10))
      .single()

    if (deckError || !deck) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      )
    }

    // SECURITY: Only allow editing via owner_profile_id (admin-assigned)
    // Username matching is NOT secure because users can change their moxfield_username freely
    // Deck ownership must be explicitly assigned by an admin through owner_profile_id
    if (deck.owner_profile_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this deck. Contact an admin to have this deck assigned to your profile.' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: UpdateDeckSettingsBody = await request.json()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}

    if (typeof body.user_hidden === 'boolean') {
      updateData.user_hidden = body.user_hidden
    }

    if (body.user_title !== undefined) {
      // Allow null to clear, or string to set
      updateData.user_title = body.user_title?.trim() || null
    }

    if (body.user_description !== undefined) {
      // Allow null to clear, or string to set
      updateData.user_description = body.user_description?.trim() || null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { error: updateError } = await adminClient
      .from('moxfield_decks')
      .update(updateData)
      .eq('id', parseInt(id, 10))

    if (updateError) {
      console.error('Failed to update deck settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update deck settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated: updateData
    })

  } catch (error) {
    console.error('Deck settings update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET current deck settings for the owner
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, moxfield_username')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 400 }
      )
    }

    // Get deck with settings
    const adminClient = createAdminClient()
    const { data: deck, error: deckError } = await adminClient
      .from('moxfield_decks')
      .select('id, name, user_hidden, user_title, user_description, author_username, owner_profile_id')
      .eq('id', parseInt(id, 10))
      .single()

    if (deckError || !deck) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      )
    }

    // Verify ownership: check owner_profile_id first, then fall back to author_username matching
    const isOwnerByProfileId = deck.owner_profile_id === user.id
    const isOwnerByUsername = profile.moxfield_username &&
      deck.author_username?.toLowerCase() === profile.moxfield_username.toLowerCase()

    if (!isOwnerByProfileId && !isOwnerByUsername) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: deck.id,
      name: deck.name,
      user_hidden: deck.user_hidden ?? false,
      user_title: deck.user_title,
      user_description: deck.user_description
    })

  } catch (error) {
    console.error('Get deck settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
