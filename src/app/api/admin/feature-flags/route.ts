// GET: list all flags | POST: upsert flag (SUPER_ADMIN)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["SUPER_ADMIN", "DISTRICT_MODERATOR"].includes(user.role)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }
  const flags = await db.featureFlag.findMany({ orderBy: [{ status: "asc" }, { key: "asc" }] });
  return NextResponse.json({ flags, count: flags.length });
}

const VALID_STATUSES = ["ACTIVE", "HIDDEN", "MAINTENANCE", "COMING_SOON", "DISABLED"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "SUPER_ADMIN فقط" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }
  const key = String(body.key ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  const nameAr = String(body.nameAr ?? "").trim();
  const description = body.description ? String(body.description) : null;
  const category = body.category ? String(body.category) : null;
  const status = String(body.status ?? "ACTIVE").toUpperCase();
  const message = body.message ? String(body.message) : null;
  if (!key || !nameAr) return NextResponse.json({ error: "key و nameAr مطلوبان" }, { status: 400 });
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: "status غير صالح" }, { status: 400 });

  const flag = await db.featureFlag.upsert({
    where: { key },
    create: { key, nameAr, description, category, status, message, updatedBy: user.id },
    update: { nameAr, description, category, status, message, updatedBy: user.id },
  });
  return NextResponse.json({ success: true, flag }, { status: 201 });
}
