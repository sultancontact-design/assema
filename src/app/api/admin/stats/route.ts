// ===================================================================
//  GET /api/admin/stats
//  يُرجع كل مؤشرات لوحة الإدارة دفعةً واحدة (KPIs + charts + activity)
//  يتطلّب تسجيل دخول + دور إداري
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin/stats";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES: Role[] = [
  "SUPER_ADMIN",
  "TREASURER",
  "ETHICS_COMMITTEE",
  "DISTRICT_MOD",
];

export async function GET() {
  // 1) المصادقة
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  // 2) فحص الدور
  if (!ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json(
      {
        error: `هذا الإجراء يتطلب أحد الأدوار: ${ALLOWED_ROLES.map(
          (r) => ROLE_LABELS[r].label
        ).join("، ")}`,
      },
      { status: 403 }
    );
  }

  try {
    const stats = await getAdminStats(user.districtId);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[/api/admin/stats] error:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإحصائيات" },
      { status: 500 }
    );
  }
}
