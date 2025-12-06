// app/auth/login/page.tsx
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
/**
 * Login Page with accessible tinted styling
 */
'use client'

import { AlertCircle, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic'

function LoginContent() {
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Check for OAuth error in URL (ignore auth_required - that's just a redirect)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const detailsParam = searchParams.get('details')

    // Don't show error for normal redirects
    if (!errorParam || errorParam === 'auth_required') {
      return
    }

    const errorMessages: Record<string, string> = {
      no_code: 'No authorization code received from Patreon',
      no_email: 'Could not retrieve email from Patreon account',
      user_lookup_failed: 'Failed to lookup or create user account',
      user_creation_failed: 'Failed to create user account',
      profile_update_failed: 'Failed to update user profile',
      password_setup_failed: 'Failed to setup user authentication',
      signin_failed: 'Failed to sign in after authentication',
      callback_failed: 'OAuth callback failed',
      config_missing: 'OAuth configuration is missing',
    }

    const baseMessage = errorMessages[errorParam] || 'Authentication failed'
    const fullMessage = detailsParam ? `${baseMessage}: ${detailsParam}` : baseMessage

    setError(fullMessage)
  }, [searchParams])

  const handlePatreonLogin = async () => {
    window.location.href = '/auth/patreon'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-bg-tinted via-transparent to-bg-tinted opacity-50" />

      <Card className="w-full max-w-md shadow-tinted-xl relative" style={{ background: 'var(--glass-bg)', border: '1px solid var(--text-tinted)' }}>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-accent-tinted border border-tinted">
              <Sparkles className="h-8 w-8" style={{ color: 'var(--mana-color)' }} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-foreground">
            Welcome to DeckVault
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Sign in with Patreon to access premium decklists
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button onClick={handlePatreonLogin} className="w-full btn-tinted-primary" size="lg">
            <svg
              className="mr-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
            </svg>
            Continue with Patreon
          </Button>

          <div className="space-y-2">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--mana-color)' }}
                />
                Access to exclusive cEDH decklists
              </li>
              <li className="flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--mana-color)' }}
                />
                Tier-based content unlocks
              </li>
              <li className="flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--mana-color)' }}
                />
                Support DefCat's content creation
              </li>
            </ul>
          </div>

          <p className="mt-6 text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
