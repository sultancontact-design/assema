// ===================================================================
//  GET /api/admin/backup/list — قائمة النسخ السابقة (آخر 50 سجل)
//  - يتطلّب صلاحية admin.backup
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "admin.backup")) {
      return NextResponse.json({ error: "ممنوع" }, { status: 403 });
    }

    const logs = await db.auditLog.findMany({
      where: { action: { startsWith: "backup." } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: { select: { id: true, fullName: true, email: true } },
      },
    });

    const items = logs.map((log) => {
      let meta: { type?: string; size?: number; filename?: string } = {};
      try {
        meta = JSON.parse(log.metadata ?? "{}");
      } catch {
        // تجاهل
      }
      return {
        id: log.id,
        action: log.action,
        type: meta.type ?? log.action.replace("backup.", ""),
        size: meta.size ?? 0,
        filename: meta.filename ?? "",
        downloadedBy: log.actor?.fullName ?? "النظام",
        createdAt:
          log.createdAt instanceof Date
            ? log.createdAt.toISOString()
            : String(log.createdAt),
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/admin/backup/list]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب قائمة النسخ" },
      { status: 500 }
    );
  }
}
