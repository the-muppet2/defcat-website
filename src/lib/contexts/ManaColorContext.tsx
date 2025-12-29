'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { ColorIdentity } from '@/types/colors'

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
    //const saved = localStorage.getItem('mana-color')
    //if (saved && Object.values(ColorIdentity.Symbol).includes(saved as ManaSymbol)) {
    //  setSelectedManaState(saved as ManaSymbol)
    //  applyManaColor(saved as ManaSymbol)
    //} else {
      const symbols = Object.values(ColorIdentity.Symbol)
      const randomColor = symbols[Math.floor(Math.random() * symbols.length)] as ManaSymbol
      setSelectedManaState(randomColor)
      applyManaColor(randomColor)
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

// add mana color to CSS variables
function applyManaColor(mana: ManaSymbol) {
  const root = document.documentElement

  // Set the transition only once
  if (!root.style.transition) {
    root.style.transition = 'background-color 400ms ease-out, color 400ms ease-out'
  }

  const color = ColorIdentity.getColorValue(mana)
  root.style.setProperty('--mana-color', color)

  // Set data attribute for CSS targeting
  root.setAttribute('data-mana', mana)
}
