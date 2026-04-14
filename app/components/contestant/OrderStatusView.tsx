"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type OrderItem = {
  id: string;
  quantity_requested: number;
  components: {
    name: string;
    price_per_unit: number;
  } | null;
};

type Order = {
  id: string;
  status: string;
  created_at: string;
  admin_note: string | null;
  order_items: OrderItem[];
};

type Props = {
  teamId: string;
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const statusIcons: Record<string, string> = {
  pending: "⏳",
  approved: "✓",
  rejected: "✕",
};

export default function OrderStatusView({ teamId }: Props) {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select(
        `
        id, status, created_at, admin_note,
        order_items (
          id,
          quantity_requested,
          components ( name, price_per_unit )
        )
      `,
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });
    setOrders((data as unknown as Order[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Realtime so status updates appear instantly without refresh
  useEffect(() => {
    const channel = supabase
      .channel("team-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          fetchOrders();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  function toggleExpand(orderId: string) {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  }

  if (loading) {
    return (
      <p className="text-gray-400 text-sm text-center py-12">
        Loading orders...
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm">
          You haven`t placed any orders yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-8 pb-16">
      <h2 className="text-lg font-semibold mb-4">Your orders</h2>
      <div className="space-y-3">
        {orders.map((order) => {
          const orderTotal = order.order_items.reduce(
            (sum, item) =>
              sum +
              item.quantity_requested * (item.components?.price_per_unit ?? 0),
            0,
          );
          const isExpanded = expandedOrder === order.id;

          return (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Header row */}
              <div
                onClick={() => toggleExpand(order.id)}
                className="flex justify-between items-center px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 ${statusStyles[order.status]}`}
                  >
                    <span>{statusIcons[order.status]}</span>
                    <span className="capitalize">{order.status}</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    ${orderTotal.toFixed(2)}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {/* Items list */}
                  <table className="w-full text-sm mb-4 border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500">
                        <th className="py-2 pr-4 font-medium">Component</th>
                        <th className="py-2 pr-4 font-medium">Qty</th>
                        <th className="py-2 pr-4 font-medium">Unit price</th>
                        <th className="py-2 font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.order_items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50">
                          <td className="py-2 pr-4">
                            {item.components?.name ?? 0}
                          </td>
                          <td className="py-2 pr-4">
                            {item.quantity_requested}
                          </td>
                          <td className="py-2 pr-4">
                            ${(item.components?.price_per_unit ?? 0).toFixed(2)}
                          </td>
                          <td className="py-2">
                            $
                            {(
                              item.quantity_requested *
                              (item.components?.price_per_unit ?? 0)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Total */}
                  <div className="flex justify-end text-sm font-semibold mb-3">
                    <span>Total: ${orderTotal.toFixed(2)}</span>
                  </div>

                  {/* Admin note */}
                  {order.admin_note && (
                    <div
                      className={`rounded-lg px-4 py-3 text-sm ${
                        order.status === "rejected"
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      <span className="font-semibold">Note from admin: </span>
                      {order.admin_note}
                    </div>
                  )}

                  {/* Pending message */}
                  {order.status === "pending" && (
                    <div className="bg-amber-50 rounded-lg px-4 py-3 text-sm text-amber-700">
                      Your order is in the queue and will be reviewed shortly.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
