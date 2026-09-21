// ===================================================================
//  RBAC — نظام الأدوار والصلاحيات
//  8 أدوار مع هرمية واضحة وصلاحيات تفصيلية
// ===================================================================

import type { Role } from "@prisma/client";
import { ROLE_HIERARCHY } from "@/lib/constants";

// ===================================================================
//  تعريف الصلاحيات (Permissions)
// ===================================================================

export type Permission =
  // المستخدمين
  | "user.view"
  | "user.create"
  | "user.edit"
  | "user.delete"
  | "user.role.change"
  | "user.status.change"
  // العائلات
  | "family.view"
  | "family.create"
  | "family.edit"
  | "family.delete"
  // الأحياء
  | "district.view"
  | "district.create"
  | "district.edit"
  | "district.delete"
  // المجموعات
  | "group.view"
  | "group.create"
  | "group.edit"
  | "group.delete"
  | "group.member.add"
  | "group.member.remove"
  | "group.member.approve"
  // صندوق المعروف
  | "fund.contribution.view"
  | "fund.contribution.create"
  | "fund.contribution.confirm"
  | "fund.contribution.reject"
  | "fund.request.view"
  | "fund.request.create"
  | "fund.request.review"
  | "fund.request.approve"     // موافقة لجنة النزاهة (الطلبات > 1000)
  | "fund.request.disburse"   // صرف المبلغ
  | "fund.report.view"
  | "fund.report.export"
  // الفعاليات
  | "event.view"
  | "event.create"
  | "event.edit"
  | "event.delete"
  | "event.register"
  | "event.manage-registrations"
  // الإعلانات
  | "ad.view"
  | "ad.create"
  | "ad.edit"
  | "ad.delete"
  | "ad.approve"
  // الشكاوى
  | "complaint.view"
  | "complaint.create"
  | "complaint.handle"
  | "complaint.resolve"
  // الإشعارات
  | "notification.send"
  | "notification.broadcast"
  // الإدارة
  | "admin.dashboard"
  | "admin.settings"
  | "admin.audit.view"
  | "admin.backup"
  | "admin.reports";

// ===================================================================
//  خريطة الأدوار → الصلاحيات
// ===================================================================

const ALL_USER_PERMISSIONS: Permission[] = [
  "user.view",
  "family.view",
  "district.view",
  "group.view",
  "fund.contribution.view",
  "fund.contribution.create",
  "fund.request.view",
  "fund.request.create",
  "event.view",
  "event.register",
  "complaint.create",
  "notification.send",
];

const MEMBER_PERMISSIONS: Permission[] = [
  ...ALL_USER_PERMISSIONS,
  "group.member.add",
];

const GROUP_LEADER_PERMISSIONS: Permission[] = [
  ...MEMBER_PERMISSIONS,
  "group.member.approve",
  "group.member.remove",
  "event.create",
  "event.edit",
  "notification.broadcast", // فقط داخل المجموعة
];

const ADS_MANAGER_PERMISSIONS: Permission[] = [
  ...MEMBER_PERMISSIONS,
  "ad.view",
  "ad.create",
  "ad.edit",
  "ad.approve",
];

const ETHICS_COMMITTEE_PERMISSIONS: Permission[] = [
  ...MEMBER_PERMISSIONS,
  "fund.request.view",
  "fund.request.approve", // تصويت على الطلبات > 1000
  "fund.report.view",
];

const TREASURER_PERMISSIONS: Permission[] = [
  ...MEMBER_PERMISSIONS,
  "fund.contribution.confirm",
  "fund.contribution.reject",
  "fund.request.view",
  "fund.request.review",
  "fund.request.disburse",
  "fund.report.view",
  "fund.report.export",
  "event.manage-registrations",
];

const DISTRICT_MOD_PERMISSIONS: Permission[] = [
  ...MEMBER_PERMISSIONS,
  "user.view",
  "family.create",
  "family.edit",
  "group.create",
  "group.edit",
  "group.member.approve",
  "group.member.remove",
  "event.create",
  "event.edit",
  "event.delete",
  "event.manage-registrations",
  "complaint.view",
  "complaint.handle",
  "complaint.resolve",
  "notification.broadcast",
];

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  // كل الصلاحيات
  "user.view",
  "user.create",
  "user.edit",
  "user.delete",
  "user.role.change",
  "user.status.change",
  "family.view",
  "family.create",
  "family.edit",
  "family.delete",
  "district.view",
  "district.create",
  "district.edit",
  "district.delete",
  "group.view",
  "group.create",
  "group.edit",
  "group.delete",
  "group.member.add",
  "group.member.remove",
  "group.member.approve",
  "fund.contribution.view",
  "fund.contribution.create",
  "fund.contribution.confirm",
  "fund.contribution.reject",
  "fund.request.view",
  "fund.request.create",
  "fund.request.review",
  "fund.request.approve",
  "fund.request.disburse",
  "fund.report.view",
  "fund.report.export",
  "event.view",
  "event.create",
  "event.edit",
  "event.delete",
  "event.register",
  "event.manage-registrations",
  "ad.view",
  "ad.create",
  "ad.edit",
  "ad.delete",
  "ad.approve",
  "complaint.view",
  "complaint.create",
  "complaint.handle",
  "complaint.resolve",
  "notification.send",
  "notification.broadcast",
  "admin.dashboard",
  "admin.settings",
  "admin.audit.view",
  "admin.backup",
  "admin.reports",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  GUEST: ["district.view", "event.view", "group.view", "fund.contribution.view", "complaint.create"],
  MEMBER: MEMBER_PERMISSIONS,
  GROUP_LEADER: GROUP_LEADER_PERMISSIONS,
  ADS_MANAGER: ADS_MANAGER_PERMISSIONS,
  ETHICS_COMMITTEE: ETHICS_COMMITTEE_PERMISSIONS,
  TREASURER: TREASURER_PERMISSIONS,
  DISTRICT_MOD: DISTRICT_MOD_PERMISSIONS,
  SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
};

// ===================================================================
//  دوال مساعدة (Helpers)
// ===================================================================

/** هل لدى الدور صلاحية محدّدة؟ */
export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) {
    return ROLE_PERMISSIONS.GUEST.includes(permission);
  }
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** هل لدى الدور أحد الصلاحيات؟ */
export function hasAnyPermission(role: Role | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** هل لدى الدور كل الصلاحيات؟ */
export function hasAllPermissions(role: Role | null | undefined, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/** هل الدور يفوق أو يساوي دوراً آخر في الهرمية؟ */
export function hasRoleLevel(role: Role | null | undefined, minRole: Role): boolean {
  if (!role) return false;
  return (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY[minRole];
}

/** هل الدور إداري (مشرف فأعلى)؟ */
export function isStaffRole(role: Role | null | undefined): boolean {
  if (!role) return false;
  return hasRoleLevel(role, "GROUP_LEADER");
}

/** هل الدور أمين صندوق أو أعلى (يحقّ له الصرف)؟ */
export function canDisburse(role: Role | null | undefined): boolean {
  return hasPermission(role, "fund.request.disburse");
}

/** هل الدور عضو لجنة نزاهة (يحقّ له التصويت)؟ */
export function isEthicsCommittee(role: Role | null | undefined): boolean {
  return role === "ETHICS_COMMITTEE" || role === "SUPER_ADMIN";
}

/** هل الدور سوبر أدمن؟ */
export function isSuperAdmin(role: Role | null | undefined): boolean {
  return role === "SUPER_ADMIN";
}

/** قائمة الأدوار التي تستطيع الوصول للوحة الإدارة */
export function getAdminAccessibleRoles(): Role[] {
  return (["SUPER_ADMIN", "DISTRICT_MOD", "TREASURER", "ADS_MANAGER", "ETHICS_COMMITTEE"] as Role[]);
}
