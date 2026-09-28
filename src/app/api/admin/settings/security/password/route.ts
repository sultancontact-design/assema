import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "كلمة المرور الحالية والجديدة مطلوبتان" }, { status: 400 });
  }
  if (newPassword.length < 12) {
    return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون 12+ حرفاً" }, { status: 400 });
  }
  if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
    return NextResponse.json({ error: "كلمة المرور تحتاج: حرف كبير + رقم + رمز خاص" }, { status: 400 });
  }

  // جلب الـ hash الحالي
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!dbUser) return NextResponse.json({ error: "مستخدم غير موجود" }, { status: 404 });

  // التحقق من كلمة المرور الحالية
  const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 403 });
  }

  // تحديث كلمة المرور
  const newHash = await bcrypt.hash(newPassword, 10);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  // سجلّ التدقيق
  await db.auditLog.create({
    data: {
      action: "user.password.change",
      entity: "User",
      entityId: user.id,
      severity: "info",
      actorId: user.id,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
