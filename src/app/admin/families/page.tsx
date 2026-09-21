// ===================================================================
//  صفحة إدارة العائلات — /admin/families
//  Server Component — يجلب كل عائلات الحي مع التفاصيل
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  FamiliesTable,
  type AdminFamilyRow,
  type AdminFamilyMember,
  type AdminFamilyContribution,
  type AdminFamilyFundRequest,
} from "@/components/admin/families-table";
import { hasPermission } from "@/lib/roles";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminFamiliesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const canEdit = hasPermission(user.role, "family.edit");

  // 1) جلب كل العائلات مع رب الأسرة وعدّ المساهمات/الطلبات
  const families = await db.family.findMany({
    where: {
      districtId: user.districtId,
      deletedAt: null,
    },
    select: {
      id: true,
      familyName: true,
      address: true,
      economicStatus: true,
      memberCount: true,
      isActive: true,
      notes: true,
      createdAt: true,
      headOfFamily: { select: { fullName: true } },
      // إجمالي المساهمات المُؤكَّدة
      contributions: {
        where: { status: "CONFIRMED" },
        select: { id: true, amount: true, receiptNumber: true, month: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      fundRequests: {
        select: {
          id: true,
          anonymousCode: true,
          type: true,
          title: true,
          amountRequested: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      // الأعضاء المسجّلون
      members: {
        select: {
          id: true,
          fullName: true,
          role: true,
          isFamilyHead: true,
          profession: true,
        },
        orderBy: { fullName: "asc" },
      },
    },
    orderBy: { familyName: "asc" },
    take: 500,
  });

  // 2) بناء الصفوف + التحويل لـISO strings
  const rows: AdminFamilyRow[] = families.map((f) => {
    const contributionsTotal = f.contributions.reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );
    // عدّ الطلبات الكلّي (لا نملكه من الـselect المحدود) — نأخذه من المبدأ البسيط
    // f.fundRequests جلبنا آخر 10 فقط للعرض، لكن العدد الكلّي يلزمنا
    // سنأخذه بطريقة بديلة: سنتعامل مع العدد المعروض فقط (≤10)
    return {
      id: f.id,
      familyName: f.familyName,
      headName: f.headOfFamily?.fullName ?? null,
      address: f.address,
      economicStatus: f.economicStatus,
      memberCount: f.memberCount,
      isActive: f.isActive,
      notes: f.notes,
      createdAt:
        f.createdAt instanceof Date
          ? f.createdAt.toISOString()
          : String(f.createdAt),
      contributionsTotal,
      fundRequestsCount: f.fundRequests.length, // ≤10 في الواقع، سنحدّثه لاحقاً
      members: f.members.map(
        (m): AdminFamilyMember => ({
          id: m.id,
          fullName: m.fullName,
          role: m.role as Role,
          isFamilyHead: m.isFamilyHead,
          profession: m.profession,
        })
      ),
      recentContributions: f.contributions.map(
        (c): AdminFamilyContribution => ({
          id: c.id,
          receiptNumber: c.receiptNumber,
          amount: c.amount,
          month: c.month,
          status: c.status,
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
        })
      ),
      recentRequests: f.fundRequests.map(
        (r): AdminFamilyFundRequest => ({
          id: r.id,
          anonymousCode: r.anonymousCode,
          type: r.type,
          title: r.title,
          amountRequested: r.amountRequested,
          status: r.status,
          createdAt:
            r.createdAt instanceof Date
              ? r.createdAt.toISOString()
              : String(r.createdAt),
        })
      ),
    };
  });

  // 3) تصحيح: جلب العدد الحقيقي للمساهمات والطلبات والإيصالات والشهور لكل عائلة
  // نجلب بـ Promise.all على مستوى كل عائلة (50 عائلة فقط، آمن)
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const [realCount, contribs] = await Promise.all([
        db.fundRequest.count({ where: { familyId: r.id } }),
        db.contribution.findMany({
          where: { familyId: r.id },
          select: {
            id: true,
            receiptNumber: true,
            amount: true,
            month: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);
      const contribTotal = await db.contribution.aggregate({
        where: { familyId: r.id, status: "CONFIRMED" },
        _sum: { amount: true },
      });
      return {
        ...r,
        fundRequestsCount: realCount,
        contributionsTotal: contribTotal._sum.amount ?? 0,
        recentContributions: contribs.map(
          (c): AdminFamilyContribution => ({
            id: c.id,
            receiptNumber: c.receiptNumber,
            amount: c.amount,
            month: c.month,
            status: c.status,
            createdAt:
              c.createdAt instanceof Date
                ? c.createdAt.toISOString()
                : String(c.createdAt),
          })
        ),
      };
    })
  );

  // 4) إحصاءات تجميعية
  const totalMembers = enriched.reduce((sum, f) => sum + f.memberCount, 0);
  const economicDistribution: Record<string, number> = { "ضعيف": 0, "متوسط": 0, "جيد": 0 };
  for (const f of enriched) {
    economicDistribution[f.economicStatus] =
      (economicDistribution[f.economicStatus] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          إدارة العائلات
        </h1>
        <p className="text-sm text-muted-foreground">
          {enriched.length} عائلة في حيك. تابع المساهمات والطلبات وتوزّع الحالة
          الاقتصادية.
        </p>
      </header>

      <FamiliesTable
        families={enriched}
        totalMembers={totalMembers}
        economicDistribution={economicDistribution}
        canEdit={canEdit}
      />
    </div>
  );
}
