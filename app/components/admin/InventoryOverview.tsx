'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Component = {
  id: string
  name: string
  type: string
  quantity_in_stock: number
  price_per_unit: number
  location: string
  notes: string
}

export default function InventoryOverview() {
  const supabase = createClient()
  const [components, setComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchComponents() {
    const { data } = await supabase
      .from('components')
      .select('*')
      .order('type', { ascending: true })
    setComponents(data ?? [])
    setLoading(false)
  }

  async function updateStock(id: string, newQty: number) {
    await supabase
      .from('components')
      .update({ quantity_in_stock: newQty, updated_at: new Date().toISOString() })
      .eq('id', id)
    fetchComponents()
  }

  useEffect(() => { fetchComponents() }, [])

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Inventory</h2>
      {loading && <p className="text-gray-400 text-sm">Loading inventory...</p>}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 text-left text-gray-600">
            <th className="py-3 px-3">Name</th>
            <th className="py-3 px-3">Type</th>
            <th className="py-3 px-3">Location</th>
            <th className="py-3 px-3">Price</th>
            <th className="py-3 px-3">Stock</th>
          </tr>
        </thead>
        <tbody>
          {components.map(c => (
            <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-3 font-medium">{c.name}</td>
              <td className="py-3 px-3 text-gray-500">{c.type}</td>
              <td className="py-3 px-3 text-gray-500">{c.location}</td>
              <td className="py-3 px-3">${c.price_per_unit.toFixed(2)}</td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateStock(c.id, Math.max(0, c.quantity_in_stock - 1))}
                    className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100 cursor-pointer text-lg leading-none transition-colors"
                  >
                    −
                  </button>
                  <span className={`min-w-8 text-center font-semibold ${
                    c.quantity_in_stock === 0
                      ? 'text-red-500'
                      : c.quantity_in_stock < 5
                      ? 'text-amber-500'
                      : 'text-gray-900'
                  }`}>
                    {c.quantity_in_stock}
                  </span>
                  <button
                    onClick={() => updateStock(c.id, c.quantity_in_stock + 1)}
                    className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100 cursor-pointer text-lg leading-none transition-colors"
                  >
                    +
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}