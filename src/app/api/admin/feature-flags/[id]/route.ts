// PATCH: update flag status | DELETE: remove flag
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
const VALID_STATUSES = ["ACTIVE", "HIDDEN", "MAINTENANCE", "COMING_SOON", "DISABLED"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "SUPER_ADMIN فقط" }, { status: 403 });
  const { id } = await params;
  const existing = await db.featureFlag.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (typeof body.status === "string" && VALID_STATUSES.includes(body.status.toUpperCase())) data.status = body.status.toUpperCase();
  if (typeof body.message === "string") data.message = body.message || null;
  if (typeof body.nameAr === "string") data.nameAr = body.nameAr;
  if (typeof body.description === "string") data.description = body.description || null;
  data.updatedBy = user.id;
  const updated = await db.featureFlag.update({ where: { id }, data });
  return NextResponse.json({ success: true, flag: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "SUPER_ADMIN فقط" }, { status: 403 });
  const { id } = await params;
  await db.featureFlag.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ success: true });
}
