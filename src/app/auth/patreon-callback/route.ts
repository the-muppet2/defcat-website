/**
 * New Patreon OAuth Callback Route
 * Handles Patreon OAuth and creates proper Supabase sessions
 */
/** biome-ignore-all assist/source/organizeImports: <explanation> */
/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: Its not that complex, chill out */

import { NextResponse } from 'next/server'
import { exchangeCodeForToken, fetchPatreonMembership } from '@/lib/api/patreon'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/observability/logger'
import { userLogins, patreonSyncs } from '@/lib/observability/metrics'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  logger.info('OAuth callback initiated', { origin, codePresent: !!code })

  if (!code) {
    logger.error('OAuth callback failed: no authorization code provided')
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  try {
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')
    const redirectUri = isLocalhost
      ? `${origin}/auth/patreon-callback`
      : process.env.PATREON_REDIRECT_URI!

    logger.debug('OAuth redirect URI determined', { redirectUri, isLocalhost })

    const patreonAccessToken = await exchangeCodeForToken(code, redirectUri)
    const { tier, patreonId, discordId } = await fetchPatreonMembership(patreonAccessToken)

    const patreonUserResponse = await fetch(
      'https://www.patreon.com/api/oauth2/v2/identity?fields%5Buser%5D=email,full_name',
      {
        headers: {
          Authorization: `Bearer ${patreonAccessToken}`,
        },
      }
    )

    const patreonUserData = await patreonUserResponse.json()
    const email = patreonUserData.data.attributes.email
    const fullName = patreonUserData.data.attributes.full_name

    if (!email) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_email`)
    }

    const adminClient = createAdminClient()

    let userId: string

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        patreon_id: patreonId,
      },
    })

    if (createError) {
      logger.info('User already exists, checking profiles table')

      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (profileError) {
        logger.error('Database error checking profiles', profileError)
        return NextResponse.redirect(
          `${origin}/auth/login?error=lookup_failed&details=${encodeURIComponent(profileError.message)}`
        )
      }

      if (!profile) {
        logger.warn('User exists in auth but not in profiles - attempting recovery')
        
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
        })
        
        if (linkError || !linkData?.user?.id) {
          logger.error('Failed to recover user ID', linkError || undefined)
          return NextResponse.redirect(`${origin}/auth/login?error=recovery_failed`)
        }
        
        userId = linkData.user.id
        logger.info('Recovered user ID via generateLink', { userId })
      } else {
        userId = profile.id
        logger.info('Found existing user in profiles', { userId })
      }
    } else if (newUser.user) {
      userId = newUser.user.id
      logger.info('Created new user', { userId })
    } else {
      logger.error('Unexpected error: no user returned from createUser call')
      return NextResponse.redirect(`${origin}/auth/login?error=user_creation_failed`)
    }

   const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    const userRole = existingProfile?.role || 'user'
    
    // Update/create profile (including Discord ID from Patreon social connections)
    const { error: upsertError } = await adminClient.from('profiles').upsert({
      id: userId,
      email,
      patreon_id: patreonId,
      patreon_tier: tier,
      discord_id: discordId,
      role: userRole,
      updated_at: new Date().toISOString(),
    })

    if (upsertError) {
      logger.error('Failed to update user profile', upsertError, { userId })
      return NextResponse.redirect(
        `${origin}/auth/login?error=profile_update_failed&details=${encodeURIComponent(upsertError.message)}`
      )
    }

    const userPassword = `patreon_${userId}_${Date.now()}_${Math.random().toString(36)}`

    const { error: passwordError } = await adminClient.auth.admin.updateUserById(userId, {
      password: userPassword,
    })

    if (passwordError) {
      logger.error('Failed to set user password', passwordError, { userId })
      return NextResponse.redirect(`${origin}/auth/login?error=password_setup_failed`)
    }

    // Sign in to get session tokens
    const { data: sessionData, error: signInError } = await adminClient.auth.signInWithPassword({
      email,
      password: userPassword,
    })

    if (signInError || !sessionData.session) {
      logger.error('Sign-in failed after password setup', signInError || undefined, { userId })
      return NextResponse.redirect(`${origin}/auth/login?error=signin_failed`)
    }

    logger.info('Session created successfully', { userId, tier, role: userRole })

    userLogins.add(1, {
      tier,
      role: userRole,
      isNewUser: !!newUser?.user,
    })

    patreonSyncs.add(1, {
      tier,
      status: 'success',
    })

    const redirectUrl = new URL(`${origin}/auth/callback-success`)
    redirectUrl.hash = `access_token=${sessionData.session.access_token}&refresh_token=${sessionData.session.refresh_token}`

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    logger.error('OAuth callback failed', error instanceof Error ? error : undefined, {
      origin,
    })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(
      `${origin}/auth/login?error=callback_failed&details=${encodeURIComponent(errorMessage)}`
    )
  }
}