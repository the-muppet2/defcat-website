import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { PATREON_TIERS } from '@/types/core'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator', 'developer'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { userId, tier } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (tier && !PATREON_TIERS.includes(tier)) {
      return NextResponse.json({ success: false, error: 'Invalid tier' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ patreon_tier: tier || null, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: tier ? `Tier updated to ${tier}` : 'Tier removed',
    })
  } catch (error) {
    console.error('Failed to update tier:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tier',
      },
      { status: 500 }
    )
  }
}
