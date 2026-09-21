// ===================================================================
//  قالب: إعادة تعيين كلمة المرور
//  المعطيات: { userName, resetUrl }
//  العنوان: "إعادة تعيين كلمة المرور"
// ===================================================================

import { buildEmailLayout } from "./layout";

export interface PasswordResetEmailParams {
  userName: string;
  resetUrl: string;
}

export function subject(_params: PasswordResetEmailParams): string {
  return "إعادة تعيين كلمة المرور";
}

export function html(params: PasswordResetEmailParams): string {
  const safeName = (params.userName || "الفاضل").trim();
  const body = `
    <p style="margin:0 0 16px;color:#1F1A17;font-size:16px;font-weight:700;">
      السلام عليكم ${safeName}،
    </p>
    <p style="margin:0 0 16px;color:#1F1A17;">
      تلقّينا طلباً لإعادة تعيين كلمة مرورك على منصة سيدي يوسف بن علي العاصمة.
      اضغط الزر أدناه لاختيار كلمة مرور جديدة:
    </p>

    <p style="margin:0 0 24px;text-align:center;">
      <a href="${escapeAttr(params.resetUrl)}" style="display:inline-block;background:#B8492B;color:#FBF6EE !important;font-family:Tajawal,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;text-align:center;direction:rtl;">
        إعادة تعيين كلمة المرور
      </a>
    </p>

    <p style="margin:0 0 16px;color:#1F1A17;font-size:13px;">
      أو انسخ هذا الرابط في متصفّحك:
    </p>
    <p style="margin:0 0 24px;padding:12px;background:#FBF6EE;border-radius:8px;font-family:monospace;font-size:12px;direction:ltr;text-align:left;word-break:break-all;color:#2D5A3D;">
      ${escapeHtml(params.resetUrl)}
    </p>

    <div style="background:#FBF6EE;border-inline-start:4px solid #B8492B;padding:16px 20px;border-radius:8px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#B8492B;font-weight:700;font-size:14px;">ملاحظة أمنية</p>
      <ul style="margin:0;padding-right:18px;color:#1F1A17;font-size:13px;line-height:1.8;">
        <li>الرابط صالح لمدة ساعة واحدة فقط.</li>
        <li>إن لم تطلب إعادة التعيين، تجاهل هذه الرسالة — لن يتغيّر شيء.</li>
        <li>لا تشارك هذا الرابط مع أحد. فريق المنصة لن يطلبه منك أبداً.</li>
      </ul>
    </div>

    <p style="margin:0;color:#6b5b4d;font-size:12px;border-top:1px solid #E8DCC8;padding-top:16px;text-align:center;">
      بريد آلي من نظام سيدي يوسف بن علي العاصمة — لا تردّ عليه.
    </p>
  `;
  return buildEmailLayout(body);
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}
