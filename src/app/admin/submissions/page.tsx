// app/admin/submissions/page.tsx

import { PendingSubmissions } from '@/components/admin/PendingSubmissions'
import { requireAdmin } from '@/lib/auth/server'

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic'

export default async function SubmissionsPage() {
  await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8" data-page="admin-submissions">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] bg-clip-text text-transparent">
            Submissions
          </h1>
          <p className="text-muted-foreground mt-2">
            Review and manage pending submission requests
          </p>
        </div>

        <PendingSubmissions />
      </div>
    </div>
  )
}
