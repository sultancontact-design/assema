// POST: lock/unlock user
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  const { id } = await params;
  let body: Record<string, unknown> = {}; try { body = await request.json(); } catch {}
  const reason = typeof body.reason === "string" ? body.reason : "Locked by admin";
  // v61.0: use lockedUntil + status (isLocked column not in schema)
  await db.user.update({ where: { id }, data: { lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), status: "SUSPENDED" } }).catch(() => null);
  return NextResponse.json({ success: true, isLocked: true });
}
