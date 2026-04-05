'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type OrderItem = {
  id: string
  quantity_requested: number
  components: {
    name: string
    price_per_unit: number
    quantity_in_stock: number
  }
}

type Order = {
  id: string
  status: string
  created_at: string
  admin_note: string | null
  teams: {
    name: string
    group_code: string
    contact_email: string
    budget_total: number
    budget_used: number
  }
  order_items: OrderItem[]
}

type Props = {
  order: Order
  onUpdated: () => void
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function OrderCard({ order, onUpdated }: Props) {
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNoteBox, setShowNoteBox] = useState(false)

  const orderTotal = order.order_items.reduce(
    (sum, item) => sum + item.quantity_requested * item.components.price_per_unit,
    0
  )
  const budgetRemaining = order.teams.budget_total - order.teams.budget_used
  const hasSufficientBudget = budgetRemaining >= orderTotal

  async function handleApprove() {
    setLoading(true)
    setError('')
    const { error } = await supabase.rpc('approve_order', { p_order_id: order.id })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onUpdated()
    }
  }

  async function handleReject() {
    setLoading(true)
    setError('')
    const { error } = await supabase
      .from('orders')
      .update({ status: 'rejected', admin_note: note, resolved_at: new Date().toISOString() })
      .eq('id', order.id)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onUpdated()
    }
  }

  async function handleSendNotification(type: 'approved' | 'rejected') {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        email: order.teams.contact_email,
        teamName: order.teams.name,
        type,
        note,
      }),
    })
  }

  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex justify-between items-center px-5 py-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${statusStyles[order.status]}`}>
            {order.status}
          </span>
          <span className="font-medium">{order.teams.name}</span>
          <span className="text-gray-500 text-sm">({order.teams.group_code})</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-700">
            Total: <strong>${orderTotal.toFixed(2)}</strong>
          </span>
          <span className="text-sm text-gray-400">
            {new Date(order.created_at).toLocaleTimeString()}
          </span>
          <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-5 border-t border-gray-200">

          {/* Budget info */}
          <div className={`flex gap-6 mb-5 p-3 rounded-lg text-sm ${hasSufficientBudget ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <span>Budget: <strong>${order.teams.budget_total.toFixed(2)}</strong></span>
            <span>Used: <strong>${order.teams.budget_used.toFixed(2)}</strong></span>
            <span>Remaining: <strong>${budgetRemaining.toFixed(2)}</strong></span>
            <span>This order: <strong>${orderTotal.toFixed(2)}</strong></span>
            {!hasSufficientBudget && (
              <span className="text-red-600 font-semibold">⚠ Insufficient budget</span>
            )}
          </div>

          {/* Items table */}
          <table className="w-full text-sm mb-5 border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-2 px-3">Component</th>
                <th className="py-2 px-3">Qty Requested</th>
                <th className="py-2 px-3">In Stock</th>
                <th className="py-2 px-3">Unit Price</th>
                <th className="py-2 px-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map(item => {
                const stockOk = item.components.quantity_in_stock >= item.quantity_requested
                return (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 px-3">{item.components.name}</td>
                    <td className="py-2 px-3">{item.quantity_requested}</td>
                    <td className={`py-2 px-3 font-medium ${stockOk ? 'text-emerald-600' : 'text-red-500'}`}>
                      {item.components.quantity_in_stock}
                      {!stockOk && ' ⚠'}
                    </td>
                    <td className="py-2 px-3">${item.components.price_per_unit.toFixed(2)}</td>
                    <td className="py-2 px-3">${(item.quantity_requested * item.components.price_per_unit).toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          {/* Actions for pending orders */}
          {order.status === 'pending' && (
            <div className="flex gap-3 flex-wrap items-start">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => setShowNoteBox(!showNoteBox)}
                className="px-5 py-2 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 cursor-pointer transition-colors"
              >
                Reject
              </button>
              {showNoteBox && (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    placeholder="Reason for rejection (optional)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Send notification for resolved orders */}
          {order.status !== 'pending' && (
            <div className="flex gap-3 items-center">
              <button
                onClick={() => handleSendNotification(order.status as 'approved' | 'rejected')}
                className="px-5 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 cursor-pointer transition-colors"
              >
                Send notification email
              </button>
              {order.admin_note && (
                <span className="text-sm text-gray-500">Note: {order.admin_note}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}