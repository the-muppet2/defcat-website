'use client'

import { useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic'

/**
 * Auth Callback Success Page
 * Handles setting the session from query params (iOS Safari compatible)
 */
function CallbackHandler() {
  const router = useRouter()

  useEffect(() => {
    const setSession = async () => {
      // Small delay to ensure URL is fully updated after redirect
      await new Promise(resolve => setTimeout(resolve, 100))

      // Read directly from window.location (useSearchParams doesn't work reliably after server redirects)
      const url = new URL(window.location.href)
      let accessToken = url.searchParams.get('access_token')
      let refreshToken = url.searchParams.get('refresh_token')

      // Fallback to hash for backwards compatibility
      if (!accessToken || !refreshToken) {
        const hash = window.location.hash.substring(1)
        const hashParams = new URLSearchParams(hash)
        accessToken = hashParams.get('access_token')
        refreshToken = hashParams.get('refresh_token')
      }

      // Clear URL immediately to avoid token exposure in browser history
      if (accessToken && refreshToken) {
        window.history.replaceState({}, '', '/auth/callback-success')
      }

      if (!accessToken || !refreshToken) {
        router.push('/auth/login?error=session_missing')
        return
      }

      try {
        const supabase = createClient()

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          router.push('/auth/login?error=session_failed')
          return
        }

        router.push('/decks')
        router.refresh()
      } catch {
        router.push('/auth/login?error=session_failed')
      }
    }

    setSession()
  }, [router])

  return null
}

export default function CallbackSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <Suspense fallback={null}>
        <CallbackHandler />
      </Suspense>
      <div className="max-w-md w-full p-8 space-y-6 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
        <h1 className="text-2xl font-bold">Completing sign-in...</h1>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  )
}
