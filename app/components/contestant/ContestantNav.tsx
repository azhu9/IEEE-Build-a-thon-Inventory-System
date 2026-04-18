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
    <div className="border-b border-gray-200 bg-white px-4 sm:px-8 py-4 mb-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        
        {/* Top row on mobile: title + budget */}
        <div className="flex justify-between items-center sm:contents">
          <h1 className="text-lg sm:text-xl font-semibold">Component Checkout</h1>
          <div className="text-xs sm:text-sm text-gray-500 sm:order-last">
            <span className="font-medium text-gray-900">{teamName}</span>
            <span className="ml-2 sm:ml-4">
              <span className="hidden sm:inline">Budget remaining: </span>
              <span className="font-medium text-gray-900">
                ${budgetRemaining.toFixed(2)}
              </span>
            </span>
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewChange("checkout")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-sm border cursor-pointer transition-colors ${
              currentView === "checkout"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Browse
          </button>
          <button
            onClick={() => onViewChange("orders")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-sm border cursor-pointer transition-colors ${
              currentView === "orders"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            My orders
          </button>
        </div>

      </div>
    </div>
  );
}