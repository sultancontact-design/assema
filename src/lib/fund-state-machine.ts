// ===================================================================
//  fund-state-machine.ts — آلة حالة طلب المعروف
//  تحكم الانتقالات المسموحة حسب الدور + المبلغ
// ===================================================================

import type { Role, FundRequestStatus } from "@prisma/client";
import { ETHICS_COMMITTEE_THRESHOLD } from "@/lib/constants";

// ===================================================================
//  الانتقالات المسموحة
//  الصيغة: [الحالة_الحالية] = [{ to, roles, requiresEthics? }]
// ===================================================================

interface Transition {
  to: FundRequestStatus;
  roles: Role[];
  requiresAmount?: "lt_threshold" | "gte_threshold"; // شرط المبلغ
  needsDisbursement?: boolean; // هل يتطلّب تفاصيل الصرف؟
}

export const VALID_TRANSITIONS: Record<FundRequestStatus, Transition[]> = {
  SUBMITTED: [
    { to: "UNDER_REVIEW", roles: ["TREASURER", "SUPER_ADMIN"] },
    { to: "REJECTED", roles: ["TREASURER", "SUPER_ADMIN"] },
  ],
  UNDER_REVIEW: [
    // للمبالغ < 1000: الأمين يوافق مباشرة
    {
      to: "APPROVED",
      roles: ["TREASURER", "SUPER_ADMIN"],
      requiresAmount: "lt_threshold",
    },
    // للمبالغ ≥ 1000: يُرسل للجنة (تصبح APPROVED فقط بعد 3 موافقات)
    {
      to: "APPROVED",
      roles: ["TREASURER", "SUPER_ADMIN"],
      requiresAmount: "gte_threshold",
      // ملاحظة: للطلبات ≥ 1000، APPROVED يتطلّب 3 موافقات من لجنة النزاهة
      // الـvote API يُحدّث الحالة تلقائياً بعد 3 موافقات
    },
    {
      to: "REJECTED",
      roles: ["TREASURER", "SUPER_ADMIN"],
    },
  ],
  APPROVED: [
    {
      to: "DISBURSED",
      roles: ["TREASURER", "SUPER_ADMIN"],
      needsDisbursement: true,
    },
    { to: "REJECTED", roles: ["TREASURER", "SUPER_ADMIN"] },
  ],
  DISBURSED: [
    { to: "COMPLETED", roles: ["TREASURER", "SUPER_ADMIN"] },
  ],
  REJECTED: [], // حالة نهائية
  COMPLETED: [], // حالة نهائية
};

// ===================================================================
//  دوال مساعدة
// ===================================================================

/** هل يمكن الانتقال من حالة إلى أخرى؟ */
export function canTransition(
  from: FundRequestStatus,
  to: FundRequestStatus,
  role: Role,
  amountRequested: number
): boolean {
  const transitions = VALID_TRANSITIONS[from] ?? [];
  return transitions.some((t) => {
    if (t.to !== to) return false;
    if (!t.roles.includes(role)) return false;
    if (t.requiresAmount === "lt_threshold" && amountRequested >= ETHICS_COMMITTEE_THRESHOLD) {
      return false;
    }
    if (t.requiresAmount === "gte_threshold" && amountRequested < ETHICS_COMMITTEE_THRESHOLD) {
      return false;
    }
    return true;
  });
}

/** الحالات التالية المسموحة لهذا الدور */
export function getNextStates(
  current: FundRequestStatus,
  role: Role,
  amountRequested: number
): FundRequestStatus[] {
  const transitions = VALID_TRANSITIONS[current] ?? [];
  return transitions
    .filter((t) => {
      if (!t.roles.includes(role)) return false;
      if (t.requiresAmount === "lt_threshold" && amountRequested >= ETHICS_COMMITTEE_THRESHOLD) {
        return false;
      }
      if (t.requiresAmount === "gte_threshold" && amountRequested < ETHICS_COMMITTEE_THRESHOLD) {
        return false;
      }
      return true;
    })
    .map((t) => t.to);
}

/** هل يتطلّب تفاصيل الصرف؟ */
export function needsDisbursement(
  from: FundRequestStatus,
  to: FundRequestStatus
): boolean {
  const transitions = VALID_TRANSITIONS[from] ?? [];
  return transitions.some((t) => t.to === to && t.needsDisbursement === true);
}

/** هل الحالة نهائية (لا رجوع منها)؟ */
export function isTerminalState(status: FundRequestStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}
