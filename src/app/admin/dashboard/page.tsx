import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardClient } from "@/components/admin/dashboard-client";
export const dynamic = "force-dynamic";
export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/dashboard");
  return <DashboardClient />;
}
