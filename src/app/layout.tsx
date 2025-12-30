import '@/styles'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Footer } from '@/components/layout/Footer'
import { HeaderWrapper } from '@/components/layout/HeaderWrapper'
import { Providers } from '../lib/contexts/Providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "DefCat's DeckVault",
  description: 'Browse and manage premium cEDH decklists with tier-based access',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/mana-font@latest/css/mana.css"
          as="style"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/mana-font@latest/css/mana.css"
          rel="stylesheet"
          type="text/css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col relative overflow-x-hidden`}
      >
        <Providers>
          <div className="border-b border-white/10">
            <HeaderWrapper />
          </div>
          <main className="flex-1 relative">{children}</main>
          <div className="border-t border-white/10 mt-2">
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
