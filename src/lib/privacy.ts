// ===================================================================
//  privacy.ts — دوال إخفاء البيانات الحسّاسة
//  - maskPhone: إخفاء جزء من رقم الهاتف للعرض العام
//  - shouldMaskPhone: تحديد ما إذا كان يجب الإخفاء حسب الدور
//  - maskName: إخفاء جزء من الاسم (الأول + الحرف الأول من العائلة)
// ===================================================================

const STAFF_ROLES = ["SUPER_ADMIN", "TREASURER", "DISTRICT_MOD"] as const;

/**
 * إخفاء رقم الهاتف على الشكل "06XX-XX-XX-XX".
 * نُظهر أوّل 4 أرقام ثم نُخفي الباقي.
 * - يُفترض أن الرقم يحتوي على 10 أرقام على الأقل.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\s|-/g, "");
  if (cleaned.length < 8) return phone;
  // نأخذ أوّل 4 أرقام (مثلاً 0612) ثم نُخفي الباقي
  const head = cleaned.substring(0, 4);
  return `${head}-XX-XX-XX`;
}

/**
 * هل يجب إخفاء رقم الهاتف عن المستخدم الحالي؟
 * - العضو غير الإداري يرى الأرقام مُخفاة
 * - الإداريون (SUPER_ADMIN, TREASURER, DISTRICT_MOD) يرون الأرقام كاملة
 */
export function shouldMaskPhone(role: string | null | undefined): boolean {
  if (!role) return true;
  return !(STAFF_ROLES as readonly string[]).includes(role);
}

/**
 * إخفاء جزء من الاسم: "محمد بنعلي" → "محمد ب."
 * يُستعمل للعرض العام على الشريط والنشاطات.
 */
export function maskName(fullName: string | null | undefined): string {
  if (!fullName) return "زائر";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "زائر";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
}
