import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

type CreditType = 'deck' | 'roast'

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

    const { userId, creditType, amount } = await request.json()

    if (!userId || !creditType || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'User ID, credit type, and amount are required' },
        { status: 400 }
      )
    }

    const validCreditTypes: CreditType[] = ['deck', 'roast']
    if (!validCreditTypes.includes(creditType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid credit type. Must be "deck" or "roast"' },
        { status: 400 }
      )
    }

    const parsedAmount = parseInt(amount, 10)
    if (isNaN(parsedAmount) || parsedAmount < -100 || parsedAmount > 100) {
      return NextResponse.json(
        { success: false, error: 'Amount must be between -100 and 100' },
        { status: 400 }
      )
    }

    const { data: existingCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    const currentCredits = (existingCredits?.credits as Record<string, number> | null) || {}
    const currentValue = currentCredits[creditType] ?? 0
    const newValue = Math.max(0, currentValue + parsedAmount)

    const updatedCredits = {
      ...currentCredits,
      [creditType]: newValue,
    }

    if (existingCredits) {
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ credits: updatedCredits, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase.from('user_credits').insert({
        user_id: userId,
        credits: updatedCredits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) throw insertError
    }

    const { data: targetUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    await supabase.from('credit_grant_history').insert({
      user_id: userId,
      credit_type: creditType,
      amount: parsedAmount,
      granted_by: user.id,
      reason: `Manual grant by admin`,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `${parsedAmount >= 0 ? 'Added' : 'Removed'} ${Math.abs(parsedAmount)} ${creditType} credit(s) ${parsedAmount >= 0 ? 'to' : 'from'} ${targetUser?.email || 'user'}`,
      newBalance: newValue,
    })
  } catch (error) {
    console.error('Failed to grant credits:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to grant credits',
      },
      { status: 500 }
    )
  }
}
