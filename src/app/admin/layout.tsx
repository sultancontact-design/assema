// ===================================================================
//  تخطيط قسم الإدارة — /admin/*
//  Server Component — فحص المصادقة + الدور، ثم تمرير البيانات للـAdminShell
//  يستخدم كروم إداري مستقل (sidebar + topbar) — لا يظهر SiteHeader/BottomNav
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

// الأدوار المسموح لها بدخول القسم الإداري
const ALLOWED_ADMIN_ROLES: Role[] = [
  "SUPER_ADMIN",
  "TREASURER",
  "ETHICS_COMMITTEE",
  "DISTRICT_MOD",
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) التحقّق من المصادقة
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin");
  }

  // 2) التحقّق من الدور
  if (!ALLOWED_ADMIN_ROLES.includes(user.role)) {
    redirect("/community");
  }

  // 3) تمرير بيانات المستخدم للـAdminShell (client component)
  const userForShell = {
    id: user.id,
    name: user.name ?? "",
    email: user.email,
    role: user.role,
    roleLabel: ROLE_LABELS[user.role].label,
    avatar: user.avatar,
    districtId: user.districtId,
  };

  return <AdminShell user={userForShell}>{children}</AdminShell>;
}
