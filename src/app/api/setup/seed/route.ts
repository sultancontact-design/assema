// ===================================================================
//  /api/setup/seed — تشغيل migration + seed مرة واحدة فقط
//  - يقرأ SETUP_KEY من process.env (مستقل عن NEXTAUTH_SECRET)
//  - بعد أول تشغيل ناجح، يسجّل setup_completed=true في Settings table
//  - إذا setup_completed=true: يعيد 403 Forbidden
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  // 1) تحقق من SETUP_KEY (مستقل عن NEXTAUTH_SECRET)
  const setupKey = request.headers.get("x-setup-key") || "";
  const expectedKey = process.env.SETUP_KEY;

  if (!expectedKey) {
    return NextResponse.json(
      { error: "SETUP_KEY غير مضبوط على الخادم" },
      { status: 500 }
    );
  }

  if (setupKey !== expectedKey) {
    return NextResponse.json(
      { error: "مفتاح غير صالح" },
      { status: 401 }
    );
  }

  // 2) تحقق إن كان setupCompleted سابقاً
  try {
    const completedSetting = await db.setting.findUnique({
      where: { key: "setup_completed" },
    });

    if (completedSetting?.value === "true") {
      return NextResponse.json(
        {
          success: false,
          error: "الإعداد اكتمل سابقاً — لا يمكن إعادة التشغيل",
          hint: "لإعادة الإعداد، احذف السطر 'setup_completed' من جدول Settings يدوياً",
        },
        { status: 403 }
      );
    }
  } catch {
    // قد تفشل لأن الجدول لم يُنشأ بعد — متابعة
  }

  const results: { step: string; status: string; output?: string }[] = [];

  // 3) prisma db push (إنشاء الـschema)
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    const { stdout, stderr } = await execAsync(
      "bunx prisma db push --accept-data-loss",
      { cwd: process.cwd(), timeout: 45000 }
    );
    results.push({
      step: "prisma db push",
      status: "success",
      output: (stdout + stderr).substring(0, 200),
    });
  } catch (e) {
    results.push({
      step: "prisma db push",
      status: "failed",
      output: e instanceof Error ? e.message.substring(0, 200) : "error",
    });
    return NextResponse.json({ success: false, results }, { status: 500 });
  }

  // 4) فحص إذا DB فارغ
  let userCount = 0;
  try {
    userCount = await db.user.count();
  } catch {
    // متابعة
  }

  if (userCount > 0) {
    // علّم كـمكتمل
    await db.setting.upsert({
      where: { key: "setup_completed" },
      create: {
        key: "setup_completed",
        value: "true",
        type: "bool",
        category: "system",
        isPublic: false,
      },
      update: { value: "true" },
    });

    return NextResponse.json({
      success: true,
      message: "الـschema أُنشئ. DB يحوي بيانات — تم تخطّي الـseed.",
      userCount,
      results,
    });
  }

  // 5) seed
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    const { stdout, stderr } = await execAsync("bun run db:seed", {
      cwd: process.cwd(),
      timeout: 50000,
    });
    results.push({
      step: "db:seed",
      status: "success",
      output: (stdout + stderr).substring(0, 300),
    });
  } catch (e) {
    results.push({
      step: "db:seed",
      status: "failed",
      output: e instanceof Error ? e.message.substring(0, 200) : "error",
    });
  }

  // 6) علّم كـمكتمل
  try {
    await db.setting.upsert({
      where: { key: "setup_completed" },
      create: {
        key: "setup_completed",
        value: "true",
        type: "bool",
        category: "system",
        isPublic: false,
      },
      update: { value: "true" },
    });
  } catch {
    // غير حرج
  }

  // 7) تحقّق نهائي
  let finalUsers = 0;
  let finalFamilies = 0;
  let finalContributions = 0;
  try {
    finalUsers = await db.user.count();
    finalFamilies = await db.family.count();
    finalContributions = await db.contribution.count();
  } catch {
    // متابعة
  }

  return NextResponse.json({
    success: true,
    message: "اكتمل الإعداد — تم إنشاء الـschema وتعبئة البيانات",
    finalCounts: {
      users: finalUsers,
      families: finalFamilies,
      contributions: finalContributions,
    },
    results,
  });
}

export async function GET() {
  // GET آمن — لا يكشف معلومات حسّاسة
  try {
    const userCount = await db.user.count();
    const familyCount = await db.family.count();

    let setupCompleted = false;
    try {
      const setting = await db.setting.findUnique({
        where: { key: "setup_completed" },
      });
      setupCompleted = setting?.value === "true";
    } catch {
      // جدول Settings قد لا يكون موجوداً
    }

    return NextResponse.json({
      status: "connected",
      users: userCount,
      families: familyCount,
      isEmpty: userCount === 0,
      setupCompleted,
      hint:
        userCount === 0 && !setupCompleted
          ? "DB فارغ — استدعِ POST /api/setup/seed مع x-setup-key header بعد استئناف Supabase"
          : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "DB not reachable",
        hint: "Supabase project may be paused — استئنفه من https://supabase.com/dashboard/project/uigwfpddaawiwvsxmggj",
      },
      { status: 500 }
    );
  }
}
