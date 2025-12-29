/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ColorIdentity } from '@/types/colors'
import { createManaMask } from '../utility/mana'

const isBrowser = typeof window !== 'undefined'

// Inject base CSS for view transitions
const injectBaseStyles = () => {
  if (isBrowser) {
    const styleId = 'theme-switch-base-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      const isHighResolution = window.innerWidth >= 3000 || window.innerHeight >= 2000

      style.textContent = `
        ::view-transition-old(root),
        ::view-transition-new(root) {
          mix-blend-mode: normal;
          ${isHighResolution ? 'transform: translateZ(0);' : ''}
        }
        
        ${
          isHighResolution
            ? `
        ::view-transition-group(root),
        ::view-transition-image-pair(root),
        ::view-transition-old(root),
        ::view-transition-new(root) {
          backface-visibility: hidden;
          perspective: 1000px;
          transform: translate3d(0, 0, 0);
        }
        `
            : ''
        }
      `
      document.head.appendChild(style)
    }
  }
}

export enum ThemeAnimationType {
  CIRCLE = 'circle',
  BLUR_CIRCLE = 'blur-circle',
  QR_SCAN = 'qr-scan',
  MANA = 'mana',
}

interface ReactThemeSwitchAnimationHook {
  ref: React.RefObject<HTMLButtonElement | null>
  toggleSwitchTheme: () => Promise<void>
  isDarkMode: boolean
}

type ManaSymbol = (typeof ColorIdentity.Symbol)[keyof typeof ColorIdentity.Symbol]

export interface ReactThemeSwitchAnimationProps {
  duration?: number
  easing?: string
  pseudoElement?: string
  globalClassName?: string
  animationType?: ThemeAnimationType
  blurAmount?: number
  styleId?: string
  isDarkMode?: boolean
  manaSymbol?: ManaSymbol
  onDarkModeChange?: (isDark: boolean) => void
}

export const useModeAnimation = (
  props?: ReactThemeSwitchAnimationProps
): ReactThemeSwitchAnimationHook => {
  const {
    duration: propsDuration = 750,
    easing = 'ease-out-quart',
    pseudoElement = '::view-transition-new(root)',
    globalClassName = 'dark',
    animationType = ThemeAnimationType.MANA,
    blurAmount = 4,
    styleId = 'theme-switch-style',
    manaSymbol = ColorIdentity.letterToSymbol('c'),
    isDarkMode: externalDarkMode,
    onDarkModeChange,
  } = props || {}

  const isHighResolution =
    typeof window !== 'undefined' && (window.innerWidth >= 3000 || window.innerHeight >= 2000)

  const duration = isHighResolution ? Math.max(propsDuration) : propsDuration

  useEffect(() => {
    injectBaseStyles()
  }, [])

  const [internalDarkMode, setInternalDarkMode] = useState(
    isBrowser ? localStorage.getItem('theme') === 'dark' : false
  )

  const isDarkMode = externalDarkMode ?? internalDarkMode

  const setIsDarkMode = (value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(isDarkMode) : value
    if (onDarkModeChange) {
      onDarkModeChange(newValue)
    } else {
      setInternalDarkMode(newValue)
    }
  }

  const ref = useRef<HTMLButtonElement>(null)

  const createBlurCircleMask = (blur: number) => {
    const isHighResolution =
      typeof window !== 'undefined' && (window.innerWidth >= 3000 || window.innerHeight >= 2000)

    const blurFilter = isHighResolution
      ? `<filter id="blur"><feGaussianBlur stdDeviation="${blur}" /></filter>`
      : ``

    const circleRadius = isHighResolution ? 20 : 4000

    return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100"><defs>${blurFilter}</defs><circle cx="0" cy="0" r="${circleRadius}" fill="white" filter="url(%23blur)"/></svg>')`
  }

  const createManaSVGMask = (blur: number, color: ManaSymbol) => {
    return createManaMask(color, blur)
  }

  const toggleSwitchTheme = async () => {
    if (
      !ref.current ||
      !(document as any).startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsDarkMode((isDarkMode) => !isDarkMode)
      return
    }

    const existingStyle = document.getElementById(styleId)
    if (existingStyle) {
      existingStyle.remove()
    }


    const x = window.innerWidth / 2
    const y = window.innerHeight / 2

    const topLeft = Math.hypot(x, y)
    const topRight = Math.hypot(window.innerWidth - x, y)
    const bottomLeft = Math.hypot(x, window.innerHeight - y)
    const bottomRight = Math.hypot(window.innerWidth - x, window.innerHeight - y)

    const maxRadius = Math.max(topLeft, topRight, bottomLeft, bottomRight)
    const viewportSize = Math.max(window.innerWidth, window.innerHeight)
    const isHighResolution = window.innerWidth >= 3000 || window.innerHeight >= 2000
    const scaleFactor = isHighResolution ? 2 :2
    const optimalMaskSize = isHighResolution
      ? Math.min(viewportSize * scaleFactor, 500)
      : viewportSize * scaleFactor

    if (
      animationType === ThemeAnimationType.BLUR_CIRCLE ||
      animationType === ThemeAnimationType.MANA
    ) {
      const styleElement = document.createElement('style')
      styleElement.id = styleId

      const blurFactor = isHighResolution ? 1.5 : 1.0
      
      // Keep the 2.5x multiplier - it was good for pacing
      const finalMaskSize = Math.max(optimalMaskSize, maxRadius * 2.5)

      const maskFunction =
        animationType === ThemeAnimationType.MANA
          ? createManaSVGMask(blurAmount * blurFactor, manaSymbol)
          : createBlurCircleMask(blurAmount * blurFactor)

      styleElement.textContent = `
      ::view-transition-group(root) {
        animation-duration: ${duration}ms;
      }
      
      /* 
         SPEC FIX 1: 'isolation: auto' 
         See "Example 5" in the spec.
         This prevents the browser from grouping the old/new views for 
         blending, which eliminates weird compounding brightness artifacts.
      */
      ::view-transition-image-pair(root) {
        isolation: auto;
      }

      /* 
         SPEC FIX 2: 'mix-blend-mode: normal'
         The spec "User Agent Stylesheet" section shows that the default 
         is 'plus-lighter'. We must override this to 'normal' to stop the flash.
      */
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
        display: block;
      }

      /* THE OLD VIEW - Static Background */
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        z-index: 1;
      }

      /* THE NEW VIEW - Expanding Mask */
      ::view-transition-new(root) {
        mask-image: ${maskFunction};
        mask-repeat: no-repeat;
        mask-position: ${x}px ${y}px;
        mask-size: 0px;
        
        /* 'ease-in' matches Spec Example 5 recommendation for reveals */
        animation: maskScale ${duration}ms ease-in;
        
        z-index: 2;
        transform-origin: ${x}px ${y}px;
        will-change: mask-size, mask-position;
      }

      @keyframes maskScale {
          0% {
            mask-size: 0px;
            mask-position: ${x}px ${y}px;
          }
          100% {
            mask-size: ${finalMaskSize}px;
            mask-position: ${x - finalMaskSize / 2}px ${y - finalMaskSize / 2}px;
          }
      }
      `
      document.head.appendChild(styleElement)
    }


    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        setIsDarkMode((isDarkMode) => !isDarkMode)
      })
    })

    if (
      animationType === ThemeAnimationType.CIRCLE ||
      animationType === ThemeAnimationType.QR_SCAN
    ) {
      await transition.ready

      if (animationType === ThemeAnimationType.CIRCLE) {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`],
          },
          {
            duration,
            easing,
            pseudoElement,
          }
        )
      }

      if (animationType === ThemeAnimationType.QR_SCAN) {
        const scanLineWidth = isHighResolution ? 8 : 4
        document.documentElement.animate(
          {
            clipPath: [
              `polygon(0% 0%, ${scanLineWidth}px 0%, ${scanLineWidth}px 100%, 0% 100%)`,
              `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`,
            ],
          },
          {
            duration,
            easing,
            pseudoElement,
          }
        )
      }
    }

    if (
      animationType === ThemeAnimationType.BLUR_CIRCLE ||
      animationType === ThemeAnimationType.MANA
    ) {
      transition.finished
        .then(() => {
          // Small delay to ensure transition is fully complete
          setTimeout(() => {
            const styleElement = document.getElementById(styleId)
            if (styleElement) {
              styleElement.remove()
            }
          }, 50)
        })
        .catch(() => {
          setTimeout(() => {
            const styleElement = document.getElementById(styleId)
            if (styleElement) {
              styleElement.remove()
            }
          }, duration)
        })
    }
  }

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add(globalClassName)
      localStorage.theme = 'dark'
    } else {
      document.documentElement.classList.remove(globalClassName)
      localStorage.theme = 'light'
    }
  }, [isDarkMode, globalClassName])

  return {
    ref,
    toggleSwitchTheme,
    isDarkMode,
  }
}
