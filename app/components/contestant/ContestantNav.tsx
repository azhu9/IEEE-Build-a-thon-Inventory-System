type View = "checkout" | "orders";

type Props = {
  teamName: string;
  budgetRemaining: number;
  currentView: View;
  onViewChange: (view: View) => void;
};

export default function ContestantNav({
  teamName,
  budgetRemaining,
  currentView,
  onViewChange,
}: Props) {
  return (
    <div className="border-b border-gray-200 bg-white px-8 py-4 mb-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-semibold">Component Checkout</h1>
          <div className="flex gap-2">
            <button
              onClick={() => onViewChange("checkout")}
              className={`px-4 py-1.5 rounded-md text-sm border cursor-pointer transition-colors ${
                currentView === "checkout"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Browse components
            </button>
            <button
              onClick={() => onViewChange("orders")}
              className={`px-4 py-1.5 rounded-md text-sm border cursor-pointer transition-colors ${
                currentView === "orders"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              My orders
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-900">{teamName}</span>
          <span className="ml-4">
            Budget remaining:{" "}
            <span className="font-medium text-gray-900">
              ${budgetRemaining.toFixed(2)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
