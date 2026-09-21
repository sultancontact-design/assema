// ===================================================================
//  صفحة مسح QR للحضور — /admin/events/scan
//  Server Component — يجلب الفعاليات المفتوحة + التسجيلات الأخيرة
//  ثم يُمرّرها للـ EventScanClient (client component)
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/roles";
import {
  EventScanClient,
  type ScanAttendee,
} from "@/components/admin/event-scan-client";
import type { RegistrationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout يُعالج التوجيه

  const isStaff = hasPermission(user.role, "event.manage-registrations");

  // 1) الفعاليات المفتوحة للحضور (PUBLISHED + ONGOING) في حيّ المستخدم
  const openEvents = await db.event.findMany({
    where: {
      districtId: user.districtId,
      status: { in: ["PUBLISHED", "ONGOING"] },
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      startDate: true,
      maxAttendees: true,
    },
    orderBy: { startDate: "desc" },
    take: 10,
  });

  // 2) التسجيلات الأخيرة لهذه الفعاليات (لتبويب "تتبّع الحضور")
  const eventIds = openEvents.map((e) => e.id);
  const recentRegistrations =
    eventIds.length > 0
      ? await db.eventRegistration.findMany({
          where: {
            eventId: { in: eventIds },
            status: { in: ["REGISTERED", "ATTENDED"] },
          },
          include: {
            user: { select: { id: true, fullName: true } },
          },
          orderBy: { registeredAt: "desc" },
          take: 200,
        })
      : [];

  const attendees: ScanAttendee[] = recentRegistrations.map((r) => ({
    id: r.id,
    ticketCode: r.ticketCode,
    status: r.status as RegistrationStatus,
    registeredAt:
      r.registeredAt instanceof Date
        ? r.registeredAt.toISOString()
        : String(r.registeredAt),
    attendedAt: r.attendedAt
      ? r.attendedAt instanceof Date
        ? r.attendedAt.toISOString()
        : String(r.attendedAt)
      : null,
    user: { id: r.user.id, fullName: r.user.fullName },
  }));

  return (
    <EventScanClient
      events={openEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startDate:
          e.startDate instanceof Date
            ? e.startDate.toISOString()
            : String(e.startDate),
        maxAttendees: e.maxAttendees,
      }))}
      initialAttendees={attendees}
      isStaff={isStaff}
    />
  );
}
