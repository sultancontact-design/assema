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
  await db.user.update({ where: { id }, data: { isLocked: true, lockedReason: reason, status: "SUSPENDED" } }).catch(() => null);
  return NextResponse.json({ success: true, isLocked: true });
}
