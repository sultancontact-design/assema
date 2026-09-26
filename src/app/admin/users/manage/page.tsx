import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UsersManageClient } from "@/components/admin/users-manage-client";
export const dynamic = "force-dynamic";
export default async function AdminUsersManagePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login?callbackUrl=/admin/users/manage");
  return <UsersManageClient />;
}
