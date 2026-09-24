// ===================================================================
//  /admin/analytics — التحليلات المتقدمة
//  Server Component — SUPER_ADMIN فقط
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAnalyticsSnapshot } from "@/lib/admin-lib";
import { AnalyticsAdmin } from "@/components/admin/analytics/analytics-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "التحليلات المتقدمة",
};

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/analytics");
  }
  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const snapshot = await getAnalyticsSnapshot();

  return <AnalyticsAdmin snapshot={snapshot} />;
}
