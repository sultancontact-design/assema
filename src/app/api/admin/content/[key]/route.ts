// PATCH: update content item by key
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  const { key } = await params;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 }); }
  const value = typeof body.value === "string" ? body.value : undefined;
  if (value === undefined) return NextResponse.json({ error: "value مطلوب" }, { status: 400 });
  const updated = await db.siteContent.update({ where: { key }, data: { value, updatedBy: user.id } }).catch(() => null);
  if (!updated) return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });
  return NextResponse.json({ success: true, item: updated });
}
