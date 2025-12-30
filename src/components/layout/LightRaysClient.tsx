'use client'

import dynamic from 'next/dynamic'

const LightRays = dynamic(
  () => import('@/components/layout/LightRays').then(mod => ({ default: mod.LightRays })),
  { ssr: false }
)

interface LightRaysClientProps {
  count?: number
  color?: string
}

export function LightRaysClient({ count = 12, color = 'var(--mana-color)' }: LightRaysClientProps) {
  return <LightRays count={count} color={color} />
}
