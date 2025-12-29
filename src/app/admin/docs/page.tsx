import { requireAdmin } from '@/lib/auth/server'
import { BookOpen } from 'lucide-react'
import { DocumentationView } from '@/components/admin/DocumentationView'

export default async function AdminDocsPage() {
  const auth = await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8" data-page="admin-docs">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8" style={{ color: 'var(--mana-color)' }} />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] bg-clip-text text-transparent">
              System Documentation
            </h1>
            <p className="text-muted-foreground mt-2">
              Architecture diagrams and technical documentation
            </p>
          </div>
        </div>

        <DocumentationView userRole={auth.role} />
      </div>
    </div>
  )
}
