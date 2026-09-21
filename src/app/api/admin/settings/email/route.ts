// ===================================================================
//  POST /api/admin/settings/email — حفظ إعدادات SMTP
//  - SUPER_ADMIN فقط
//  - يخزّن القيم في جدول Setting (مفاتيح smtp.*)
//  - ملاحظة أمنية: smtp.pass تُخزَّن كنص عادي (MVP). لا تُشفَّر.
//    لنُدفع المسؤولية للمستخدم: يجب أن يضبط صلاحيات DB والـenv بعناية.
//  - AuditLog: admin.email.settings_updated
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateTransport } from "@/lib/mailer";
import { ROLE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = [
  "smtp.host",
  "smtp.port",
  "smtp.user",
  "smtp.pass",
  "smtp.from",
  "smtp.enabled",
] as const;

type AllowedKey = (typeof ALLOWED_KEYS)[number];

interface SettingsPayload {
  "smtp.host"?: string;
  "smtp.port"?: string | number;
  "smtp.user"?: string;
  "smtp.pass"?: string;
  "smtp.from"?: string;
  "smtp.enabled"?: boolean | string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: `هذا الإجراء يتطلب دور: ${ROLE_LABELS.SUPER_ADMIN.label}`,
        },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as SettingsPayload | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "الجسم غير صالح" }, { status: 400 });
    }

    // تطهير المدخلات
    const cleaned: Record<AllowedKey, string> = {
      "smtp.host": String(body["smtp.host"] ?? "").trim(),
      "smtp.port": String(body["smtp.port"] ?? "587").trim(),
      "smtp.user": String(body["smtp.user"] ?? "").trim(),
      "smtp.pass": String(body["smtp.pass"] ?? ""),
      "smtp.from": String(body["smtp.from"] ?? "").trim(),
      "smtp.enabled":
        typeof body["smtp.enabled"] === "boolean"
          ? body["smtp.enabled"]
            ? "true"
            : "false"
          : String(body["smtp.enabled"] ?? "false")
              .trim()
              .toLowerCase(),
    };

    // تحقّق من المضيف (اسم نطاق أو IP)
    if (cleaned["smtp.host"] && cleaned["smtp.host"].length > 200) {
      return NextResponse.json(
        { error: "اسم المضيف SMTP_HOST أطول من اللازم" },
        { status: 400 }
      );
    }

    // تحقّق من المنفذ
    const portNum = parseInt(cleaned["smtp.port"], 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return NextResponse.json(
        { error: "المنفذ يجب أن يكون عدداً بين 1 و 65535" },
        { status: 400 }
      );
    }

    // تحقّق من صيغة المرسِل
    if (cleaned["smtp.from"] && !/.+@.+\..+/.test(cleaned["smtp.from"])) {
      return NextResponse.json(
        { error: "صيغة المُرسِل (SMTP_FROM) غير صحيحة" },
        { status: 400 }
      );
    }

    // upsert لكل مفتاح
    const entries = Object.entries(cleaned) as [AllowedKey, string][];
    await db.$transaction(
      entries.map(([key, value]) =>
        db.setting.upsert({
          where: { key },
          update: {
            value,
            updatedAt: new Date(),
          },
          create: {
            key,
            value,
            type: key === "smtp.enabled" ? "bool" : "string",
            category: "smtp",
            isPublic: false,
            description: `إعداد SMTP (${key})`,
          },
        })
      )
    );

    // أبطِل كاش الـtransporter ليعيد القراءة
    invalidateTransport();

    // سجلّ تدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "admin.email.settings_updated",
        entity: "Setting",
        entityId: "smtp",
        metadata: JSON.stringify({
          host: cleaned["smtp.host"] ? "***set***" : "",
          port: cleaned["smtp.port"],
          user: cleaned["smtp.user"] ? "***set***" : "",
          pass: cleaned["smtp.pass"] ? "***set***" : "",
          from: cleaned["smtp.from"],
          enabled: cleaned["smtp.enabled"] === "true",
        }),
        severity: "warning",
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تمّ حفظ إعدادات SMTP بنجاح",
    });
  } catch (err) {
    console.error("[POST /api/admin/settings/email]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ الإعدادات" },
      { status: 500 }
    );
  }
}

// ===================================================================
//  GET /api/admin/settings/email — جلب الإعدادات الحالية
//  - لا يُرجِع كلمة المرور (تُستبدل بـ"***")
// ===================================================================

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لعرض إعدادات البريد" },
        { status: 403 }
      );
    }

    const settings = await db.setting.findMany({
      where: { key: { in: [...ALLOWED_KEYS] } },
      select: { key: true, value: true },
    });

    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    const passSet = !!map["smtp.pass"] || !!process.env.SMTP_PASS;

    return NextResponse.json({
      settings: {
        host: map["smtp.host"] || process.env.SMTP_HOST || "smtp-relay.brevo.com",
        port: parseInt(map["smtp.port"] || process.env.SMTP_PORT || "587", 10),
        user: map["smtp.user"] || process.env.SMTP_USER || "",
        // لا نُرجِع كلمة المرور — نُرجِع مؤشّر وجودها فقط
        pass: "",
        passSet,
        from:
          map["smtp.from"] ||
          process.env.SMTP_FROM ||
          "سيدي يوسف بن علي العاصمة <noreply@syba-community.ma>",
        enabled:
          (map["smtp.enabled"] ?? process.env.SMTP_ENABLED ?? "false")
            .toLowerCase() === "true",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/settings/email]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإعدادات" },
      { status: 500 }
    );
  }
}
