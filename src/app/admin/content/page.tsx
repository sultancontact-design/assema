import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ContentManagementClient } from "@/components/admin/content-management-client";
export const dynamic = "force-dynamic";
export default async function AdminContentPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/content");
  return <ContentManagementClient />;
}
