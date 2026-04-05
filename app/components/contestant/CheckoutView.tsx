'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import ComponentCatalog from '@/app/components/contestant/ComponentCatalog'
import CartSidebar from '@/app/components/contestant/CartSidebar'
import OrderConfirmation from '@/app/components/contestant/OrderConfirmation'

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

type Team = {
  id: string
  name: string
  group_code: string
  budget_total: number
  budget_used: number
  contact_email: string
}

type Props = {
  team: Team
}

export default function CheckoutView({ team }: Props) {
  const supabase = createClient()
  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [currentTeam, setCurrentTeam] = useState<Team>(team)

  const budgetRemaining = currentTeam.budget_total - currentTeam.budget_used
  const cartTotal = cart.reduce((sum, i) => sum + i.quantity * i.component.price_per_unit, 0)

  function addToCart(component: Component) {
    setCart(prev => {
      const existing = prev.find(i => i.component.id === component.id)
      if (existing) return prev.map(i => i.component.id === component.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { component, quantity: 1 }]
    })
  }

  function removeFromCart(componentId: string) {
    setCart(prev => {
      const existing = prev.find(i => i.component.id === componentId)
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.component.id === componentId ? { ...i, quantity: i.quantity - 1 } : i)
      }
      return prev.filter(i => i.component.id !== componentId)
    })
  }

  async function handleSubmit() {
    setSubmitting(true)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ team_id: currentTeam.id, status: 'pending' })
      .select()
      .single()

    if (orderError || !order) {
      setSubmitting(false)
      return
    }

    const items = cart.map(i => ({
      order_id: order.id,
      component_id: i.component.id,
      quantity_requested: i.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(items)

    if (itemsError) {
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  function handleNewOrder() {
    setCart([])
    setSubmitted(false)
  }

  if (submitted) return <OrderConfirmation onNewOrder={handleNewOrder} />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-4 mb-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Component Checkout</h1>
          <div className="text-sm text-gray-500">
            Team: <span className="font-medium text-gray-900">{currentTeam.name}</span>
            <span className="ml-4">Budget remaining: <span className="font-medium text-gray-900">${(budgetRemaining - cartTotal).toFixed(2)}</span></span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-16 flex gap-8 items-start">
        <ComponentCatalog
          budget_remaining={budgetRemaining - cartTotal}
          cart={cart}
          onAdd={addToCart}
          onRemove={removeFromCart}
        />
        <CartSidebar
          team={currentTeam}
          cart={cart}
          onRemove={removeFromCart}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>
    </div>
  )
}