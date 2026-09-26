// GET: list all images | (SUPER_ADMIN)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  const items = await db.imageAsset.findMany({ orderBy: [{ section: "asc" }, { key: "asc" }] });
  return NextResponse.json({ items, count: items.length });
}
