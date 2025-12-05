import type React from 'react'
import { type ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface MeteorsProps {
  number?: number
  minDelay?: number
  maxDelay?: number
  minDuration?: number
  maxDuration?: number
  angle?: number
  className?: string
  icons?: ReactNode[]
}

export const Meteors = ({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
  icons,
}: MeteorsProps) => {
  const [meteorStyles, setMeteorStyles] = useState<Array<React.CSSProperties>>([])

  useEffect(() => {
    const styles = [...new Array(number)].map(() => ({
      '--angle': `${-angle}deg`,
      top: '-5%',
      left: `calc(0% + ${Math.floor(Math.random() * window.innerWidth)}px)`,
      animationDelay: `${Math.random() * (maxDelay - minDelay) + minDelay}s`,
      animationDuration: `${Math.floor(Math.random() * (maxDuration - minDuration) + minDuration)}s`,
    }))
    setMeteorStyles(styles)
  }, [number, minDelay, maxDelay, minDuration, maxDuration, angle])

  return (
    <>
      {[...meteorStyles].map((style, idx) => (
        <span
          key={idx}
          style={{ ...style } as React.CSSProperties}
          className={cn(
            'animate-meteor pointer-events-none absolute rotate-[var(--angle)]',
            className
          )}
        >
          {icons && icons.length > 0 ? (
            // Icon meteor
            <div className="relative flex items-center">
              {/* Counter-rotate the icon to keep it upright */}
              <div
                className="relative "
                style={{
                  width: '32px',
                  height: '32px',
                  transform: `rotate(calc(-1 * var(--angle)))`,
                  filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.5))',
                }}
              >
                {icons[idx % icons.length]}
              </div>
              {/* Trail */}
              <div
                className="pointer-events-none absolute top-1/2 -z-10 h-[2px] w-[60px] -translate-y-1/2 bg-gradient-to-r from-purple-500/70 via-purple-500/50 to-transparent"
                style={{ filter: 'blur(1px)', right: '100%' }}
              />
            </div>
          ) : (
            // Default meteor dot
            <>
              <div className="size-0.5 rounded-full bg-zinc-500 shadow-[0_0_0_1px_#ffffff10]" />
              <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-zinc-500 to-transparent" />
            </>
          )}
        </span>
      ))}
    </>
  )
}
