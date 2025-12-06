import { ExternalLink, FileText, GraduationCap, Home, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PreviewPage() {
  const pages = [
    {
      title: 'Example Home Page',
      description: 'Complete redesigned home page with all new components integrated',
      href: '/example-home',
      icon: <Home className="h-8 w-8" />,
    },
    {
      title: 'Commander College',
      description: 'Educational page with sales video and lesson plan',
      href: '/commander-college',
      icon: <GraduationCap className="h-8 w-8" />,
    },
    {
      title: 'Discount Store',
      description: 'Product listing with category filters and 4-per-row grid',
      href: '/discount-store',
      icon: <ShoppingBag className="h-8 w-8" />,
    },
  ]

  const components = [
    {
      name: 'NavigationHeader',
      path: 'src/components/layout/NavigationHeader.tsx',
    },
    {
      name: 'TutorialModal',
      path: 'src/components/tutorial/TutorialModal.tsx',
    },
    { name: 'FeaturedVideo', path: 'src/components/home/FeaturedVideo.tsx' },
    {
      name: 'SocialMediaLinks',
      path: 'src/components/home/SocialMediaLinks.tsx',
    },
    { name: 'RotatingAds', path: 'src/components/home/RotatingAds.tsx' },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(farthest-corner at 50% 0%, var(--bg-tinted) 0%, var(--background) 100%)',
        }}
      />

      <div className="relative">
        <section className="pt-24 pb-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1
                className="text-5xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--gradient-start), var(--gradient-end))`,
                }}
              >
                Front Page Redesign Preview
              </h1>
              <p className="text-xl text-muted-foreground">
                Preview all the new pages and components
              </p>
            </div>

            {/* Pages */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6">New Pages</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pages.map((page) => (
                  <Card key={page.href} className="glass border-white/10 bg-card-tinted">
                    <CardHeader>
                      <div className="mb-4" style={{ color: 'var(--mana-color)' }}>
                        {page.icon}
                      </div>
                      <CardTitle>{page.title}</CardTitle>
                      <CardDescription>{page.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full btn-tinted-primary">
                        <Link href={page.href}>
                          View Page
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Components */}
            <div>
              <h2 className="text-3xl font-bold mb-6">New Components</h2>
              <Card className="glass border-white/10 bg-card-tinted">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Created Components
                  </CardTitle>
                  <CardDescription>Ready-to-use components for your pages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {components.map((component) => (
                      <div
                        key={component.name}
                        className="flex items-center justify-between p-3 rounded-lg hover-tinted glass border border-white/10"
                      >
                        <div>
                          <div className="font-medium">{component.name}</div>
                          <div className="text-sm text-muted-foreground">{component.path}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Instructions */}
            <div className="mt-12">
              <Card className="glass border-white/10 bg-card-tinted">
                <CardHeader>
                  <CardTitle>How to Use</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">1. Update Navigation</h4>
                    <p>
                      Import and use NavigationHeader in your layout for the new navigation menu
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">2. Add Components</h4>
                    <p>Import components from @/components/home/* to add featured sections</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">3. Customize Content</h4>
                    <p>Update video IDs, social links, and product data to match your content</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">4. Style Integration</h4>
                    <p>
                      All components use your existing design system (glass effects, tinted styles,
                      mana colors)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
