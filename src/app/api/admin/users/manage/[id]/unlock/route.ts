// POST: unlock user
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  const { id } = await params;
  await db.user.update({ where: { id }, data: { isLocked: false, lockedReason: null, status: "ACTIVE" } }).catch(() => null);
  return NextResponse.json({ success: true, isLocked: false });
}
