// ===================================================================
//  POST /api/admin/ads/settings — حفظ إعدادات قسم الإعلانات
//  - يستقبل خريطة { key: value } ويحفظها في جدول Setting
//  - يتطلّب صلاحية ad.edit (ADS_MANAGER أو SUPER_ADMIN)
//  - يقوم بـ upsert لكل مفتاح
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_PREFIXES = ["ads."] as const;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "ad.edit")) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لحفظ إعدادات الإعلانات" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | Record<string, string>
      | null;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "الجسم غير صالح" }, { status: 400 });
    }

    const entries = Object.entries(body);
    if (entries.length === 0) {
      return NextResponse.json({ error: "لا توجد قيم للحفظ" }, { status: 400 });
    }

    // تحقّق من البادئات المسموح بها فقط
    for (const [key] of entries) {
      if (!ALLOWED_PREFIXES.some((p) => key.startsWith(p))) {
        return NextResponse.json(
          { error: `المفتاح غير مسموح: ${key}` },
          { status: 400 }
        );
      }
    }

    // تنفيذ upsert لكل مفتاح/قيمة
    await db.$transaction(
      entries.map(([key, value]) =>
        db.setting.upsert({
          where: { key },
          update: {
            value: String(value),
            updatedAt: new Date(),
          },
          create: {
            key,
            value: String(value),
            type: "string",
            category: "ads",
            isPublic: false,
            description: `إعداد قسم الإعلانات (${key})`,
          },
        })
      )
    );

    // سجلّ التدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ad.settings_updated",
        entity: "Setting",
        entityId: "ads",
        severity: "info",
        metadata: JSON.stringify({ keys: entries.map(([k]) => k) }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/admin/ads/settings]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ الإعدادات" },
      { status: 500 }
    );
  }
}
