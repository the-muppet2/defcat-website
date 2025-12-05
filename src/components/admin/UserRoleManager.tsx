'use client'

import { AlertCircle, CheckCircle2, Search, UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GlowingEffect } from '@/components/ui/glowEffect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { PATREON_TIERS, UserRole } from '@/types/core'

interface User {
  id: string
  email: string
  role: string | null
  patreon_tier: string | null
  created_at: string | null
  deck_credits?: number
  roast_credits?: number
  submission_count?: number
  patreon_since?: string | null
}

interface UserRoleManagerProps {
  currentUserRole: UserRole
}

export function UserRoleManager({ currentUserRole }: UserRoleManagerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<User[] | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('user')
  const [newUserTier, setNewUserTier] = useState('')
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  const isDeveloper = currentUserRole === 'developer'
  const availableRoles = isDeveloper
    ? ['user', 'admin', 'moderator', 'developer']
    : ['user', 'admin', 'moderator']

  const loadUsers = useCallback(async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, patreon_tier, patreon_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (profilesError) throw profilesError

      const enrichedUsers = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const [creditsResult, submissionsResult] = await Promise.all([
            supabase
              .from('user_credits')
              .select('credits')
              .eq('user_id', profile.id)
              .maybeSingle(),
            supabase
              .from('deck_submissions')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', profile.id),
          ])

          const credits = creditsResult.data?.credits as { deck?: number; roast?: number } | null
          const deckCredits = credits?.deck ?? 0
          const roastCredits = credits?.roast ?? 0
          const submissionCount = submissionsResult.count ?? 0

          return {
            ...profile,
            deck_credits: deckCredits,
            roast_credits: roastCredits,
            submission_count: submissionCount,
            patreon_since: profile.created_at,
          }
        })
      )

      setUsers(enrichedUsers)
    } catch (err) {
      // Error will be shown in UI via error state
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults(null)
      return
    }

    setSearching(true)
    setMessage(null)

    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, patreon_tier, patreon_id, created_at')
        .ilike('email', `%${searchTerm.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (profilesError) throw profilesError

      if (!profilesData || profilesData.length === 0) {
        setSearchResults([])
        setMessage({ type: 'error', text: 'No users found matching your search' })
        return
      }

      const enrichedUsers = await Promise.all(
        profilesData.map(async (profile) => {
          const [creditsResult, submissionsResult] = await Promise.all([
            supabase
              .from('user_credits')
              .select('credits')
              .eq('user_id', profile.id)
              .maybeSingle(),
            supabase
              .from('deck_submissions')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', profile.id),
          ])

          const credits = creditsResult.data?.credits as { deck?: number; roast?: number } | null
          const deckCredits = credits?.deck ?? 0
          const roastCredits = credits?.roast ?? 0
          const submissionCount = submissionsResult.count ?? 0

          return {
            ...profile,
            deck_credits: deckCredits,
            roast_credits: roastCredits,
            submission_count: submissionCount,
            patreon_since: profile.created_at,
          }
        })
      )

      setSearchResults(enrichedUsers)
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Search failed',
      })
    } finally {
      setSearching(false)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setSearchResults(null)
    setMessage(null)
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdating(true)
    setMessage(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/admin/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId, role: newRole }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update role')
      }

      setMessage({ type: 'success', text: 'Role updated successfully' })
      await loadUsers()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update role',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      setMessage({ type: 'error', text: 'Email is required' })
      return
    }

    setAdding(true)
    setMessage(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/admin/users/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          role: newUserRole,
          patreonTier: newUserTier.trim() || null,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add user')
      }

      const successMessage = result.data.passwordResetSent
        ? 'User added successfully! Password reset email sent.'
        : 'User added successfully! Note: Password reset email may have failed.'

      setMessage({ type: 'success', text: successMessage })
      setNewUserEmail('')
      setNewUserRole('user')
      setNewUserTier('')
      setShowAddUser(false)
      await loadUsers()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to add user',
      })
    } finally {
      setAdding(false)
    }
  }

  const displayUsers = searchResults !== null ? searchResults : users

  const getSubscriptionDuration = (patreonSince: string | null | undefined): string => {
    if (!patreonSince) return 'Unknown'

    const start = new Date(patreonSince)
    const now = new Date()
    const months = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))

    if (months < 1) return 'Less than 1 month'
    if (months === 1) return '1 month'
    if (months < 12) return `${months} months`

    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (remainingMonths === 0) return years === 1 ? '1 year' : `${years} years`
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="space-y-4">
        {message && (
          <div
            className={`p-3 rounded-lg flex items-start gap-2 ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-destructive/10 border border-destructive/20'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            )}
            <p
              className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-destructive'}`}
            >
              {message.text}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={searching || !searchTerm.trim()}
            variant="outline"
          >
            {searching ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
          {searchResults !== null && (
            <Button onClick={handleClearSearch} variant="outline">
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => {
              if (!showAddUser && searchTerm.trim()) {
                setNewUserEmail(searchTerm.trim())
              }
              setShowAddUser(!showAddUser)
            }}
            className="btn-tinted-primary"
          >
            {showAddUser ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </>
            )}
          </Button>
        </div>

      </div>

      {showAddUser && (
        <Card className="border-tinted bg-card-tinted">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-user-role">Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger id="new-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-user-tier">Patreon Tier (Optional)</Label>
              <Select
                value={newUserTier || 'none'}
                onValueChange={(val) => setNewUserTier(val === 'none' ? '' : val)}
              >
                <SelectTrigger id="new-user-tier">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {PATREON_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAddUser}
              disabled={adding || !newUserEmail.trim()}
              className="w-full btn-tinted-primary"
            >
              {adding ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Adding User...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {searchResults !== null && (
        <p className="text-sm text-muted-foreground">
          Found {searchResults.length} of {users.length} users
        </p>
      )}

      {loading ? (
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
          <Card className="card-glass border-0 p-8 relative">
            <div className="text-center text-muted-foreground">Loading users...</div>
          </Card>
        </div>
      ) : displayUsers.length === 0 ? (
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
          <Card className="card-glass border-0 p-8 relative">
            <div className="text-center text-muted-foreground">
              {searchResults !== null ? 'No users found matching your search' : 'No users found'}
            </div>
          </Card>
        </div>
      ) : (
        displayUsers.map((user) => (
          <div key={user.id} className="relative rounded-2xl border p-2 md:rounded-3xl md:p-3">
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
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.email}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span>
                        <strong>Tier:</strong> {user.patreon_tier || 'None'}
                      </span>
                      <span>
                        <strong>Subscriber:</strong> {getSubscriptionDuration(user.patreon_since)}
                      </span>
                      <span>
                        <strong>Joined:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={user.role || 'user'}
                      onValueChange={(newRole) => handleUpdateRole(user.id, newRole)}
                      disabled={updating}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Deck Credits:</span>
                    <span className="font-medium tabular-nums">{user.deck_credits ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Roast Credits:</span>
                    <span className="font-medium tabular-nums">{user.roast_credits ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Submissions:</span>
                    <span className="font-medium tabular-nums">{user.submission_count ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))
      )}

      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Role Permissions:</strong>
          <br />• <strong>User:</strong> Basic access
          <br />• <strong>Admin:</strong> Content management (client access)
          <br />• <strong>Moderator:</strong> Content management + moderation
          <br />
          {isDeveloper && (
            <>
              • <strong>Developer:</strong> Full system access (database, SQL queries)
            </>
          )}
        </p>
      </div>
    </div>
  )
}
