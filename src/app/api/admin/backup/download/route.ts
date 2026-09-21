// ===================================================================
//  GET /api/admin/backup/download — تنزيل ملف قاعدة البيانات SQLite
//  - يتطلّب صلاحية admin.backup
//  - يقرأ db/custom.db ويرسله كـbinary
//  - يدعم ?filename= لتنزيل نسخة سابقة
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { promises as fs } from "node:fs";
import { resolve } from "node:path";

export const dynamic = "force-dynamic";

const DB_FILE_PATH = resolve(process.cwd(), "db/custom.db");
const BACKUPS_DIR = resolve(process.cwd(), "db/backups");

function safeFilename(name: string): string {
  // نمنع path traversal: نأخذ اسم الملف فقط
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "");
  return base.endsWith(".db") || base.endsWith(".json") ? base : `${base}.db`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "admin.backup")) {
      return NextResponse.json({ error: "ممنوع" }, { status: 403 });
    }

    const url = new URL(request.url);
    const requestedFilename = url.searchParams.get("filename");
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);

    let filePath: string;
    let filename: string;
    let isJson = false;

    if (requestedFilename) {
      // محاولة تنزيل نسخة سابقة — نبحث عنها في backups dir
      const safe = safeFilename(requestedFilename);
      filePath = resolve(BACKUPS_DIR, safe);
      filename = safe;
      isJson = safe.endsWith(".json");
      try {
        await fs.access(filePath);
      } catch {
        return NextResponse.json(
          { error: "النسخة غير موجودة محلياً" },
          { status: 404 }
        );
      }
    } else {
      filePath = DB_FILE_PATH;
      filename = `syba-backup-${dateStr}.db`;
    }

    let buf: Buffer;
    try {
      const data = await fs.readFile(filePath);
      buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    } catch {
      return NextResponse.json(
        { error: "تعذّر قراءة ملف النسخة" },
        { status: 500 }
      );
    }

    const stat = await fs.stat(filePath).catch(() => ({ size: buf.length }));

    // سجلّ التدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "backup.download",
        entity: "Database",
        entityId: null,
        severity: "info",
        metadata: JSON.stringify({
          type: isJson ? "json" : "db",
          size: stat.size,
          filename,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": isJson ? "application/json" : "application/octet-stream",
        "Content-Length": String(buf.length),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/backup/download]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء التنزيل" },
      { status: 500 }
    );
  }
}
