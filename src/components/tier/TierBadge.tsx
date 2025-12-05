'use client'


import { GiWizardStaff, GiMountedKnight, GiBeard, GiFarmer, GiMustache, GiPublicSpeaker, GiSunPriest, GiVoodooDoll, GiBatMask, GiWizardFace } from "react-icons/gi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'


import type { PatreonTier } from '@/types/core'
import type { IconType } from 'react-icons'
import { useAuth } from '@/lib/auth/client'

interface TierBadgeProps {
  tier: PatreonTier
  showIcon?: boolean
  showTooltip?: boolean
  className?: string
}

// Available icons pool
export const AVAILABLE_ICONS: Record<string, IconType> = {
  farmer: GiFarmer,
  knight: GiMountedKnight,
  speaker: GiPublicSpeaker,
  mustache: GiMustache,
  wizardFace: GiWizardFace,
  sunPriest: GiSunPriest,
  wizardStaff: GiWizardStaff,
  beard: GiBeard,
  voodooDoll: GiVoodooDoll,
  batMask: GiBatMask,
}

const TIER_CONFIG: Record<PatreonTier, {
  label: string
  defaultIcon: string
  gradient: string
  textColor: string
  glowColor: string
  borderGradient: string
}> = {
  Citizen: {
    label: 'Citizen',
    defaultIcon: 'farmer',
    gradient: 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600',
    textColor: 'text-white',
    glowColor: 'shadow-slate-500/50',
    borderGradient: 'border-slate-400/50',
  },
  Knight: {
    label: 'Knight',
    defaultIcon: 'knight',
    gradient: 'bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-700',
    textColor: 'text-white',
    glowColor: 'shadow-blue-500/60',
    borderGradient: 'border-blue-400/50',
  },
  Emissary: {
    label: 'Emissary',
    defaultIcon: 'speaker',
    gradient: 'bg-gradient-to-br from-purple-400 via-purple-600 to-fuchsia-700',
    textColor: 'text-white',
    glowColor: 'shadow-purple-500/60',
    borderGradient: 'border-purple-400/50',
  },
  Duke: {
    label: 'Duke',
    defaultIcon: 'mustache',
    gradient: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-600',
    textColor: 'text-white',
    glowColor: 'shadow-amber-500/70',
    borderGradient: 'border-amber-400/50',
  },
  Wizard: {
    label: 'Wizard',
    defaultIcon: 'wizardFace',
    gradient: 'bg-gradient-to-br from-violet-400 via-purple-600 to-indigo-800',
    textColor: 'text-white',
    glowColor: 'shadow-violet-500/80',
    borderGradient: 'border-violet-400/60',
  },
  ArchMage: {
    label: 'ArchMage',
    defaultIcon: 'sunPriest',
    gradient: 'bg-gradient-to-br from-rose-400 via-pink-600 to-purple-800',
    textColor: 'text-white',
    glowColor: 'shadow-rose-500/90',
    borderGradient: 'border-rose-400/70',
  },
}


export function TierBadge({
  tier,
  showIcon = true,
  className = '',
}: TierBadgeProps) {
  const { isDeveloper } = useAuth()
  const config = TIER_CONFIG[tier]
  const Icon = AVAILABLE_ICONS[config.defaultIcon]

  const badgeContent = (
    <div
      className={`
        ${config.gradient}
        ${config.textColor}
        ${config.borderGradient}
        ${config.glowColor}
        inline-flex flex-col items-center justify-center gap-1
        px-4 py-3
        rounded-xl
        font-bold tracking-wide
        shadow-lg
        border-2
        transition-all duration-300
        hover:scale-110 hover:shadow-2xl
        hover:brightness-110
        relative
        overflow-hidden
        before:absolute before:inset-0
        before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
        before:-translate-x-full
        hover:before:translate-x-full
        before:transition-transform before:duration-700
        ${isDeveloper ? 'cursor-pointer' : ''}
        ${className}
      `}
      >
      {showIcon && <Icon className="h-6 w-6 drop-shadow" />}
      <span>{config.label}</span>
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <div className="space-y-1">
            <p className="font-bold text-white">{config.label} Tier</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function TierBadgeCompact({ tier }: { tier: PatreonTier }) {
  const config = TIER_CONFIG[tier]
  const iconKey = tier || config.defaultIcon
  const Icon = AVAILABLE_ICONS[iconKey]

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
      ${config.gradient} 
      ${config.textColor}
      text-sm font-bold
      shadow-md
      border ${config.borderGradient}
    `}>
      <Icon className="h-3.5 w-3.5 drop-shadow" />
      {config.label}
    </span>
  )
}

export function getTierConfig(tier: PatreonTier) {
  return TIER_CONFIG[tier]
}

export function getAllTiers(): PatreonTier[] {
  return ['Citizen', 'Knight', 'Emissary', 'Duke', 'Wizard', 'ArchMage']
}