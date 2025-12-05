'use client'

import { Download, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'

interface DeckFetchButtonProps {
  mode: 'update' | 'import'
}

export function DeckFetchButton({ mode }: DeckFetchButtonProps) {
  const [loading, setLoading] = useState(false)

  const config = {
    update: {
      icon: RefreshCw,
      label: 'Fetch All (Force)',
      color: 'green',
      tooltip: 'Force rescrape all existing decks to update their data',
      edgeFunction: 'sync-bookmark',
      body: { bookmarkId: 'xpGzQ', forceRescrape: true },
      successMessage: 'All decks are being rescraped from Moxfield. This may take several minutes.',
      reloadDelay: 5000,
    },
    import: {
      icon: Download,
      label: 'Fetch All (New)',
      color: 'blue',
      tooltip: "Import only new decks that don't exist in the database",
      edgeFunction: 'fetch-decks',
      body: {},
      successMessage: 'The Moxfield scraper is now running. This may take a few minutes.',
      reloadDelay: 3000,
    },
  }[mode]

  const Icon = config.icon

  const handleFetch = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.functions.invoke(config.edgeFunction, {
        body: config.body,
      })

      if (error) {
        throw new Error(error.message || 'Failed to trigger fetch')
      }

      toast.success('Fetch started successfully!', {
        description: config.successMessage,
        duration: 5000,
      })

      setTimeout(() => {
        window.location.reload()
      }, config.reloadDelay)
    } catch (error) {
      toast.error('Failed to start fetch', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleFetch}
            disabled={loading}
            variant="outline"
            className={`border-${config.color}-500/20 hover:bg-${config.color}-500/10 text-${config.color}-500`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Icon className="h-4 w-4 mr-2" />
                {config.label}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}