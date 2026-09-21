// ===================================================================
//  qr-code.ts — مساعد توليد رموز QR
//  يستعمل مكتبة `qrcode` لإنتاج PNG (data URL) أو SVG نصي
//  كل الاستخدامات server-side فقط (لا يُستعمل في client)
// ===================================================================

import QRCode from "qrcode";

/**
 * يُولّد رمز QR كـ PNG مع base64 data URL.
 * @param text النص الذي سيُرمَّز (مثال: رقم التذكرة EV-2024-001)
 * @param opts خيارات إضافية (width، margin، errorCorrectionLevel)
 * @returns data URL (data:image/png;base64,...) أو سلسلة فارغة عند الفشل
 */
export async function generateQrCodeDataUrl(
  text: string,
  opts?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  if (!text) return "";
  try {
    return await QRCode.toDataURL(text, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#1F1A17", light: "#FFFFFF" },
      ...opts,
    });
  } catch {
    // فشل التوليد لا يوقف العرض
    return "";
  }
}

/**
 * يُولّد رمز QR كـ SVG نصّي (string).
 * مفيد للطباعة أو للعرض المباشر في DOM بدون base64.
 * @param text النص الذي سيُرمَّز
 * @param opts خيارات إضافية
 * @returns سلسلة SVG (<svg>...</svg>) أو سلسلة فارغة عند الفشل
 */
export async function generateQrCodeSvg(
  text: string,
  opts?: QRCode.QRCodeToStringOptions
): Promise<string> {
  if (!text) return "";
  try {
    return await QRCode.toString(text, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 2,
      color: { dark: "#1F1A17", light: "#FFFFFF" },
      ...opts,
    });
  } catch {
    return "";
  }
}
