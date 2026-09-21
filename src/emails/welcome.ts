// ===================================================================
//  قالب: رسالة ترحيب — بعد تسجيل مستخدم جديد
//  المعطيات: { userName }
//  العنوان: "مرحباً بك في منصة المعروف الرقمي"
// ===================================================================

import { buildEmailLayout, BTN_PRIMARY } from "./layout";

export interface WelcomeEmailParams {
  userName: string;
}

export function subject(_params: WelcomeEmailParams): string {
  return "مرحباً بك في منصة المعروف الرقمي";
}

export function html(params: WelcomeEmailParams): string {
  const safeName = (params.userName || "أخي الكريم").trim();
  const body = `
    <p style="margin:0 0 16px;color:#1F1A17;font-size:16px;font-weight:700;">
      السلام عليكم ورحمة الله ${safeName}،
    </p>
    <p style="margin:0 0 16px;color:#1F1A17;">
      نرحّب بك في منصة <strong style="color:#B8492B;">سيدي يوسف بن علي العاصمة</strong> —
      أول منصة رقمية مغربية لتنظيم المعروف والتضامن بين أسر الحي.
    </p>
    <p style="margin:0 0 16px;color:#1F1A17;">
      عبر هذه المنصة تستطيع:
    </p>
    <ul style="margin:0 0 16px;color:#1F1A17;padding-right:20px;line-height:1.9;">
      <li>المساهمة في صندوق المعروف الشهري بإيصال رقمي موثَّق</li>
      <li>طلب المساعدة في المناسبات (مرض، عرس، تعليم، طوارئ...)</li>
      <li>التسجيل في فعاليات الحي وورشاته</li>
      <li>الانضمام لمجموعات الاهتمام (الأمهات، الشباب، كبار السن...)</li>
      <li>متابعة لوحة الشفافية المالية للحي</li>
    </ul>
    <p style="margin:0 0 24px;color:#1F1A17;">
      نبدأ من حي سيدي يوسف بن علي بمراكش، ومنه إلى عاصمة المغرب كلها — بإذن الله.
    </p>
    <p style="margin:0 0 24px;text-align:center;">
      <a href="https://syba-community.ma/community" style="${BTN_PRIMARY}">ادخل إلى المجتمع</a>
    </p>
    <p style="margin:0;color:#6b5b4d;font-size:12px;border-top:1px solid #E8DCC8;padding-top:16px;text-align:center;">
      لا تردّ على هذه الرسالة — فهي مرسلة آلياً من نظام منصة سيدي يوسف بن علي العاصمة.
    </p>
  `;
  return buildEmailLayout(body);
}
