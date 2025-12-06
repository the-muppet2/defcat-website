'use client'

import { AlertCircle, CheckCircle2, Loader2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Verify the recovery token from the URL hash
  useEffect(() => {
    const verifyToken = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      if (accessToken && type === 'recovery') {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '', // Recovery tokens don't need refresh tokens
        })

        if (error) {
          console.error('Token verification error:', error)
          setMessage({
            type: 'error',
            text: 'Invalid or expired reset link. Please request a new one.',
          })
        }
      } else {
        setMessage({
          type: 'error',
          text: 'No valid reset token found. Please use the link from your email.',
        })
      }
      setVerifying(false)
    }

    verifyToken()
  }, [supabase])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters',
      })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setMessage({
        type: 'success',
        text: 'Password updated successfully! Redirecting...',
      })

      setTimeout(() => {
        router.push('/home')
      }, 2000)
    } catch (error) {
      console.error('Password reset error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to reset password',
      })
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(farthest-corner at 50% 0%, var(--bg-tinted) 0%, var(--background) 100%)',
          }}
        />
        <Card className="w-full max-w-md glass border-white/10 bg-card-tinted relative">
          <CardContent className="py-12 flex flex-col items-center justify-center">
            <Loader2
              className="h-12 w-12 animate-spin mb-4"
              style={{ color: 'var(--mana-color)' }}
            />
            <p className="text-muted-foreground">Verifying your reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(farthest-corner at 50% 0%, var(--bg-tinted) 0%, var(--background) 100%)',
        }}
      />

      <Card className="w-full max-w-md glass border-white/10 bg-card-tinted relative">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Lock className="h-6 w-6" style={{ color: 'var(--mana-color)' }} />
            <CardTitle className="text-2xl">Set Your Password</CardTitle>
          </div>
          <CardDescription>Choose a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
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

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full btn-tinted-primary"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Set Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
