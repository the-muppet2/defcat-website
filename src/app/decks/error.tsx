'use client'

import { AlertTriangle, Home, RefreshCw, Search } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DecksError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Decks error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-xl w-full glass-tinted border-tinted">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <CardTitle className="text-2xl">Failed to Load Decks</CardTitle>
          </div>
          <CardDescription>
            We encountered an error while loading deck data. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-40">
              <p className="font-mono text-sm text-destructive whitespace-pre-wrap">
                {error.message || error.toString()}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => reset()} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href="/decks">
                <Search className="h-4 w-4 mr-2" />
                Browse Decks
              </a>
            </Button>
            <Button asChild variant="ghost">
              <a href="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
