'use client'

import { Flame } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useRoastEligibility, useAuth } from '@/lib/auth/client'
import { cn } from '@/lib/utils'

interface RoastButtonProps {
  moxfieldUrl: string
  variant?: 'default' | 'compact' | 'icon-only' | 'mobile'
  className?: string
  deckOwnerId?: string | null
}

export function RoastButton({ moxfieldUrl, variant = 'default', className, deckOwnerId }: RoastButtonProps) {
  const { isEligible, roastCredits, isLoading } = useRoastEligibility()
  const { user } = useAuth()

  const roastUrl = `/decks/roast-submission?deckUrl=${encodeURIComponent(moxfieldUrl)}`

  // Don't show anything while loading or if user is not eligible
  if (isLoading || !isEligible) {
    return null
  }

  // If deckOwnerId is provided, only show button if current user owns the deck
  if (deckOwnerId && user?.id !== deckOwnerId) {
    return null
  }

  // Mobile variant - no tooltip, optimized for action bar
  if (variant === 'mobile') {
    return (
      <Button
        asChild
        variant="destructive"
        size="default"
        className={cn(
          'flex-1 flex items-center justify-center gap-2',
          'px-4 py-3.5 rounded-xl font-bold',
          'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white',
          'transition-smooth active:scale-98 touch-target elevation-2 active:elevation-1',
          className
        )}
      >
        <Link href={roastUrl}>
          <Flame className="h-5 w-5" />
          <span>Roast</span>
          <span className="text-sm ">({roastCredits})</span>
        </Link>
      </Button>
    )
  }

  const buttonContent = (
    <>
      <Flame className="h-4 w-4" />
      {variant === 'default' && <span className="ml-2">Roast This Deck</span>}
      {variant === 'compact' && (
        <>
          <span className="ml-2">Roast</span>
          <span className="ml-1 text-xs ">({roastCredits})</span>
        </>
      )}
    </>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant="destructive"
            size={variant === 'icon-only' ? 'icon' : 'default'}
            className={cn(
              'bg-orange-600 hover:bg-orange-700 text-white transition-all',
              variant === 'icon-only' && 'hover:scale-110',
              className
            )}
          >
            <Link href={roastUrl}>{buttonContent}</Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {variant === 'icon-only' && 'Roast This Deck - '}
            {`${roastCredits} roast credit${roastCredits !== 1 ? 's' : ''} remaining this month`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
