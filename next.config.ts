import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/home/college',
        destination: '/college',
        permanent: true,
      },
      {
        source: '/home/store',
        destination: '/store',
        permanent: true,
      },
      {
        source: '/home/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'paerhoqoypdezkqhzimk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.moxfield.net',
        port: '',
        pathname: '/assets/images/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-select',
      '@radix-ui/react-navigation-menu',
      'lucide-react',
      '@tanstack/react-query',
    ],
  },
}

export default nextConfig
