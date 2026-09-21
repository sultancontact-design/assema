// ===================================================================
//  two-factor.ts — مكتبة المصادقة الثنائية (TOTP)
//  - توليد السر + رابط otpauth
//  - التحقّق من رمز TOTP (window=1)
//  - توليد رموز النسخ الاحتياطي (10 × 8 أحرف)
//  - تجزئة bcrypt لرموز النسخ + التحقق وإزالة المستخدَم
//  - تذاكر مؤقّتة موقّعة (HMAC) لإتمام الدخول بعد نجاح التحقّق
// ===================================================================

import speakeasy from "speakeasy";
import bcrypt from "bcryptjs";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

// ===================================================================
//  الثوابت
// ===================================================================

/** اسم الجهة المُصدِرة (يظهر في تطبيق المصادقة) */
export const TWO_FACTOR_ISSUER = "سيدي يوسف بن علي العاصمة";

/** طول السر base32 (32 حرفاً) */
export const TWO_FACTOR_SECRET_LENGTH = 32;

/** عدد رموز النسخ الاحتياطي المُولّدة */
export const BACKUP_CODES_COUNT = 10;

/** طول رمز النسخ الاحتياطي بالأحرف */
export const BACKUP_CODE_LENGTH = 8;

/** نافذة التحقّق TOTP (±30 ثانية = ± خطوة واحدة) */
export const TOTP_WINDOW = 1;

/** فترة صلاحية تذكرة التحقّق المؤقّتة (بالثواني) */
export const TWO_FACTOR_TICKET_TTL_SECONDS = 90;

/** السر المستخدَم لتوقيع التذاكر (HMAC) */
const TICKET_SECRET =
  process.env.NEXTAUTH_SECRET ??
  "syba-community-mvp-secret-change-in-production";

// ===================================================================
//  توليد السر و otpauth_url
// ===================================================================

/**
 * يولّد سرّاً base32 جديداً مع رابط otpauth:// لتطبيق المصادقة.
 * @param userEmail البريد المستخدَم كـ label داخل otpauth_url
 */
export function generateSecret(userEmail: string): {
  secret: string;
  otpauth_url: string;
} {
  const secret = speakeasy.generateSecret({
    length: TWO_FACTOR_SECRET_LENGTH,
    name: userEmail,
    issuer: TWO_FACTOR_ISSUER,
  });
  let url = secret.otpauth_url ?? "";
  // نضمن أن يكون المُصدِر حاضراً في الرابط — بعض إصدارات speakeasy تُسقطه
  // لعدم ASCII في اسم الجهة. نُضيف issuer= كـ query param صراحة.
  if (url && !url.includes("issuer=")) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}issuer=${encodeURIComponent(TWO_FACTOR_ISSUER)}`;
  }
  return {
    secret: secret.base32,
    otpauth_url: url,
  };
}

// ===================================================================
//  التحقّق من رمز TOTP
// ===================================================================

/**
 * يتحقّق من رمز TOTP باستخدام speakeasy مع نافذة window=1.
 * يدخل الرمز نصّاً (قد يحتوي مسافات — نُنظّفه).
 */
export function verifyToken(secret: string, token: string): boolean {
  if (!secret || !token) return false;
  // تنظيف الرمز: أرقام فقط (يدعم 6 أرقام) — حتى لو أُدخلت مسافات
  const cleanToken = String(token).replace(/\D/g, "");
  if (cleanToken.length !== 6) return false;
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: cleanToken,
    window: TOTP_WINDOW,
  });
}

// ===================================================================
//  رموز النسخ الاحتياطي
// ===================================================================

/**
 * يولّد 10 رموز عشوائية بطول 8 أحرف (A-Z0-9 مع استبعاد الأحرف الملتبسة).
 * يعيد المصفوفة كما هي (نصّية) — تُحفظ مجزّأة بـ bcrypt.
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  // الأحرف بدون لبس: بدون 0/O/1/I/L (31 حرفاً)
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const alphaLen = alphabet.length; // 31
  // عتبة الرفض للتوزيع الموحّد (أكبر مضاعف لـ alphaLen أصغر من 256)
  const threshold = Math.floor(256 / alphaLen) * alphaLen; // 248

  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    // نولّد بايتات إضافية للتعامل مع الرفض (نادراً جداً)
    const rawBytes = randomBytes(BACKUP_CODE_LENGTH * 2);
    let code = "";
    let idx = 0;
    for (let j = 0; j < BACKUP_CODE_LENGTH; j++) {
      // rejection sampling لتفادي الانحياز
      let b = rawBytes[idx++];
      while (b >= threshold) {
        if (idx >= rawBytes.length) {
          // نادر جداً — نولّد بايت إضافي
          b = randomBytes(1)[0];
        } else {
          b = rawBytes[idx++];
        }
      }
      code += alphabet[b % alphaLen];
    }
    codes.push(code);
  }
  // ضمان عدم التكرار (نادر الحدوث) — نُعيد التوليد لو حدث
  const set = new Set(codes);
  if (set.size !== codes.length) {
    return generateBackupCodes();
  }
  return codes;
}

/**
 * يجزّئ مصفوفة رموز النسخ الاحتياطي (bcrypt) ويُرجعها كـ JSON string.
 * كل عنصر في المصفوفة الناتجة هو bcrypt hash لرمز واحد.
 */
export async function hashBackupCodes(codes: string[]): Promise<string> {
  const hashed: string[] = [];
  for (const code of codes) {
    const h = await bcrypt.hash(code, 10);
    hashed.push(h);
  }
  return JSON.stringify(hashed);
}

/**
 * يتحقّق من رمز نسخ احتياطي مقابل مصفوفة bcrypt-hashed.
 * يمرّ على كل العناصر، ويعيد true عند أول مطابقة، ويحذف الرمز المستخدَم
 * من المصفوفة (single-use) ويُرجع النسخة المحدّثة عبر outParam.
 *
 * @param hashedJson نصّ JSON يحوي مصفوفة من bcrypt hashes
 * @param code الرمز المراد التحقّق منه
 * @returns `{ valid, remaining }` — `remaining` يحوي المصفوفة المحدّثة (بدون الرمز)
 *          لتُحفظ من جديد في قاعدة البيانات.
 */
export async function verifyBackupCode(
  hashedJson: string,
  code: string
): Promise<{ valid: boolean; remaining: string }> {
  // نقرأ المصفوفة المُجزّأة
  let hashedArr: string[] = [];
  try {
    const parsed = JSON.parse(hashedJson);
    if (!Array.isArray(parsed)) {
      return { valid: false, remaining: hashedJson };
    }
    hashedArr = parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return { valid: false, remaining: hashedJson };
  }

  if (!code || hashedArr.length === 0) {
    return { valid: false, remaining: hashedJson };
  }

  const cleanCode = String(code).trim().toUpperCase();

  // نمرّ على كل الـhashes للعثور على المطابقة (متجهّز ضد التوقيت نسبياً)
  let matchedIndex = -1;
  for (let i = 0; i < hashedArr.length; i++) {
    const ok = await bcrypt.compare(cleanCode, hashedArr[i]);
    if (ok) {
      matchedIndex = i;
      break;
    }
  }

  if (matchedIndex === -1) {
    return { valid: false, remaining: hashedJson };
  }

  // نحذف الرمز المستخدَم (single-use)
  hashedArr.splice(matchedIndex, 1);
  return { valid: true, remaining: JSON.stringify(hashedArr) };
}

// ===================================================================
//  التذاكر المؤقّتة الموقّعة (HMAC-SHA256)
//  تذاكر قصيرة العمر (90 ثانية) تُستخدَم لربط نجاح التحقّق (TOTP/backup)
//  بإنشاء الجلسة عبر مزوّد credentials-2fa.
//  الشكل: <payload-b64url>.<signature-b64url>
// ===================================================================

type TicketType = "totp" | "backup";

interface TicketPayload {
  userId: string;
  type: TicketType;
  exp: number; // Unix seconds
}

/**
 * يُصدِر تذكرة موقّعة قصيرة العمر للتحقّق الناجح.
 */
export function issueTwoFactorTicket(
  userId: string,
  type: TicketType
): string {
  const payload: TicketPayload = {
    userId,
    type,
    exp: Math.floor(Date.now() / 1000) + TWO_FACTOR_TICKET_TTL_SECONDS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const sig = createHmac("sha256", TICKET_SECRET)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

/**
 * يتحقّق من تذكرة موقّعة. يعيد `{ userId }` عند الصلاحية، وإلا `null`.
 * يفحص: التوقيع، انتهاء الصلاحية، مطابقة userId، مطابقة النوع.
 */
export function verifyTwoFactorTicket(
  ticket: string,
  expectedUserId: string,
  allowedTypes: TicketType[] = ["totp", "backup"]
): { userId: string; type: TicketType } | null {
  if (!ticket || typeof ticket !== "string") return null;
  const dotIdx = ticket.lastIndexOf(".");
  if (dotIdx < 1) return null;
  const payloadB64 = ticket.slice(0, dotIdx);
  const sig = ticket.slice(dotIdx + 1);

  // التحقّق من التوقيع (constant-time)
  const expectedSig = createHmac("sha256", TICKET_SECRET)
    .update(payloadB64)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  // فكّ الحمولة
  let payload: TicketPayload;
  try {
    payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    );
  } catch {
    return null;
  }
  if (
    typeof payload?.userId !== "string" ||
    typeof payload?.exp !== "number" ||
    typeof payload?.type !== "string"
  ) {
    return null;
  }

  // فحص الانتهاء
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return null;

  // مطابقة userId
  if (payload.userId !== expectedUserId) return null;

  // مطابقة النوع
  if (!allowedTypes.includes(payload.type)) return null;

  return { userId: payload.userId, type: payload.type };
}
