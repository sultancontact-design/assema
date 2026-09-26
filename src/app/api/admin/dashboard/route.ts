// GET: Dashboard stats (resilient with Promise.allSettled)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
async function safe<T>(p: Promise<T>, fb: T): Promise<T> { try { return await p; } catch { return fb; } }
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "SUPER_ADMIN فقط" }, { status: 403 });
  const r = await Promise.allSettled([
    safe(db.user.count({ where: { deletedAt: null } }), 0),
    safe(db.user.count({ where: { status: "ACTIVE", deletedAt: null } }), 0),
    safe(db.user.count({ where: { role: "SUPER_ADMIN", deletedAt: null } }), 0),
    safe(db.user.count({ where: { isLocked: true, deletedAt: null } }), 0),
    safe(db.family.count(), 0),
    safe(db.district.count(), 0),
    safe(db.group.count(), 0),
    safe(db.fundRequest.count({ where: { status: "PENDING" } }), 0),
    safe(db.contribution.aggregate({ _sum: { amount: true } }), { _sum: { amount: 0 } }),
    safe(db.event.count(), 0),
    safe(db.blogPost.count({ where: { status: "published" } }), 0),
    safe(db.blogComment.count(), 0),
    safe(db.blogLike.count(), 0),
    safe(db.adSlot.count(), 0),
    safe(db.storeItem.count(), 0),
    safe(db.storeOrder.count(), 0),
    safe(db.discussion.count(), 0),
    safe(db.initiative.count(), 0),
    safe(db.priceReport.count(), 0),
    safe(db.cndpRequest.count(), 0),
    safe(db.auditLog.count(), 0),
    safe(db.featureFlag.count(), 0),
  ]);
  const g = <T,>(i: number, fb: T): T => r[i].status === "fulfilled" ? r[i].value as T : fb;
  const sections = [
    { key: "users", nameAr: "المستخدمون", count: g(0, 0), detail: `${g(1, 0)} نشط · ${g(2, 0)} سوبر` },
    { key: "families", nameAr: "العائلات", count: g(4, 0) },
    { key: "districts", nameAr: "الأحياء", count: g(5, 0) },
    { key: "groups", nameAr: "المجموعات", count: g(6, 0) },
    { key: "fund_pending", nameAr: "طلبات قيد الانتظار", count: g(7, 0) },
    { key: "contributions", nameAr: "إجمالي المساهمات", count: Number(g(8, { _sum: { amount: 0 } })._sum.amount ?? 0), detail: "درهم" },
    { key: "events", nameAr: "الفعاليات", count: g(9, 0) },
    { key: "blog_posts", nameAr: "مقالات منشورة", count: g(10, 0) },
    { key: "blog_comments", nameAr: "تعليقات", count: g(11, 0) },
    { key: "blog_likes", nameAr: "إعجابات", count: g(12, 0) },
    { key: "ads", nameAr: "مواضع إعلانية", count: g(13, 0) },
    { key: "store", nameAr: "منتجات المتجر", count: g(14, 0), detail: `${g(15, 0)} طلبات` },
    { key: "discussions", nameAr: "نقاشات", count: g(16, 0) },
    { key: "initiatives", nameAr: "مبادرات", count: g(17, 0) },
    { key: "price_reports", nameAr: "تقارير أسعار", count: g(18, 0) },
    { key: "cndp", nameAr: "طلبات CNDP", count: g(19, 0) },
    { key: "audit_logs", nameAr: "سجلّات التدقيق", count: g(20, 0) },
    { key: "feature_flags", nameAr: "Feature Flags", count: g(21, 0) },
  ];
  return NextResponse.json({ sections, security: [{ key: "locked", nameAr: "مقفولون", count: g(3, 0) }], generatedAt: new Date().toISOString() });
}
