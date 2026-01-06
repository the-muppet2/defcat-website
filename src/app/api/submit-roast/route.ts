// app/api/submit-roast/route.ts

import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import type { SubmissionResponse } from '@/types/form'
import { logger } from '@/lib/observability/logger'
import { trackRequestDuration } from '@/lib/observability/metrics'

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'

// Helper to create Supabase client at runtime
function getSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Lazy-initialize Resend client
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

// Validation helper
function validateRoastSubmission(data: any): boolean {
  const required = [
    'preferredName',
    'deckDescription',
    'moxfieldLink',
    'targetBracket',
    'artChoicesIntentional',
  ]

  for (const field of required) {
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
      return false
    }
  }

  // Validate Moxfield URL - check for proper domain
  if (!data.moxfieldLink.includes('://moxfield.com/') && !data.moxfieldLink.includes('://www.moxfield.com/')) {
    return false
  }

  return true
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let statusCode = 500

  try {
    const supabase = getSupabaseClient()

    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json<SubmissionResponse>(
        {
          success: false,
          error: {
            message: 'Authentication required. Please sign in to submit a roast request.',
            code: 'UNAUTHORIZED',
          },
        },
        { status: 401 }
      )
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return NextResponse.json<SubmissionResponse>(
        {
          success: false,
          error: {
            message: 'Invalid authentication. Please sign in again.',
            code: 'UNAUTHORIZED',
          },
        },
        { status: 401 }
      )
    }

    // Get user's profile to check tier and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('patreon_tier, patreon_id, role, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json<SubmissionResponse>(
        {
          success: false,
          error: {
            message: 'Unable to verify Patreon tier. Please ensure your account is linked.',
            code: 'PROFILE_ERROR',
          },
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate submission data
    if (!validateRoastSubmission(body)) {
      return NextResponse.json<SubmissionResponse>(
        {
          success: false,
          error: {
            message: 'Invalid submission data. Please check all required fields.',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      )
    }

    const isPrivileged = ['admin', 'moderator', 'developer'].includes(profile.role)
{
      const eligibleTiers = ['Emissary', 'Duke', 'Wizard', 'ArchMage']
      if (!eligibleTiers.includes(profile.patreon_tier)) {
        return NextResponse.json<SubmissionResponse>(
          {
            success: false,
            error: {
              message: `Roast submissions require Emissary tier ($30/month) or higher. Your current tier: ${profile.patreon_tier}`,
              code: 'INSUFFICIENT_TIER',
            },
          },
          { status: 403 }
        )
      }

      // Check roast credits for current month
      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)
      const monthString = currentMonth.toISOString().split('T')[0]

      const { data: userCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('credits, last_granted')
        .eq('user_id', user.id)
        .single()

      if (creditsError && creditsError.code !== 'PGRST116') {
        logger.error('Failed to check user roast credits', creditsError, { userId: user.id })
        return NextResponse.json<SubmissionResponse>(
          {
            success: false,
            error: {
              message: 'Unable to check roast credits. Please try again.',
              code: 'CREDITS_ERROR',
            },
          },
          { status: 500 }
        )
      }

      // Extract roast credits from JSONB structure
      const credits = userCredits?.credits as { deck?: number; roast?: number } | null
      const lastGranted = userCredits?.last_granted as { deck?: string; roast?: string } | null

      // Check if credits need to be refreshed for current month
      const lastRoastGrant = lastGranted?.roast
      const needsRefresh = !lastRoastGrant || lastRoastGrant < monthString

      // Roast credits: 1 per month for eligible tiers
      const monthlyAllocation = 1

      let roastCredits = credits?.roast ?? 0

      // If credits need refresh, reset to monthly allocation
      if (needsRefresh) {
        const newCredits = { ...credits, roast: monthlyAllocation }
        const newLastGranted = { ...lastGranted, roast: monthString }

        const { error: refreshError } = await supabase
          .from('user_credits')
          .upsert({
            user_id: user.id,
            credits: newCredits,
            last_granted: newLastGranted,
            updated_at: new Date().toISOString(),
          })

        if (refreshError) {
          logger.error('Failed to refresh roast credits', refreshError, { userId: user.id })
        } else {
          roastCredits = monthlyAllocation
        }
      }

      if (roastCredits <= 0) {
        return NextResponse.json<SubmissionResponse>(
          {
            success: false,
            error: {
              message: `You've used all your roast credits for this month. Credits refresh on the 1st of next month.`,
              code: 'NO_CREDITS',
            },
          },
          { status: 429 }
        )
      }

      // Deduct a roast credit
      const updatedCredits = { ...credits, roast: roastCredits - 1 }
      const { error: deductError } = await supabase
        .from('user_credits')
        .update({
          credits: updatedCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (deductError) {
        logger.error('Failed to deduct roast credit', deductError, { userId: user.id, creditsRemaining: roastCredits - 1 })
        return NextResponse.json<SubmissionResponse>(
          {
            success: false,
            error: {
              message: 'Failed to process credit. Please try again.',
              code: 'CREDIT_DEDUCTION_ERROR',
            },
          },
          { status: 500 }
        )
      }
    }

    // Prepare data for Supabase
    const submissionData = {
      user_id: user.id,
      patreon_id: profile.patreon_id,
      patreon_tier: profile.patreon_tier,
      patreon_username: body.preferredName?.trim() || null,
      email: profile.email || null,
      discord_username: null,
      submission_type: 'roast' as const,
      mystery_deck: false,
      commander: null,
      color_preference: null,
      theme: body.deckDescription?.trim() || null,
      bracket: body.targetBracket || null,
      budget: null,
      coffee_preference: null,
      ideal_date: null,
      deck_list_url: body.moxfieldLink?.trim() || null,
      notes: body.artChoicesIntentional ? `Art choices intentional: ${body.artChoicesIntentional}` : null,
      status: 'pending' as const,
    }

    // Insert into Supabase
    const { data: submission, error: dbError } = await supabase
      .from('deck_submissions')
      .insert(submissionData)
      .select('id, created_at')
      .single()

    if (dbError) {
      logger.error('Failed to insert roast submission', dbError, { userId: user.id, tier: profile.patreon_tier })

      // If credit was deducted, try to refund it
      if (!isPrivileged) {
        try {
          const { data: currentCredits } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', user.id)
            .single()

          if (currentCredits?.credits) {
            const refundedCredits = {
              ...currentCredits.credits,
              roast: ((currentCredits.credits as { roast?: number }).roast ?? 0) + 1,
            }
            await supabase
              .from('user_credits')
              .update({ credits: refundedCredits, updated_at: new Date().toISOString() })
              .eq('user_id', user.id)
          }
        } catch (refundError) {
          logger.error('Failed to refund roast credit', refundError instanceof Error ? refundError : undefined, { userId: user.id })
        }
      }

      return NextResponse.json<SubmissionResponse>(
        {
          success: false,
          error: {
            message: 'Failed to save submission. Please try again.',
            code: 'DATABASE_ERROR',
          },
        },
        { status: 500 }
      )
    }

    // Get submission number
    const { count } = await supabase
      .from('deck_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('submission_type', 'roast')

    const submissionNumber = count || 1

    // Send confirmation email
    try {
      const resend = getResendClient()
      await resend.emails.send({
        from: 'DefCat Deck Roasts <roasts@defcat.com>',
        to: profile.email,
        subject: `Roast Submission Confirmed - #${submissionNumber}`,
        html: `
          <h2>Your Deck Roast Request Has Been Received!</h2>
          <p>Hey ${body.preferredName},</p>
          <p>Your deck roast request has been confirmed! DefCat will roast your deck and you'll be notified when it's ready.</p>
          <hr>
          <p><strong>Submission #:</strong> ${submissionNumber}</p>
          <p><strong>Deck Link:</strong> <a href="${body.moxfieldLink}">${body.moxfieldLink}</a></p>
          <p><strong>Target Bracket:</strong> ${body.targetBracket}</p>
          <p><strong>Description:</strong> ${body.deckDescription}</p>
          <hr>
          <p>Thanks for supporting DefCat!</p>
          <br>
          <p style="font-size: 12px; color: #888;">Generated with Claude Code - https://claude.com/claude-code</p>
        `,
      })
    } catch (emailError) {
      logger.error('Failed to send roast confirmation email', emailError instanceof Error ? emailError : undefined, {
        userId: user.id,
        email: body.email,
        submissionId: submission.id
      })
      // Don't fail the request if email fails
    }

    // Notify admin
    try {
      const resend = getResendClient()
      await resend.emails.send({
        from: 'DefCat Submissions <notifications@defcat.com>',
        to: process.env.ADMIN_EMAIL || 'admin@defcat.com',
        subject: `New ${profile.patreon_tier} Roast Submission #${submissionNumber} from ${body.preferredName}`,
        html: `
          <h2>New Roast Submission Received</h2>
          <p><strong>Submission #:</strong> ${submissionNumber}</p>
          <p><strong>Patreon Tier:</strong> ${profile.patreon_tier}</p>
          <hr>
          <p><strong>Preferred Name:</strong> ${body.preferredName}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Deck Link:</strong> <a href="${body.moxfieldLink}">${body.moxfieldLink}</a></p>
          <p><strong>Target Bracket:</strong> ${body.targetBracket}</p>
          <p><strong>Art Choices Intentional:</strong> ${body.artChoicesIntentional}</p>
          <p><strong>Description:</strong> ${body.deckDescription}</p>
          <br>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/submissions/${submission.id}">View in Dashboard</a></p>
        `,
      })
    } catch (adminEmailError) {
      logger.error('Failed to send admin notification email', adminEmailError instanceof Error ? adminEmailError : undefined, {
        submissionId: submission.id
      })
    }

    // Return success response
    statusCode = 201
    const response = NextResponse.json<SubmissionResponse>(
      {
        success: true,
        data: {
          id: submission.id,
          submissionNumber,
        },
      },
      { status: 201 }
    )

    // Track request metrics
    trackRequestDuration('POST', '/api/submit-roast', statusCode, Date.now() - startTime)
    return response
  } catch (error) {
    logger.error('Unexpected error in roast submission endpoint', error instanceof Error ? error : undefined)
    statusCode = 500
    const response = NextResponse.json<SubmissionResponse>(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred. Please try again.',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    )

    // Track request metrics even on error
    trackRequestDuration('POST', '/api/submit-roast', statusCode, Date.now() - startTime)
    return response
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
