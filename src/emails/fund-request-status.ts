// ===================================================================
//  قالب: تحديث حالة طلب الصرف — عند تغيّر حالة FundRequest
//  المعطيات: { userName, requestTitle, anonymousCode, newStatus, amount, note }
//  العنوان: `تحديث طلبك ${anonymousCode}`
// ===================================================================

import { buildEmailLayout, TABLE_STYLE, TD_LABEL, TD_VALUE } from "./layout";
import { formatMAD, FUND_REQUEST_STATUS_LABELS } from "@/lib/constants";
import type { FundRequestStatus } from "@prisma/client";

export interface FundRequestStatusEmailParams {
  userName: string;
  requestTitle: string;
  anonymousCode: string;
  newStatus: FundRequestStatus;
  amount: number;
  note?: string | null;
}

export function subject(params: FundRequestStatusEmailParams): string {
  return `تحديث طلبك ${params.anonymousCode}`;
}

export function html(params: FundRequestStatusEmailParams): string {
  const safeName = (params.userName || "الفاضل").trim();
  const statusInfo = FUND_REQUEST_STATUS_LABELS[params.newStatus];
  const statusLabel = statusInfo?.label ?? params.newStatus;
  const amountStr = formatMAD(params.amount);

  // تعليمات الخطوة التالية حسب الحالة
  const nextSteps: Record<FundRequestStatus, string> = {
    SUBMITTED: "تمّ تسجيل طلبك بنجاح. سيبدأ فريق المراجعة دراسته خلال 48 ساعة.",
    UNDER_REVIEW:
      "طلبك قيد المراجعة من قبل الفريق المختص. سنوافيك بكل المستجدات.",
    APPROVED:
      "تمّت الموافقة على طلبك. سيتمّ صرف المبلغ خلال 72 ساعة كحد أقصى وفق سياسة الصرف.",
    REJECTED:
      "نأسف لإخبارك أنّه لم يمكن الموافقة على طلبك في هذه المرحلة. يمكنك مراجعة ملاحظات الفريق أدناه.",
    DISBURSED:
      "تمّ صرف المبلغ المحدَّد. يمكنك استخدام المرجع المالي للمتابعة. شفاء وعافية.",
    COMPLETED:
      "اكتملت دورة طلبك بنجاح. شكراً لاستخدامك منصة المعروف الرقمي. نسأل الله أن ينفع به.",
  };
  const stepText = nextSteps[params.newStatus] ?? "";

  const body = `
    <p style="margin:0 0 16px;color:#1F1A17;font-size:16px;font-weight:700;">
      السلام عليكم ${safeName}،
    </p>
    <p style="margin:0 0 16px;color:#1F1A17;">
      نُعلمك بأنّ حالة طلبك قد تحدّثت. فيما يلي التفاصيل الجديدة:
    </p>

    <table role="presentation" style="${TABLE_STYLE}margin:0 0 24px;">
      <tr>
        <td style="${TD_LABEL}">الرمز المجهول</td>
        <td style="${TD_VALUE}font-family:monospace;color:#B8492B;font-weight:700;">${params.anonymousCode}</td>
      </tr>
      <tr>
        <td style="${TD_LABEL}">عنوان الطلب</td>
        <td style="${TD_VALUE}">${escapeHtml(params.requestTitle)}</td>
      </tr>
      <tr>
        <td style="${TD_LABEL}">المبلغ المطلوب</td>
        <td style="${TD_VALUE}font-weight:700;color:#2D5A3D;">${amountStr}</td>
      </tr>
      <tr>
        <td style="${TD_LABEL}">الحالة الجديدة</td>
        <td style="${TD_VALUE}">
          <span style="background:#FBF6EE;color:#C8842A;padding:4px 12px;border-radius:4px;font-weight:700;">${statusLabel}</span>
        </td>
      </tr>
    </table>

    <div style="background:#FBF6EE;border-inline-start:4px solid #2D5A3D;padding:16px 20px;border-radius:8px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#2D5A3D;font-weight:700;font-size:14px;">الخطوة التالية</p>
      <p style="margin:0;color:#1F1A17;font-size:14px;line-height:1.8;">${stepText}</p>
    </div>

    ${
      params.note
        ? `<div style="background:#FFF;border:1px solid #E8DCC8;padding:16px 20px;border-radius:8px;margin:0 0 24px;">
            <p style="margin:0 0 8px;color:#6b5b4d;font-weight:700;font-size:13px;">ملاحظة من الفريق</p>
            <p style="margin:0;color:#1F1A17;font-size:14px;line-height:1.8;">${escapeHtml(params.note)}</p>
          </div>`
        : ""
    }

    <p style="margin:0 0 24px;text-align:center;">
      <a href="https://syba-community.ma/community/fund" style="display:inline-block;background:#B8492B;color:#FBF6EE !important;font-family:Tajawal,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;text-align:center;direction:rtl;">
        تابع حالة الطلب
      </a>
    </p>

    <p style="margin:0;color:#6b5b4d;font-size:12px;border-top:1px solid #E8DCC8;padding-top:16px;text-align:center;">
      نحترم كرامتك — لا يُكشف اسمك في العلن أبداً، فقط رمزك المجهول.
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
