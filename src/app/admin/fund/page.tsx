// ===================================================================
//  صفحة إدارة الصندوق — /admin/fund
//  Server Component — يجلب المساهمات والطلبات في الحي، يمرّرها للعميل
// ===================================================================

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { FundAdminTables, type AdminContributionRow, type AdminFundRequestRow } from "@/components/admin/fund-admin-tables";

export const dynamic = "force-dynamic";

export default async function AdminFundPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout يتعامل مع التوجيه

  // 1) جلب آخر 200 مساهمة في الحي
  const contributionsRaw = await db.contribution.findMany({
    where: { districtId: user.districtId },
    take: 200,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      receiptNumber: true,
      amount: true,
      method: true,
      month: true,
      status: true,
      createdAt: true,
      user: { select: { id: true, fullName: true } },
    },
  });

  const contributions: AdminContributionRow[] = contributionsRaw.map((c) => ({
    id: c.id,
    receiptNumber: c.receiptNumber,
    user: c.user,
    amount: c.amount,
    method: c.method,
    month: c.month,
    status: c.status,
    createdAt:
      c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
  }));

  // 2) جلب آخر 200 طلب صرف في الحي
  const requestsRaw = await db.fundRequest.findMany({
    where: { districtId: user.districtId },
    take: 200,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      anonymousCode: true,
      type: true,
      title: true,
      amountRequested: true,
      status: true,
      requiresEthics: true,
      createdAt: true,
      approvals: {
        select: { id: true },
      },
    },
  });

  const requests: AdminFundRequestRow[] = requestsRaw.map((r) => ({
    id: r.id,
    anonymousCode: r.anonymousCode,
    type: r.type,
    title: r.title,
    amountRequested: r.amountRequested,
    status: r.status,
    requiresEthics: r.requiresEthics,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    approvalsCount: r.approvals?.length ?? 0,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          إدارة الصندوق
        </h1>
        <p className="text-sm text-muted-foreground">
          مصادقة المساهمات، تصويت لجنة النزاهة على الطلبات، ومتابعة الصرف.
        </p>
      </header>

      <FundAdminTables
        contributions={contributions}
        requests={requests}
        currentUserRole={user.role}
      />
    </div>
  );
}
