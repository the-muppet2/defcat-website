// app/page.tsx
import { LogIn, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { LightRaysClient } from '@/components/layout/LightRaysClient'

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

      {/* Logo background - optimized WebP with blur placeholder */}
      <Image
        src="/defcat_logo_optimized.webp"
        alt="DefCat Logo"
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        blurDataURL="data:image/webp;base64,UklGRowCAABXRUJQVlA4WAoAAAAQAAAAHwAAKwAAQUxQSFQBAAABkLNtm2k77/fNiW3bTmXbTps6P8BOeicVq1y7jG2jtO2ksjMz31vstfbs8pQRMQGovBTNUeecK4MT1NSMbK3QPHUQAMsf1oGA0GfetLEDagKAOoUIit30m/zWEgKH7fSMLwsL+0MAQNB189XjD834tVXGZAYjjb8uFzbvOXFy77k/JBk9vzSCAIJD9Bb9f2Ou+RCCRT6rVuQwh5EkLXjvQwjBWOy5EwpAoFcZmG7kSDgAUEwwK0sYAi2CYjdDWuT7DjmCVi8YU4ycDYccvZ7mWYBDXovPtJTAqyo5DvMZmWrGWXAZgnpPykDju57QrGo3GcrxIweK3s8ZU8y4AIpsQdMbjClcB0V+Vazh/9KM31qX5DCR0YfgfbDgi/msDqQECNbTjPnGT9OgSByxft+xjavv/T6wfNvWZTMbQpCoyKzZUZGpSHZO1TlAnaqrEJRbFJXNVlA4IBIBAADQBgCdASogACwAPzmKuFWvKSUjKqwB4CcJZADF1BO1+CtBQM+3iH2ZTMnx2/gOWfL33eHyxPnSkUipXTeaTAAA/vV2BcGC01b1Fr3bGUXHqQmWWu/58+FABs7L6R4c9zMd75hXUNnr2EqxMGnxRFD9DEIBMcq17oboLKPONWxJ0quJm2XWhMh8Wt4mIccO26FhFMcohHCWNVpYeG+mZUdrrcoTWzNKgM8YzajeAtAQ+4CNBsDN+IbpNNFAEyzOgu55+ekJw91wb8nINJuWJD4PEJ40o6bZgv40jrDZ36oWn4rQN+JxZCBjPhjGTD//JN/iM7BXMLGpUhuje2Zc429AAAKyLaAAIdVeH3kNYd79ISAA"
        className="object-contain object-[center_70%] pointer-events-none"
      />

      {/* Overlay gradient for better content visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/20 to-background pointer-events-none" />

      {/* Ocean Light Rays - reduced count for performance */}
      <LightRaysClient count={12} color="var(--mana-color)" />

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
              {/* Vault entry button */}
              <Link href="/decks">
                <Button
                  size="lg"
                  className="btn-tinted-primary shadow-tinted-glow text-lg px-8 py-6"
                >
                  <Sparkles className="mr-2" size={20} />
                  Enter the Vault
                </Button>
              </Link>
              
              {/* Login button */}
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
      </div>
    </div>
  )
}
