// app/decks/[id]/page.tsx
'use client'

import { use, useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { useAuth } from '@/lib/auth/client'
import { useDeck } from '@/lib/hooks/useDecks'
import { useProtectedRoute } from '@/lib/hooks/useProtectedRoute'
import { DeckDetailLayout } from '@/components/decks/details/DeckDetailLayout'
import { DeckDetailLoading } from '@/components/decks/details/DeckDetailLoading'
import { DeckDetailError } from '@/components/decks/details/DeckDetailError'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function DeckDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: deck, cards, isLoading, error } = useDeck(id)
  const { profile } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Deck owners can always view their decks regardless of tier
  // undefined while loading (defers check), true if owner, false otherwise
  const isOwner = isLoading ? undefined : (!!deck && !!profile?.id && deck.owner_profile_id === profile.id)

  // Protect this route - requires Knight tier (owners bypass)
  useProtectedRoute({ requiredTier: 'Knight', bypass: isOwner })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return <DeckDetailLoading />
  }

  if (error) {
    return <DeckDetailError error={error} />
  }

  if (!deck) {
    notFound()
  }

  return <DeckDetailLayout deck={deck} cards={cards || []} />
}