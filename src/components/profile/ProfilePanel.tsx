'use client'

import { ChevronDown, FileText, Library, Loader2, Package, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { MyDrafts } from '@/components/profile/MyDrafts'
import { MySubmissions } from '@/components/profile/MySubmissions'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { TierCreditsCard } from '@/components/profile/TierCreditsCard'
import { UserDecks } from '@/components/profile/UserDecks'
import { ManaSymbolSelector } from '@/components/settings/ManaSymbolSelector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { GlowingEffect } from '@/components/ui/glowEffect'
import { useAuth } from '@/lib/auth/client'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase/generated'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function ProfilePanel() {
  const router = useRouter()
  const auth = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()

  const loadProfile = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      }

      // Use auth from context instead of making redundant API call
      if (!auth.user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select(
          'id, patreon_tier, role, created_at, moxfield_username, email, patreon_id, updated_at'
        )
        .eq('id', auth.user.id)
        .single()

      setProfile(profileData)
      if (isRefresh) {
        setRefreshing(false)
      }
    },
    [supabase, router, auth.user]
  )

  useEffect(() => {
    if (!auth.isLoading) {
      loadProfile(false)
    }
  }, [auth.isLoading, loadProfile])

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!auth.user) {
    return null
  }

  const userTier = profile?.patreon_tier || auth.profile.tier || 'Citizen'
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString()
    : 'Unknown'

  return (
    <div className="">
      <div className="mx-auto py-8 w-[90%] sm:w-[85%] md:w-[80%] lg:w-[75%] xl:w-[70%]">
        <div className="flex flex-col gap-6">
          {/* Top Row: Profile Settings & Mana Selector */}
          <div className="relative rounded-2xl border-2xl
          ">
            <GlowingEffect
              blur={0.1}
              borderWidth={5}
              spread={60}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.1}
            />
            <Card className="glass-panel border-3 relative">
              <CardContent className="p-0 m-0">
                <div className="flex items-center justify-between">
                  {/* Profile Settings Title */}
                  <div className="flex items-center gap-3">
                    <User className="h-12 w-12" stroke="var(--mana-color)" />
                    <div>
                      <h1 className="text-2xl mana-color">Profile Settings</h1>
                      <p className="text-sm text-muted-foreground">Manage your account</p>
                    </div>
                  </div>

                  {/* Mana Symbol Selector */}
                  <div className="pr-6 relative">
                    <ManaSymbolSelector />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content: 2 Columns - Full Height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* LEFT COLUMN */}
            <div className="space-y-4 flex flex-col">
              {/* Tier + Credits Card (15-20% height) */}
              <div className="relative rounded-2xl border-2xl">
                <GlowingEffect
                  blur={0}
                  borderWidth={5}
                  spread={60}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                />
                <TierCreditsCard tier={userTier as any} />
              </div>

              {/* Account & Profile Form */}
              <div className="relative rounded-3xl border-3xl md:rounded-2xl flex-1">
                <GlowingEffect
                  blur={0}
                  borderWidth={5}
                  spread={60}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                />
                <Card className="glass-panel border-2xl min-h-full relative">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" stroke="var(--mana-color)"/>
                      Account Information
                    </CardTitle>
                    <CardDescription>Update your profile details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 min-h-fit">
                    {/* Editable fields */}
                    <ProfileEditForm
                      userId={auth.user.id}
                      currentEmail={profile?.email || auth.user.email || ''}
                      currentMoxfieldUsername={profile?.moxfield_username || null}
                      joinedDate={joinedDate}
                      onSuccess={() => {
                        loadProfile(true)
                      }}
                    />
                    {refreshing && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Refreshing profile...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4 flex flex-col">
              {/* My Decks */}
              <Collapsible defaultOpen={true} className="flex-1 flex flex-col">
                <div className="relative rounded-3xl border-3xl flex flex-col flex-1">
                  <GlowingEffect
                    blur={0}
                    borderWidth={5}
                    spread={60}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                  />
                  <Card className="glass-panel border-3xl rounded-2xl flex-col flex-1">
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer transition-colors">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Library className="h-5 w-5" stroke="var(--mana-color)" />
                            My Decks
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex-1 overflow-hidden">
                      <CardContent className="h-full overflow-auto">
                        <UserDecks moxfieldUsername={profile?.moxfield_username || null} />
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </div>
              </Collapsible>

              {/* My Drafts */}
              <Collapsible defaultOpen={true} className="flex-1 flex flex-col">
                <div className="relative border-3xl rounded-3xl flex flex-col flex-1">
                  <GlowingEffect
                    blur={0}
                    borderWidth={5}
                    spread={60}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                  />
                  <Card className="glass-panel border-3xl rounded-2xl flex-col flex-1">
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer transition-colors">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" stroke="var(--mana-color)"/>
                            My Drafts
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex-1 overflow-hidden">
                      <CardContent className="h-full overflow-auto">
                        <MyDrafts />
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </div>
              </Collapsible>

              {/* My Submissions */}
              <Collapsible defaultOpen={true} className="flex-1 flex flex-col">
                <div className="relative border border-3xl rounded-3xl flex flex-col flex-1">
                  <GlowingEffect
                    blur={0}
                    borderWidth={5}
                    spread={60}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                  />
                  <Card className="glass-panel border-3xl rounded-2xl flex-col flex-1">
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer transition-colors">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5" stroke="var(--mana-color)" />
                            My Submissions
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex-1 overflow-hidden">
                      <CardContent className="h-full overflow-auto">
                        <MySubmissions />
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </div>
              </Collapsible>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
