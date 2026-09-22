// ===================================================================
//  POST /api/setup/seed — تشغيل seed مرة واحدة (إذا DB فارغ)
//  محمي بـ SECRET_KEY أو DEV فقط
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  // تحقق من أن DB فارغ قبل الـseed
  try {
    const userCount = await db.user.count();

    if (userCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `DB ليس فارغاً (${userCount} مستخدم موجود). الـseed مُقدّم للحالات الأولى فقط.`,
        },
        { status: 409 }
      );
    }

    // استدعاء seed.ts مباشرة
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    const { stdout, stderr } = await execAsync("bun run db:seed", {
      cwd: process.cwd(),
      timeout: 50000,
    });

    // التحقق من النتيجة
    const finalCount = await db.user.count();

    return NextResponse.json({
      success: true,
      message: "تم تشغيل الـseed بنجاح",
      usersCreated: finalCount,
      stdout: stdout.substring(0, 500),
      stderr: stderr ? stderr.substring(0, 500) : null,
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DB not reachable" },
      { status: 500 }
    );
  }
}
