// ===================================================================
//  صفحة الإشعارات — /admin/notifications
//  Server Component — يجلب المجموعات والأحياء والإشعارات المُرسَلة
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  NotificationsClient,
  type NotificationsData,
} from "@/components/admin/notifications-client";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "notification.broadcast")) return null;

  const districtId = user.districtId ?? "";

  // جلب المجموعات والأحياء للفلاتر
  const [groups, districts] = await Promise.all([
    db.group.findMany({
      where: { districtId, isActive: true, deletedAt: null },
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    db.district.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
      take: 50,
    }),
  ]);

  // جلب آخر 100 إشعار (مع المستخدم المستلم)
  const notifications = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  // إحصاءات الإرسال
  const [totalSent, totalRead] = await Promise.all([
    db.notification.count(),
    db.notification.count({ where: { isRead: true } }),
  ]);

  // تجميع الإشعارات حسب العنوان والنوع للحصول على "رسائل مجمّعة"
  const groupedMap = new Map<
    string,
    {
      title: string;
      type: string;
      createdAt: Date;
      count: number;
      isRead: number;
      sampleUserId?: string;
    }
  >();
  for (const n of notifications) {
    const key = `${n.title}__${n.type}__${new Date(n.createdAt).getTime()}`;
    const e = groupedMap.get(key) ?? {
      title: n.title,
      type: n.type,
      createdAt: n.createdAt,
      count: 0,
      isRead: 0,
      sampleUserId: n.userId,
    };
    e.count += 1;
    if (n.isRead) e.isRead += 1;
    groupedMap.set(key, e);
  }
  const sentHistory = Array.from(groupedMap.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 100)
    .map((e) => ({
      title: e.title,
      type: e.type,
      recipientsCount: e.count,
      isReadCount: e.isRead,
      createdAt:
        e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
    }));

  const data: NotificationsData = {
    groups: groups.map((g) => ({ id: g.id, name: g.name, category: g.category })),
    districts: districts.map((d) => ({ id: d.id, name: d.name, city: d.city })),
    sentHistory,
    stats: {
      totalSent,
      totalRead,
      readRate: totalSent > 0 ? (totalRead / totalSent) * 100 : 0,
    },
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          الإشعارات
        </h1>
        <p className="text-sm text-muted-foreground">
          إرسال إشعارات جماعية للأعضاء، إدارة القوالب، ومتابعة سجل الإرسال.
        </p>
      </header>

      <NotificationsClient data={data} />
    </div>
  );
}
