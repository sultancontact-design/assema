// ===================================================================
//  صفحة إدارة المستخدمين — /admin/users
//  Server Component — يجلب كل المستخدمين في الحي + يمرّرهم لـUsersTable
//  v5.0: أضفنا أعمدة (level, points, streak) + جلب الشارات لاستعمالها
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersTable, type AdminUserRow } from "@/components/admin/users-table";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout يتعامل مع التوجيه

  // 1) جلب كل المستخدمين في الحي (up to 500 — كافٍ)
  const users = await db.user.findMany({
    where: {
      districtId: user.districtId,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      points: true,
      level: true,
      family: { select: { familyName: true } },
      district: { select: { name: true } },
      streak: { select: { currentStreak: true, longestStreak: true, freezes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // 2) جلب الشارات المتاحة للمنح
  const badges = await db.badge.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      icon: true,
      rarity: true,
      isLimited: true,
      currentRecipients: true,
      maxRecipients: true,
    },
  });

  // 3) تحويل التواريخ لـ ISO strings (متوافقة مع العميل)
  const rows: AdminUserRow[] = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    createdAt:
      u.createdAt instanceof Date
        ? u.createdAt.toISOString()
        : String(u.createdAt),
    district: u.district,
    family: u.family,
    points: u.points,
    level: u.level,
    currentStreak: u.streak?.currentStreak ?? 0,
    longestStreak: u.streak?.longestStreak ?? 0,
    freezes: u.streak?.freezes ?? 0,
  }));

  const badgeOptions = badges.map((b) => ({
    id: b.id,
    name: b.name,
    icon: b.icon,
    rarity: b.rarity,
    isLimited: b.isLimited,
    available:
      !b.isLimited ||
      b.maxRecipients === null ||
      b.currentRecipients < b.maxRecipients,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          إدارة المستخدمين
        </h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} مستخدم مسجّل في حي {rows[0]?.district?.name ?? "—"}.
          ابحث وفلتر وإدارة الحسابات والنقاط والشارات.
        </p>
      </header>

      <UsersTable
        users={rows}
        currentUserRole={user.role as Role}
        badgeOptions={badgeOptions}
      />
    </div>
  );
}
