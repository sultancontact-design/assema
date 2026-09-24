// ===================================================================
//  /admin/data — لوحة إدارة البيانات (SUPER_ADMIN)
//  Server Component — يجلب عدّادات كل النماذج ويُمرّرها للعميل
// ===================================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DataAdminClient, type ModelCount } from "@/components/admin/data-admin-client";
import { Database, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة البيانات",
  description:
    "لوحة تحكّم بالمحتوى — حذف ناعم ونهائي لكل نماذج المنصة، مع سجلّ تدقيق.",
};

// قائمة النماذج (تُطابق تلك في /api/admin/data)
const MODEL_SPECS: { name: string; label: string; softDelete: boolean }[] = [
  { name: "user", label: "المستخدمون", softDelete: true },
  { name: "family", label: "الأسر", softDelete: true },
  { name: "district", label: "الأحياء", softDelete: true },
  { name: "group", label: "المجموعات", softDelete: true },
  { name: "event", label: "الفعاليات", softDelete: true },
  { name: "fundRequest", label: "طلبات الصندوق", softDelete: true },
  { name: "contribution", label: "المساهمات", softDelete: false },
  { name: "fundRequestApproval", label: "موافقات الطلبات", softDelete: false },
  { name: "discussion", label: "النقاشات", softDelete: false },
  { name: "discussionReply", label: "ردود النقاشات", softDelete: false },
  { name: "initiative", label: "المبادرات", softDelete: false },
  { name: "initiativeVote", label: "تصويتات المبادرات", softDelete: false },
  { name: "blogPost", label: "مقالات المدوّنة", softDelete: false },
  { name: "guideItem", label: "عناصر دليل الحي", softDelete: false },
  { name: "pointsLedger", label: "سجلّ النقاط", softDelete: false },
  { name: "storeItem", label: "منتجات المتجر", softDelete: false },
  { name: "storeOrder", label: "طلبات المتجر", softDelete: false },
  { name: "groupMember", label: "أعضاء المجموعات", softDelete: false },
  { name: "eventRegistration", label: "تسجيلات الفعاليات", softDelete: false },
  { name: "notification", label: "الإشعارات", softDelete: false },
  { name: "smartNotification", label: "الإشعارات الذكية", softDelete: false },
  { name: "notificationPreference", label: "تفضيلات الإشعارات", softDelete: false },
  { name: "ad", label: "الحملات الإعلانية", softDelete: false },
  { name: "adSlot", label: "مساحات الإعلان", softDelete: false },
  { name: "complaint", label: "الشكاوى", softDelete: false },
  { name: "auditLog", label: "سجلّ التدقيق", softDelete: false },
  { name: "setting", label: "الإعدادات", softDelete: false },
  { name: "emailLog", label: "سجلّات البريد", softDelete: false },
  { name: "allowedIP", label: "الـIPs المسموحة", softDelete: false },
  { name: "userStreak", label: "سلاسل الأعضاء", softDelete: false },
  { name: "variableReward", label: "المكافآت المتغيرة", softDelete: false },
  { name: "challenge", label: "التحديات", softDelete: false },
  { name: "userChallenge", label: "تحديات الأعضاء", softDelete: false },
  { name: "badge", label: "الأوسمة", softDelete: false },
  { name: "userBadge", label: "أوسمة الأعضاء", softDelete: false },
  { name: "userActivity", label: "نشاطات المستخدمين", softDelete: false },
  { name: "userRelationship", label: "علاقات المستخدمين", softDelete: false },
  { name: "engagementMetric", label: "مقاييس الانخراط", softDelete: false },
  { name: "directMessage", label: "الرسائل المباشرة", softDelete: false },
  { name: "downloadPermission", label: "أذونات التحميل", softDelete: false },
  { name: "downloadLog", label: "سجلّات التحميل", softDelete: false },
  { name: "referral", label: "الإحالات", softDelete: false },
];

async function countModel(spec: {
  name: string;
  softDelete: boolean;
}): Promise<number> {
  try {
    const where = spec.softDelete ? { deletedAt: null } : undefined;
    // @ts-expect-error — Prisma typing غير ديناميكي عبر مفاتيح النماذج
    return await db[spec.name].count({ where });
  } catch {
    return 0;
  }
}

export default async function AdminDataPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/data");
  if (user.role !== "SUPER_ADMIN") redirect("/community");

  const counts = await Promise.all(
    MODEL_SPECS.map(async (m) => ({
      name: m.name,
      label: m.label,
      softDelete: m.softDelete,
      count: await countModel(m),
    }))
  );

  const total = counts.reduce((s, m) => s + m.count, 0);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
          <Link href="/admin" className="hover:text-primary transition-colors">
            لوحة الإدارة
          </Link>
          <ChevronLeft className="size-3" />
          <span>إدارة البيانات</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          <Database className="inline size-6 me-2 text-accent" />
          إدارة بيانات المنصة
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mt-1">
          لوحة تحكّم شاملة تُتيح إدارة كل نماذج المنصة. العمليات الخطرة تتطلّب
          تأكيداً صريحاً ويتم تسجيلها في سجلّ التدقيق (AuditLog) مع عنوان الـIP
          والمتصفّح. الحذف الناعم يضع تاريخاً في حقل <code className="font-mono text-[11px]">deletedAt</code> — يمكن
          استرجاعه يدوياً من قاعدة البيانات.
        </p>
      </header>

      <DataAdminClient models={counts as ModelCount[]} total={total} />
    </div>
  );
}
