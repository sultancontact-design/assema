// PATCH: update user | DELETE: soft delete
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
const VALID_ROLES = ["GUEST", "MEMBER", "GROUP_LEADER", "DISTRICT_MODERATOR", "ADS_MANAGER", "ETHICS_COMMITTEE", "TREASURER", "SUPER_ADMIN"];
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  const { id } = await params;
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 }); }
  const data: Record<string, unknown> = {};
  if (typeof body.role === "string" && VALID_ROLES.includes(body.role.toUpperCase())) data.role = body.role.toUpperCase();
  if (typeof body.status === "string") data.status = body.status;
  if (typeof body.firstName === "string") { data.firstName = body.firstName; data.fullName = `${body.firstName} ${existing.lastName}`; }
  if (typeof body.lastName === "string") { data.lastName = body.lastName; data.fullName = `${existing.firstName} ${body.lastName}`; }
  const updated = await db.user.update({ where: { id }, data, select: { id: true, fullName: true, email: true, role: true, status: true } });
  return NextResponse.json({ success: true, user: updated });
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  const { id } = await params;
  if (id === user.id) return NextResponse.json({ error: "لا يمكن حذف حسابك" }, { status: 400 });
  await db.user.update({ where: { id }, data: { deletedAt: new Date(), isLocked: true, status: "SUSPENDED" } }).catch(() => null);
  return NextResponse.json({ success: true });
}
