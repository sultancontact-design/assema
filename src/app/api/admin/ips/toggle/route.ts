// ===================================================================
//  /api/admin/ips/toggle — تفعيل/تعطيل قائمة IP
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin.settings")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const body = (await request.json()) as { enabled: boolean };

  await db.setting.upsert({
    where: { key: "security.ip_allowlist.enabled" },
    create: {
      key: "security.ip_allowlist.enabled",
      value: body.enabled ? "true" : "false",
      type: "bool",
      category: "security",
      isPublic: false,
      description: "تفعيل قائمة IP المسموح بها",
    },
    update: {
      value: body.enabled ? "true" : "false",
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.ip.allowlist_toggled",
      entity: "Setting",
      entityId: "security.ip_allowlist.enabled",
      metadata: JSON.stringify({ enabled: body.enabled }),
      severity: body.enabled ? "critical" : "info",
    },
  });

  return NextResponse.json({ success: true, enabled: body.enabled });
}
