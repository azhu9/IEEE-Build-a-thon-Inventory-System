'use client'

type Component = {
  id: string
  name: string
  price_per_unit: number
}

type CartItem = {
  component: Component
  quantity: number
}

type Team = {
  name: string
  budget_total: number
  budget_used: number
}

type Props = {
  team: Team
  cart: CartItem[]
  onRemove: (componentId: string) => void
  onSubmit: () => void
  submitting: boolean
}

export default function CartSidebar({ team, cart, onRemove, onSubmit, submitting }: Props) {
  const budgetRemaining = team.budget_total - team.budget_used
  const cartTotal = cart.reduce((sum, i) => sum + i.quantity * i.component.price_per_unit, 0)
  const afterOrder = budgetRemaining - cartTotal
  const canSubmit = cart.length > 0 && afterOrder >= 0 && !submitting

  return (
    <div className="w-72 shrink-0">
      <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-6">
        {/* Team info */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <p className="text-sm font-semibold">{team.name}</p>
          <div className="mt-2 space-y-1 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Total budget</span>
              <span className="text-gray-900">${team.budget_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Already spent</span>
              <span className="text-gray-900">${team.budget_used.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-900">
              <span>Available</span>
              <span>${budgetRemaining.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Cart items */}
        <div className="mb-4">
          <p className="text-sm font-semibold mb-3">Your order</p>
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400">No items added yet</p>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.component.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{item.component.name}</span>
                    <span className="text-gray-400 ml-1">×{item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>${(item.quantity * item.component.price_per_unit).toFixed(2)}</span>
                    <button
                      onClick={() => onRemove(item.component.id)}
                      className="text-gray-300 hover:text-red-400 cursor-pointer transition-colors text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order total + remaining */}
        {cart.length > 0 && (
          <div className="mb-4 pt-3 border-t border-gray-100 space-y-1 text-sm">
            <div className="flex justify-between font-semibold">
              <span>Order total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between text-xs ${afterOrder < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              <span>Budget after order</span>
              <span>${afterOrder.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full py-2.5 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm"
        >
          {submitting ? 'Submitting...' : 'Submit order'}
        </button>
      </div>
    </div>
  )
}