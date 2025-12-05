// components/admin/TierBenefitsMatrix.tsx
'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function TierBenefitsMatrix() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [_saving, _setSaving] = useState(false)
  const [matrix, setMatrix] = useState<any>({})
  const [creditTypes, setCreditTypes] = useState<any[]>([])
  const [tiers, setTiers] = useState<any[]>([])

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    try {
      // Load credit types
      const { data: credits } = await supabase
        .from('credit_types')
        .select('*')
        .eq('is_active', true)
        .order('id')

      // Load tiers
      const { data: tierData } = await supabase
        .from('tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      // Load current benefits
      const { data: benefits } = await supabase
        .from('tier_benefits')
        .select('*')

      setCreditTypes(credits || [])
      setTiers(tierData || [])

      // Build matrix
      const newMatrix: any = {}
      tierData?.forEach(tier => {
        newMatrix[tier.id] = {}
        credits?.forEach(credit => {
          const benefit = benefits?.find(
            b => b.tier_id === tier.id && b.credit_type_id === credit.id
          )
          newMatrix[tier.id][credit.id] = benefit?.amount || 0
        })
      })
      setMatrix(newMatrix)
    } catch (error) {
      toast.error('Error loading data', {
        description: 'Failed to load credit configuration',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(tierId: string, creditId: string, value: string) {
    const amount = parseInt(value) || 0
    
    // Update local state optimistically
    setMatrix((prev: any) => ({
      ...prev,
      [tierId]: {
        ...prev[tierId],
        [creditId]: amount
      }
    }))

    // Debounced save would go here
    await saveValue(tierId, creditId, amount)
  }

  async function saveValue(tierId: string, creditId: string, amount: number) {
    try {
      const { error } = await supabase.rpc('set_tier_benefit', {
        p_tier_id: tierId,
        p_credit_type_id: creditId,
        p_amount: amount
      })

      if (error) throw error

      toast.success('Updated', {
        description: `Set ${creditId} for ${tierId} to ${amount}`,
      })
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to update benefit',
      })
    }
  }

  if (loading) {
    return (
      <Card className="card-tinted-glass">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-tinted-glass">
      <CardHeader>
        <CardTitle>Tier Benefits Matrix</CardTitle>
        <CardDescription>
          Configure how many credits each tier receives monthly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tinted">
                <th className="text-left p-2">Tier</th>
                {creditTypes.map(credit => (
                  <th key={credit.id} className="text-center p-2 min-w-[120px]">
                    {credit.display_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiers.map(tier => (
                <tr key={tier.id} className="border-b border-tinted hover:bg-tinted">
                  <td className="p-2 font-medium">{tier.display_name}</td>
                  {creditTypes.map(credit => (
                    <td key={credit.id} className="p-2 text-center">
                      <Input
                        type="number"
                        min="0"
                        value={matrix[tier.id]?.[credit.id] || 0}
                        onChange={(e) => handleUpdate(tier.id, credit.id, e.target.value)}
                        className="w-20 mx-auto input-tinted text-center"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

