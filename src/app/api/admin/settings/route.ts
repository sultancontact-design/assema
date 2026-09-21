// ===================================================================
//  POST /api/admin/settings — stub (لا يُطبّق فعلياً في النسخة التجريبية)
//  يتحقّق من المصادقة + الدور، يُرجع success:true بدون حفظ
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: Role[] = ["SUPER_ADMIN"];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        {
          error: `هذا الإجراء يتطلب دور: ${ROLE_LABELS.SUPER_ADMIN.label}`,
        },
        { status: 403 }
      );
    }

    // نستهلك الجسم فقط لإثبات صحّته (لا نحفظ)
    await request.json().catch(() => null);

    return NextResponse.json({
      success: true,
      message: "تم استلام الإعدادات (stub — لن تُحفظ فعلياً في النسخة التجريبية)",
    });
  } catch (err) {
    console.error("[POST /api/admin/settings]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الإعدادات" },
      { status: 500 }
    );
  }
}
