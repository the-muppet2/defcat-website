import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/api'

export const dynamic = 'force-dynamic'

// POST - Run manual credit distribution
export async function POST() {
  const authResult = await requireAdmin()
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient.rpc('run_monthly_credit_distribution', {
      p_triggered_by: 'manual'
    })

    if (error) {
      console.error('Distribution error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      log_id: data
    })
  } catch (error) {
    console.error('Distribution error:', error)
    return NextResponse.json(
      { error: 'Failed to run distribution' },
      { status: 500 }
    )
  }
}

// GET - Get distribution history
export async function GET() {
  const authResult = await requireAdmin()
  if (!authResult.ok) {
    return authResult.response
  }

  try {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient.rpc('get_distribution_history', {
      p_limit: 10
    })

    if (error) {
      console.error('Error fetching history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ history: data || [] })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch distribution history' },
      { status: 500 }
    )
  }
}
