// app/decks/[id]/page.tsx
'use client'

import { use, useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { useDeck } from '@/lib/hooks/useDecks'
import { DeckDetailLayout } from '@/components/decks/details/DeckDetailLayout'
import { DeckDetailLoading } from '@/components/decks/details/DeckDetailLoading'
import { DeckDetailError } from '@/components/decks/details/DeckDetailError'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function DeckDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: deck, cards, isLoading, error } = useDeck(id)
  const [mounted, setMounted] = useState(false)

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