'use client'

import { HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { TutorialModal } from '@/components/tutorial/TutorialModal'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { Button } from '@/components/ui/button'
import { ThemeAnimationType } from '@/lib/hooks/useModeAnimation'
import { cn } from '@/lib/utils'

export function NavigationHeader() {
  const [showTutorial, setShowTutorial] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      <header className="sticky top-0 w-full glass-tinted-strong shadow-tinted-lg z-[100]">
        <div className="container flex h-16 items-center justify-between">
          {/* Tutorial Button (Top Left) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTutorial(true)}
            className="hover-tinted"
          >
            <HelpCircle className="h-5 w-5 mr-2" />
            Tutorial
          </Button>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/decks"
              className={cn(
                'text-sm font-medium transition-colors hover-tinted px-3 py-2 rounded-lg',
                pathname === '/decks' && 'tinted-accent border border-tinted'
              )}
            >
              Deck Vault
            </Link>

            <Link
              href="/discount-store"
              className={cn(
                'text-sm font-medium transition-colors hover-tinted px-3 py-2 rounded-lg',
                pathname === '/discount-store' && 'tinted-accent border border-tinted'
              )}
            >
              Defcat's Discount Store
            </Link>

            <Link
              href="/commander-college"
              className={cn(
                'text-sm font-medium transition-colors hover-tinted px-3 py-2 rounded-lg',
                pathname === '/commander-college' && 'tinted-accent border border-tinted'
              )}
            >
              Commander College
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">

            {/* Dark Mode Toggle */}
            <AnimatedThemeToggler
              animationType={ThemeAnimationType.MANA}
              className="hover-tinted rounded-full p-2"
            />

            {/* Login Button */}
            <Button size="lg" asChild className="btn-tinted-primary shadow-tinted-glow">
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}
