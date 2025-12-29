'use client'

import { Loader2, Save, Search, Trash2, UserCheck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'


interface UserSearchResult {
  id: string
  email: string
  moxfield_username: string | null
  patreon_tier: string | null
}

interface DeckEditFormProps {
  deck: {
    id: number
    moxfield_id: string
    name: string
    author_username?: string
    owner_profile_id?: string | null
    user_hidden?: boolean | null
    user_title?: string | null
    user_description?: string | null
    raw_data?: {
      description?: string
    } | null
  }
}

export function DeckEditForm({ deck }: DeckEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: deck.name || '',
    owner: deck.author_username || '',
    description: deck.raw_data?.description || '',
    owner_profile_id: deck.owner_profile_id || '',
  })

  // User search state
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserSearchResult[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Search users when query changes
  const handleUserSearch = useCallback((query: string) => {
    setUserSearch(query)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 2) {
      setUserResults([])
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingUsers(true)
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setUserResults(data.users || [])
      } catch (err) {
        console.error('User search failed:', err)
        setUserResults([])
      } finally {
        setSearchingUsers(false)
      }
    }, 300)
  }, [])

  const selectUser = (user: UserSearchResult) => {
    setSelectedUser(user)
    setFormData(prev => ({ ...prev, owner_profile_id: user.id }))
    setUserSearch('')
    setUserResults([])
  }

  const clearSelectedUser = () => {
    setSelectedUser(null)
    setFormData(prev => ({ ...prev, owner_profile_id: '' }))
  }
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get auth token for API request
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        alert('Authentication required. Please sign in again.')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/admin/decks/${deck.moxfield_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          owner: formData.owner,
          owner_profile_id: formData.owner_profile_id || null,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        router.refresh()
        
        let message = 'Deck updated successfully!'
        if (result.newCardsCreated > 0) {
          message += ` ${result.newCardsCreated} new commander(s) added to database.`
        }
        if (result.imageCacheTriggered) {
          message += ' Image caching triggered.'
        }
        
        alert(message)
      } else {
        alert(`Error: ${result.error || 'Failed to update deck'}`)
      }
    } catch (error) {
      console.error('Error updating deck:', error)
      alert('Failed to update deck')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${deck.name}"? This cannot be undone.`)) {
      return
    }

    setDeleting(true)

    try {
      // Get auth token for API request
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        alert('Authentication required. Please sign in again.')
        setDeleting(false)
        return
      }

      const response = await fetch(`/api/admin/decks/${deck.moxfield_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        router.push('/admin/decks')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to delete deck'}`)
      }
    } catch (error) {
      console.error('Error deleting deck:', error)
      alert('Failed to delete deck')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Deck Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Deck Title</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      {/* Owner Username */}
      <div className="space-y-2">
        <Label htmlFor="owner">Owner's Username</Label>
        <Input
          id="owner"
          value={formData.owner}
          onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          placeholder="Optional deck description"
        />
      </div>

      {/* Deck Owner Link Section */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Deck Owner Assignment</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Link this deck to a user profile. This allows the user to manage deck settings (visibility, title, description).
        </p>

        {/* Show user-set values if they exist */}
        {(deck.user_title || deck.user_description || deck.user_hidden) && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
            <p className="font-medium mb-2">User-set values:</p>
            {deck.user_hidden && (
              <p><span className="text-muted-foreground">Hidden:</span> Yes</p>
            )}
            {deck.user_title && (
              <p><span className="text-muted-foreground">Title:</span> {deck.user_title}</p>
            )}
            {deck.user_description && (
              <p><span className="text-muted-foreground">Description:</span> {deck.user_description}</p>
            )}
          </div>
        )}

        {/* User Search */}
        <div className="space-y-2">
          <Label>Search User</Label>
          {selectedUser ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <UserCheck className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <p className="font-medium">{selectedUser.email}</p>
                {selectedUser.moxfield_username && (
                  <p className="text-sm text-muted-foreground">Moxfield: {selectedUser.moxfield_username}</p>
                )}
                {selectedUser.patreon_tier && (
                  <p className="text-xs text-muted-foreground">Tier: {selectedUser.patreon_tier}</p>
                )}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={clearSelectedUser}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search by email or Moxfield username..."
                  className="pl-9"
                />
                {searchingUsers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>
              {userResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {userResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 border-b last:border-0"
                      onClick={() => selectUser(user)}
                    >
                      <p className="font-medium text-sm">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.moxfield_username || 'No Moxfield username'}
                        {user.patreon_tier && ` - ${user.patreon_tier}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>

        <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Deck
            </>
          )}
        </Button>
      </div>
    </form>
  )
}