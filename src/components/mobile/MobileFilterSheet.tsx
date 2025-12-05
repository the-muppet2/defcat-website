// components/mobile/MobileFilterSheet.tsx
'use client'

import { X, Shuffle } from 'lucide-react'
import { memo } from 'react'
import { ColorIdentity } from '@/types/colors'
import { bracketOptions } from '@/types/core'
import { cn } from '@/lib/utils'

interface MobileFilterSheetProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedColors: string[]
  onColorToggle: (color: string) => void
  invertColors: boolean
  onInvertToggle: () => void
  selectedBracket: string
  onBracketChange: (bracket: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export const MobileFilterSheet = memo(function MobileFilterSheet({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  selectedColors,
  onColorToggle,
  invertColors,
  onInvertToggle,
  selectedBracket,
  onBracketChange,
  onClearFilters,
  hasActiveFilters,
}: MobileFilterSheetProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50',
          'bg-card rounded-t-3xl shadow-2xl',
          'max-h-[85vh] overflow-hidden',
          'animate-in slide-in-from-bottom duration-300'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <h2 className="text-2xl font-bold">Filters</h2>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-accent transition-smooth touch-target"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-4 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-base font-semibold text-muted-foreground mb-3">
              Search
            </label>
            <input
              type="text"
              placeholder="Deck or commander..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-accent border border-border text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--mana-color)] transition-smooth touch-target"
            />
          </div>

          {/* Color Identity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-base font-semibold text-muted-foreground">
                Color Identity
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onInvertToggle}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    invertColors
                      ? "bg-[var(--mana-color)]/20 text-[var(--mana-color)] ring-1 ring-[var(--mana-color)]"
                      : "bg-accent text-muted-foreground"
                  )}
                >
                  <Shuffle className="h-3 w-3" />
                  {invertColors ? 'Inverted' : 'Invert'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedColors.length === 7) {
                      // Clear all colors
                      ['W', 'U', 'B', 'R', 'G', 'C', 'WUBRG'].forEach((color) => {
                        if (selectedColors.includes(color)) {
                          onColorToggle(color)
                        }
                      })
                    } else {
                      // Select all colors
                      ['W', 'U', 'B', 'R', 'G', 'C', 'WUBRG'].forEach((color) => {
                        if (!selectedColors.includes(color)) {
                          onColorToggle(color)
                        }
                      })
                    }
                  }}
                  className="text-xs text-tinted font-medium hover:brightness-110"
                >
                  {selectedColors.length === 7 ? 'Clear' : 'All'}
                </button>
              </div>
            </div>

            {/* Color buttons - 2-row grid layout */}
            <div className="grid grid-cols-4 gap-2">
              {ColorIdentity.ORDER.map((letter) => {
                const colorInfo = ColorIdentity.getColorInfo(letter)
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => onColorToggle(letter)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-smooth touch-target',
                      selectedColors.includes(letter)
                        ? 'bg-accent ring-2 scale-100 elevation-2'
                        : 'bg-accent/50 scale-95  hover:opacity-90'
                    )}
                    style={
                      selectedColors.includes(letter)
                        ? ({ '--tw-ring-color': colorInfo.color } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <i
                      className={colorInfo.className}
                      style={{
                        fontSize: '28px',
                        color: selectedColors.includes(letter) ? colorInfo.color : undefined,
                      }}
                    />
                    <span className="text-xs font-medium">
                      {colorInfo.name}
                    </span>
                  </button>
                )
              })}
              {/* 5-Color option */}
              <button
                type="button"
                onClick={() => onColorToggle('WUBRG')}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-smooth touch-target',
                  selectedColors.includes('WUBRG')
                    ? 'ring-2 scale-100 elevation-2'
                    : 'bg-accent/50 scale-95  hover:opacity-90'
                )}
                style={
                  selectedColors.includes('WUBRG')
                    ? {
                        background: `linear-gradient(135deg, ${ColorIdentity.Colors.W}, ${ColorIdentity.Colors.U}, ${ColorIdentity.Colors.B}, ${ColorIdentity.Colors.R}, ${ColorIdentity.Colors.G})`,
                      }
                    : undefined
                }
              >
                <div className="flex gap-0.5">
                  {['W', 'U', 'B', 'R', 'G'].map((letter) => {
                    const colorInfo = ColorIdentity.getColorInfo(letter)
                    return (
                      <i
                        key={letter}
                        className={colorInfo.className}
                        style={{ fontSize: '16px' }}
                      />
                    )
                  })}
                </div>
                <span className="text-xs font-medium">5-Color</span>
              </button>
            </div>
          </div>

          {/* Bracket Filter */}
          <div>
            <label className="block text-base font-semibold text-muted-foreground mb-3">
              Bracket
            </label>
            <div className="space-y-2">
              {bracketOptions.map((bracket) => (
                <button
                  key={bracket.value}
                  type="button"
                  onClick={() =>
                    onBracketChange(selectedBracket === bracket.value ? '' : bracket.value)
                  }
                  className={cn(
                    'w-full flex flex-col items-start gap-1 p-4 rounded-xl transition-smooth text-left touch-target',
                    selectedBracket === bracket.value
                      ? 'bg-[var(--mana-color)]/10 ring-2 ring-[var(--mana-color)] elevation-2'
                      : 'bg-accent/50 active:bg-accent hover:bg-accent/70'
                  )}
                >
                  <span className="font-semibold text-base">{bracket.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {bracket.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border p-4 space-y-3 bg-accent/30">
          {hasActiveFilters && (
            <button
              onClick={() => {
                onClearFilters()
                onClose()
              }}
              className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-semibold transition-smooth touch-target elevation-1 active:elevation-0"
            >
              Clear All Filters
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-[var(--mana-color)] hover:brightness-110 text-white font-bold transition-smooth elevation-3 active:elevation-2 touch-target"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  )
})
