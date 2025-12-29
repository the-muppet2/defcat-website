'use client'

import { AlertCircle, CheckCircle2, Coins, Search, UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const [tierFilter, setTierFilter] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('user')
  const [newUserTier, setNewUserTier] = useState('')
  const [adding, setAdding] = useState(false)
  const [creditModal, setCreditModal] = useState<{ userId: string; email: string } | null>(null)
  const [creditType, setCreditType] = useState<'deck' | 'roast'>('deck')
  const [creditAmount, setCreditAmount] = useState('1')
  const [grantingCredits, setGrantingCredits] = useState(false)
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
        .order('email', { ascending: true })
        .limit(200)

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
    } catch {
      // Error will be shown in UI via error state
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const handleUpdateTier = async (userId: string, newTier: string) => {
    setUpdating(true)
    setMessage(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/admin/users/update-tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId, tier: newTier === 'none' ? null : newTier }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update tier')
      }

      setMessage({ type: 'success', text: result.message })
      await loadUsers()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update tier',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleGrantCredits = async () => {
    if (!creditModal) return

    setGrantingCredits(true)
    setMessage(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/admin/users/grant-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: creditModal.userId,
          creditType,
          amount: parseInt(creditAmount, 10),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to grant credits')
      }

      setMessage({ type: 'success', text: result.message })
      setCreditModal(null)
      setCreditAmount('1')
      await loadUsers()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to grant credits',
      })
    } finally {
      setGrantingCredits(false)
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

  // Filter and sort users
  const displayUsers = useMemo(() => {
    let filtered = users

    // Apply search filter (client-side instant filtering)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(u => u.email.toLowerCase().includes(query))
    }

    // Apply tier filter
    if (tierFilter) {
      if (tierFilter === 'none') {
        filtered = filtered.filter(u => !u.patreon_tier)
      } else {
        filtered = filtered.filter(u => u.patreon_tier === tierFilter)
      }
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(u => (u.role || 'user') === roleFilter)
    }

    return filtered
  }, [users, searchTerm, tierFilter, roleFilter])

  // Tier counts for filter buttons (based on all users, not filtered)
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { none: 0 }
    for (const tier of PATREON_TIERS) {
      counts[tier] = 0
    }
    for (const user of users) {
      if (user.patreon_tier) {
        counts[user.patreon_tier] = (counts[user.patreon_tier] || 0) + 1
      } else {
        counts.none++
      }
    }
    return counts
  }, [users])

  // Background color based on Patreon tier
  const getTierBackground = (tier: string | null): string => {
    switch (tier) {
      case 'Citizen':
        return 'bg-blue-500/10'
      case 'Knight':
        return 'bg-amber-500/10'
      case 'Emissary':
        return 'bg-emerald-500/10'
      case 'Duke':
        return 'bg-purple-500/10'
      case 'Wizard':
        return 'bg-cyan-500/10'
      case 'ArchMage':
        return 'bg-rose-500/10'
      default:
        return ''
    }
  }

  // Border color based on role
  const getRoleBorder = (role: string | null): string => {
    switch (role) {
      case 'admin':
        return 'border-red-500/50'
      case 'moderator':
        return 'border-amber-500/50'
      case 'developer':
        return 'border-purple-500/50'
      default:
        return 'border-border/30'
    }
  }

  // Button styles for tier filters
  const getTierButtonStyle = (tier: string, isActive: boolean): string => {
    const styles: Record<string, { active: string; inactive: string }> = {
      Citizen: {
        active: 'bg-blue-500/30 text-blue-300 !ring-2 !ring-blue-400 border-transparent font-semibold',
        inactive: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/40',
      },
      Knight: {
        active: 'bg-amber-500/30 text-amber-300 !ring-2 !ring-amber-400 border-transparent font-semibold',
        inactive: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40',
      },
      Emissary: {
        active: 'bg-emerald-500/30 text-emerald-300 !ring-2 !ring-emerald-400 border-transparent font-semibold',
        inactive: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/40',
      },
      Duke: {
        active: 'bg-purple-500/30 text-purple-300 !ring-2 !ring-purple-400 border-transparent font-semibold',
        inactive: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/40',
      },
      Wizard: {
        active: 'bg-cyan-500/30 text-cyan-300 !ring-2 !ring-cyan-400 border-transparent font-semibold',
        inactive: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-cyan-500/40',
      },
      ArchMage: {
        active: 'bg-rose-500/30 text-rose-300 !ring-2 !ring-rose-400 border-transparent font-semibold',
        inactive: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border-rose-500/40',
      },
      none: {
        active: 'bg-gray-500/30 text-gray-300 !ring-2 !ring-gray-400 border-transparent font-semibold',
        inactive: 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 border-gray-500/40',
      },
    }
    return styles[tier]?.[isActive ? 'active' : 'inactive'] || ''
  }

  // Button styles for role filters
  const getRoleButtonStyle = (role: string, isActive: boolean): string => {
    const styles: Record<string, { active: string; inactive: string }> = {
      admin: {
        active: 'bg-red-500/30 text-red-300 !ring-2 !ring-red-400 border-transparent font-semibold',
        inactive: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/40',
      },
      moderator: {
        active: 'bg-amber-500/30 text-amber-300 !ring-2 !ring-amber-400 border-transparent font-semibold',
        inactive: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40',
      },
      developer: {
        active: 'bg-purple-500/30 text-purple-300 !ring-2 !ring-purple-400 border-transparent font-semibold',
        inactive: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/40',
      },
      user: {
        active: 'bg-gray-500/30 text-gray-300 !ring-2 !ring-gray-400 border-transparent font-semibold',
        inactive: '',
      },
    }
    return styles[role]?.[isActive ? 'active' : 'inactive'] || ''
  }

  return (
    <div className="space-y-4 col-span-full">
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
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
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

        {/* Tier Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={tierFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTierFilter(null)}
          >
            All ({users.length})
          </Button>
          {PATREON_TIERS.map((tier) => (
            <Button
              key={tier}
              variant="outline"
              size="sm"
              onClick={() => setTierFilter(tierFilter === tier ? null : tier)}
              className={getTierButtonStyle(tier, tierFilter === tier)}
            >
              {tier} ({tierCounts[tier] || 0})
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTierFilter(tierFilter === 'none' ? null : 'none')}
            className={getTierButtonStyle('none', tierFilter === 'none')}
          >
            No Tier ({tierCounts.none || 0})
          </Button>
        </div>

        {/* Role Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center mr-2">Role:</span>
          <Button
            variant={roleFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRoleFilter(null)}
          >
            All
          </Button>
          {availableRoles.map((role) => (
            <Button
              key={role}
              variant="outline"
              size="sm"
              onClick={() => setRoleFilter(roleFilter === role ? null : role)}
              className={getRoleButtonStyle(role, roleFilter === role)}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Button>
          ))}
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

      {(searchTerm.trim() || tierFilter || roleFilter) && (
        <p className="text-sm text-muted-foreground">
          Showing {displayUsers.length} of {users.length} users
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
              {searchTerm.trim() || tierFilter || roleFilter
                ? 'No users found matching your filters'
                : 'No users found'}
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayUsers.map((user) => (
            <div key={user.id} className="relative rounded-2xl">
              <GlowingEffect
                blur={0}
                borderWidth={3}
                spread={80}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
              />
              <Card className={`border relative h-full ${getTierBackground(user.patreon_tier)} ${getRoleBorder(user.role)}`}>
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex-1">
                    <p className="font-medium truncate text-sm">{user.email}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span>Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Select
                      value={user.patreon_tier || 'none'}
                      onValueChange={(newTier) => handleUpdateTier(user.id, newTier)}
                      disabled={updating}
                    >
                      <SelectTrigger className="flex-1 h-8 text-xs">
                        <SelectValue placeholder="Tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Tier</SelectItem>
                        {PATREON_TIERS.map((tier) => (
                          <SelectItem key={tier} value={tier}>
                            {tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={user.role || 'user'}
                      onValueChange={(newRole) => handleUpdateRole(user.id, newRole)}
                      disabled={updating}
                    >
                      <SelectTrigger className="flex-1 h-8 text-xs">
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

                  <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-border/50 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Deck: {user.deck_credits ?? 0}</span>
                      <span>Roast: {user.roast_credits ?? 0}</span>
                      <span>Subs: {user.submission_count ?? 0}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => setCreditModal({ userId: user.id, email: user.email })}
                    >
                      <Coins className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          Note: User role changes may take a few minutes to propagate throughout the system.
        </p>
      </div>

      {creditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 border-tinted bg-card">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Grant Credits</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCreditModal(null)
                    setCreditAmount('1')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Granting credits to: <strong>{creditModal.email}</strong>
              </p>

              <div className="space-y-2">
                <Label htmlFor="credit-type">Credit Type</Label>
                <Select value={creditType} onValueChange={(v) => setCreditType(v as 'deck' | 'roast')}>
                  <SelectTrigger id="credit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deck">Deck Credits</SelectItem>
                    <SelectItem value="roast">Roast Credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit-amount">Amount (use negative to remove)</Label>
                <Input
                  id="credit-amount"
                  type="number"
                  min="-100"
                  max="100"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setCreditModal(null)
                    setCreditAmount('1')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 btn-tinted-primary"
                  onClick={handleGrantCredits}
                  disabled={grantingCredits || !creditAmount}
                >
                  {grantingCredits ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Coins className="h-4 w-4 mr-2" />
                      Grant Credits
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
