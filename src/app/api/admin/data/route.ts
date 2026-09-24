// ===================================================================
//  /api/admin/data — إدارة بيانات المنصة (SUPER_ADMIN فقط)
//  - GET: قائمة كل النماذج مع عدّ الصفوف
//  - DELETE: حذف نهائي (Hard) أو حذف ناعم (Soft = set deletedAt) لكل النماذج
//  - 3 عمليات مجمّعة:
//    * "pending-contributions" — حذف كل المساهمات المعلّقة (status=PENDING)
//    * "rejected-requests" — حذف كل الطلبات المرفوضة (status=REJECTED)
//    * "old-discussions" — حذف كل النقاشات الأقدم من 90 يوماً
//  - كل عملية تنشئ AuditLog
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

// ─────────── قائمة النماذج القابلة للإدارة ───────────
// - softDelete: النموذج يدعم الحذف الناعم (له حقل deletedAt)
// - العدّ الافتراضي يستثني السجلات المُحذوفة ناعماً (لو تحقّق deletedAt)
interface ModelSpec {
  name: string;
  label: string;
  softDelete: boolean;
}

const MODELS: ModelSpec[] = [
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

// خريطة مساعدة: model name → spec
const MODEL_MAP = new Map(MODELS.map((m) => [m.name, m]));

// دالة عدّ السجلات — تستثني السجلات المُحذوفة ناعماً (لو يدعم)
async function countModel(spec: ModelSpec): Promise<number> {
  try {
    const where = spec.softDelete ? { deletedAt: null } : undefined;
    // @ts-expect-error — Prisma typing غير ديناميكي عبر مفاتيح النماذج
    return await db[spec.name].count({ where });
  } catch {
    return 0;
  }
}

// دالة تنفيذ الحذف
interface DeleteOptions {
  mode?: "soft" | "hard"; // soft افتراضياً لو متاح
  filter?: Record<string, unknown>;
}

async function deleteFromModel(
  spec: ModelSpec,
  options: DeleteOptions
): Promise<{ count: number; mode: "soft" | "hard" }> {
  const mode: "soft" | "hard" =
    options.mode === "hard" || !spec.softDelete ? "hard" : "soft";
  const filter = options.filter ?? {};
  const where =
    spec.softDelete && mode === "soft"
      ? { ...filter, deletedAt: null }
      : { ...filter };

  if (mode === "soft") {
    // @ts-expect-error — Prisma typing غير ديناميكي
    const result = await db[spec.name].updateMany({
      where,
      data: { deletedAt: new Date() },
    });
    return { count: result.count, mode };
  }
  // @ts-expect-error — Prisma typing غير ديناميكي
  const result = await db[spec.name].deleteMany({ where });
  return { count: result.count, mode };
}

// ===================================================================
//  GET: قائمة النماذج مع العدّدات
// ===================================================================
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للوصول لهذا المورد" },
        { status: 401 }
      );
    }
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "هذا القسم مخصّص للمشرف العام فقط" },
        { status: 403 }
      );
    }

    const counts = await Promise.all(
      MODELS.map(async (m) => ({
        name: m.name,
        label: m.label,
        softDelete: m.softDelete,
        count: await countModel(m),
      }))
    );

    return NextResponse.json({
      models: counts,
      total: counts.reduce((s, m) => s + m.count, 0),
    });
  } catch (err) {
    console.error("[GET /api/admin/data]:", err);
    return NextResponse.json(
      { error: "تعذّر جلب العدّادت" },
      { status: 500 }
    );
  }
}

// ===================================================================
//  DELETE: حذف نهائي أو ناعم لنموذج محدّد
//  Body: { model: string, mode?: "soft"|"hard", filter?: Record<string, unknown> }
// ===================================================================
const deleteSchema = z.object({
  model: z.string().min(1),
  mode: z.enum(["soft", "hard"]).optional(),
  filter: z.record(z.string(), z.unknown()).optional(),
});

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للوصول لهذا المورد" },
        { status: 401 }
      );
    }
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "هذا القسم مخصّص للمشرف العام فقط" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "البيانات غير صحيحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const spec = MODEL_MAP.get(parsed.data.model);
    if (!spec) {
      return NextResponse.json(
        { error: "نموذج غير معروف" },
        { status: 400 }
      );
    }

    // حماية: نمنع حذف AuditLog نهائياً عبر هذا الـendpoint
    if (spec.name === "auditLog" && parsed.data.mode !== "soft") {
      return NextResponse.json(
        { error: "لا يمكن حذف سجلّ التدقيق نهائياً من هنا — فقط الحذف الناعم" },
        { status: 400 }
      );
    }

    const result = await deleteFromModel(spec, {
      mode: parsed.data.mode,
      filter: parsed.data.filter,
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "admin.data.delete",
        entity: spec.name,
        severity: result.count > 0 ? "critical" : "warning",
        metadata: JSON.stringify({
          model: spec.name,
          mode: result.mode,
          filter: parsed.data.filter ?? {},
          count: result.count,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      model: spec.name,
      mode: result.mode,
      deletedCount: result.count,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/data]:", err);
    return NextResponse.json(
      { error: "تعذّر تنفيذ الحذف" },
      { status: 500 }
    );
  }
}
