// ===================================================================
//  قالب البريد الإلكتروني الأساسي — layout
//  كل النصوص عربية فصحى مغربية + RTL + Inline CSS
//  ألوان زليج مراكش: ترابي #B8492B، أخضر صنوبر #2D5A3D،
//  كريم #FBF6EE، ذهبي النحاس #C8842A
// ===================================================================

import { SITE } from "@/lib/constants";

// ===================================================================
//  ترويسة ثابتة لكل البريد — اسم الموقع + شعار نصّي
// ===================================================================

const HEADER_HTML = `
  <tr>
    <td style="background:#B8492B;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="margin:0;color:#FBF6EE;font-family:Tajawal,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.01em;">
        سيدي يوسف بن علي العاصمة
      </h1>
      <p style="margin:6px 0 0;color:#FBF6EE;opacity:0.85;font-family:Tajawal,Arial,sans-serif;font-size:13px;">
        من حي إلى عاصمة... المعروف الرقمي
      </p>
    </td>
  </tr>
`;

// ===================================================================
//  تذييل ثابت — معلومات الاتصال + حقوق النشر
// ===================================================================

function footerHtml(): string {
  const year = new Date().getFullYear();
  return `
    <tr>
      <td style="padding:24px 32px;background:#1F1A17;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 8px;color:#FBF6EE;font-family:Tajawal,Arial,sans-serif;font-size:12px;text-align:center;direction:rtl;">
          للاستفسار: <a href="mailto:${SITE.email}" style="color:#C8842A;text-decoration:none;">${SITE.email}</a>
          &nbsp;·&nbsp; هاتف: ${SITE.phone}
        </p>
        <p style="margin:0 0 4px;color:#FBF6EE;opacity:0.6;font-family:Tajawal,Arial,sans-serif;font-size:11px;text-align:center;direction:rtl;">
          ${SITE.address}
        </p>
        <p style="margin:0;color:#FBF6EE;opacity:0.5;font-family:Tajawal,Arial,sans-serif;font-size:11px;text-align:center;direction:rtl;">
          © ${year} سيدي يوسف بن علي العاصمة — جميع الحقوق محفوظة
        </p>
      </td>
    </tr>
  `;
}

// ===================================================================
//  يبني صفحة بريد كاملة: ترويسة + بطاقة محتوى + تذييل
//  - bodyContent: HTML داخل البطاقة البيضاء
// ===================================================================

export function buildEmailLayout(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>سيدي يوسف بن علي العاصمة</title>
</head>
<body style="margin:0;padding:0;background:#FBF6EE;font-family:Tajawal,Arial,sans-serif;direction:rtl;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF6EE;min-width:100%;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E8DCC8;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(31,26,23,0.06);">
          ${HEADER_HTML}
          <tr>
            <td style="padding:32px 24px;background:#FFFFFF;">
              <div style="direction:rtl;font-family:Tajawal,Arial,sans-serif;color:#1F1A17;font-size:15px;line-height:1.8;">
                ${bodyContent}
              </div>
            </td>
          </tr>
          ${footerHtml()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ===================================================================
//  أنماط مشتركة لتسهيل كتابة القوالب
// ===================================================================

export const BTN_PRIMARY = `
  display:inline-block;
  background:#B8492B;
  color:#FBF6EE !important;
  font-family:Tajawal,Arial,sans-serif;
  font-size:14px;
  font-weight:700;
  text-decoration:none;
  padding:12px 24px;
  border-radius:8px;
  text-align:center;
  direction:rtl;
`;

export const TABLE_STYLE = `
  width:100%;
  border-collapse:collapse;
  font-family:Tajawal,Arial,sans-serif;
  font-size:14px;
  direction:rtl;
`;

export const TD_LABEL = `
  padding:12px 16px;
  background:#FBF6EE;
  color:#2D5A3D;
  font-weight:700;
  border:1px solid #E8DCC8;
  text-align:right;
  width:40%;
`;

export const TD_VALUE = `
  padding:12px 16px;
  background:#FFFFFF;
  color:#1F1A17;
  border:1px solid #E8DCC8;
  text-align:right;
`;
