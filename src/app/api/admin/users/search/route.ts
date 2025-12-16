import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check admin authorization
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'developer', 'moderator'].includes(profile.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get search query
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] })
  }

  // Search profiles by email or moxfield_username
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, moxfield_username, patreon_tier')
    .or(`email.ilike.%${query}%,moxfield_username.ilike.%${query}%`)
    .limit(10)

  if (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }

  return NextResponse.json({ users: users || [] })
}
