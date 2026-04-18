'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type InventoryItem = {
  id: string
  name: string
  price: number
  quantity: number
  source: string
}

type OrderItem = {
  id: string
  quantity_requested: number
  removed: boolean
  components: {
    name: string
    price_per_unit: number
  } | null
}

type Props = {
  teamId: string
  onBudgetChange: () => void
}

export default function TeamInventoryPanel({ teamId, onBudgetChange }: Props) {
  const supabase = createClient()
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [manualItems, setManualItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function fetchData() {
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        order_items (
          id,
          quantity_requested,
          removed,
          components ( name, price_per_unit )
        )
      `)
      .eq('team_id', teamId)
      .eq('status', 'approved')

    const items = orders?.flatMap(o => o.order_items as unknown as OrderItem[]) ?? []
    setOrderItems(items)

    const { data: manual } = await supabase
      .from('team_inventory')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at')

    setManualItems(manual ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [teamId])

  async function handleAdd() {
    if (!newName.trim() || !newPrice.trim()) {
      setError('Name and price are required.')
      return
    }
    setAdding(true)
    setError('')

    const price = parseFloat(newPrice)
    const quantity = parseInt(newQty)

    const { error: insertError } = await supabase.from('team_inventory').insert({
      team_id: teamId,
      name: newName.trim(),
      price,
      quantity,
      source: 'manual',
    })

    if (!insertError) {
      await supabase.rpc('deduct_team_budget', {
        p_team_id: teamId,
        p_amount: price * quantity,
      })
      setNewName('')
      setNewPrice('')
      setNewQty('1')
      fetchData()
      onBudgetChange()
    } else {
      setError(insertError.message)
    }
    setAdding(false)
  }

  async function handleRemoveManual(item: InventoryItem) {
    await supabase.from('team_inventory').delete().eq('id', item.id)
    // Refund budget
    await supabase.rpc('deduct_team_budget', {
      p_team_id: teamId,
      p_amount: -(item.price * item.quantity),
    })
    fetchData()
    onBudgetChange()
  }

  async function handleRemoveOrderItem(item: OrderItem) {
    const price = (item.components?.price_per_unit ?? 0) * item.quantity_requested
    // Soft delete the order item
    await supabase
      .from('order_items')
      .update({ removed: true })
      .eq('id', item.id)
    // Refund budget
    await supabase.rpc('deduct_team_budget', {
      p_team_id: teamId,
      p_amount: -price,
    })
    // Also restore stock
    if (item.components) {
      await supabase.rpc('restore_component_stock', {
        p_order_item_id: item.id,
      })
    }
    fetchData()
    onBudgetChange()
  }

  async function handleRestoreOrderItem(item: OrderItem) {
    const price = (item.components?.price_per_unit ?? 0) * item.quantity_requested
    await supabase
      .from('order_items')
      .update({ removed: false })
      .eq('id', item.id)
    // Re-deduct budget
    await supabase.rpc('deduct_team_budget', {
      p_team_id: teamId,
      p_amount: price,
    })
    fetchData()
    onBudgetChange()
  }

  const activeOrderItems = orderItems.filter(i => !i.removed)
  const removedOrderItems = orderItems.filter(i => i.removed)

  const orderTotal = activeOrderItems.reduce(
    (sum, item) => sum + item.quantity_requested * (item.components?.price_per_unit ?? 0),
    0
  )
  const manualTotal = manualItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <div className="mt-3 pl-4 border-l-2 border-gray-200">
      {loading && <p className="text-xs text-gray-400">Loading inventory...</p>}

      {/* Active order items */}
      {activeOrderItems.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">From approved orders</p>
          <div className="space-y-1">
            {activeOrderItems.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">
                  {item.components?.name ?? '—'}
                  <span className="text-gray-400 ml-1">×{item.quantity_requested}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs">
                    ${((item.components?.price_per_unit ?? 0) * item.quantity_requested).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleRemoveOrderItem(item)}
                    className="text-gray-300 hover:text-red-400 cursor-pointer transition-colors text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between text-xs font-medium text-gray-500 pt-1 border-t border-gray-100">
              <span>Subtotal</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Removed order items */}
      {removedOrderItems.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Removed items</p>
          <div className="space-y-1">
            {removedOrderItems.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm opacity-50">
                <span className="text-gray-500 line-through">
                  {item.components?.name ?? '—'}
                  <span className="ml-1">×{item.quantity_requested}</span>
                </span>
                <button
                  onClick={() => handleRestoreOrderItem(item)}
                  className="text-gray-400 hover:text-emerald-600 cursor-pointer transition-colors text-xs"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual items */}
      {manualItems.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Manually added</p>
          <div className="space-y-1">
            {manualItems.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">
                  {item.name}
                  <span className="text-gray-400 ml-1">×{item.quantity}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleRemoveManual(item)}
                    className="text-gray-300 hover:text-red-400 cursor-pointer transition-colors text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between text-xs font-medium text-gray-500 pt-1 border-t border-gray-100">
              <span>Subtotal</span>
              <span>${manualTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {!loading && activeOrderItems.length === 0 && manualItems.length === 0 && (
        <p className="text-xs text-gray-400 mb-3">No active items</p>
      )}

      {/* Grand total */}
      {(activeOrderItems.length > 0 || manualItems.length > 0) && (
        <div className="flex justify-between text-xs font-semibold text-gray-700 mb-3 pt-1 border-t-2 border-gray-200">
          <span>Total spent</span>
          <span>${(orderTotal + manualTotal).toFixed(2)}</span>
        </div>
      )}

      {/* Add manual item */}
      <div className="mt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add item manually</p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Item name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1 min-w-32 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <input
            type="number"
            placeholder="Price"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <input
            type="number"
            placeholder="Qty"
            value={newQty}
            onChange={e => setNewQty(e.target.value)}
            min="1"
            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="px-3 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50 cursor-pointer transition-colors"
          >
            Add
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  )
}