/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
'use client'

import { useManaColor } from '@/lib/contexts/ManaColorContext'
import { cn } from '@/lib/utils'
import { ColorIdentity } from '@/types/colors'

// Preserve the intended order (WUBRG + Colorless)
const MANA_SYMBOLS = [
  ColorIdentity.Symbol.WHITE,
  ColorIdentity.Symbol.BLUE,
  ColorIdentity.Symbol.BLACK,
  ColorIdentity.Symbol.RED,
  ColorIdentity.Symbol.GREEN,
] as const

export function ManaSymbolSelector() {
  const { selectedMana, setSelectedMana } = useManaColor()

  // Cache the selected colorInfo to avoid multiple getColorInfo calls
  const selectedColorInfo = ColorIdentity.getColorInfo(selectedMana)

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Choose your mana color</p>

      <div className="flex gap-5 flex-wrap">
        {MANA_SYMBOLS.map((symbol) => {
          const isSelected = selectedMana === symbol
          const colorInfo = ColorIdentity.getColorInfo(symbol)

          return (
            <button
              key={symbol}
              type="button"
              onClick={() => setSelectedMana(symbol)}
              className={cn(
                'relative w-15 h-15 rounded-lg border-2 transition-all duration-200',
                'hover:scale-105 active:scale-95',
                'flex items-center justify-center p-2',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                isSelected ? 'scale-105 shadow-sm' : 'border-tinted/50 hover:shadow-sm'
              )}
              style={{
                color: isSelected ? colorInfo.color : 'var(--muted-foreground)',
                borderColor: isSelected ? colorInfo.color : undefined,
                backgroundColor: isSelected ? `${colorInfo.color}10` : undefined,
              }}
              aria-label={`Select ${colorInfo.name} mana`}
              aria-pressed={isSelected}
            >
              <i
                className={cn(
                  colorInfo.className,
                  'ms-4x',
                  'transition-all duration-200',
                  isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                )}
                style={{
                  filter: isSelected ? 'brightness(1.2)' : undefined,
                }}
              />

              {isSelected && (
                <div
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: colorInfo.color }}
                >
                  <svg
                    className="w-2 h-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">Selected:</span>
        <span
          className="font-medium transition-colors duration-200"
          style={{ color: selectedColorInfo.color }}
        >
          {selectedColorInfo.name}
        </span>
      </div>
    </div>
  )
}
