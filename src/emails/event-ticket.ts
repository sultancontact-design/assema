// ===================================================================
//  قالب: تذكرة الفعالية — بعد التسجيل في فعالية
//  المعطيات: { userName, eventTitle, eventDate, eventLocation, ticketCode, qrDataUrl }
//  العنوان: `تذكرتك: ${eventTitle}`
// ===================================================================

import { buildEmailLayout, TABLE_STYLE, TD_LABEL, TD_VALUE } from "./layout";

export interface EventTicketEmailParams {
  userName: string;
  eventTitle: string;
  eventDate: string; // نص عربي جاهز
  eventLocation: string;
  ticketCode: string;
  qrDataUrl: string; // data:image/png;base64,...
}

export function subject(params: EventTicketEmailParams): string {
  return `تذكرتك: ${params.eventTitle}`;
}

export function html(params: EventTicketEmailParams): string {
  const safeName = (params.userName || "الفاضل").trim();
  const safeTitle = escapeHtml(params.eventTitle);
  const safeLocation = escapeHtml(params.eventLocation);
  const safeDate = escapeHtml(params.eventDate);

  const body = `
    <p style="margin:0 0 16px;color:#1F1A17;font-size:16px;font-weight:700;">
      السلام عليكم ${safeName}،
    </p>
    <p style="margin:0 0 16px;color:#1F1A17;">
      تمّ تسجيلك في الفعالية بنجاح. هذه تذكرتك الرقمية الرسمية — احتفظ بها
      واعرضها عند الدخول لمسح رمز QR.
    </p>

    <table role="presentation" style="${TABLE_STYLE}margin:0 0 24px;">
      <tr>
        <td style="${TD_LABEL}">الفعالية</td>
        <td style="${TD_VALUE}font-weight:700;color:#B8492B;">${safeTitle}</td>
      </tr>
      <tr>
        <td style="${TD_LABEL}">التاريخ</td>
        <td style="${TD_VALUE}">${safeDate}</td>
      </tr>
      <tr>
        <td style="${TD_LABEL}">المكان</td>
        <td style="${TD_VALUE}">${safeLocation}</td>
      </tr>
      <tr>
        <td style="${TD_LABEL}">رقم التذكرة</td>
        <td style="${TD_VALUE}font-family:monospace;font-weight:700;color:#2D5A3D;">${escapeHtml(params.ticketCode)}</td>
      </tr>
    </table>

    ${
      params.qrDataUrl
        ? `<div style="text-align:center;background:#FBF6EE;border:1px solid #E8DCC8;border-radius:12px;padding:24px;margin:0 0 24px;">
            <p style="margin:0 0 12px;color:#2D5A3D;font-weight:700;font-size:14px;">امسح هذا الرمز عند الدخول</p>
            <img src="${params.qrDataUrl}" alt="رمز QR لتذكرة الدخول" width="200" height="200" style="display:inline-block;border:8px solid #FFFFFF;border-radius:8px;box-shadow:0 2px 8px rgba(31,26,23,0.08);" />
            <p style="margin:12px 0 0;color:#6b5b4d;font-size:12px;font-family:monospace;letter-spacing:0.04em;">${escapeHtml(params.ticketCode)}</p>
          </div>`
        : ""
    }

    <div style="background:#FBF6EE;border-inline-start:4px solid #C8842A;padding:16px 20px;border-radius:8px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#C8842A;font-weight:700;font-size:14px;">تعليمات</p>
      <ul style="margin:0;padding-right:18px;color:#1F1A17;font-size:13px;line-height:1.8;">
        <li>احضر قبل موعد الفعالية بـ15 دقيقة.</li>
        <li>اعرض رمز QR للموظف عند الدخول لتسجيل الحضور.</li>
        <li>في حال إلغاء التسجيل، استعمل زر الإلغاء في صفحة الفعالية قبل 24 ساعة.</li>
      </ul>
    </div>

    <p style="margin:0 0 24px;text-align:center;">
      <a href="https://syba-community.ma/community/events" style="display:inline-block;background:#2D5A3D;color:#FBF6EE !important;font-family:Tajawal,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;text-align:center;direction:rtl;">
        كل فعاليات الحي
      </a>
    </p>

    <p style="margin:0;color:#6b5b4d;font-size:12px;border-top:1px solid #E8DCC8;padding-top:16px;text-align:center;">
      في انتظار لقائك في الفعالية — فريق سيدي يوسف بن علي العاصمة.
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
