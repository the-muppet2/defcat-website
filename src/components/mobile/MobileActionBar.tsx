// components/mobile/MobileActionBar.tsx
'use client'

import { Share2 } from 'lucide-react'
import { memo, useState } from 'react'
import { RoastButton } from '@/components/decks/RoastButton'
import { cn } from '@/lib/utils'

interface MobileActionBarProps {
  moxfieldUrl?: string
  deckName: string
  deckOwnerId?: string | null
  className?: string
}

export const MobileActionBar = memo(function MobileActionBar({
  moxfieldUrl,
  deckName,
  deckOwnerId,
  className,
}: MobileActionBarProps) {
  const [shareSuccess, setShareSuccess] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: deckName,
          text: `Check out this deck: ${deckName}`,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled share or error occurred
        console.error('Share failed:', err)
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      } catch (err) {
        console.error('Copy failed:', err)
      }
    }
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'glass-tinted-strong border-t border-tinted elevation-4',
        'px-4 py-4 safe-area-inset-bottom',
        className
      )}
    >
      <div className="flex items-center gap-3 max-w-screen-sm mx-auto">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className={cn(
            'flex-1 flex items-center justify-center gap-2',
            'px-4 py-3.5 rounded-xl font-bold',
            'btn-tinted transition-smooth active:scale-98 touch-target elevation-2 active:elevation-1',
            shareSuccess && 'bg-green-500/20 border-green-500/50 text-green-600'
          )}
        >
          <Share2 className="h-5 w-5" />
          {shareSuccess ? 'Copied!' : 'Share'}
        </button>

        {/* Roast Button */}
        {moxfieldUrl && (
          <div className="flex-1">
            <RoastButton
              moxfieldUrl={moxfieldUrl}
              variant="mobile"
              deckOwnerId={deckOwnerId}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
})
