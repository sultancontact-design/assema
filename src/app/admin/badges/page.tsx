// ===================================================================
//  /admin/badges — إدارة الشارات
//  Server Component — SUPER_ADMIN فقط
// ===================================================================

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BadgesAdmin } from "@/components/admin/badges/badges-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة الشارات",
};

export interface BadgeRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  rarity: string;
  isLimited: boolean;
  availableFrom: string | null;
  availableUntil: string | null;
  maxRecipients: number | null;
  currentRecipients: number;
  createdAt: string;
}

export interface UserOption {
  id: string;
  fullName: string;
}

export default async function BadgesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/badges");
  }
  if (user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const [badges, users] = await Promise.all([
    db.badge.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { userBadges: true } } },
    }),
    db.user.findMany({
      where: { deletedAt: null },
      orderBy: { fullName: "asc" },
      take: 200,
      select: { id: true, fullName: true },
    }),
  ]);

  const rows: BadgeRow[] = badges.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    icon: b.icon,
    rarity: b.rarity,
    isLimited: b.isLimited,
    availableFrom: b.availableFrom ? b.availableFrom.toISOString() : null,
    availableUntil: b.availableUntil ? b.availableUntil.toISOString() : null,
    maxRecipients: b.maxRecipients,
    currentRecipients: b._count?.userBadges ?? b.currentRecipients,
    createdAt: b.createdAt.toISOString(),
  }));

  return <BadgesAdmin badges={rows} users={users} />;
}
