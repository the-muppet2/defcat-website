'use client'

import { Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface FeaturedDeckCardProps {
  deckId?: string
}

export function FeaturedDeckCard({ deckId }: FeaturedDeckCardProps) {
  if (!deckId) {
    return (
      <Card className="glass border-white/10 bg-card-tinted">
        <CardContent className="p-12 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">No featured deck available at this time.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass border-white/10 bg-card-tinted">
      <CardContent className="p-12 text-center">
        <Sparkles className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--mana-color)' }} />
        <p className="text-lg text-muted-foreground">Featured Deck: {deckId}</p>
      </CardContent>
    </Card>
  )
}
