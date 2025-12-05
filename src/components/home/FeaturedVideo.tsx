'use client'

import { Youtube } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface FeaturedVideoProps {
  videoId?: string
  url?: string
  title?: string
}

function extractVideoId(input: string): string {
  if (!input) return ''

  // If it's already just an ID (no slashes or query params), return it
  if (!input.includes('/') && !input.includes('?')) {
    return input
  }

  // Try to extract from various YouTube URL formats
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`)

    // Handle youtube.com/watch?v=ID
    if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
      return url.searchParams.get('v') || ''
    }

    // Handle youtu.be/ID
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1)
    }

    // Handle youtube.com/embed/ID
    if (url.pathname.includes('/embed/')) {
      return url.pathname.split('/embed/')[1]?.split('?')[0] || ''
    }
  } catch {
    // If URL parsing fails, return original
    return input
  }

  return input
}

export function FeaturedVideo({
  videoId,
  title = "Today's Featured Video",
}: FeaturedVideoProps) {
  const extractedId = videoId ? extractVideoId(videoId) : ''

  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Youtube className="h-6 w-6" style={{ color: 'var(--mana-color)' }} />
          <h2 className="text-3xl font-bold">{title}</h2>
        </div>

        <Card className="glass border-white/10 bg-card-tinted overflow-hidden">
          <CardContent className="p-0">
            {extractedId ? (
              <div className="aspect-video relative">
                <iframe
                  src={`https://www.youtube.com/embed/${extractedId}`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                  <Youtube className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">Featured Video Coming Soon</p>
                  <p className="text-sm text-muted-foreground/70 mt-2">
                    Your YouTube video will appear here
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
