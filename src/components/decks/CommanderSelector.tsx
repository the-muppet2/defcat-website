'use client'

import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface Commander {
  name: string
  scryfall_id: string
}

interface CommanderSelectorProps {
  value: Commander[]
  onChange: (commanders: Commander[]) => void
  maxCommanders?: number
}

/**
 * Autocomplete|dropdown commander search and select component 
 * @param param0 
 * @returns 
 */
export function CommanderSelector({ value, onChange, maxCommanders = 2 }: CommanderSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Commander[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(
            `${searchQuery}`
          )}`
        )

        if (response.ok) {
          const data = await response.json()
          setSearchResults(
            data.data.slice(0, 50).map((card: any) => ({
              name: card.name,
              scryfall_id: card.id,
            }))
          )
        } else {
          setSearchResults([])
        }
      } catch (error) {
        console.error('Error searching commanders:', error)
        setSearchResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const addCommander = (commander: Commander) => {
    if (value.length >= maxCommanders) {
      alert(`Maximum ${maxCommanders} commanders allowed`)
      return
    }
    if (value.some((c) => c.scryfall_id === commander.scryfall_id)) {
      return
    }
    onChange([...value, commander])
    setSearchQuery('')
    setOpen(false)
  }

  const removeCommander = (scryfall_id: string) => {
    onChange(value.filter((c) => c.scryfall_id !== scryfall_id))
  }

  return (
    <div className="space-y-2">
      {/* Selected Commanders */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((commander) => (
            <Badge key={commander.scryfall_id} variant="secondary" className="gap-1">
              {commander.name}
              <button
                type="button"
                onClick={() => removeCommander(commander.scryfall_id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add Commander Combobox */}
      {value.length < maxCommanders && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {value.length === 0
                ? 'Select commander...'
                : `Add ${value.length === 1 ? 'partner' : 'another'} commander...`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search legendary creatures..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {loading ? (
                  <CommandEmpty>Searching...</CommandEmpty>
                ) : searchQuery.length < 2 ? (
                  <CommandEmpty>Type at least 2 characters to search</CommandEmpty>
                ) : searchResults.length === 0 ? (
                  <CommandEmpty>No legendary creatures found</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {searchResults.map((commander, index) => (
                      <CommandItem
                        key={commander.scryfall_id || `commander-${index}`}
                        value={commander.name}
                        onSelect={() => addCommander(commander)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            value.some((c) => c.scryfall_id === commander.scryfall_id)
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                        {commander.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}