'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import OrderCard from './OrderCard'

type Order = any
type Filter = 'pending' | 'approved' | 'rejected' | 'all'

export default function OrderQueue() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<Filter>('pending')
  const [loading, setLoading] = useState(true)

  async function fetchOrders() {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select(`
        *,
        teams ( name, group_code, contact_email, budget_total, budget_used ),
        order_items (
          id,
          quantity_requested,
          components ( name, price_per_unit, quantity_in_stock )
        )
      `)
      .order('created_at', { ascending: false })

    if (filter !== 'all') query = query.eq('status', filter)

    const { data } = await query
    setOrders(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [filter])

  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [filter])

  const filters: Filter[] = ['pending', 'approved', 'rejected', 'all']

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Order Queue</h2>
        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm border capitalize cursor-pointer transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading orders...</p>}
      {!loading && orders.length === 0 && (
        <p className="text-gray-400 text-center py-12">No {filter} orders</p>
      )}
      {orders.map(order => (
        <OrderCard key={order.id} order={order} onUpdated={fetchOrders} />
      ))}
    </div>
  )
}