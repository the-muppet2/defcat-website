/**
 * Supabase client exports
 * Import from this file based on your context:
 *
 * Client Components:
 *   import { createClient } from '@/lib/supabase/client'
 *
 * Server Components/Actions:
 *   import { createClient } from '@/lib/supabase/server'
 *
 * Admin operations (server-only):
 *   import { createAdminClient } from '@/lib/supabase/admin'
 *
 * Note: Middleware is handled by src/proxy.ts (Next.js 16+)
 */

export { createAdminClient } from './admin'
export { createClient as createBrowserClient } from './client'
export { createClient as createServerClient } from './server'

export interface supabase {
  createBrowserClient: () => any
  createServerClient: () => any
  createAdminClient: () => any
}
