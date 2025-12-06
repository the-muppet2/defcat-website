'use client'

import { BookOpen, GraduationCap, Target, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function CommanderCollegePage() {
  const [collegeVideoId, setCollegeVideoId] = useState<string>('')

  // Fetch college video ID from site_config
  useEffect(() => {
    async function fetchCollegeVideo() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'college_video_id')
        .single()

      if (data && !error) {
        const videoValue = data.value || ''
        // Extract video ID from URL if full URL is provided
        const extractedId = extractYouTubeId(videoValue)
        setCollegeVideoId(extractedId)
      }
    }
    fetchCollegeVideo()
  }, [])

  // Helper function to extract YouTube ID from URL or return ID as-is
  function extractYouTubeId(input: string): string {
    if (!input) return ''

    // If it's already just an ID (no slashes or dots), return it
    if (!input.includes('/') && !input.includes('.')) return input

    // Try to extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct ID format
    ]

    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match && match[1]) return match[1]
    }

    // If no pattern matches, return the input as-is
    return input
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(farthest-corner at 50% 0%, var(--bg-tinted) 0%, var(--background) 100%)',
        }}
      />

      <div className="relative">
        <section className="pt-24 pb-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <GraduationCap className="h-12 w-12" style={{ color: 'var(--mana-color)' }} />
                <h1
                  className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--gradient-start), var(--gradient-end))`,
                  }}
                >
                  DefCat's Commander College
                </h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Learn to build a deck that plays exactly the way you want it to.
              </p>
            </div>

            {/* Sales Video */}
            <div className="mb-16">
              <Card className="glass border-white/10 bg-card-tinted overflow-hidden">
                <CardContent className="p-0">
                  {collegeVideoId ? (
                    <div className="aspect-video relative">
                      <iframe
                        src={`https://www.youtube.com/embed/${collegeVideoId}`}
                        title="DefCat's Commander College"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted/30 flex items-center justify-center">
                      <div className="text-center">
                        <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg text-muted-foreground">Sales Video Coming Soon</p>
                        <p className="text-sm text-muted-foreground/70 mt-2">
                          Set the video ID in the admin panel
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Course Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <Card className="glass border-white/10 bg-card-tinted">
                <CardHeader>
                  <Target className="h-8 w-8 mb-2" style={{ color: 'var(--mana-color)' }} />
                  <CardTitle>Master Deck Building</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Learn the fundamentals of crafting powerful Commander decks with focused
                    strategies and synergies.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass border-white/10 bg-card-tinted">
                <CardHeader>
                  <Zap className="h-8 w-8 mb-2" style={{ color: 'var(--mana-color)' }} />
                  <CardTitle>Optimize Your Play</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Discover advanced techniques for improving your gameplay and making optimal
                    decisions.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass border-white/10 bg-card-tinted">
                <CardHeader>
                  <BookOpen className="h-8 w-8 mb-2" style={{ color: 'var(--mana-color)' }} />
                  <CardTitle>Comprehensive Lessons</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Follow a structured curriculum designed to take you from beginner to expert deck
                    builder.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Lesson Plan Visual */}
            <div>
              <h2 className="text-3xl font-bold mb-6 text-center">Course Curriculum</h2>
              <Card className="glass border-white/10 bg-card-tinted">
                <CardContent className="p-8">
                  <div className="aspect-[16/10] bg-muted/30 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg text-muted-foreground">Lesson Plan Visual</p>
                      <p className="text-sm text-muted-foreground/70 mt-2">
                        Your lesson plan PNG will be displayed here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
