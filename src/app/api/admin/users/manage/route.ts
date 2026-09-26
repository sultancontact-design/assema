// GET: list users | POST: create user (SUPER_ADMIN)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const search = searchParams.get("q");
  const where: Record<string, unknown> = { deletedAt: null };
  if (search) where.OR = [{ fullName: { contains: search } }, { email: { contains: search } }, { phone: { contains: search } }];
  const [users, total] = await Promise.all([db.user.findMany({ where, select: { id: true, fullName: true, email: true, phone: true, role: true, status: true, isLocked: true, lastLoginAt: true, createdAt: true, district: { select: { nameAr: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * 20, take: 20 }), db.user.count({ where })]);
  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / 20) });
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 }); }
  const firstName = String(body.firstName ?? "").trim(); const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase(); const phone = String(body.phone ?? "").trim();
  const role = String(body.role ?? "MEMBER").toUpperCase();
  if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^0\d{9}$/.test(phone)) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  const existingEmail = await db.user.findUnique({ where: { email } }); if (existingEmail) return NextResponse.json({ error: "البريد مستعمل" }, { status: 400 });
  const existingPhone = await db.user.findUnique({ where: { phone } }); if (existingPhone) return NextResponse.json({ error: "الهاتف مستعمل" }, { status: 400 });
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let pwd = ""; for (let i = 0; i < 16; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  const passwordHash = await bcrypt.hash(pwd, 12);
  const firstDistrict = await db.district.findFirst({ orderBy: { createdAt: "asc" } });
  if (!firstDistrict) return NextResponse.json({ error: "لا توجد أحياء" }, { status: 500 });
  const newUser = await db.user.create({ data: { firstName, lastName, fullName: `${firstName} ${lastName}`, email, phone, role: role as never, status: "ACTIVE", passwordHash, districtId: firstDistrict.id, createdBy: user.id } });
  return NextResponse.json({ success: true, userId: newUser.id, temporaryPassword: pwd }, { status: 201 });
}
