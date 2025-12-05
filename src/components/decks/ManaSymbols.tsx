// components/deck/ManaSymbols.tsx
/** biome-ignore-all lint/a11y/useAriaPropsSupportedByRole: <explanation> */
'use client'

import { cn } from '@/lib/utils'
import { ColorIdentity } from '@/types/colors'

interface ManaSymbolsProps {
  /**
   * Can be:
   * - Array of colors: ['W', 'U', 'B']
   * - Mana cost string: "{2}{W}{U}{B}"
   * - Single color: "W"
   */
  mana: string[] | string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2x' | '3x' | '4x' | '5x' | '6x'
  className?: string
  /**
   * Adds a circle around the symbol (for casting costs)
   */
  cost?: boolean
  /**
   * Adds a drop shadow to the symbol
   */
  shadow?: boolean
  /**
   * If true, uses guild/clan symbols when available (e.g., Azorius for W+U)
   * Only applies when mana is an array of colors
   */
  useGuildSymbols?: boolean
  /**
   * Fixed width for alignment
   */
  fixedWidth?: boolean
}

export function ManaSymbols({
  mana,
  size = 'md',
  className,
  cost = false,
  
  useGuildSymbols = false,
  fixedWidth = false,
}: ManaSymbolsProps) {
  if (!mana || (Array.isArray(mana) && mana.length === 0)) {
    return null
  }

  // Map semantic sizes to mana-font classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2x': 'ms-2x',
    '3x': 'ms-3x',
    '4x': 'ms-4x',
    '5x': 'ms-5x',
    '6x': 'ms-6x',
  }

  // Parse the mana input using ColorIdentity utilities
  let symbols: string[]

  if (typeof mana === 'string') {
    // Check if it's a mana cost string like "{2}{W}{U}"
    if (mana.includes('{')) {
      // Parse and normalize using ColorIdentity utility
      symbols = ColorIdentity.parseManaCost(mana)
    } else {
      // Single color: "W"
      symbols = [mana.toLowerCase()]
    }
  } else {
    // Array of colors: ['W', 'U', 'B']
    symbols = mana.map((s) => s.toLowerCase())
  }

  if (symbols.length === 0) {
    return null
  }

  // Try to get guild/clan symbol if enabled and it's a color identity array
  const colorIdentity =
    useGuildSymbols && Array.isArray(mana) && !mana.some((m) => m.includes('{'))
      ? ColorIdentity.getClassName(symbols)
      : null

  // If we found a guild/clan symbol, use that
  if (colorIdentity) {
    const isHybrid = symbols.length > 1
    return (
      <i
        className={cn(
          'ms',
          colorIdentity,
          (cost || isHybrid) && 'ms-cost',
          fixedWidth && 'ms-fw',
          sizeClasses[size],
          'transition-all duration-200 hover:scale-110',
          className
        )}
        title={ColorIdentity.getLabel(symbols)}
        aria-label={`${ColorIdentity.getLabel(symbols)} color identity`}
      />
    )
  }

  // Otherwise, show individual mana symbols
  return (
    <div className={cn('inline-flex gap-0.5 items-center', className)}>
      {symbols.map((symbol, index) => {
        const code = symbol.toLowerCase()

        return (
          <i
            key={`${symbol}-${index}`}
            className={cn(
              'ms',
              `ms-${code}`,
              ColorIdentity.shouldApplyCostClass(code) && 'ms-cost',
              fixedWidth && 'ms-fw',
              sizeClasses[size],
              'transition-all duration-200 hover:scale-110'
            )}
            aria-label={`${symbol} mana`}
          />
        )
      })}
    </div>
  )
}

// Convenient alias for single symbols
interface ManaSymbolProps {
  color: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2x' | '3x' | '4x' | '5x' | '6x'
  cost?: boolean
  shadow?: boolean
  fixedWidth?: boolean
  className?: string
}

export function ManaSymbol(props: ManaSymbolProps) {
  return <ManaSymbols mana={props.color} {...props} />
}

// Convenient alias for mana costs
interface ManaCostProps {
  cost: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2x' | '3x' | '4x' | '5x' | '6x'
  shadow?: boolean
  className?: string
}

export function ManaCost({
  cost: costString,
  size = 'md',
  shadow = true,
  className,
}: ManaCostProps) {
  return (
    <ManaSymbols
      mana={costString}
      size={size}
      cost={true} // Always show as cost
      shadow={shadow}
      className={className}
    />
  )
}
