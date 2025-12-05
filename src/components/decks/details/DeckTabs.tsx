// components/decks/detail/DeckTabs.tsx
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
'use client'

import { useState } from 'react'
import { List, Grid3x3, BarChart3, ExternalLink } from 'lucide-react'
import { GlowingEffect } from '@/components/ui/glowEffect'
import { DeckListView } from './DeckListView'
import { DeckVisualView } from './DeckVisualView'
import { DeckStatsView } from './DeckStatsView'
import { DeckEmptyState } from './DeckEmptyState'
import type { DecklistCardWithCard, Deck } from '@/types'

interface DeckTabsProps {
  deck: Deck & Partial<any>
  cards: DecklistCardWithCard[]
  selectedType: string | null
  onTypeSelect: (type: string) => void
}

export function DeckTabs({ deck, cards, selectedType, onTypeSelect }: DeckTabsProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'visual' | 'stats'>('list')

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
          <div className="flex items-center justify-between px-4 md:px-6 gap-2">
            <div className="flex items-center min-w-0">
              {[
                { id: 'list', icon: List, label: 'List View' },
                { id: 'visual', icon: Grid3x3, label: 'Visual' },
                { id: 'stats', icon: BarChart3, label: 'Statistics' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-4 font-semibold transition-all relative whitespace-nowrap ${
                    activeTab === id
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                  {activeTab === id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {deck.moxfield_url && (
              <a
                href={deck.moxfield_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-sm font-medium transition-all shrink-0"
                title="View on Moxfield"
              >
                <span className="hidden sm:inline">View on</span> Moxfield
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {cards.length === 0 ? (
            <DeckEmptyState deck={deck} />
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