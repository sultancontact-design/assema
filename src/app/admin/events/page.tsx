// ===================================================================
//  صفحة إدارة الفعاليات — /admin/events
//  Server Component — يجلب كل فعاليات الحي مع عدّ التسجيلات
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  EventsTable,
  type AdminEventRow,
} from "@/components/admin/events-table";
import { hasPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout يتعامل مع التوجيه

  // الصلاحيات
  const canCreate = hasPermission(user.role, "event.create");
  const canEdit = hasPermission(user.role, "event.edit");
  const canDelete = hasPermission(user.role, "event.delete");

  // 1) جلب كل فعاليات الحي مع عدد التسجيلات
  const events = await db.event.findMany({
    where: {
      districtId: user.districtId,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      status: true,
      startDate: true,
      endDate: true,
      location: true,
      maxAttendees: true,
      isRegistrationOpen: true,
      _count: {
        select: {
          registrations: {
            where: { status: { in: ["REGISTERED", "ATTENDED"] } },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
    take: 200,
  });

  // 2) تحويل البيانات لـAdminEventRow (مع تحويل التواريخ إلى ISO)
  const rows: AdminEventRow[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    description: e.description,
    type: e.type,
    status: e.status,
    startDate: e.startDate instanceof Date ? e.startDate.toISOString() : String(e.startDate),
    endDate: e.endDate
      ? e.endDate instanceof Date
        ? e.endDate.toISOString()
        : String(e.endDate)
      : null,
    location: e.location,
    maxAttendees: e.maxAttendees,
    isRegistrationOpen: e.isRegistrationOpen,
    registrationsCount: e._count.registrations,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          إدارة الفعاليات
        </h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} فعالية في حيك. تابع القادمة والمنتهية وأدر التسجيلات.
        </p>
      </header>

      <EventsTable
        events={rows}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
