type Props = {
  onNewOrder: () => void;
  onViewOrders: () => void;
};

export default function OrderConfirmation({ onNewOrder, onViewOrders }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-xl p-10 w-full max-w-md shadow-sm text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-emerald-600 text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Order submitted!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your order is in the queue. An admin will review it shortly. Keep an
          eye on your email for a status update.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onViewOrders}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 cursor-pointer transition-colors text-sm"
          >
            View my orders
          </button>
          <button
            onClick={onNewOrder}
            className="px-6 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-700 cursor-pointer transition-colors text-sm"
          >
            Submit another order
          </button>
        </div>
      </div>
    </div>
  );
}
