"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ComponentCatalog from "@/app/components/contestant/ComponentCatalog";
import CartSidebar from "@/app/components/contestant/CartSidebar";
import OrderConfirmation from "@/app/components/contestant/OrderConfirmation";
import ContestantNav from "@/app/components/contestant/ContestantNav";
import OrderStatusView from "@/app/components/contestant/OrderStatusView";

type Component = {
  id: string;
  name: string;
  type: string;
  quantity_in_stock: number;
  price_per_unit: number;
  location: string;
  notes: string;
};

type CartItem = {
  component: Component;
  quantity: number;
};

type Team = {
  id: string;
  name: string;
  group_code: string;
  budget_total: number;
  budget_used: number;
  contact_email: string;
};

type View = "checkout" | "orders";

type Props = {
  team: Team;
};

export default function CheckoutView({ team }: Props) {
  const supabase = createClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Team>(team);
  const [view, setView] = useState<View>("checkout");

  const budgetRemaining = currentTeam.budget_total - currentTeam.budget_used;
  const cartTotal = cart.reduce(
    (sum, i) => sum + i.quantity * i.component.price_per_unit,
    0,
  );

  function addToCart(component: Component) {
    setCart((prev) => {
      const existing = prev.find((i) => i.component.id === component.id);
      if (existing)
        return prev.map((i) =>
          i.component.id === component.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      return [...prev, { component, quantity: 1 }];
    });
  }

  function removeFromCart(componentId: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.component.id === componentId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.component.id === componentId
            ? { ...i, quantity: i.quantity - 1 }
            : i,
        );
      }
      return prev.filter((i) => i.component.id !== componentId);
    });
  }

  async function handleSubmit() {
    setSubmitting(true);

  // console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  // console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20))
  // setSubmitting(true)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ team_id: currentTeam.id, status: 'pending' })
    .select()
    .single()

  console.log('Order result:', JSON.stringify(order))
  console.log('Order error:', JSON.stringify(orderError))
  
  if (orderError || !order) {
    console.log('Failed at order insert')
    setSubmitting(false)
    return
  }

    const items = cart.map((i) => ({
      order_id: order.id,
      component_id: i.component.id,
      quantity_requested: i.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items);

    if (itemsError) {
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  function handleNewOrder() {
    setCart([]);
    setSubmitted(false);
    setView("checkout");
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ContestantNav
          teamName={currentTeam.name}
          budgetRemaining={budgetRemaining - cartTotal}
          currentView={view}
          onViewChange={setView}
        />
        <OrderConfirmation
          onNewOrder={handleNewOrder}
          onViewOrders={() => {
            setSubmitted(false);
            setCart([]);
            setView("orders");
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ContestantNav
        teamName={currentTeam.name}
        budgetRemaining={budgetRemaining - cartTotal}
        currentView={view}
        onViewChange={setView}
      />

      {/* {view === "checkout" && (
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
      )} */}
      {view === 'checkout' && (
  <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-32 lg:pb-16 flex flex-col lg:flex-row gap-8 items-start">
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
)}

      {view === "orders" && <OrderStatusView teamId={currentTeam.id} />}
    </div>
  );
}
