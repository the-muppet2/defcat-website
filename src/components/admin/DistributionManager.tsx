'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Calendar, CheckCircle, Clock, Loader2, Play, Users, XCircle } from 'lucide-react'
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
import { toast } from 'sonner'

interface DistributionLog {
  id: string
  started_at: string
  completed_at: string | null
  status: 'running' | 'success' | 'failed'
  users_affected: number
  credits_distributed: Record<string, number>
  error_message: string | null
  triggered_by: 'cron' | 'manual'
  duration_seconds: number | null
}

export function DistributionManager() {
  const [history, setHistory] = useState<DistributionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/credits/distribute')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to fetch distribution history:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const runDistribution = async () => {
    setRunning(true)
    setShowConfirm(false)

    try {
      const response = await fetch('/api/admin/credits/distribute', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Distribution Complete', {
          description: 'Monthly credits have been distributed to eligible users.'
        })
        fetchHistory()
      } else {
        toast.error('Distribution Failed', {
          description: data.error || 'An error occurred during distribution.'
        })
      }
    } catch {
      toast.error('Distribution Failed', {
        description: 'Network error occurred.'
      })
    } finally {
      setRunning(false)
    }
  }

  const lastRun = history[0]
  const nextDistribution = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCredits = (credits: Record<string, number>) => {
    return Object.entries(credits)
      .map(([type, amount]) => `${amount} ${type}`)
      .join(', ')
  }

  return (
    <>
      <Card className="card-tinted-glass">
        <CardHeader>
          <CardTitle>Credit Distribution</CardTitle>
          <CardDescription>
            Monitor and manage monthly credit distributions. Cron runs on the 1st of each month.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-tinted">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Next Distribution</span>
                </div>
                <p className="text-2xl font-bold">
                  {nextDistribution.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-tinted">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  {lastRun?.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : lastRun?.status === 'failed' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  <span className="text-sm">Last Run</span>
                </div>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : lastRun ? (
                  <p className={`text-2xl font-bold ${
                    lastRun.status === 'success' ? 'text-green-500' :
                    lastRun.status === 'failed' ? 'text-red-500' : ''
                  }`}>
                    {lastRun.status === 'success' ? 'Success' :
                     lastRun.status === 'failed' ? 'Failed' : 'Running'}
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">Never</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-tinted">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Users Affected</span>
                </div>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">
                    {lastRun?.users_affected ?? 0}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Button */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={running}
              className="btn-tinted-primary"
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Manual Distribution
                </>
              )}
            </Button>
          </div>

          {/* Distribution History */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Recent Distributions</h4>
              <div className="space-y-2">
                {history.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-tinted text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {log.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : log.status === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <div>
                        <p className="font-medium">{formatDate(log.started_at)}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.triggered_by === 'cron' ? 'Scheduled' : 'Manual'}
                          {log.users_affected > 0 && ` - ${log.users_affected} users`}
                        </p>
                      </div>
                    </div>
                    {log.status === 'success' && log.credits_distributed && (
                      <span className="text-xs text-muted-foreground">
                        {formatCredits(log.credits_distributed)}
                      </span>
                    )}
                    {log.status === 'failed' && log.error_message && (
                      <span className="text-xs text-red-500 max-w-[200px] truncate">
                        {log.error_message}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Run Manual Distribution?
            </DialogTitle>
            <DialogDescription>
              This will distribute monthly credits to all eligible users based on their current
              Patreon tier. Users who have already received credits this month will be skipped.
              <br /><br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={runDistribution} className="btn-tinted-primary">
              Run Distribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
