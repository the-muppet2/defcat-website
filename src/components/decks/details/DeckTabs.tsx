// components/decks/detail/DeckTabs.tsx
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
'use client'

import { useState, useEffect } from 'react'
import { List, Grid3x3, BarChart3 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { GlowingEffect } from '@/components/ui/glowEffect'
import { DeckListView } from './DeckListView'
import { DeckVisualView } from './DeckVisualView'
import { DeckStatsView } from './DeckStatsView'
import { DeckEmptyState } from './DeckEmptyState'
import type { DecklistCardWithCard, Deck } from '@/types/supabase'

interface DeckTabsProps {
  deck: Deck & Partial<any>
  cards: DecklistCardWithCard[]
  selectedType: string | null        // Add this
  onTypeSelect: (type: string) => void  // Add this
}

export function DeckTabs({ deck, cards, selectedType, onTypeSelect }: DeckTabsProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'visual' | 'stats'>('list')
  const [isDark, setIsDark] = useState(false)

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

  const moxfieldIcon = isDark
    ? 'https://assets.moxfield.net/assets/images/logo-text.svg'
    : 'https://assets.moxfield.net/assets/images/logo-text-color.svg'

  return (
    <div className="relative rounded-2xl border translate-z(0) md:rounded-3xl">
      <GlowingEffect
        blur={0}
        borderWidth={3}
        spread={80}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
      />
      <div className="bg-card border-2 rounded-2xl shadow-xl relative">
        {/* Tab Navigation */}
        <div className="border-b border-border bg-accent/30">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center">
              {[
                { id: 'list', icon: List, label: 'List View' },
                { id: 'visual', icon: Grid3x3, label: 'Visual' },
                { id: 'stats', icon: BarChart3, label: 'Statistics' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as typeof activeTab)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all relative ${
                    activeTab === id
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {activeTab === id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {deck.moxfield_url && (
                <a
                  href={deck.moxfield_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform"
                  title="View on Moxfield"
                >
                  <Image
                    src={moxfieldIcon}
                    alt="View on Moxfield"
                    width={120}
                    height={30}
                    className="h-8 w-auto"
                    unoptimized
                  />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {cards.length === 0 ? (
            <DeckEmptyState deck={deck} moxfieldIcon={moxfieldIcon} />
          ) : (
            <>
              {activeTab === 'list' && (
                <DeckListView
                  cards={cards}
                  selectedType={selectedType}
                  onTypeSelect={onTypeSelect}
                />
              )}
              {activeTab === 'visual' && (
                <DeckVisualView
                  cards={cards}
                  selectedType={selectedType}
                  onTypeSelect={onTypeSelect}
                />
              )}
              {activeTab === 'stats' && (
                <DeckStatsView
                  cards={cards}
                  selectedType={selectedType}
                  onTypeSelect={onTypeSelect}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}