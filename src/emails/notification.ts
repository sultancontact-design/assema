// ===================================================================
//  قالب: إشعار عام
//  المعطيات: { userName, title, message, link }
//  العنوان: title
// ===================================================================

import { buildEmailLayout } from "./layout";

export interface NotificationEmailParams {
  userName: string;
  title: string;
  message: string;
  link?: string | null;
}

export function subject(params: NotificationEmailParams): string {
  return params.title;
}

export function html(params: NotificationEmailParams): string {
  const safeName = (params.userName || "الفاضل").trim();
  const safeTitle = escapeHtml(params.title);
  const safeMessage = escapeHtml(params.message);
  const safeLink = params.link ? escapeAttr(params.link) : null;

  const cta = safeLink
    ? `<p style="margin:0 0 24px;text-align:center;">
        <a href="${safeLink}" style="display:inline-block;background:#2D5A3D;color:#FBF6EE !important;font-family:Tajawal,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;text-align:center;direction:rtl;">
          اطّلع على التفاصيل
        </a>
      </p>`
    : "";

  const body = `
    <p style="margin:0 0 16px;color:#1F1A17;font-size:16px;font-weight:700;">
      السلام عليكم ${safeName}،
    </p>
    <h2 style="margin:0 0 16px;color:#B8492B;font-size:18px;font-weight:700;line-height:1.5;">
      ${safeTitle}
    </h2>
    <p style="margin:0 0 24px;color:#1F1A17;line-height:1.9;white-space:pre-wrap;">${safeMessage}</p>
    ${cta}
    <p style="margin:0;color:#6b5b4d;font-size:12px;border-top:1px solid #E8DCC8;padding-top:16px;text-align:center;">
      وصلتك هذه الرسالة لأنّك عضو في منصة سيدي يوسف بن علي العاصمة.
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
