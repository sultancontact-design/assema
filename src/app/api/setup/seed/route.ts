// ===================================================================
//  /api/setup/seed — تشغيل migration + seed مرة واحدة
//  يستدعى بعد استئناف Supabase project
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const setupKey = request.headers.get("x-setup-key") || body?.setupKey;

  // تحقق بسيط من المفتاح (يجب أن يطابق NEXTAUTH_SECRET)
  if (setupKey !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "مفتاح غير صالح" }, { status: 401 });
  }

  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    const results: { step: string; status: string; output?: string }[] = [];

    // 1) prisma db push (إنشاء الـschema)
    try {
      const { stdout, stderr } = await execAsync(
        "bunx prisma db push --accept-data-loss",
        { cwd: process.cwd(), timeout: 45000 }
      );
      results.push({
        step: "prisma db push",
        status: "success",
        output: (stdout + stderr).substring(0, 300),
      });
    } catch (e) {
      results.push({
        step: "prisma db push",
        status: "failed",
        output: e instanceof Error ? e.message.substring(0, 300) : "error",
      });
      return NextResponse.json({ success: false, results }, { status: 500 });
    }

    // 2) فحص إذا DB فارغ
    const userCount = await db.user.count();

    if (userCount > 0) {
      return NextResponse.json({
        success: true,
        message: "الـschema أُنشئ. DB يحوي بيانات — تم تخطّي الـseed.",
        userCount,
        results,
      });
    }

    // 3) seed
    try {
      const { stdout, stderr } = await execAsync("bun run db:seed", {
        cwd: process.cwd(),
        timeout: 50000,
      });
      results.push({
        step: "db:seed",
        status: "success",
        output: (stdout + stderr).substring(0, 500),
      });
    } catch (e) {
      results.push({
        step: "db:seed",
        status: "failed",
        output: e instanceof Error ? e.message.substring(0, 300) : "error",
      });
    }

    // 4) تحقّق نهائي
    const finalUsers = await db.user.count();
    const finalFamilies = await db.family.count();
    const finalContributions = await db.contribution.count();

    return NextResponse.json({
      success: true,
      message: "اكتمل الإعداد",
      finalCounts: {
        users: finalUsers,
        families: finalFamilies,
        contributions: finalContributions,
      },
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const userCount = await db.user.count();
    const familyCount = await db.family.count();
    return NextResponse.json({
      users: userCount,
      families: familyCount,
      isEmpty: userCount === 0,
      hint: userCount === 0 ? "DB فارغ — استدعِ POST /api/setup/seed بعد استئناف Supabase" : "DB يحوي بيانات",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "DB not reachable",
        hint: "Supabase project may be paused — استئنفه من https://supabase.com/dashboard/project/uigwfpddaawiwvsxmggj",
      },
      { status: 500 }
    );
  }
}
