// ===================================================================
//  arabic-font — مساعد لتسجيل خط Tajawal مرة واحدة لكل PDFs
//  - يقرأ ملفات woff من node_modules/@fontsource/tajawal
//  - يحوّل Buffer إلى data URL (مطلوب من @react-pdf/renderer)
//  - خامل (idempotent) عبر module-level flag
// ===================================================================

import { Font } from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let fontRegistered = false;

export function ensureArabicFont(): void {
  if (fontRegistered) return;
  fontRegistered = true;
  try {
    const normalPath = resolve(
      process.cwd(),
      "node_modules/@fontsource/tajawal/files/tajawal-arabic-400-normal.woff"
    );
    const boldPath = resolve(
      process.cwd(),
      "node_modules/@fontsource/tajawal/files/tajawal-arabic-700-normal.woff"
    );
    const normalBuf = readFileSync(normalPath);
    const boldBuf = readFileSync(boldPath);
    const normalDataUrl = `data:font/woff;base64,${normalBuf.toString("base64")}`;
    const boldDataUrl = `data:font/woff;base64,${boldBuf.toString("base64")}`;
    Font.register({
      family: "Tajawal",
      fonts: [
        { src: normalDataUrl, fontWeight: "normal" },
        { src: boldDataUrl, fontWeight: "bold" },
      ],
    });
  } catch {
    // تجاهل — سنستخدم Helvetica الافتراضي
  }
}

/** قيم الألوان الموحّدة لكل التقارير */
export const PDF_COLORS = {
  text: "#1F1A17",
  muted: "#6B5D4E",
  accent: "#C8842A",
  bg: "#FFFFFF",
  bgSoft: "#FBF6EE",
  border: "#E5DDD0",
  borderSoft: "#F1EBDD",
  green: "#2D5A3D",
  rose: "#B8492B",
} as const;
