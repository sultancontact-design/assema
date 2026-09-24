import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { grantDownloadPermission, revokeDownloadPermission } from "@/lib/pdf-permissions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin.settings")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { userId, reportType, expiresAt } = await request.json();
  if (!userId || !reportType) {
    return NextResponse.json({ error: "المستخدم ونوع التقرير مطلوبان" }, { status: 400 });
  }
  const perm = await grantDownloadPermission(userId, reportType, user.id, expiresAt ? new Date(expiresAt) : undefined);
  return NextResponse.json({ success: true, id: perm.id }, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "admin.settings")) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const permissions = await db.downloadPermission.findMany({ orderBy: { grantedAt: "desc" }, take: 50 });
  return NextResponse.json(permissions);
}
