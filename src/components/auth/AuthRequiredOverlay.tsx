'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, createContext, useContext, type ReactNode, useCallback } from 'react'
import { LogIn, Crown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PATREON_URL = process.env.NEXT_PUBLIC_PATREON_TIER_URL || 'https://www.patreon.com/DefendingCastle'

type OverlayType = 'auth' | 'tier' | null

interface AuthOverlayContextType {
  showAuthOverlay: () => void
  showTierOverlay: () => void
  hideOverlay: () => void
}

const AuthOverlayContext = createContext<AuthOverlayContextType | undefined>(undefined)

export function useAuthOverlay() {
  const context = useContext(AuthOverlayContext)
  if (!context) {
    throw new Error('useAuthOverlay must be used within AuthOverlayProvider')
  }
  return context
}

interface AuthOverlayProviderProps {
  children: ReactNode
}

export function AuthOverlayProvider({ children }: AuthOverlayProviderProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [errorType, setErrorType] = useState<OverlayType>(null)

  // Handle URL-based triggers (for middleware redirects)
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'auth_required') {
      setErrorType('auth')
      setShow(true)
    } else if (error === 'tier_required') {
      setErrorType('tier')
      setShow(true)
    }
  }, [searchParams])

  const handleClose = useCallback(() => {
    setShow(false)
    setErrorType(null)
    // Remove error param from URL if present
    const url = new URL(window.location.href)
    if (url.searchParams.has('error')) {
      url.searchParams.delete('error')
      url.searchParams.delete('redirect')
      router.replace(url.pathname + url.search)
    }
  }, [router])

  const showAuthOverlay = useCallback(() => {
    setErrorType('auth')
    setShow(true)
  }, [])

  const showTierOverlay = useCallback(() => {
    setErrorType('tier')
    setShow(true)
  }, [])

  const hideOverlay = useCallback(() => {
    handleClose()
  }, [handleClose])

  const handleLogin = () => {
    window.location.href = '/auth/login'
  }

  return (
    <AuthOverlayContext.Provider value={{ showAuthOverlay, showTierOverlay, hideOverlay }}>
      {children}
      {show && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleClose}
          />

          {/* Modal - slides up on mobile, centered on desktop */}
          <div
            className="relative z-10 w-full sm:max-w-md sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 fade-in duration-300"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--text-tinted)' }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent/50 transition-colors touch-manipulation"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="px-6 pt-8 pb-6 sm:pb-8 text-center">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div
                  className="p-4 rounded-full"
                  style={{ background: 'var(--accent-tinted)', border: '1px solid var(--border-tinted)' }}
                >
                  {errorType === 'tier' ? (
                    <Crown className="h-8 w-8" style={{ color: 'var(--mana-color)' }} />
                  ) : (
                    <LogIn className="h-8 w-8" style={{ color: 'var(--mana-color)' }} />
                  )}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold mb-2">
                {errorType === 'tier' ? 'Premium Content' : 'Sign In Required'}
              </h2>

              {/* Description */}
              <p className="text-muted-foreground text-sm mb-6">
                {errorType === 'tier'
                  ? 'This content is available to Duke tier patrons and above.'
                  : 'You must be logged in to view this content.'
                }
              </p>

              {/* Actions */}
              <div className="space-y-3">
                {errorType === 'tier' ? (
                  <>
                    <a
                      href={PATREON_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full btn-tinted-primary min-h-[48px] inline-flex items-center justify-center rounded-md text-sm font-medium"
                    >
                      <Crown className="mr-2 h-5 w-5" />
                      Upgrade on Patreon
                    </a>
                    <p className="text-xs text-muted-foreground px-4">
                      Already upgraded? Try signing out and back in to refresh your tier.
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleLogin}
                      className="w-full btn-tinted-primary min-h-[48px]"
                      size="lg"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In with Patreon
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Not a member?{' '}
                      <a
                        href={PATREON_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                        style={{ color: 'var(--mana-color)' }}
                      >
                        Join on Patreon
                      </a>
                    </p>
                  </>
                )}

                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="w-full min-h-[44px]"
                >
                  Continue Browsing
                </Button>
              </div>
            </div>

            {/* Safe area padding for mobile */}
            <div className="h-safe-area-inset-bottom sm:hidden" />
          </div>
        </div>
      )}
    </AuthOverlayContext.Provider>
  )
}

