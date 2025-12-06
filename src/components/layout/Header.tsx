// components/layout/header.tsx
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
'use client'

import type { User } from '@supabase/supabase-js'
import { ClipboardList, LogIn, Sparkles, Menu, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { AuthLoadingModal } from '@/components/auth/auth-loading-modal'
import { UserMenu } from '@/components/profile/UserMenu'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { useSubmissionEligibility } from '@/lib/auth/client'
import { useNavigationHistory } from '@/lib/hooks/useNavigationHistory'
import { ThemeAnimationType } from '@/lib/hooks/useModeAnimation'
import { cn } from '@/lib/utils'
import type { PatreonTier } from '@/types/core'
import { AnimatedThemeToggler } from '../ui/animated-theme-toggler'
import { TierBadge } from '../tier/TierBadge'

interface HeaderProps {
  initialUser: User | null
  initialUserTier: PatreonTier
  initialUserRole: string
  initialPendingCount: number
}

export function Header({
  initialUser,
  initialUserTier,
  initialUserRole,
  initialPendingCount,
}: HeaderProps) {
  // Use props directly instead of state to ensure updates after login
  const user = initialUser
  const userTier = initialUserTier
  const userRole = initialUserRole
  const pendingCount = initialPendingCount

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showBadge, setShowBadge] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { goBack, hasHistory } = useNavigationHistory()
  const {
    isEligible,
    remainingSubmissions,
    isLoading: submissionLoading,
  } = useSubmissionEligibility()

  // Track client-side mount to prevent hydration mismatch with navigation history
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (userRole === 'developer') {
      const stored = localStorage.getItem('show-submission-badge')
      setShowBadge(stored === null || stored === 'true')
    }
  }, [userRole])

  const handleLogin = useCallback(() => {
    setShowLoginModal(true)
    setTimeout(() => {
      window.location.href = '/auth/login'
    }, 300)
  }, [])
  
  return (
    <>
      <AuthLoadingModal isOpen={showLoginModal} type="login" />
      <header className="sticky top-0 w-full shadow-md z-50">
        <div className="px-8 md:px-16 lg:px-24 flex h-16 items-center justify-between">
          {/* Logo and Back Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {mounted && hasHistory() && (
              <button
                onClick={() => goBack('/decks')}
                className="hover-tinted rounded-lg p-2 transition-all"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Link
              href="/"
              className="flex items-center space-x-2 group hover-tinted rounded-lg px-3 py-2 -ml-3"
            >
              <Sparkles className="h-5 w-5 text-tinted transition-transform group-hover:rotate-12 group-hover:scale-110" />
              <span className="font-bold text-xl gradient-tinted-text">DefCat's DeckVault</span>
            </Link>
          </div>

          {/* Navigation Menu - centered with equal spacing */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList
                className="flex-row gap-4 border rounded-lg shadow-lg p-1">
                <NavigationMenuItem
                  style={{ border: "rounded 1px solid var(--mana-color)"}}
                >
                  <NavigationMenuLink asChild>
                    <Link
                      href="/decks"
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'hover-tinted',
                        pathname === '/decks' && 'tinted-accent border border-tinted'
                      )}
                    >
                      The Vault
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem
                  style={{ border: "rounded 1px solid var(--mana-color)"}}>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/search"
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'hover-tinted',
                        pathname === '/home/search' && 'tinted-accent border border-tinted'
                      )}
                    >
                      Search
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem
                  style={{ border: "rounded 1px solid var(--mana-color)"}}>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/home/college"
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'hover-tinted',
                        pathname === '/home/college' && 'tinted-accent border border-tinted'
                      )}
                    >
                      College
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem
                  style={{ border: "rounded 1px solid var(--mana-color)"}}
                >
                  <NavigationMenuLink asChild>
                    <Link
                      href="/home/store"
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'hover-tinted',
                        pathname === '/home/store' && 'tinted-accent border border-tinted'
                      )}
                    >
                      Store
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {(['Duke', 'Wizard', 'ArchMage'].includes(userTier) ||
                  ['admin', 'moderator', 'developer'].includes(userRole)) && (
                  <NavigationMenuItem
                    style={{ border: "rounded 1px solid var(--mana-color)"}}>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/decks/submission"
                        className={cn(
                          navigationMenuTriggerStyle(),
                          'hover-tinted',
                          pathname === '/decks/submission' && 'tinted-accent border border-tinted'
                        )}
                      >
                        Submit Deck
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden hover-tinted rounded-lg p-2 transition-all"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Theme Toggle */}
            <AnimatedThemeToggler
              animationType={ThemeAnimationType.MANA}
              duration={1000}
              blurAmount={0}
              className="hover-tinted rounded-full p-2"
            />
            {/* User Section */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* Admin/Developer notification badge */}
                {pendingCount > 0 &&
                  (userRole === 'admin' || (userRole === 'developer' && showBadge)) && (
                    <Link
                      href="/admin/submissions"
                      className="relative hover-tinted rounded-lg p-2 transition-all"
                      title={`${pendingCount} pending submission${pendingCount !== 1 ? 's' : ''}`}
                    >
                      <ClipboardList className="h-5 w-5" style={{ color: 'var(--mana-color)' }} />
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {pendingCount}
                      </span>
                    </Link>
                  )}
                {/* Deck submission credit indicator */}
                {!submissionLoading && isEligible && remainingSubmissions > 0 && (
                  <Link
                    href="/decks/submission"
                    className="relative hover-tinted rounded-lg p-2 transition-all"
                    title={`${remainingSubmissions} deck submission${remainingSubmissions !== 1 ? 's' : ''} remaining`}
                  >
                    <Sparkles className="h-5 w-5" style={{ color: 'var(--mana-color)' }} />
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {remainingSubmissions}
                    </span>
                  </Link>
                )}
                <div className="hover-tinted rounded-full">
                  <UserMenu
                    user={{
                      id: user.id,
                      email: user.email || '',
                      patreonTier: userTier,
                      role: userRole as any,
                    }}
                  />
                </div>
              </div>
            ) : (
              <Button
              size="lg"
              onClick={handleLogin}
              className="btn-tinted-primary shadow-tinted-glow"
              >
                <LogIn className="mr-2" size={16} />
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-out Menu */}
            <div className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] z-50 md:hidden glass-tinted-strong border-r border-tinted elevation-5 animate-in slide-in-from-left duration-300">
              <nav className="px-4 py-6 space-y-2 h-full overflow-y-auto">
              <Link
                href="/decks"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-lg hover-tinted transition-all',
                  pathname === '/decks' && 'tinted-accent border border-tinted'
                )}
              >
                The Vault
              </Link>
              <Link
                href="/home/home"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-lg hover-tinted transition-all',
                  pathname === '/home/home' && 'tinted-accent border border-tinted'
                )}
              >
                Home
              </Link>
              <Link
                href="/home/college"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-lg hover-tinted transition-all',
                  pathname === '/home/college' && 'tinted-accent border border-tinted'
                )}
              >
                College
              </Link>
              <Link
                href="/home/store"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-lg hover-tinted transition-all',
                  pathname === '/home/store' && 'tinted-accent border border-tinted'
                )}
              >
                Store
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-lg hover-tinted transition-all',
                  pathname === '/about' && 'tinted-accent border border-tinted'
                )}
              >
                About
              </Link>
              {(['Duke', 'Wizard', 'ArchMage'].includes(userTier) ||
                ['admin', 'moderator', 'developer'].includes(userRole)) && (
                <Link
                  href="/decks/submission"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-3 rounded-lg hover-tinted transition-all',
                    pathname === '/decks/submission' && 'tinted-accent border border-tinted'
                  )}
                >
                  Submit Deck
                </Link>
              )}
              </nav>
            </div>
          </>
        )}
      </header>
    </>
  )
}
