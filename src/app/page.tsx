// app/page.tsx
/** biome-ignore-all lint/performance/noImgElement: <explanation> */
'use client'

import { LogIn, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { LightRays } from '@/components/layout/LightRays'
import { Button } from '@/components/ui/button'

export default function LandingPage() {

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Ocean gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(farthest-corner at 50% 0%, var(--bg-tinted) 0%, var(--background) 100%)',
        }}
      />

      {/* Logo background - LCP optimized */}
      <img
        src="/defcat_logo.png"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-contain object-[center_70%] pointer-events-none "
        style={{
          objectFit: 'contain',
        }}
      />

      {/* Overlay gradient for better content visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/20 to-background pointer-events-none" />

      {/* Ocean Light Rays - GPU accelerated */}
      <LightRays count={32} color="var(--mana-color)" />

      <div className="relative" style={{ zIndex: 10 }}>
        <section className="min-h-screen flex flex-col px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center pt-24">
              <h1
                className="text-5xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--gradient-start), var(--gradient-end))`,
                }}
              >
                DefCat's DeckVault
              </h1>
              <p className="text-xl text-muted-foreground">
                Carefully Curated Cache of Commander Creations 
              </p>
            </div>

            {/* Spacer to push buttons below logo - logo is at ~35-65% of viewport */}
            <div className="flex-1 min-h-[65vh]"></div>

            {/* Enter/Login Buttons - positioned below logo */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pb-24">
              <Link href="/pivot/home">
                <Button
                  size="lg"
                  className="btn-tinted-primary shadow-tinted-glow text-lg px-8 py-6"
                >
                  <Sparkles className="mr-2" size={20} />
                  Enter the Vault
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="btn-tinted-outline shadow-tinted-glow text-lg px-8 py-6"
                >
                  <LogIn className="mr-2" size={20} />
                  Login with Patreon
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <style jsx global>{`
        @keyframes jumbo-animate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .jumbo-background {
          background: linear-gradient(
            -45deg,
            var(--gradient-color-1),
            var(--gradient-color-2),
            var(--gradient-color-3),
            var(--gradient-color-4),
            var(--gradient-color-1)
          );
          background-size: 400% 400%;
          filter: blur(60px) saturate(150%);
          animation: jumbo-animate 20s ease infinite;
          transition: all 0.8s ease-in-out;
        }

        .dark .jumbo-background {
          filter: blur(80px) saturate(200%) brightness(0.8);
        }
      `}</style>
      </div>
    </div>
  )
}
