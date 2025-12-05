import type { DeckCard } from '@/types/core'

export function ManaCurve({ cards }: { cards: DeckCard[] }) {
  const curveCounts = cards
    .filter((dc) => {
      const typeLine = dc.cards?.type_line || ''
      const manaCost = dc.cards?.mana_cost

      // Exclude lands unless they have a mana cost (DFCs with castable back side)
      if (typeLine.includes('Land')) {
        return manaCost && manaCost.trim() !== ''
      }
      return true
    })
    .reduce(
      (acc, dc) => {
        const cmc = dc.cards?.cmc || 0
        const bucket = cmc >= 7 ? '7+' : cmc.toString()
        acc[bucket] = (acc[bucket] || 0) + dc.quantity
        return acc
      },
      {} as Record<string, number>
    )

  const buckets = ['0', '1', '2', '3', '4', '5', '6', '7+']
  const maxCount = Math.max(...buckets.map((b) => curveCounts[b] || 0), 1)

  // Color scheme for mana curve bars
  const getBarColor = (bucket: string) => {
    const colors: Record<string, string> = {
      '0': 'from-gray-400 to-gray-600',
      '1': 'from-blue-400 to-blue-600',
      '2': 'from-cyan-400 to-cyan-600',
      '3': 'from-green-400 to-green-600',
      '4': 'from-yellow-400 to-yellow-600',
      '5': 'from-orange-400 to-orange-600',
      '6': 'from-red-400 to-red-600',
      '7+': 'from-purple-400 to-purple-600',
    }
    return colors[bucket] || 'from-primary to-primary/70'
  }

  return (
    <div className="w-full">
      {/* Chart Area */}
      <div className="relative h-40 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50 p-4 shadow-inner">
        {/* Grid lines */}
        <div className="absolute left-4 right-4 top-4 bottom-10 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-border/30" />
          ))}
        </div>

        {/* Bars Container */}
        <div className="absolute left-4 right-4 bottom-10 top-4 flex justify-around gap-1">
          {buckets.map((bucket) => {
            const count = curveCounts[bucket] || 0
            const heightPercentage = maxCount > 0 ? (count / maxCount) * 100 : 0

            return (
              <div
                key={bucket}
                className="flex-1 flex flex-col items-center justify-end group relative"
              >
                {/* Bar */}
                <div
                  className={`w-full bg-gradient-to-t ${getBarColor(bucket)} rounded-t-md transition-all duration-500 hover:brightness-110 cursor-pointer backdrop-blur-sm`}
                  style={{
                    height: `${heightPercentage}%`,
                    minHeight: count > 0 ? '4px' : '0',
                    opacity: 0.9,
                  }}
                >
                  {/* Count label on hover */}
                  {count > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-foreground bg-background/90 backdrop-blur-sm px-2 py-1 rounded border border-border whitespace-nowrap shadow-lg">
                        {count}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* CMC Labels at bottom */}
        <div className="absolute left-4 right-4 bottom-2 flex justify-around">
          {buckets.map((bucket) => (
            <div
              key={bucket}
              className="flex-1 text-center text-xs font-semibold text-muted-foreground"
            >
              {bucket}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats below chart */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Total: {Object.values(curveCounts).reduce((a, b) => a + b, 0)} cards</span>
        <span>Peak: {maxCount} cards</span>
      </div>
    </div>
  )
}
