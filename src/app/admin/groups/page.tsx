// ===================================================================
//  صفحة إدارة المجموعات — /admin/groups
//  Server Component — يجلب كل مجموعات الحي مع الأعضاء والرئيس والإحصاءات
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  GroupsTable,
  type AdminGroupRow,
  type AdminGroupMember,
  type AdminGroupCandidate,
} from "@/components/admin/groups-table";
import { hasPermission } from "@/lib/roles";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // الصلاحيات
  const canCreate = hasPermission(user.role, "group.create");
  const canEdit = hasPermission(user.role, "group.edit");
  const canDelete = hasPermission(user.role, "group.delete");
  const canManageMembers = hasPermission(user.role, "group.member.add");

  // 1) جلب كل مجموعات الحي
  const groups = await db.group.findMany({
    where: {
      districtId: user.districtId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: true,
      icon: true,
      isDefault: true,
      isActive: true,
      isPrivate: true,
      maxMembers: true,
      members: {
        // الأعضاء المعتمدون فقط (لعدّ العرض)
        select: {
          id: true,
          userId: true,
          role: true,
          isApproved: true,
          joinedAt: true,
          user: { select: { fullName: true } },
        },
        orderBy: { joinedAt: "desc" },
      },
      events: {
        // الفعاليات النشطة المرتبطة (لم يُحذف، نوعها PUBLISHED/ONGOING)
        where: {
          deletedAt: null,
          status: { in: ["PUBLISHED", "ONGOING"] },
        },
        select: { id: true },
      },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    take: 200,
  });

  // 2) حساب النشاط الأخير (آخر 7 أيام) لكل مجموعة — عبر Event.startDate
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActivityByGroup = await db.event.groupBy({
    by: ["groupId"],
    where: {
      districtId: user.districtId,
      startDate: { gte: sevenDaysAgo },
      deletedAt: null,
    },
    _count: { id: true },
  });
  const activityMap = new Map(
    recentActivityByGroup
      .filter((r) => r.groupId !== null)
      .map((r) => [r.groupId as string, r._count.id])
  );

  // 3) بناء الصفوف
  const rows: AdminGroupRow[] = groups.map((g) => {
    const approvedMembers = g.members.filter((m) => m.isApproved);
    const leader = g.members.find((m) => m.role === "leader");
    return {
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      category: g.category,
      icon: g.icon,
      isDefault: g.isDefault,
      isActive: g.isActive,
      isPrivate: g.isPrivate,
      maxMembers: g.maxMembers,
      membersCount: approvedMembers.length,
      leaderName: leader?.user.fullName ?? null,
      activeEventsCount: g.events.length,
      recentActivityCount: activityMap.get(g.id) ?? 0,
    };
  });

  // 4) جلب الأعضاء مع التفصيل لكل مجموعة (لإدارة الأعضاء)
  const members: Record<string, AdminGroupMember[]> = {};
  for (const g of groups) {
    members[g.id] = g.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      fullName: m.user.fullName,
      role: m.role,
      isApproved: m.isApproved,
      joinedAt:
        m.joinedAt instanceof Date
          ? m.joinedAt.toISOString()
          : String(m.joinedAt),
    }));
  }

  // 5) جلب المرشحين للأعضاء (كل المستخدمين النشطين في الحي)
  const candidatesUsers = await db.user.findMany({
    where: {
      districtId: user.districtId,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: { id: true, fullName: true, role: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });
  const candidates: AdminGroupCandidate[] = candidatesUsers.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    role: u.role as Role,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          إدارة المجموعات
        </h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} مجموعة في حيك. أدر الأعضاء والرؤساء والفعاليات المرتبطة.
        </p>
      </header>

      <GroupsTable
        groups={rows}
        members={members}
        candidates={candidates}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canManageMembers={canManageMembers}
      />
    </div>
  );
}
