// ===================================================================
//  ip-allowlist.ts — مساعد قائمة IP المسموح بها
// ===================================================================

import { db } from "@/lib/db";

/**
 * يستخرج IP الزائر من headers الطلب
 * - يفحص x-forwarded-for أولاً (يأخذ أول IP)
 * - ثم x-real-ip
 * - ثم fallback إلى 127.0.0.1
 */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const real = headers.get("x-real-ip");
  if (real) {
    return real.trim();
  }
  return "127.0.0.1";
}

/**
 * يتحقق من صيغة IPv4 أو IPv6
 */
export function isValidIP(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    return ip.split(".").every((part) => {
      const n = Number(part);
      return n >= 0 && n <= 255;
    });
  }
  // IPv6 (basic check)
  return ip.includes(":") && ip.length >= 2;
}

/**
 * هل قائمة IP المسموح بها مُفعّلة؟
 * يقرأ من جدول Setting (key: security.ip_allowlist.enabled)
 */
export async function isAllowlistEnabled(): Promise<boolean> {
  try {
    const setting = await db.setting.findUnique({
      where: { key: "security.ip_allowlist.enabled" },
    });
    return setting?.value === "true";
  } catch {
    return false;
  }
}

/**
 * يتحقق إن كان IP مسموحاً به
 * - إذا القائمة غير مُفعّلة: مسموح دائماً
 * - إذا مُفعّلة: يلزم وجود IP في جدول AllowedIP مع isActive=true
 */
export async function isIPAllowed(ip: string): Promise<{
  allowed: boolean;
  reason: string;
}> {
  const enabled = await isAllowlistEnabled();
  if (!enabled) {
    return { allowed: true, reason: "allowlist_disabled" };
  }

  const allowed = await db.allowedIP.findFirst({
    where: { ip, isActive: true },
    select: { id: true, note: true },
  });

  return allowed
    ? { allowed: true, reason: "in_allowlist" }
    : { allowed: false, reason: "not_in_allowlist" };
}

/**
 * يحضّر القائمة كاملة للعرض
 */
export async function getAllowlist() {
  return db.allowedIP.findMany({
    orderBy: { createdAt: "desc" },
  });
}
