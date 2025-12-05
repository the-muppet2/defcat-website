'use client'

import { CheckCircle, ChevronDown, ChevronUp, ClipboardList, Loader2, Play, XCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlowingEffect } from '@/components/ui/glowEffect'
import { createClient } from '@/lib/supabase/client'
import { ColorIdentity } from '@/types/colors'

interface PendingSubmission {
  id: string
  created_at: string
  email: string
  moxfield_username: string | null
  discord_username: string | null
  patreon_tier: string
  commander: string | null
  color_preference: string | null
  theme: string | null
  bracket: string | null
  budget: string | null
  coffee_preference: string | null
  ideal_date: string | null
  mystery_deck: boolean
  status: string
  deck_list_url: string | null
}

interface FinishFormData {
  moxfieldUrl: string
  ownerProfileId: string
}

interface UserSearchResult {
  id: string
  email: string
  moxfield_username: string | null
  patreon_tier: string | null
}

export function PendingSubmissions() {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [finishDialogOpen, setFinishDialogOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<PendingSubmission | null>(null)
  const [finishFormData, setFinishFormData] = useState<FinishFormData>({
    moxfieldUrl: '',
    ownerProfileId: '',
  })
  const [finishing, setFinishing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const loadedRef = useRef(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadSubmissions = useCallback(async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('deck_submissions')
      .select('*')
      .in('status', ['pending', 'queued', 'in_progress'])
      .order('created_at', { ascending: true })

    if (!error && data) {
      setSubmissions(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      loadSubmissions()
    }
  }, [loadSubmissions])

  const refreshSubmissions = useCallback(async () => {
    await loadSubmissions()
  }, [loadSubmissions])

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setUserSearchResults([])
      return
    }

    setSearchingUsers(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, moxfield_username, patreon_tier')
      .or(`email.ilike.%${query}%,moxfield_username.ilike.%${query}%`)
      .limit(5)

    if (!error && data) {
      setUserSearchResults(data)
    } else {
      setUserSearchResults([])
    }
    setSearchingUsers(false)
  }, [])

  const handleUserSearchInput = useCallback(
    (value: string) => {
      setUserSearchQuery(value)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(value)
      }, 300)
    },
    [searchUsers]
  )

  const selectUser = useCallback((user: UserSearchResult) => {
    setFinishFormData((prev) => ({ ...prev, ownerProfileId: user.id }))
    setUserSearchQuery(user.email)
    setUserSearchResults([])
  }, [])

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id)
    const supabase = createClient()

    // Get session token for API authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setUpdating(null)
      return
    }

    // Use API route for admin operations
    const response = await fetch(`/api/admin/submissions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    })

    if (response.ok) {
      await refreshSubmissions()
    }

    setUpdating(null)
  }

  function openFinishDialog(submission: PendingSubmission) {
    setSelectedSubmission(submission)
    setFinishFormData({
      moxfieldUrl: submission.deck_list_url || '',
      ownerProfileId: '',
    })
    setUserSearchQuery('')
    setUserSearchResults([])
    setFinishDialogOpen(true)
  }

  async function handleFinish() {
    if (!selectedSubmission) return

    setFinishing(true)
    const supabase = createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      alert('Session expired. Please refresh the page.')
      setFinishing(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/submissions/${selectedSubmission.id}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          moxfieldUrl: finishFormData.moxfieldUrl,
          ownerProfileId: finishFormData.ownerProfileId || null,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setFinishDialogOpen(false)
        setSelectedSubmission(null)
        await refreshSubmissions()

        let message = 'Submission completed successfully!'
        if (result.deckImported) {
          message += ` Deck "${result.deckName}" imported.`
        }
        if (result.ownerLinked) {
          message += ' Owner linked to deck.'
        }
        alert(message)
      } else {
        alert(`Error: ${result.error || 'Failed to complete submission'}`)
      }
    } catch (error) {
      console.error('Finish submission error:', error)
      alert('Failed to complete submission')
    } finally {
      setFinishing(false)
    }
  }

  if (loading) {
    return (
      <div className="relative rounded-2xl border p-2 md:rounded-3xl md:p-3">
        <GlowingEffect
          blur={0}
          borderWidth={3}
          spread={80}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <Card className="card-glass border-0 relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Pending Submissions
            </CardTitle>
            <CardDescription>Deck requests awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border p-2 md:rounded-3xl md:p-3">
      <GlowingEffect
        blur={0}
        borderWidth={3}
        spread={80}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
      />
      <Card className="card-tinted border-0 relative">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Pending Submissions
          </CardTitle>
          <CardDescription>
            {submissions.length} deck request{submissions.length !== 1 ? 's' : ''} awaiting review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending submissions</p>
              <p className="text-sm mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((submission) => {
                const isExpanded = expandedId === submission.id
                return (
                  <div
                    key={submission.id}
                    className="rounded-lg bg-accent-tinted border border-tinted hover:bg-accent-tinted/80 transition-all overflow-hidden"
                  >
                    {/* Compact Header Row */}
                    <div className="flex items-center gap-3 p-3">
                      {/* Status Badge */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          submission.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : submission.status === 'in_progress'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {submission.status === 'pending'
                          ? 'New'
                          : submission.status === 'in_progress'
                            ? 'WIP'
                            : 'Queue'}
                      </span>

                      {/* Tier Badge */}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 shrink-0">
                        {submission.patreon_tier}
                      </span>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0 flex items-center gap-4">
                        <span className="font-medium truncate">{submission.email}</span>
                        {submission.moxfield_username && (
                          <a
                            href={`https://moxfield.com/users/${submission.moxfield_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 truncate hidden sm:block"
                          >
                            @{submission.moxfield_username}
                          </a>
                        )}
                        {submission.commander && (
                          <span className="text-sm text-muted-foreground truncate hidden md:block">
                            {submission.commander}
                          </span>
                        )}
                        {submission.color_preference && (
                          <div className="flex items-center gap-0.5 shrink-0 hidden lg:flex">
                            {ColorIdentity.getIndividual(submission.color_preference).map(
                              (symbol, idx) => (
                                <i key={idx} className={`ms ms-${symbol.toLowerCase()} ms-fw`} />
                              )
                            )}
                          </div>
                        )}
                      </div>

                      {/* Date */}
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </span>

                      {/* Expand Toggle */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : submission.id)}
                        className="p-1 hover:bg-accent rounded shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {/* Action Buttons */}
                      <div className="flex gap-1 shrink-0">
                        {submission.status !== 'in_progress' ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                              onClick={() => updateStatus(submission.id, 'in_progress')}
                              disabled={updating === submission.id}
                            >
                              {updating === submission.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => updateStatus(submission.id, 'rejected')}
                              disabled={updating === submission.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                              onClick={() => openFinishDialog(submission)}
                              disabled={updating === submission.id}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => updateStatus(submission.id, 'rejected')}
                              disabled={updating === submission.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-tinted/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-sm">
                          {submission.moxfield_username && (
                            <div>
                              <span className="text-muted-foreground">Moxfield: </span>
                              <a
                                href={`https://moxfield.com/users/${submission.moxfield_username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                {submission.moxfield_username}
                              </a>
                            </div>
                          )}
                          {submission.discord_username && (
                            <div>
                              <span className="text-muted-foreground">Discord: </span>
                              {submission.discord_username}
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Type: </span>
                            {submission.mystery_deck ? 'Mystery' : 'Custom'}
                          </div>
                          {submission.commander && (
                            <div>
                              <span className="text-muted-foreground">Commander: </span>
                              {submission.commander}
                            </div>
                          )}
                          {submission.color_preference && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Colors: </span>
                              <div className="flex items-center gap-0.5">
                                {ColorIdentity.getIndividual(submission.color_preference).map(
                                  (symbol, idx) => (
                                    <i key={idx} className={`ms ms-${symbol.toLowerCase()} ms-fw`} />
                                  )
                                )}
                              </div>
                            </div>
                          )}
                          {submission.bracket && (
                            <div>
                              <span className="text-muted-foreground">Bracket: </span>
                              {submission.bracket.replace('bracket', '')}
                            </div>
                          )}
                          {submission.budget && (
                            <div>
                              <span className="text-muted-foreground">Budget: </span>$
                              {Number(submission.budget).toLocaleString('en-US')}
                            </div>
                          )}
                          {submission.coffee_preference && (
                            <div>
                              <span className="text-muted-foreground">Coffee: </span>
                              {submission.coffee_preference}
                            </div>
                          )}
                        </div>
                        {(submission.theme || submission.ideal_date) && (
                          <div className="mt-3 pt-3 border-t border-tinted/50 text-sm space-y-1">
                            {submission.theme && (
                              <div>
                                <span className="text-muted-foreground">Theme: </span>
                                {submission.theme}
                              </div>
                            )}
                            {submission.ideal_date && (
                              <div>
                                <span className="text-muted-foreground">Ideal Date: </span>
                                {submission.ideal_date}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-3 pt-2 border-t border-tinted/50 text-xs text-muted-foreground">
                          Submitted {new Date(submission.created_at).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Finish Submission Dialog */}
      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Submission</DialogTitle>
            <DialogDescription>
              Enter the Moxfield deck URL and optionally link to a user profile.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 py-4">
              {/* Submission Info */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p>
                  <strong>Email:</strong> {selectedSubmission.email}
                </p>
                {selectedSubmission.moxfield_username && (
                  <p>
                    <strong>Moxfield:</strong> {selectedSubmission.moxfield_username}
                  </p>
                )}
                {selectedSubmission.commander && (
                  <p>
                    <strong>Commander:</strong> {selectedSubmission.commander}
                  </p>
                )}
              </div>

              {/* Moxfield URL */}
              <div className="space-y-2">
                <Label htmlFor="moxfieldUrl">Moxfield Deck URL</Label>
                <Input
                  id="moxfieldUrl"
                  value={finishFormData.moxfieldUrl}
                  onChange={(e) =>
                    setFinishFormData({ ...finishFormData, moxfieldUrl: e.target.value })
                  }
                  placeholder="https://www.moxfield.com/decks/..."
                />
                <p className="text-xs text-muted-foreground">
                  The deck will be scraped and added to the database.
                </p>
              </div>

              {/* Owner Search */}
              <div className="space-y-2">
                <Label htmlFor="ownerSearch">Link to User (optional)</Label>
                <div className="relative">
                  <Input
                    id="ownerSearch"
                    value={userSearchQuery}
                    onChange={(e) => handleUserSearchInput(e.target.value)}
                    placeholder="Search by email or Moxfield username..."
                  />
                  {searchingUsers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {userSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                      {userSearchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectUser(user)}
                          className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between text-sm"
                        >
                          <div>
                            <div className="font-medium">{user.email}</div>
                            {user.moxfield_username && (
                              <div className="text-xs text-muted-foreground">
                                @{user.moxfield_username}
                              </div>
                            )}
                          </div>
                          {user.patreon_tier && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                              {user.patreon_tier}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {finishFormData.ownerProfileId && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-500">Selected:</span>
                    <code className="bg-muted px-1 rounded text-[10px]">
                      {finishFormData.ownerProfileId}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        setFinishFormData((prev) => ({ ...prev, ownerProfileId: '' }))
                        setUserSearchQuery('')
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      Clear
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Search for a user to link this deck to their profile. Leave empty to use username
                  matching.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishDialogOpen(false)} disabled={finishing}>
              Cancel
            </Button>
            <Button
              onClick={handleFinish}
              disabled={finishing || !finishFormData.moxfieldUrl}
              className="bg-green-600 hover:bg-green-700"
            >
              {finishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Submission
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
