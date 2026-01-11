'use client'

import { CheckCircle2, Clock, Loader2, Package, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth/client'
import { createClient } from '@/lib/supabase/client'

interface Submission {
  id: string
  created_at: string
  status: string
  commander: string | null
  color_preference: string | null
  bracket: string | null
  mystery_deck: boolean
  submission_type: string | null
  updated_at: string | null
}

export function MySubmissions() {
  const auth = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth.isLoading) {
      loadSubmissions()
    }
  }, [auth.isLoading])

  async function loadSubmissions() {
    // Use auth from context instead of making redundant API call
    if (!auth.user) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('deck_submissions')
      .select(
        'id, created_at, status, commander, color_preference, bracket, mystery_deck, submission_type, updated_at'
      )
      .eq('user_id', auth.user.id)
      .in('status', ['pending', 'queued', 'in_progress'])
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSubmissions(data)
    }
    setLoading(false)
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      in_progress: 'secondary',
      cancelled: 'destructive',
      pending: 'outline',
      queued: 'outline',
    }

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No submissions yet</p>
        <p className="text-sm mt-1">Your deck requests will appear here</p>
      </div>
    )
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {submissions.map((submission) => (
        <AccordionItem key={submission.id} value={`submission-${submission.id}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(submission.status)}
                <span className="font-medium">
                  {submission.mystery_deck
                    ? 'Mystery Deck'
                    : submission.commander || 'Custom Build'}
                </span>
              </div>
              {getStatusBadge(submission.status)}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {submission.submission_type && (
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-medium capitalize">
                      {submission.submission_type}
                    </span>
                  </div>
                )}
                {submission.color_preference && (
                  <div>
                    <span className="text-muted-foreground">Colors:</span>
                    <span className="ml-2 font-medium">{submission.color_preference}</span>
                  </div>
                )}
                {submission.bracket && (
                  <div>
                    <span className="text-muted-foreground">Bracket:</span>
                    <span className="ml-2 font-medium">{submission.bracket}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="ml-2 font-medium">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {submission.updated_at && submission.updated_at !== submission.created_at && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(submission.updated_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
