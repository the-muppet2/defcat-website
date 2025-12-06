'use client'

import { ExternalLink, Loader2, ShoppingBag, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  description: string
  link: string
}

export default function DiscountStorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, key, name, description, link, image_url, is_active')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (error) {
          console.error('Failed to load products:', error)
          return
        }

        const productItems: Product[] = (data || []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          link: item.link,
        }))

        setProducts(productItems)
      } catch (err) {
        console.error('Error loading products:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [supabase.from])

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
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <ShoppingBag className="h-12 w-12" style={{ color: 'var(--mana-color)' }} />
                <h1
                  className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--gradient-start), var(--gradient-end))`,
                  }}
                >
                  DefCat's Discount Store
                </h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Exclusive discounts on gaming gear and accessories
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Products Grid - 4 per row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className="glass border-white/10 bg-card-tinted flex flex-col"
                    >
                      <CardHeader>
                        <div className="aspect-square bg-muted/30 rounded-lg mb-4 flex items-center justify-center">
                          <Tag className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <p className="text-sm text-muted-foreground mb-4 flex-1">
                          {product.description}
                        </p>

                        <Button asChild className="w-full btn-tinted-primary">
                          <a href={product.link} target="_blank" rel="noopener noreferrer">
                            View Deal
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {products.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No products available yet.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
