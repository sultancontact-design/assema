import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { PermissionsManager } from "@/components/admin/permissions-manager";

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/settings/permissions");
  if (!hasPermission(user.role, "admin.settings")) redirect("/admin");

  const [permissions, logs, users] = await Promise.all([
    db.downloadPermission.findMany({ orderBy: { grantedAt: "desc" }, take: 50 }),
    db.downloadLog.findMany({ orderBy: { downloadedAt: "desc" }, take: 30 }),
    db.user.findMany({ select: { id: true, fullName: true, email: true, role: true }, take: 200, orderBy: { fullName: "asc" } }),
  ]);

  const serializedPerms = permissions.map(p => ({ id: p.id, userId: p.userId, reportType: p.reportType, grantedAt: p.grantedAt.toISOString(), expiresAt: p.expiresAt?.toISOString() ?? null, isActive: p.isActive }));
  const serializedLogs = logs.map(l => ({ id: l.id, userId: l.userId, reportType: l.reportType, reportId: l.reportId, status: l.status, reason: l.reason, downloadedAt: l.downloadedAt.toISOString() }));
  const serializedUsers = users.map(u => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">صلاحيات تحميل PDF</h1>
        <p className="text-sm text-muted-foreground mt-1">تحكّم فيمن يمكنه تحميل التقارير المالية وسجلات النقاط</p>
      </div>
      <PermissionsManager permissions={serializedPerms} logs={serializedLogs} users={serializedUsers} currentUserId={user.id} />
    </div>
  );
}
