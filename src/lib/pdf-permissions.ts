// ===================================================================
//  lib/pdf-permissions.ts — صلاحيات تحميل PDF
//  يتحقق: هل المستخدم يملك صلاحية تحميل نوع تقرير معيّن؟
// ===================================================================

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

export type ReportType = "FUND_REPORT" | "EVENT_REPORT" | "USER_DATA" | "LEDGER" | "ALL";

/** هل المستخدم يملك صلاحية تحميل هذا النوع؟ */
export async function checkDownloadPermission(reportType: ReportType): Promise<{ allowed: boolean; reason?: string }> {
  const user = await getCurrentUser();
  if (!user) return { allowed: false, reason: "NOT_AUTHENTICATED" };

  // السوبر أدمن يملك صلاحية دائمة
  if (user.role === "SUPER_ADMIN") return { allowed: true };

  // فحص جدول DownloadPermission
  const perm = await db.downloadPermission.findFirst({
    where: {
      userId: user.id,
      isActive: true,
      OR: [
        { reportType: reportType },
        { reportType: "ALL" },
      ],
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  if (!perm) {
    // تسجيل المحاولة المرفوضة
    await logDownloadAttempt(user.id, reportType, "DENIED", "NO_PERMISSION");
    return { allowed: false, reason: "NO_PERMISSION" };
  }

  return { allowed: true };
}

/** تسجيل محاولة تحميل (ناجح أو مرفوض) */
export async function logDownloadAttempt(
  userId: string,
  reportType: string,
  status: "GRANTED" | "DENIED",
  reason?: string,
  reportId?: string
) {
  try {
    await db.downloadLog.create({
      data: {
        userId,
        reportType,
        reportId,
        status,
        reason,
      },
    });
  } catch {
    // فشل التسجيل لا يمنع العملية
  }
}

/** منح صلاحية تحميل لمستخدم (SUPER_ADMIN فقط) */
export async function grantDownloadPermission(
  targetUserId: string,
  reportType: ReportType,
  grantedBy: string,
  expiresAt?: Date
) {
  return db.downloadPermission.create({
    data: {
      userId: targetUserId,
      reportType,
      grantedBy,
      expiresAt,
      isActive: true,
    },
  });
}

/** سحب صلاحية تحميل (SUPER_ADMIN فقط) */
export async function revokeDownloadPermission(permissionId: string) {
  return db.downloadPermission.update({
    where: { id: permissionId },
    data: { isActive: false },
  });
}

/** قائمة صلاحيات مستخدم */
export async function getUserPermissions(userId: string) {
  return db.downloadPermission.findMany({
    where: { userId, isActive: true },
    orderBy: { grantedAt: "desc" },
  });
}
