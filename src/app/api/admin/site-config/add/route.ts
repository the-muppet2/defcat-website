import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'

// Helper to create Supabase client at runtime
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    // Verify user is admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from browser client to verify role
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { key, value, category, description, is_sensitive } = body

    if (!key || !category) {
      return NextResponse.json(
        { success: false, error: 'Key and category are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('site_config')
      .insert({
        key,
        value: value || '',
        category,
        description: description || '',
        is_sensitive: is_sensitive || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to insert config:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration item added successfully',
      data,
    })
  } catch (error) {
    console.error('Failed to add config item:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add configuration item',
      },
      { status: 500 }
    )
  }
}
