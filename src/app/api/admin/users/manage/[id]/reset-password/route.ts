// POST: reset password (generates secure 16-char password)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
export const dynamic = "force-dynamic";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  const { id } = await params;
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let pwd = ""; for (let i = 0; i < 16; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  const passwordHash = await bcrypt.hash(pwd, 12);
  await db.user.update({ where: { id }, data: { passwordHash } });
  return NextResponse.json({ success: true, temporaryPassword: pwd, message: "كلمة المرور الجديدة (اعرضها للمستخدم)" });
}
