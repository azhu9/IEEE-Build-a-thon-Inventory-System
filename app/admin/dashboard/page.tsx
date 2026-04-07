import AdminNav from "@/app/components/admin/AdminNav";
import OrderQueue from "@/app/components/admin/OrderQueue";
import InventoryOverview from "@/app/components/admin/InventoryOverview";
import TeamsManager from "@/app/components/admin/TeamsManager";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="max-w-6xl mx-auto px-8 pb-16">
        <div className="mb-12">
          <OrderQueue />
        </div>
        <div className="border-t border-gray-200 pt-10 mb-12">
          <TeamsManager />
        </div>
        <div className="border-t border-gray-200 pt-10">
          <InventoryOverview />
        </div>
      </div>
    </div>
  );
}
