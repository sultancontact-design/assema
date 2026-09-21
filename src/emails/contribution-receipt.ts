// ===================================================================
//  قالب: إيصال المساهمة — بعد إنشاء مساهمة في صندوق المعروف
//  المعطيات: { userName, amount, receiptNumber, digitalReceipt, month, method }
//  العنوان: `إيصال مساهمتك — ${receiptNumber}`
// ===================================================================

import { buildEmailLayout, TABLE_STYLE, TD_LABEL, TD_VALUE } from "./layout";
import { formatMAD, CONTRIBUTION_METHOD_LABELS } from "@/lib/constants";

export interface ContributionReceiptEmailParams {
  userName: string;
  amount: number;
  receiptNumber: string;
  digitalReceipt: string;
  month: string; // YYYY-MM
  method: "BANK_TRANSFER" | "CASH" | "CMI";
}

export function subject(params: ContributionReceiptEmailParams): string {
  return `إيصال مساهمتك — ${params.receiptNumber}`;
}

export function html(params: ContributionReceiptEmailParams): string {
  const safeName = (params.userName || "الفاضل").trim();
  const methodLabel = CONTRIBUTION_METHOD_LABELS[params.method] ?? params.method;
  const amountStr = formatMAD(params.amount);

  const body = `
    <p style="margin:0 0 16px;color:#1F1A17;font-size:16px;font-weight:700;">
      السلام عليكم ${safeName}،
    </p>
    <p style="margin:0 0 16px;color:#1F1A17;">
      شكراً لمساهمتك في صندوق المعروف. تقبّل الله منك وجعلها في ميزان حسناتك.
      فيما يلي تفاصيل الإيصال الرقمي لمساهمتك:
    </p>

    <table role="presentation" style="${TABLE_STYLE}margin:0 0 24px;">
      <tr>
        <td style="${TD_LABEL}">رقم الإيصال</td>
        <td style="${TD_VALUE}font-family:monospace;color:#B8492B;font-weight:700;">${params.receiptNumber}</td>
      </tr>
      <tr>
        <td style="${TD_LABEL}">المبلغ</td>
        <td style="${TD_VALUE}font-weight:700;color:#2D5A3D;">${amountStr}</td>
      </tr>
      <tr>
        <td style="${TD_LABEL}">الشهر</td>
        <td style="${TD_VALUE}">${params.month}</td>
      </tr>
      <tr>
        <td style="${TD_LABEL}">طريقة الدفع</td>
        <td style="${TD_VALUE}">${methodLabel}</td>
      </tr>
      <tr>
        <td style="${TD_LABEL}">المرجع الرقمي (UUID)</td>
        <td style="${TD_VALUE}font-family:monospace;font-size:12px;word-break:break-all;">${params.digitalReceipt}</td>
      </tr>
      <tr>
        <td style="${TD_LABEL}">الحالة</td>
        <td style="${TD_VALUE}">
          <span style="background:#FBF6EE;color:#C8842A;padding:4px 12px;border-radius:4px;font-weight:700;">بانتظار التأكيد</span>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;color:#1F1A17;">
      سيقوم أمين الصندوق بمراجعة مساهمتك وتأكيدها قريباً. يمكنك متابعة حالة
      المساهمة عبر صفحة صندوق المعروف.
    </p>

    <p style="margin:0 0 24px;text-align:center;">
      <a href="https://syba-community.ma/community/fund" style="display:inline-block;background:#2D5A3D;color:#FBF6EE !important;font-family:Tajawal,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;text-align:center;direction:rtl;">
        راجع صندوق المعروف
      </a>
    </p>

    <p style="margin:0;color:#6b5b4d;font-size:12px;border-top:1px solid #E8DCC8;padding-top:16px;text-align:center;">
      احتفظ بهذا الإيصال للرقم — فهو مرجعك الرسمي للمساهمة.
    </p>
  `;
  return buildEmailLayout(body);
}
