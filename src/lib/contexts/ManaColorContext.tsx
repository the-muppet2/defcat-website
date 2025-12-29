'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { ColorIdentity } from '@/types/colors'
import { createClient } from '@/lib/supabase/client'

// alias for the ManaSymbol enum
type ManaSymbol = (typeof ColorIdentity.Symbol)[keyof typeof ColorIdentity.Symbol]

interface ManaColorContextType {
  selectedMana: ManaSymbol
  setSelectedMana: (color: ManaSymbol) => void
}

const ManaColorContext = createContext<ManaColorContextType | undefined>(undefined)

export function ManaColorProvider({ children }: { children: ReactNode }) {
  const [selectedMana, setSelectedManaState] = useState<ManaSymbol>(ColorIdentity.Symbol.GREEN)

  useEffect(() => {
    const initManaColor = async () => {
      // Check for saved preference first
      const saved = localStorage.getItem('mana-color')
      if (saved && Object.values(ColorIdentity.Symbol).includes(saved as ManaSymbol)) {
        setSelectedManaState(saved as ManaSymbol)
        applyManaColor(saved as ManaSymbol)
        return
      }

      // Check if user is authenticated - if so, default to green (they can set preference)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Logged in user with no saved preference - use default green
        setSelectedManaState(ColorIdentity.Symbol.GREEN)
        applyManaColor(ColorIdentity.Symbol.GREEN)
        localStorage.setItem('mana-color', ColorIdentity.Symbol.GREEN)
      } else {
        // Non-authenticated visitor - randomize once per session
        const sessionColor = sessionStorage.getItem('mana-color-session')
        if (sessionColor && Object.values(ColorIdentity.Symbol).includes(sessionColor as ManaSymbol)) {
          setSelectedManaState(sessionColor as ManaSymbol)
          applyManaColor(sessionColor as ManaSymbol)
        } else {
          const symbols = Object.values(ColorIdentity.Symbol)
          const randomColor = symbols[Math.floor(Math.random() * symbols.length)] as ManaSymbol
          setSelectedManaState(randomColor)
          applyManaColor(randomColor)
          sessionStorage.setItem('mana-color-session', randomColor)
        }
      }
    }

    initManaColor()
  }, [])

  const setSelectedMana = (color: ManaSymbol) => {
    setSelectedManaState(color)
    localStorage.setItem('mana-color', color)
    applyManaColor(color)
  }

  return (
    <ManaColorContext.Provider value={{ selectedMana, setSelectedMana }}>
      {children}
    </ManaColorContext.Provider>
  )
}

export function useManaColor() {
  const context = useContext(ManaColorContext)
  if (context === undefined) {
    throw new Error('useManaColor must be used within a ManaColorProvider')
  }
  return context
}

// Map ManaSymbol enum values to CSS class names and RGB values
const manaDataMap: Record<ManaSymbol, { className: string; rgb: string }> = {
  [ColorIdentity.Symbol.WHITE]: { className: 'mana-white', rgb: '202, 138, 4' },
  [ColorIdentity.Symbol.BLUE]: { className: 'mana-blue', rgb: '30, 64, 175' },
  [ColorIdentity.Symbol.BLACK]: { className: 'mana-black', rgb: '109, 40, 217' },
  [ColorIdentity.Symbol.RED]: { className: 'mana-red', rgb: '185, 28, 28' },
  [ColorIdentity.Symbol.GREEN]: { className: 'mana-green', rgb: '21, 128, 61' },
}

// add mana color to CSS variables and apply class
function applyManaColor(mana: ManaSymbol) {
  const root = document.documentElement

  // Set the transition only once
  if (!root.style.transition) {
    root.style.transition = 'background-color 400ms ease-out, color 400ms ease-out'
  }

  const color = ColorIdentity.getColorValue(mana)
  const manaData = manaDataMap[mana]

  // Set CSS custom properties directly
  root.style.setProperty('--mana-color', color)
  root.style.setProperty('--manargb', manaData.rgb)

  // Remove all existing mana classes and add new one
  Object.values(manaDataMap).forEach(data => {
    root.classList.remove(data.className)
  })
  root.classList.add(manaData.className)

  // Set data attribute for CSS targeting
  root.setAttribute('data-mana', mana)
}
