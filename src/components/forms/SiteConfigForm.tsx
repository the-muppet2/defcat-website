'use client'

import { AlertCircle, Globe, Loader2, LucideVideo, Plus, Save, Trash2, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'

interface ConfigItem {
  key: string
  value: string
  category: string
  description: string
  is_sensitive: boolean
}

export function SiteConfigForm() {
  const [config, setConfig] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addDialogCategory, setAddDialogCategory] = useState<string>('videos')
  const [newConfigItem, setNewConfigItem] = useState({
    key: '',
    value: '',
    description: '',
    is_sensitive: false,
  })
  const supabase = createClient()

  const loadConfig = useCallback(async () => {
    try {
      console.log('Loading site config...')
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Loaded config:', data)
      // Map data to ensure non-null values
      const mappedData: ConfigItem[] = (data || []).map((item) => ({
        key: item.key || '',
        value: item.value || '',
        category: item.category || 'general',
        description: item.description || '',
        is_sensitive: item.is_sensitive || false,
      }))
      setConfig(mappedData)
    } catch (err) {
      console.error('Failed to load config:', err)
      setError(
        `Failed to load configuration: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadConfig()
  }, [])

  const handleChange = (key: string, value: string) => {
    console.log('handleChange called:', key, value)
    setConfig((prev) => {
      const updated = prev.map((item) => (item.key === key ? { ...item, value } : item))
      console.log('Updated config:', updated)
      return updated
    })
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      console.log('Starting save...', config)

      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Update all config items via API route
      const updates = config.map((item) => ({
        key: item.key,
        value: item.value,
      }))

      console.log('Sending updates to API:', updates)

      const response = await fetch('/api/admin/site-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      })

      const result = await response.json()
      console.log('API response:', result)

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save configuration')
      }

      console.log('All updates successful!')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

      // Reload config to ensure we have latest data
      await loadConfig()
    } catch (err) {
      console.error('Failed to save config:', err)
      setError(
        `Failed to save configuration: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    } finally {
      setSaving(false)
    }
  }

  const handleAddNew = (category: string) => {
    setAddDialogCategory(category)
    setNewConfigItem({
      key: '',
      value: '',
      description: '',
      is_sensitive: false,
    })
    setShowAddDialog(true)
  }

  const handleCreateConfigItem = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/admin/site-config/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          key: newConfigItem.key,
          value: newConfigItem.value,
          category: addDialogCategory,
          description: newConfigItem.description,
          is_sensitive: newConfigItem.is_sensitive,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create configuration item')
      }

      setShowAddDialog(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await loadConfig()
    } catch (err) {
      console.error('Failed to create config item:', err)
      setError(
        `Failed to create configuration item: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  const handleDeleteConfigItem = async (key: string) => {
    if (!confirm(`Are you sure you want to delete "${key}"?`)) {
      return
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/admin/site-config/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete configuration item')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await loadConfig()
    } catch (err) {
      console.error('Failed to delete config item:', err)
      setError(
        `Failed to delete configuration item: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  const getConfigValue = (key: string) => {
  }

  const getConfigItem = (key: string) => {
    return config.find((item) => item.key === key)
  }

  const renderConfigInput = (key: string, label: string, placeholder?: string, canDelete = false) => {
    const item = getConfigItem(key)
    if (!item) return null

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor={key} className="text-sm font-medium">
            {label}
          </label>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteConfigItem(key)}
              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
        <Input
          id={key}
          type="text"
          value={item.value || ''}
          onChange={(e) => handleChange(key, e.target.value)}
          placeholder={placeholder}
          className="font-mono text-sm"
        />
      </div>
    )
  }

  const renderCategoryItems = (category: string) => {
    return config
      .filter((item) => item.category === category)
      .map((item) => (
        <div key={item.key}>
          {renderConfigInput(item.key, item.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), '', true)}
        </div>
      ))
  }

  if (loading) {
    return (
      <Card className="glass-panel">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" data-component="site-config-form">
      <div>
        <h2 className="text-2xl font-bold">Site Configuration</h2>
        <p className="text-muted-foreground">
          Manage site-wide configuration settings. Be cautious when modifying these values.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg">
          <p className="text-sm text-green-500">Configuration saved successfully!</p>
        </div>
      )}

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos">
            <LucideVideo className="h-4 w-4 mr-2" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="social">
            <Users className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Video Configuration</CardTitle>
                  <CardDescription>
                    Configure YouTube video IDs for featured videos across the site
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddNew('videos')}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video Link
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderCategoryItems('videos')}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> The video ID is the part after <code>?v=</code> in YouTube
                  URLs. For example:{' '}
                  <code>
                    youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Social Media Links</CardTitle>
                  <CardDescription>Configure social media profile URLs</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddNew('social')}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Social Link
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderCategoryItems('social')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Site metadata and general configuration</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddNew('general')}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Config Value
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderCategoryItems('general')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={saving}
          className="btn-tinted-primary shadow-tinted-glow"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      {/* Add New Config Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Configuration Item</DialogTitle>
            <DialogDescription>
              Create a new configuration item in the{' '}
              <strong className="capitalize">{addDialogCategory}</strong> category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-key">Key *</Label>
              <Input
                id="new-key"
                value={newConfigItem.key}
                onChange={(e) =>
                  setNewConfigItem((prev) => ({ ...prev, key: e.target.value }))
                }
                placeholder="e.g., youtube_url or featured_video_id"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase with underscores (snake_case)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-value">Value</Label>
              <Input
                id="new-value"
                value={newConfigItem.value}
                onChange={(e) =>
                  setNewConfigItem((prev) => ({ ...prev, value: e.target.value }))
                }
                placeholder="e.g., https://youtube.com/@defcat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-description">Description (optional)</Label>
              <Textarea
                id="new-description"
                value={newConfigItem.description}
                onChange={(e) =>
                  setNewConfigItem((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description of what this config item does"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateConfigItem}
              disabled={!newConfigItem.key.trim()}
              className="btn-tinted-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
