enum ManaSymbol {
  WHITE = 'white',
  BLUE = 'blue',
  BLACK = 'black',
  RED = 'red',
  GREEN = 'green',
}

const ManaColorMap = {
  W: 'oklch(0.90 0.40 100)',
  U: 'oklch(0.35 0.40 270)',
  B: 'oklch(0.32 0.36 330.58)',
  R: 'oklch(0.35 0.40 50)',
  G: 'oklch(0.40 0.40 150)',


  // Aliases for convenience
  WHITE: 'oklch(0.90 0.40 100)',
  BLUE: 'oklch(0.35 0.40 270)',
  BLACK: 'oklch(0.30 0.36 333.58)',
  RED: 'oklch(0.35 0.40 50)',
  GREEN: 'oklch(0.40 0.40 150)',
} as const

type ColorInfo = {
  letter: string // Single letter code (W, U, B, R, G, C)
  name: string // Full name
  className: string // Mana Font CSS/icon class name
  color: string // OKLCH color value
}

const ColorMapping: Record<string, ColorInfo> = {
  W: { letter: 'W', name: 'White', className: 'ms ms-w', color: ManaColorMap.W },
  U: { letter: 'U', name: 'Blue', className: 'ms ms-u', color: ManaColorMap.U },
  B: { letter: 'B', name: 'Black', className: 'ms ms-b', color: ManaColorMap.B },
  R: { letter: 'R', name: 'Red', className: 'ms ms-r', color: ManaColorMap.R },
  G: { letter: 'G', name: 'Green', className: 'ms ms-g', color: ManaColorMap.G },
}

const HybridManaMap = {
  GU: { letters: ['G', 'U'], name: 'Green-Blue', className: 'ms ms-gu ms-cost' },
  GW: { letters: ['G', 'W'], name: 'Green-White', className: 'ms ms-gw ms-cost' },
  BR: { letters: ['B', 'R'], name: 'Black-Red', className: 'ms ms-br ms-cost' },
  BG: { letters: ['B', 'G'], name: 'Black-Green', className: 'ms ms-bg ms-cost' },
  WB: { letters: ['W', 'B'], name: 'White-Black', className: 'ms ms-wb ms-cost' },
  WU: { letters: ['W', 'U'], name: 'White-Blue', className: 'ms ms-wu ms-cost' },
  UB: { letters: ['U', 'B'], name: 'Blue-Black', className: 'ms ms-ub ms-cost' },
  UR: { letters: ['U', 'R'], name: 'Blue-Red', className: 'ms ms-ur ms-cost' },
  RG: { letters: ['R', 'G'], name: 'Red-Green', className: 'ms ms-rg ms-cost' },
  RW: { letters: ['R', 'W'], name: 'Red-White', className: 'ms ms-rw ms-cost' },
}

export const ColorIdentity = {
  // Constants
  ORDER: ['W', 'U', 'B', 'R', 'G'],

  // Enums
  Symbol: ManaSymbol,

  // Color values
  Colors: ManaColorMap,

  // Convert ManaSymbol enum to letter code
  symbolToLetter: (symbol: ManaSymbol): string => {
    const map: Record<ManaSymbol, string> = {
      [ManaSymbol.WHITE]: 'W',
      [ManaSymbol.BLUE]: 'U',
      [ManaSymbol.BLACK]: 'B',
      [ManaSymbol.RED]: 'R',
      [ManaSymbol.GREEN]: 'G',
    }
    return map[symbol]
  },

  // Convert letter code to ManaSymbol enum
  letterToSymbol: (letter: string): ManaSymbol => {
    const map: Record<string, ManaSymbol> = {
      W: ManaSymbol.WHITE,
      U: ManaSymbol.BLUE,
      B: ManaSymbol.BLACK,
      R: ManaSymbol.RED,
      G: ManaSymbol.GREEN,
    }
    return map[letter.toUpperCase()]
  },

  // Get color value from symbol, letter, or name
  getColorValue: (input: ManaSymbol | string): string => {
    if (Object.values(ManaSymbol).includes(input as ManaSymbol)) {
      const letter = ColorIdentity.symbolToLetter(input as ManaSymbol)
      return ColorMapping[letter].color
    }
    const upper = input.toUpperCase()
    return ColorMapping[upper]?.color
  },

  // Get ColorInfo from symbol, letter, or name
  getColorInfo: (input: ManaSymbol | string): ColorInfo => {
    if (Object.values(ManaSymbol).includes(input as ManaSymbol)) {
      const letter = ColorIdentity.symbolToLetter(input as ManaSymbol)
      return ColorMapping[letter]
    }
    const upper = input.toUpperCase()
    return ColorMapping[upper] || ColorMapping.C
  },

  /**
   * Extract color letters from a mana cost string
   * "{2}{W}{U}" -> ['W', 'U']
   * "{W/U}" -> ['W', 'U']
   * "{W/P}" -> ['W'] (Phyrexian white is still white)
   */
  extractColorsFromManaCost: (manaCost: string | null | undefined): string[] => {
    if (!manaCost) return ['C']

    const colors: string[] = []

    // Check for each color (including hybrid mana)
    // Note: P (Phyrexian) is not a color itself, just a cost modifier
    if (manaCost.includes('W')) colors.push('W')
    if (manaCost.includes('U')) colors.push('U')
    if (manaCost.includes('B')) colors.push('B')
    if (manaCost.includes('R')) colors.push('R')
    if (manaCost.includes('G')) colors.push('G')

    // If no colors found or only generic mana, return colorless
    return colors.length > 0 ? colors : ['C']
  },

  /**
   * Normalize color array to sorted, deduplicated string
   * ['U', 'W', 'W'] -> 'WU'
   */
  normalize: (colors: string[]): string => {
    const unique = [...new Set(colors.map((c) => c.toUpperCase()))]
    return unique
      .sort((a, b) => ColorIdentity.ORDER.indexOf(a) - ColorIdentity.ORDER.indexOf(b))
      .join('')
  },

  /**
   * Compare two color identities for sorting
   */
  compare: (a: string, b: string): number => {
    // Compare by length first (monocolor < multicolor)
    if (a.length !== b.length) return a.length - b.length

    // Then by color order
    for (let i = 0; i < a.length; i++) {
      const aIdx = ColorIdentity.ORDER.indexOf(a[i])
      const bIdx = ColorIdentity.ORDER.indexOf(b[i])
      if (aIdx !== bIdx) return aIdx - bIdx
    }
    return 0
  },

  /**
   * 
   * Get hybrid mana class
   * @param symbol Hybrid mana symbol (e.g., "W/U", "B/P")
   * @returns CSS class string for the hybrid mana
   */
  getHybridClass: (colors: string[]): string => {
    const normalized = ColorIdentity.normalize(colors)
    const symbolMap = HybridManaMap
    
    // Check normalized (WUBRG) order first
    if (symbolMap[normalized as keyof typeof HybridManaMap]) {
      return symbolMap[normalized as keyof typeof HybridManaMap].className
    }

    // Check reversed order for Mana Font's required ordering
    const reversed = normalized.split('').reverse().join('')
    if (symbolMap[reversed as keyof typeof HybridManaMap]) {
      return symbolMap[reversed as keyof typeof HybridManaMap].className
    }
    return ''
  },

  /**
   * Get icon class for a color identity
   * 'WU' -> 'ms-wu' (Azorius)
   * 'W' -> 'ms-w'
   */
  getClassName: (
    colors: string[] | string,
    cost: boolean = false,
    shadow: boolean = false
  ): string => {
    const normalized = typeof colors === 'string' ? colors : ColorIdentity.normalize(colors)

    // For dual-color combinations, use proper Mana Font guild symbol order
    let classBase = normalized.toLowerCase()
    if (normalized.length === 2) {
      const dualColorMap: Record<string, string> = {
        'WU': 'wu', // Azorius
        'UB': 'ub', // Dimir
        'BR': 'br', // Rakdos
        'RG': 'rg', // Gruul
        'GW': 'gw', // Selesnya
        'WB': 'wb', // Orzhov
        'UR': 'ur', // Izzet
        'BG': 'bg', // Golgari
        'RW': 'rw', // Boros
        'GU': 'gu', // Simic
      }
      classBase = dualColorMap[normalized] || classBase
    }

    const base = `ms ms-${classBase}`
    const mods = [cost ? 'ms-cost' : '', shadow ? 'ms-shadow' : ''].filter(Boolean)

    return [base, ...mods].join(' ')
  },

  /**
   * Get individual color letters from a color identity string
   * 'WU' -> ['W', 'U']
   * 'BRG' -> ['B', 'R', 'G']
   */
  getIndividual: (colors: string | null | undefined): string[] => {
    const colorStr = String(colors)
    return colorStr.toUpperCase().split('')
  },

  /**
   * Get human-readable label for color identity
   * 'WU' -> 'White/Blue'
   * 'W' -> 'White'
   */
  getLabel: (colors: string[] | string): string => {
    const normalized = typeof colors === 'string' ? colors : ColorIdentity.normalize(colors)

    if (normalized.length === 1) {
      return ColorMapping[normalized]?.name || 'Colorless'
    }

    // Return color names instead of guild/clan names
    return normalized
      .split('')
      .map((c) => ColorMapping[c]?.name)
      .join('/')
  },

  /**
   * Parse mana cost string into individual symbols
   * "{2}{W}{U}" -> ['2', 'w', 'u']
   * "{W/G}" -> ['gw'] (normalized hybrid)
   * "{B/P}" -> ['bp'] (Phyrexian)
   */
  parseManaCost: (manaCost: string): string[] => {
    if (!manaCost || !manaCost.includes('{')) return []

    return manaCost.match(/\{([^}]+)\}/g)?.map((s) => {
      const inner = s.slice(1, -1)
      return ColorIdentity.normalizeHybridMana(inner)
    }) || []
  },

  /**
   * Normalize hybrid mana order per Mana Font conventions
   * "W/G" -> "wg" (W comes before G in WUBRG, so keep order)
   * "G/W" -> "gw" (G comes after W, so G goes first)
   * "W/P" -> "wp" (Phyrexian mana keeps color first)
   *
   * Rule: The color that comes LATER in WUBRG goes FIRST in the class name
   */
  normalizeHybridMana: (symbol: string): string => {
    if (!symbol.includes('/')) return symbol.toLowerCase()

    const [first, second] = symbol.split('/')
    const colorOrder: Record<string, number> = { W: 0, U: 1, B: 2, R: 3, G: 4 }

    if (second === 'P' || first === 'P') {
      return symbol.replace('/', '').toLowerCase()
    }

    const firstOrder = colorOrder[first.toUpperCase()]
    const secondOrder = colorOrder[second.toUpperCase()]

    if (firstOrder !== undefined && secondOrder !== undefined) {
      return secondOrder > firstOrder
        ? `${first}${second}`.toLowerCase()
        : `${second}${first}`.toLowerCase()
    }

    return symbol.replace('/', '').toLowerCase()
  },

  /**
   * Check if a symbol is hybrid mana (2+ color letters)
   * "ub" -> true
   * "wp" -> true (Phyrexian)
   * "w" -> false
   * "2" -> false
   */
  isHybridMana: (symbol: string): boolean => {
    return symbol.length >= 2 && /^[wubrgcp]+$/.test(symbol.toLowerCase())
  },

  /**
   * Check if a symbol is Phyrexian mana (contains P)
   * "wp" -> true
   * "bp" -> true
   * "w" -> false
   */
  isPhyrexianMana: (symbol: string): boolean => {
    return symbol.toLowerCase().includes('p')
  },

  /**
   * Determine if ms-cost class should be applied
   * Only hybrid and Phyrexian mana symbols need ms-cost
   */
  shouldApplyCostClass: (symbol: string): boolean => {
    return ColorIdentity.isHybridMana(symbol) || ColorIdentity.isPhyrexianMana(symbol)
  },
}

// Type exports for external use
export type { ColorInfo }

const symbols = Object.values(ColorIdentity.Symbol)
export const randomColor = symbols[Math.floor(Math.random() * symbols.length)] as ManaSymbol