// ===================================================================
//  POST /api/admin/prices/cleanup
//  يحذف كل الأسعار المُولّدة من مصادر ممنوعة (MOCK/SEASONAL/SYNTHETIC/...)
//  SUPER_ADMIN فقط. يسجّل AuditLog.
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const FORBIDDEN_SOURCES = ["SEASONAL_FALLBACK", "MOCK", "SYNTHETIC", "FALLBACK", "SIMULATED"];

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  const before = await db.price.count({
    where: { source: { in: FORBIDDEN_SOURCES } },
  });

  if (before === 0) {
    return NextResponse.json({
      success: true,
      deletedCount: 0,
      message: "لا توجد أسعار مُصنّعة في قاعدة البيانات — لا حاجة للتنظيف.",
    });
  }

  const result = await db.price.deleteMany({
    where: { source: { in: FORBIDDEN_SOURCES } },
  });

  // سجلّ تدقّق إداري بحرجة
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.prices.cleanup",
      severity: "critical",
      metadata: JSON.stringify({
        deletedCount: result.count,
        forbiddenSources: FORBIDDEN_SOURCES,
        before,
      }),
    },
  });

  return NextResponse.json({
    success: true,
    deletedCount: result.count,
    message: `تم حذف ${result.count} سعراً مُصنّعاً.`,
  });
}

// GET: تقرير حالة الأسعار الحقيقية مقابل الممنوعة
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  const [total, realCount, fakeCount, bySource] = await Promise.all([
    db.price.count(),
    db.price.count({ where: { source: { notIn: FORBIDDEN_SOURCES } } }),
    db.price.count({ where: { source: { in: FORBIDDEN_SOURCES } } }),
    db.price.groupBy({
      by: ["source"],
      _count: true,
      orderBy: { _count: { source: "desc" } },
    }),
  ]);

  return NextResponse.json({
    total,
    realCount,
    fakeCount,
    bySource: bySource.map(s => ({ source: s.source, count: s._count.source })),
    forbiddenSources: FORBIDDEN_SOURCES,
  });
}
