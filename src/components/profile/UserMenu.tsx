/** biome-ignore-all lint/complexity/noUselessFragments: <explanation> */
'use client'

import { LogoutButton } from '@/components/auth/logout-button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '../../types/core'

interface UserMenuProps {
  user: User
}

/**
 * User Menu Component
 * Displays user info and logout option
 */
export function UserMenu({ user }: UserMenuProps) {
  const initials = user.email.split('@')[0].slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="relative h-8 w-8 rounded-full">  
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        {(user.role === 'admin' || user.role === 'moderator' || user.role === 'developer') && (
          <>
            <DropdownMenuItem asChild>
              <a href="/admin">Admin Dashboard</a>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <a href="/profile">Profile Settings</a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
