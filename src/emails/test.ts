// ===================================================================
//  قالب: بريد اختباري — للتأكد من صحة إعدادات SMTP
//  المعطيات: { userName }
//  العنوان: "اختبار الإعدادات"
// ===================================================================

import { buildEmailLayout } from "./layout";

export interface TestEmailParams {
  userName?: string;
}

export function subject(_params: TestEmailParams): string {
  return "اختبار الإعدادات";
}

export function html(params: TestEmailParams): string {
  const safeName = (params.userName || "المشرف").trim();
  const sentAt = new Intl.DateTimeFormat("ar-MA", {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());

  const body = `
    <p style="margin:0 0 16px;color:#1F1A17;font-size:16px;font-weight:700;">
      السلام عليكم ${safeName}،
    </p>
    <p style="margin:0 0 16px;color:#1F1A17;">
      هذا بريد اختباري للتحقّق من إعدادات SMTP على منصة سيدي يوسف بن علي
      العاصمة. إن وصلتك هذه الرسالة فالإعدادات سليمة.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 16px;background:#FBF6EE;border:1px solid #E8DCC8;border-radius:8px;color:#2D5A3D;font-weight:700;font-size:13px;text-align:right;width:40%;">
          وقت الإرسال
        </td>
        <td style="padding:12px 16px;background:#FFFFFF;border:1px solid #E8DCC8;color:#1F1A17;font-size:13px;text-align:right;">
          ${sentAt}
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#6b5b4d;font-size:12px;border-top:1px solid #E8DCC8;padding-top:16px;text-align:center;">
      بريد اختباري آلي — لا تردّ عليه.
    </p>
  `;
  return buildEmailLayout(body);
}
