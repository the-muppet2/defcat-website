/**
 * Supabase Client for Client Components
 * Use this in client-side React components
 */

import { createBrowserClient } from '@supabase/ssr'
import type { db } from '@/types/supabase'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error(
      'Missing Supabase env vars:',
      !url ? 'NEXT_PUBLIC_SUPABASE_URL' : '',
      !key ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''
    )
  }

  return createBrowserClient<db>(url!, key!)
}
