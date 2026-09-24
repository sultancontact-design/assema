import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { LiveAdminDashboard } from "@/components/admin/live-admin-dashboard";

export const dynamic = "force-dynamic";

export default async function LiveAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/live");
  if (!hasPermission(user.role, "admin.dashboard")) redirect("/admin");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">لوحة النشاط الحي</h1>
        <p className="text-sm text-muted-foreground mt-1">مراقبة لحظية لنشاط المنصة — تحديث كل 10 ثوانٍ</p>
      </div>
      <LiveAdminDashboard />
    </div>
  );
}
