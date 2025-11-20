// components/decks/detail/DeckEmptyState.tsx
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Deck, DeckInfo } from '@/types/supabase'

interface DeckEmptyStateProps {
  deck: Deck & Partial<DeckInfo>
  moxfieldIcon: string
}

export function DeckEmptyState({ deck, moxfieldIcon }: DeckEmptyStateProps) {
  return (
    <div className="py-16 text-center">
      <div className="mb-4">
        <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
      </div>
      <p className="text-lg font-semibold text-foreground mb-2">Decklist Not Available</p>
      <p className="text-muted-foreground mb-6">
        The full card list hasn't been loaded yet.
      </p>
      {deck.moxfield_url && (
        <Button asChild size="lg">
          <a
            href={deck.moxfield_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <img src={moxfieldIcon} alt="Moxfield" width={20} height={20} className="rounded" />
            View on Moxfield
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  )
}