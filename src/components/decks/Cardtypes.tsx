import type { DeckCard } from '@/types/core'

interface TypeDistributionProps {
  deckCards: DeckCard[]
}

export function TypeDistribution({ deckCards }: TypeDistributionProps) {
  const typeDistribution = deckCards.reduce(
    (acc, dc) => {
      const typeLine = dc.cards?.type_line || ''
      let primaryType = 'Other'

      // For DFCs (e.g., "Artifact // Land"), split and check front face first
      const frontFaceType = typeLine.split('//')[0].trim()

      if (frontFaceType.includes('Creature') || typeLine.includes('Creature')) primaryType = 'Creature'
      else if (frontFaceType.includes('Instant') || typeLine.includes('Instant')) primaryType = 'Instant'
      else if (frontFaceType.includes('Sorcery') || typeLine.includes('Sorcery')) primaryType = 'Sorcery'
      else if (frontFaceType.includes('Artifact') || typeLine.includes('Artifact')) primaryType = 'Artifact'
      else if (frontFaceType.includes('Enchantment') || typeLine.includes('Enchantment')) primaryType = 'Enchantment'
      else if (frontFaceType.includes('Planeswalker') || typeLine.includes('Planeswalker')) primaryType = 'Planeswalker'
      else if (frontFaceType.includes('Battle') || typeLine.includes('Battle')) primaryType = 'Battle'
      else if (frontFaceType.includes('Tribal') || typeLine.includes('Tribal')) primaryType = 'Tribal'
      else if (typeLine.includes('Land')) primaryType = 'Land'

      acc[primaryType] = (acc[primaryType] || 0) + (dc.quantity || 0)
      return acc
    },
    {} as Record<string, number>
  )

  const totalCards = deckCards.reduce((sum, dc) => sum + (dc.quantity || 0), 0)

  // Safety check
  if (totalCards === 0) {
    return <div className="text-center text-muted-foreground py-4">No cards to display</div>
  }

  const typeColors: Record<string, string> = {
    Creature: 'from-green-400 to-green-600',
    Instant: 'from-blue-400 to-blue-600',
    Sorcery: 'from-red-400 to-red-600',
    Artifact: 'from-gray-400 to-gray-600',
    Enchantment: 'from-purple-400 to-purple-600',
    Planeswalker: 'from-indigo-400 to-indigo-600',
    Battle: 'from-orange-400 to-orange-600',
    Tribal: 'from-pink-400 to-pink-600',
    Land: 'from-amber-400 to-amber-600',
    Other: 'from-slate-400 to-slate-600',
  }

  return (
    <div className="space-y-3">
      {Object.entries(typeDistribution)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => {
          const percentage = ((count / totalCards) * 100).toFixed(1)
          const barPercentage = (count / totalCards) * 100

          return (
            <div key={type} className="flex items-center gap-4">
              <span className="text-sm font-semibold w-28 text-foreground">{type}</span>
              <span className="text-sm font-bold text-muted-foreground w-12 text-right">
                {count}
              </span>
              <div className="flex-1 relative">
                <div className="bg-background/40 backdrop-blur-sm rounded-lg h-10 overflow-hidden border border-border/50 shadow-inner">
                  <div
                    className={`bg-gradient-to-r ${typeColors[type] || typeColors.Other} h-full transition-all duration-500 backdrop-blur-sm`}
                    style={{
                      width: `${Math.max(barPercentage, 4)}%`,
                      opacity: 0.9,
                    }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-end px-4 pointer-events-none">
                  <span className="text-sm font-bold text-foreground">
                    {percentage}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}
