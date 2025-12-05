// hooks/useDeckSubmission.ts

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DeckSubmissionFormData, SubmissionResponse } from '@/types/form'

interface UseSubmissionState {
  isLoading: boolean
  error: string | null
  success: boolean
  submissionId: string | null
  submissionNumber: number | null
}

interface UseSubmissionReturn extends UseSubmissionState {
  submitDeck: (data: DeckSubmissionFormData, isDraft?: boolean) => Promise<boolean>
  reset: () => void
}

export function useDeckSubmission(): UseSubmissionReturn {
  const [state, setState] = useState<UseSubmissionState>({
    isLoading: false,
    error: null,
    success: false,
    submissionId: null,
    submissionNumber: null,
  })

  const supabase = createClient()

  const submitDeck = async (data: DeckSubmissionFormData, isDraft = false): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error(
          'You must be signed in to submit a deck. Please log in with your Patreon account.'
        )
      }

      const response = await fetch('/api/submit-deck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...data, isDraft }),
      })

      const result: SubmissionResponse = await response.json()

      if (!response.ok || !result.success) {
        // Handle specific error codes
        if (result.error?.code === 'INSUFFICIENT_TIER') {
          throw new Error(
            result.error.message ||
              'Your Patreon tier does not allow deck submissions. Please upgrade your tier to submit decks.'
          )
        } else if (result.error?.code === 'MONTHLY_LIMIT_REACHED') {
          throw new Error(result.error.message || 'You have reached your monthly submission limit.')
        } else if (result.error?.code === 'UNAUTHORIZED') {
          throw new Error(
            result.error.message || 'Please sign in with your Patreon account to continue.'
          )
        } else {
          throw new Error(result.error?.message || 'Failed to submit deck')
        }
      }

      setState({
        isLoading: false,
        error: null,
        success: true,
        submissionId: result.data?.id || null,
        submissionNumber: result.data?.submissionNumber || null,
      })

      return true
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'

      setState({
        isLoading: false,
        error: errorMessage,
        success: false,
        submissionId: null,
        submissionNumber: null,
      })

      return false
    }
  }

  const reset = () => {
    setState({
      isLoading: false,
      error: null,
      success: false,
      submissionId: null,
      submissionNumber: null,
    })
  }

  return {
    ...state,
    submitDeck,
    reset,
  }
}
