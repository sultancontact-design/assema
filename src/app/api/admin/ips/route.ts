// ===================================================================
//  /api/admin/ips — CRUD لقائمة IP المسموح بها
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { isValidIP } from "@/lib/ip-allowlist";

// GET — قائمة كل IPs
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin.settings")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const [ips, enabledSetting] = await Promise.all([
    db.allowedIP.findMany({
      orderBy: { createdAt: "desc" },
    }),
    db.setting.findUnique({
      where: { key: "security.ip_allowlist.enabled" },
    }),
  ]);

  return NextResponse.json({
    ips,
    enabled: enabledSetting?.value === "true",
  });
}

// POST — إضافة IP جديد
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin.settings")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const body = (await request.json()) as { ip: string; note?: string };
  const { ip, note } = body;

  if (!ip || !isValidIP(ip)) {
    return NextResponse.json(
      { error: "صيغة IP غير صالحة (IPv4 أو IPv6)" },
      { status: 400 }
    );
  }

  try {
    const created = await db.allowedIP.create({
      data: {
        ip,
        note: note?.trim() || null,
        createdBy: user.id,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "admin.ip.added",
        entity: "AllowedIP",
        entityId: created.id,
        metadata: JSON.stringify({ ip, note }),
        severity: "warning",
      },
    });

    return NextResponse.json({ success: true, ip: created }, { status: 201 });
  } catch (error) {
    const msg =
      error instanceof Error && error.message.includes("unique")
        ? "هذا IP موجود بالفعل"
        : "حدث خطأ أثناء الإضافة";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
