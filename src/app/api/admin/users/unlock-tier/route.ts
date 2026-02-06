import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ tier_locked: false, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Tier unlocked - will sync from Patreon on next login',
    })
  } catch (error) {
    console.error('Failed to unlock tier:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlock tier',
      },
      { status: 500 }
    )
  }
}
