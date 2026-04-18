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

type CartItem = {
  component: Component
  quantity: number
}

type Props = {
  budget_remaining: number
  cart: CartItem[]
  onAdd: (component: Component) => void
  onRemove: (componentId: string) => void
}

export default function ComponentCatalog({ budget_remaining, cart, onAdd, onRemove }: Props) {
  const supabase = createClient()
  const [components, setComponents] = useState<Component[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('components')
        .select('*')
        .gt('quantity_in_stock', 0)
        .order('type')
      setComponents(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  const types = ['all', ...Array.from(new Set(components.map(c => c.type).filter(Boolean)))]

  const filtered = components.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || c.type === filterType
    return matchesSearch && matchesType
  })

  function cartQty(componentId: string) {
    return cart.find(i => i.component.id === componentId)?.quantity ?? 0
  }

  function cartCost(component: Component) {
    return cartQty(component.id) * component.price_per_unit
  }

  function canAfford(component: Component) {
    return budget_remaining >= component.price_per_unit
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Search + filter bar */}
<div className="flex flex-col sm:flex-row gap-3 mb-6">
  <input
    type="text"
    placeholder="Search components..."
    value={search}
    onChange={e => setSearch(e.target.value)}
    className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
  />
  <div className="flex gap-2 flex-wrap">
    {types.map(t => (
      <button
        key={t}
        onClick={() => setFilterType(t)}
        className={`px-3 py-2 rounded-md text-sm border capitalize cursor-pointer transition-colors ${
          filterType === t
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        {t}
      </button>
    ))}
  </div>
</div>
      {loading && <p className="text-gray-400 text-sm">Loading components...</p>}
      
    {/* Component grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => {
          const qty = cartQty(c.id)
          const affordable = canAfford(c)

          return (
            <div
              key={c.id}
              className={`bg-white border rounded-lg p-4 flex flex-col gap-2 transition-opacity ${
                !affordable && qty === 0 ? 'opacity-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">{c.name}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c.type}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>${c.price_per_unit.toFixed(2)} each</span>
                <span>{c.quantity_in_stock} in stock</span>
              </div>

              {c.notes && (
                <p className="text-xs text-gray-400">{c.notes}</p>
              )}

              {/* Quantity controls */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                {qty === 0 ? (
                  <button
                    onClick={() => onAdd(c)}
                    disabled={!affordable}
                    className="w-full py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    {affordable ? 'Add to order' : 'Over budget'}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 w-full justify-between">
                    <button
                      onClick={() => onRemove(c.id)}
                      className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors text-lg leading-none"
                    >
                      −
                    </button>
                    <div className="text-center">
                      <span className="font-semibold">{qty}</span>
                      <span className="text-xs text-gray-400 ml-1">(${cartCost(c).toFixed(2)})</span>
                    </div>
                    <button
                      onClick={() => onAdd(c)}
                      disabled={!affordable || qty >= c.quantity_in_stock}
                      className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <p className="text-gray-400 text-center py-12">No components match your search</p>
      )}
    </div>
  )
}