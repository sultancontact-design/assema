// ===================================================================
//  صفحة المجموعات — /community/groups
//  Server Component يقرأ searchParams من URL ويُرجّع مجموعات مفلترة
// ===================================================================

import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  ChevronLeft,
  Users as UsersIcon,
  AlertCircle,
  Group as GroupIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { GroupsFilterBar } from "@/components/community/groups-filter-bar";
import { GroupCard, type GroupCardData } from "@/components/community/group-card";

export const dynamic = "force-dynamic";

// ===================================================================
//  خريطة slug → emoji للمجموعات الافتراضية الخمسة
// ===================================================================

const GROUP_ICON_EMOJIS: Record<string, string> = {
  mothers: "👩",
  fathers: "👨",
  youth: "🧑",
  children: "🧒",
  elders: "👵",
};

// ===================================================================
//  الصفحة
// ===================================================================

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GroupsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community/groups");
  }

  // استرجاع فلترات الـURL
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const categoryFilter =
    typeof params.category === "string" ? params.category : "ALL";

  // 1) بناء شرط البحث
  const whereClause = {
    districtId: user.districtId,
    isActive: true,
    deletedAt: null,
    ...(categoryFilter !== "ALL" ? { category: categoryFilter } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
  };

  // 2) جلب العدد الإجمالي + قائمة المجموعات
  const [total, groups] = await Promise.all([
    db.group.count({
      where: {
        districtId: user.districtId,
        isActive: true,
        deletedAt: null,
      },
    }),
    db.group.findMany({
      where: whereClause,
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      take: 100,
      include: {
        members: {
          where: { isApproved: true },
          select: {
            id: true,
            userId: true,
            role: true,
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    }),
  ]);

  // 3) عضويات المستخدم لمعرفة أي المجموعات هو عضو فيها
  const myMemberships = await db.groupMember.findMany({
    where: { userId: user.id },
    select: { groupId: true },
  });
  const myGroupIds = new Set(myMemberships.map((m) => m.groupId));

  // 4) تحويل البيانات لشكل بطاقات المجموعة
  const groupCards: GroupCardData[] = groups.map((g) => {
    const leader = g.members.find((m) => m.role === "leader");
    return {
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      category: g.category,
      iconEmoji: GROUP_ICON_EMOJIS[g.slug] ?? g.icon ?? "👥",
      isPrivate: g.isPrivate,
      memberCount: g.members.length,
      leaderName: leader?.user.fullName ?? null,
    };
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* رأس الصفحة */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/community"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>المجتمع</span>
          </Link>
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
            <GroupIcon className="size-7 text-primary" />
            مجموعات الحي
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            خمس مجموعات افتراضية تجمع أبناء الحي حول اهتماماتهم: الأمهات،
            الآباء، الشباب، الأطفال، وكبار السن. انضمّ إلى من يناسبك.
          </p>
        </div>
      </section>

      <ZelligeDivider variant="diamond" />

      {/* شريط الفلترة */}
      <Suspense
        fallback={
          <div className="h-12 rounded-md bg-muted/40 animate-pulse" />
        }
      >
        <GroupsFilterBar total={total} filteredCount={groupCards.length} />
      </Suspense>

      {/* شبكة المجموعات */}
      {groupCards.length === 0 ? (
        <Card className="border-dashed warm-shadow border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <AlertCircle className="size-8" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground">
              لا توجد مجموعات مطابقة
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              جرّب تعديل الفلاتر أو امسحها لعرض كل المجموعات.
            </p>
            <Button asChild variant="outline" size="lg" className="h-11 mt-2">
              <Link href="/community/groups">مسح الفلاتر</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="قائمة المجموعات"
        >
          {groupCards.map((g) => (
            <div key={g.id} role="listitem" className="h-full">
              <GroupCard
                group={g}
                isMember={myGroupIds.has(g.id)}
              />
            </div>
          ))}
        </div>
      )}

      <ZelligeDivider variant="wave" />

      {/* تذييل صغير */}
      <section className="text-center text-sm text-muted-foreground">
        <p>
          قال رسول الله صلى الله عليه وسلم: «المؤمن للمؤمن كالبنيان يشدّ بعضه
          بعضاً» — متّفق عليه.
        </p>
      </section>

      {/* معلومات إضافية */}
      <section
        aria-labelledby="groups-info"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <Card className="warm-shadow border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">مجموعات نشطة</p>
              <p className="font-heading text-xl font-bold text-foreground">
                {total}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="warm-shadow border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">مجموعاتي</p>
              <p className="font-heading text-xl font-bold text-foreground">
                {myGroupIds.size}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="warm-shadow border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <GroupIcon className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الفئات</p>
              <p className="font-heading text-xl font-bold text-foreground">5</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <h2 id="groups-info" className="sr-only">
        معلومات إضافية عن المجموعات
      </h2>
    </div>
  );
}
