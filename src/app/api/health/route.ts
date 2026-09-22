// ===================================================================
//  /api/health — فحص صحة التطبيق + اتصال DB
//  GET آمن — لا يكشف credentials
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    // 1) اختبار اتصال DB
    await db.$queryRaw`SELECT 1`;

    // 2) عدّ البيانات
    const userCount = await db.user.count();
    const familyCount = await db.family.count();
    const contributionCount = await db.contribution.count();
    const fundRequestCount = await db.fundRequest.count();
    const eventCount = await db.event.count();

    // 3) hostname فقط (بدون credentials)
    const dbUrl = process.env.DATABASE_URL || "";
    let dbHost = "unknown";
    try {
      const match = dbUrl.match(/@([^:]+):(\d+)/);
      if (match) {
        dbHost = `${match[1]}:${match[2]}`;
      }
    } catch {
      // تجاهل
    }

    // 4) حالة الإعداد
    let setupCompleted = false;
    try {
      const setting = await db.setting.findUnique({
        where: { key: "setup_completed" },
      });
      setupCompleted = setting?.value === "true";
    } catch {
      // جدول Settings قد لا يكون موجوداً
    }

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      status: "connected",
      timestamp: new Date().toISOString(),
      responseTimeMs,
      database: {
        host: dbHost,
        users: userCount,
        families: familyCount,
        contributions: contributionCount,
        fundRequests: fundRequestCount,
        events: eventCount,
      },
      setup: {
        completed: setupCompleted,
        isEmpty: userCount === 0,
        hint:
          userCount === 0 && !setupCompleted
            ? "DB فارغ — شغّل POST /api/setup/seed مع x-setup-key header"
            : undefined,
      },
      env: {
        demoMode: process.env.DEMO_MODE === "true",
        smtpEnabled: process.env.SMTP_ENABLED === "true",
        nextauthUrl: process.env.NEXTAUTH_URL || "not set",
      },
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // تحديد نوع الخطأ
    let errorType = "unknown";
    if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("tenant")) {
      errorType = "supabase_paused";
    } else if (errorMessage.includes("ECONNREFUSED")) {
      errorType = "connection_refused";
    } else if (errorMessage.includes("Can't reach database")) {
      errorType = "unreachable";
    }

    return NextResponse.json(
      {
        status: "error",
        errorType,
        message: errorMessage.substring(0, 200),
        responseTimeMs,
        timestamp: new Date().toISOString(),
        hint:
          errorType === "supabase_paused"
            ? "Supabase project موقوف — استئنفه من https://supabase.com/dashboard/project/uigwfpddaawiwvsxmggj"
            : errorType === "unreachable"
            ? "DB غير متاح — تحقّق من DATABASE_URL في Vercel Environment Variables"
            : "تحقّق من إعدادات الاتصال",
      },
      { status: 500 }
    );
  }
}
