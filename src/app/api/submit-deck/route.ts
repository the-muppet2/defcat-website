// app/api/submit-deck/route.ts

import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { DeckSubmissionEmail } from '@/emails'
import type { DeckSubmissionFormData, SubmissionResponse } from '@/types/form'
import { logger } from '@/lib/observability/logger'
import { trackRequestDuration, deckSubmissions } from '@/lib/observability/metrics'

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'

// Helper to create Supabase client at runtime
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server-side operations
  )
}

// Lazy-initialize Resend client (only when needed, avoids build-time errors)
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

// Validation helper
function validateSubmission(data: any): { valid: boolean; missingField?: string } {
  const required = [
    'patreonUsername',
    'email',
    'colorPreference',
    'bracket',
    'budget',
    'coffee',
  ]

  for (const field of required) {
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
      return { valid: false, missingField: field }
    }
  }

  // Validate email format
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  if (!emailRegex.test(data.email)) {
    return { valid: false, missingField: 'email (invalid format)' }
  }

  // Validate mysteryDeck is a string ('yes' or 'no')
  if (typeof data.mysteryDeck !== 'string' || !['yes', 'no'].includes(data.mysteryDeck)) {
    return { valid: false, missingField: `mysteryDeck (got: ${typeof data.mysteryDeck} = ${data.mysteryDeck})` }
  }

  return { valid: true }
}

// Get color identity name for email

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
            message: 'Authentication required. Please sign in to submit a deck.',
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
      .select('patreon_tier, patreon_id, role')
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
    const isDraft = body.isDraft === true

    // Check tier requirements (skip for drafts and privileged users)
    if (!isDraft) {
      const eligibleTiers = ['Duke', 'Wizard', 'ArchMage']
      if (!eligibleTiers.includes(profile.patreon_tier)) {
        return NextResponse.json<SubmissionResponse>(
          {
            success: false,
            error: {
              message: 'Your Patreon tier does not permit deck submissions. Please upgrade your tier to submit a deck.',
              code: 'INSUFFICIENT_TIER',
            },
          },
          { status: 403 }
        )
      }

      // Check deck credits for current month
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
        logger.error('Failed to check user deck credits', creditsError, { userId: user.id })
        return NextResponse.json<SubmissionResponse>(
          {
            success: false,
            error: {
              message: 'Unable to check deck credits. Please try again.',
              code: 'CREDITS_ERROR',
            },
          },
          { status: 500 }
        )
      }

      // Extract deck credits from JSONB structure
      const credits = userCredits?.credits as { deck?: number; roast?: number } | null
      const lastGranted = userCredits?.last_granted as { deck?: string; roast?: string } | null

      // Check if credits need to be refreshed for current month
      const lastDeckGrant = lastGranted?.deck
      const needsRefresh = !lastDeckGrant || lastDeckGrant < monthString

      // Get tier credit allocation
      const tierCredits: Record<string, number> = {
        'Duke': 1,
        'Wizard': 2,
        'ArchMage': 3,
      }
      const monthlyAllocation = tierCredits[profile.patreon_tier] ?? 0

      let deckCredits = credits?.deck ?? 0

      logger.info('Credit check', {
        userId: user.id,
        rawCredits: userCredits?.credits,
        credits,
        lastGranted,
        lastDeckGrant,
        monthString,
        needsRefresh,
        monthlyAllocation,
        deckCredits,
        tier: profile.patreon_tier,
      })

      // If credits need refresh, reset to monthly allocation
      if (needsRefresh && monthlyAllocation > 0) {
        const newCredits = { ...credits, deck: monthlyAllocation }
        const newLastGranted = { ...lastGranted, deck: monthString }

        const { error: refreshError } = await supabase
          .from('user_credits')
          .upsert({
            user_id: user.id,
            credits: newCredits,
            last_granted: newLastGranted,
            updated_at: new Date().toISOString(),
          })

        if (refreshError) {
          logger.error('Failed to refresh deck credits', refreshError, { userId: user.id })
        } else {
          deckCredits = monthlyAllocation
        }
      }

      if (deckCredits <= 0) {
        return NextResponse.json<SubmissionResponse>(
          {
            success: false,
            error: {
              message: `You've used all your deck credits for this month. Credits refresh on the 1st of next month.`,
              code: 'NO_CREDITS',
            },
          },
          { status: 429 }
        )
      }

      // Deduct a deck credit
      const updatedCredits = { ...credits, deck: deckCredits - 1 }
      const { error: deductError } = await supabase
        .from('user_credits')
        .update({
          credits: updatedCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (deductError) {
        logger.error('Failed to deduct deck credit', deductError, { userId: user.id, creditsRemaining: deckCredits - 1 })
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

    // Skip validation for drafts
    if (!isDraft) {
      const validation = validateSubmission(body)
      if (!validation.valid) {
        logger.error('Validation failed', undefined, { missingField: validation.missingField, body })
        return NextResponse.json<SubmissionResponse>(
          {
            success: false,
            error: {
              message: `Invalid submission data. Missing or invalid field: ${validation.missingField}`,
              code: 'VALIDATION_ERROR',
            },
          },
          { status: 400 }
        )
      }
    }

    // Convert mysteryDeck string to boolean
    const mysteryDeck = body.mysteryDeck === true

    // Prepare data for Supabase
    const submissionData = {
      user_id: user.id,
      patreon_id: profile.patreon_id,
      patreon_tier: profile.patreon_tier,
      patreon_username: body.patreonUsername?.trim() || null,
      email: body.email?.trim()?.toLowerCase() || null,
      discord_username: body.discordUsername?.trim() || null,
      submission_type: 'deck' as const,
      mystery_deck: mysteryDeck,
      commander: body.commander?.trim() || null,
      color_preference: body.colorPreference || null,
      theme: body.theme?.trim() || null,
      bracket: body.bracket || null,
      budget: body.budget?.trim() || null,
      coffee_preference: body.coffee?.trim() || null,
      ideal_date: body.idealDate?.trim() || null,
      status: (isDraft ? 'draft' : 'pending') as 'draft' | 'pending',
    }

    // Insert into Supabase
    const { data: submission, error: dbError } = await supabase
      .from('deck_submissions')
      .insert(submissionData)
      .select('id, created_at')
      .single()

    if (dbError) {
      logger.error('Failed to insert deck submission', dbError, { userId: user.id, isDraft, tier: profile.patreon_tier })

      // If credit was deducted, try to refund it
      if (!isDraft) {
        try {
          const { data: currentCredits } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', user.id)
            .single()

          if (currentCredits?.credits) {
            const refundedCredits = {
              ...currentCredits.credits,
              deck: ((currentCredits.credits as { deck?: number }).deck ?? 0) + 1,
            }
            await supabase
              .from('user_credits')
              .update({ credits: refundedCredits, updated_at: new Date().toISOString() })
              .eq('user_id', user.id)
          }
        } catch (refundError) {
          logger.error('Failed to refund deck credit', refundError instanceof Error ? refundError : undefined, { userId: user.id })
        }
      }

      // Check if it's a submission limit error from the trigger
      if (dbError.message?.includes('Monthly submission limit reached')) {
        return NextResponse.json<SubmissionResponse>(
          {
            success: false,
            error: {
              message: dbError.message,
              code: 'MONTHLY_LIMIT_REACHED',
            },
          },
          { status: 429 }
        )
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

    // Get submission number (count of all submissions up to this one)
    const { count } = await supabase
      .from('deck_submissions')
      .select('*', { count: 'exact', head: true })

    const submissionNumber = count || 1

    // Skip emails for drafts
    if (!isDraft) {
      // Send confirmation email
      try {
        const resend = getResendClient()
        await resend.emails.send({
          from: 'DefCat Custom Decks <decks@defcat.com>',
          to: body.email,
          subject: `Deck Submission Confirmed - #${submissionNumber}`,
          react: DeckSubmissionEmail({
            patreonUsername: body.patreonUsername,
            submissionNumber,
            colorPreference: body.colorPreference, // Pass raw value, not .getName()
            commander: body.commander || undefined,
            bracket: body.bracket,
            mysteryDeck,
          }),
        })
      } catch (emailError) {
        logger.error('Failed to send submission confirmation email', emailError instanceof Error ? emailError : undefined, {
          userId: user.id,
          email: body.email,
          submissionId: submission.id
        })
        // Don't fail the request if email fails
        // The submission is already saved
      }

      // Track metrics for successful submission
      if (!isDraft) {
        deckSubmissions.add(1, {
          tier: profile.patreon_tier,
          status: 'success',
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
      return response
    }

    // Return success response for drafts
    statusCode = 201
    return NextResponse.json<SubmissionResponse>(
      {
        success: true,
        data: {
          id: submission.id,
          submissionNumber,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Unexpected error in deck submission', error instanceof Error ? error : undefined)

    // Track metrics for failed submission
    deckSubmissions.add(1, {
      tier: 'unknown',
      status: 'error',
    })

    return NextResponse.json<SubmissionResponse>(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred. Please try again later.',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    )
  } finally {
    const duration = Date.now() - startTime
    trackRequestDuration('POST', '/api/submit-deck', statusCode, duration)
  }
}
