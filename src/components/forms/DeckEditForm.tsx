'use client'

import { Loader2, Save, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CommanderSelector } from '@/components/decks/CommanderSelector'

interface Commander {
  name: string
  scryfall_id: string
}

interface RawDataCommander {
  card?: {
    name?: string
    id?: string
  }
  name?: string
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
      commanders?: Record<string, RawDataCommander> | RawDataCommander[]
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
  
  // Initialize commanders from raw_data (handles both object and array formats)
  const [commanders, setCommanders] = useState<Commander[]>(() => {
    const rawCommanders = deck.raw_data?.commanders
    if (!rawCommanders) return []

    let commanderList: RawDataCommander[]
    if (Array.isArray(rawCommanders)) {
      commanderList = rawCommanders
    } else if (typeof rawCommanders === 'object') {
      commanderList = Object.values(rawCommanders)
    } else {
      return []
    }

    return commanderList
      .map(c => ({
        name: c?.card?.name || c?.name || '',
        scryfall_id: c?.card?.id || '',
      }))
      .filter(c => c.name) // Keep commanders with names
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (commanders.length === 0) {
      alert('Please select at least one commander')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/decks/${deck.moxfield_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          owner: formData.owner,
          commanders: commanders,
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
      const response = await fetch(`/api/admin/decks/${deck.moxfield_id}`, {
        method: 'DELETE',
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

        <div className="space-y-2">
          <Label htmlFor="owner_profile_id">Owner Profile ID</Label>
          <Input
            id="owner_profile_id"
            value={formData.owner_profile_id}
            onChange={(e) => setFormData({ ...formData, owner_profile_id: e.target.value })}
            placeholder="User profile UUID (leave empty to use username matching)"
          />
          <p className="text-xs text-muted-foreground">
            When set, this user can edit deck visibility and description. Supersedes username matching.
          </p>
        </div>
      </div>

      {/* Commanders */}
      <div className="space-y-2">
        <Label>Commanders</Label>
        <CommanderSelector
          value={commanders}
          onChange={setCommanders}
          maxCommanders={2}
        />
        <p className="text-sm text-muted-foreground">
          Select up to 2 commanders for partner combinations. New commanders will be added to the database automatically.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t">
        <Button type="submit" disabled={loading || commanders.length === 0}>
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