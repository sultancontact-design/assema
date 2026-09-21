// ===================================================================
//  صفحة إدارة الشكاوى — /admin/complaints
//  Server Component — يجلب كل شكاوى الحي مع المُقدِّم والمعالِج
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ComplaintsTable,
  type AdminComplaintRow,
} from "@/components/admin/complaints-table";
import { hasPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminComplaintsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const canResolve = hasPermission(user.role, "complaint.resolve");

  // 1) جلب كل شكاوى الحي
  const complaints = await db.complaint.findMany({
    where: { districtId: user.districtId },
    select: {
      id: true,
      isAnonymous: true,
      filedById: true,
      type: true,
      subject: true,
      description: true,
      attachments: true,
      status: true,
      priority: true,
      handledById: true,
      resolution: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true,
      filedBy: { select: { fullName: true } },
      handledBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // 2) التحويل إلى AdminComplaintRow (مع ISO strings)
  const rows: AdminComplaintRow[] = complaints.map((c) => ({
    id: c.id,
    isAnonymous: c.isAnonymous,
    filedByName: c.filedBy?.fullName ?? null,
    type: c.type,
    subject: c.subject,
    description: c.description,
    attachments: c.attachments,
    status: c.status,
    priority: c.priority,
    handledByName: c.handledBy?.fullName ?? null,
    resolution: c.resolution,
    resolvedAt: c.resolvedAt
      ? c.resolvedAt instanceof Date
        ? c.resolvedAt.toISOString()
        : String(c.resolvedAt)
      : null,
    createdAt:
      c.createdAt instanceof Date
        ? c.createdAt.toISOString()
        : String(c.createdAt),
    updatedAt:
      c.updatedAt instanceof Date
        ? c.updatedAt.toISOString()
        : String(c.updatedAt),
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          الشكاوى والاقتراحات
        </h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} شكوى في حيك. عالج الشكاوى المالية والسلوكية والتقنية
          والاقتراحات بكل كرامة وسرية.
        </p>
      </header>

      <ComplaintsTable complaints={rows} canResolve={canResolve} />
    </div>
  );
}
