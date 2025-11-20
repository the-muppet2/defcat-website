// components/mobile/MobileDeckTabs.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { List, Grid3x3, BarChart3 } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { DecklistCardWithCard, EnhancedDeck } from '@/types'

interface MobileDeckTabsProps {
  deck: EnhancedDeck & Partial<any>
  cards: DecklistCardWithCard[]
  selectedType: string | null
  onTypeSelect: (type: string) => void
  listView: React.ReactNode
  visualView: React.ReactNode
  statsView: React.ReactNode
}

export function MobileDeckTabs({
  deck,
  cards,
  selectedType,
  onTypeSelect,
  listView,
  visualView,
  statsView,
}: MobileDeckTabsProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'visual' | 'stats'>('list')
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isDark, setIsDark] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      // Swipe left - go to next tab
      if (activeTab === 'list') setActiveTab('visual')
      else if (activeTab === 'visual') setActiveTab('stats')
    }

    if (isRightSwipe) {
      // Swipe right - go to previous tab
      if (activeTab === 'stats') setActiveTab('visual')
      else if (activeTab === 'visual') setActiveTab('list')
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  const tabs = [
    { id: 'list' as const, icon: List, label: 'List' },
    { id: 'visual' as const, icon: Grid3x3, label: 'Visual' },
    { id: 'stats' as const, icon: BarChart3, label: 'Stats' },
  ]

  const moxfieldIcon = isDark
    ? 'https://assets.moxfield.net/assets/images/logo-text.svg'
    : 'https://assets.moxfield.net/assets/images/logo-text-color.svg'

  return (
    <div className="card-tinted-glass rounded-2xl overflow-hidden shadow-tinted-lg">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between bg-accent-tinted/30 border-b border-tinted px-4 py-2">
        <div className="flex items-center gap-1 flex-1">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all relative',
                activeTab === id
                  ? 'text-tinted bg-accent-tinted/50 shadow-tinted'
                  : 'text-muted-foreground active:bg-accent/50'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden xs:inline">{label}</span>
            </button>
          ))}
        </div>

        {deck.moxfield_url && (
          <a
            href={deck.moxfield_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 hover:scale-105 transition-transform active:scale-95"
            title="View on Moxfield"
          >
            <Image
              src={moxfieldIcon}
              alt="Moxfield"
              width={80}
              height={20}
              className="h-6 w-auto"
              unoptimized
            />
          </a>
        )}
      </div>

      {/* Swipe Indicator */}
      <div className="flex justify-center py-2 bg-accent/20">
        <div className="flex gap-1.5">
          {tabs.map(({ id }) => (
            <div
              key={id}
              className={cn(
                'h-1 rounded-full transition-all',
                activeTab === id ? 'w-6 bg-tinted' : 'w-1.5 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </div>

      {/* Tab Content - Swipeable */}
      <div
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="p-4 min-h-[400px] touch-pan-y"
      >
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground mb-4">No cards in this deck yet</p>
            {deck.moxfield_url && (
              <a
                href={deck.moxfield_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tinted-primary px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
              >
                <Image
                  src={moxfieldIcon}
                  alt="Moxfield"
                  width={80}
                  height={20}
                  className="h-5 w-auto brightness-0 invert"
                  unoptimized
                />
                View on Moxfield
              </a>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'list' && (
              <div className="animate-in fade-in duration-300">
                {listView}
              </div>
            )}
            {activeTab === 'visual' && (
              <div className="animate-in fade-in duration-300">
                {visualView}
              </div>
            )}
            {activeTab === 'stats' && (
              <div className="animate-in fade-in duration-300">
                {statsView}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
