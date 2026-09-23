// ===================================================================
//  /privacy-policy — سياسة الخصوصية (CNDP — القانون 09-08)
//  Server Component — عربي (رئيسي) + قسم فرنسي ثانوي
//  13 قسماً + إشارة CNDP في التذييل
// ===================================================================

import Link from "next/link";
import type { Metadata } from "next";
import {
  Shield,
  Database,
  Eye,
  Lock,
  Cookie,
  Share2,
  Globe,
  FileWarning,
  RefreshCw,
  Mail,
  ScrollText,
  Scale,
  Hand,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description:
    "سياسة خصوصية منصة سيدي يوسف بن علي العاصمة وفقاً للقانون المغربي 09-08 (CNDP). تعرّف على البيانات التي نجمعها وكيفية حمايتها وحقوقك.",
};

const AR_SECTIONS = [
  {
    icon: ScrollText,
    n: 1,
    title: "مقدمة — من نحن ولماذا نجمع البيانات",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          منصة <strong className="text-foreground">سيدي يوسف بن علي العاصمة</strong>{" "}
          هي منصة اجتماعية تضامنية تُديرها لجنة من سكان حي سيدي يوسف بن علي الصنهاجي
          بمراكش، تهدف إلى رقمنة «المعروف المغربي» عبر صندوق تضامني رقمي للأسرة،
          تنظيم الفعاليات، وإدارة المجموعات الأهلية.
        </p>
        <p>
          نلتزم بالقانون المغربي رقم <strong className="text-foreground">09-08</strong>{" "}
          المتعلق بحماية الأشخاص الذاتيين تجاه معالجة بياناتهم الشخصية، والصلاحيات
          الممنوحة للجنة الوطنية لمراقبة حماية البيانات الشخصية (CNDP).
        </p>
        <p>
          هذه السياسة تشرح بطريقة صريحة وبسيطة: البيانات التي نجمعها، لماذا، كيف
          نستخدمها، مدة احتفاظنا بها، حقوقك، وكيف تتواصل معنا أو مع CNDP.
        </p>
      </div>
    ),
  },
  {
    icon: Database,
    n: 2,
    title: "البيانات التي نجمعها",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>نجمع فقط البيانات الضرورية لتشغيل المنصة وتقديم خدماتها لك:</p>
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>الاسم الكامل:</strong> الاسم الشخصي + اسم العائلة.
          </li>
          <li>
            <strong>البريد الإلكتروني:</strong> لمعرفتك، استرجاع كلمة المرور،
            واستلام الإيصالات والإشعارات.
          </li>
          <li>
            <strong>رقم الهاتف:</strong> بصيغة مغربية (06XXXXXXXX أو
            05XXXXXXXX) للتواصل الطارئ والتحقق.
          </li>
          <li>
            <strong>رقم البطاقة الوطنية (اختياري):</strong> يُخزَّن{" "}
            <strong>مشفّراً (bcrypt)</strong> ولا يُستخدم إلا عند تأكيد هوية أمين
            الصندوق أو رئيس مجموعة.
          </li>
          <li>
            <strong>بيانات المساهمات والطلبات:</strong> المبلغ، الشهر، الطريقة
            (تحويل بنكي / نقداً / CMI)، وصول الإيصال الرقمي.
          </li>
          <li>
            <strong>سجل النشاط (AuditLog):</strong> عنوان IP، User-Agent، نوع
            الإجراء، التاريخ — لأغراض أمنية وتدقيقية فقط.
          </li>
        </ul>
        <p className="text-xs">
          لا نطلب بيانات حسّاسة كالعنوان البريدي الكامل أو الموقع الجغرافي، ولا
          نطلب الوصول لدفتر عناوين هاتفك أو صورك الشخصية.
        </p>
      </div>
    ),
  },
  {
    icon: Eye,
    n: 3,
    title: "كيف نستخدم بياناتك",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>نستخدم بياناتك حصراً للأغراض التالية:</p>
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>التسجيل وإدارة الحساب:</strong> إنشاء حسابك، استرجاع كلمة
            المرور، تفعيل المصادقة الثنائية (2FA).
          </li>
          <li>
            <strong>إدارة المساهمات:</strong> تسجيل مساهمتك في صندوق المعروف،
            توليد إيصال رقمي موقّع، إشعار أمين الصندوق.
          </li>
          <li>
            <strong>الطلبات والصرف:</strong> تقديم طلب دعم (مرض، وفاة، عرس،
            تعليم)، معالجته من قِبل اللجنة، صرف المبلغ.
          </li>
          <li>
            <strong>الفعاليات:</strong> التسجيل في فعاليات الحي، توليد تذاكر
            رقمية، تذكير قبل الموعد.
          </li>
          <li>
            <strong>الإشعارات:</strong> تنبيهات داخل المنصة + بريد إلكتروني
            (يمكنك التحكّم الكامل بها من إعدادات الإشعارات).
          </li>
          <li>
            <strong>الشفافية المالية:</strong> عرض إحصاءات إجمالية (لا فردية) في
            لوحة الشفافية العامة.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: Scale,
    n: 4,
    title: "الأساس القانوني للمعالجة",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>نُعالج بياناتك وفقاً لأحد الأسس القانونية التالية:</p>
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>الموافقة (المادة 2، 4 من القانون 09-08):</strong> عند
            تسجيلك، تُعطي موافقتك الصريحة لمعالجة بياناتك وفق هذه السياسة. يمكنك
            سحبها في أي وقت.
          </li>
          <li>
            <strong>تنفيذ عقد (المادة 5):</strong> معالجة المساهمات والطلبات
            ضرورية لتنفيذ الالتزام التضامني بينك وبين الحي.
          </li>
          <li>
            <strong>الالتزام القانوني (المادة 6):</strong> حفظ سجل النشاط
            (AuditLog) والإيصالات المالية وفق متطلبات المحاسبة المغربية (5
            سنوات).
          </li>
          <li>
            <strong>المصلحة المشروعة:</strong> تحسين المنصة، منع الاحتيال،
            ضمان أمن الحسابات.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: RefreshCw,
    n: 5,
    title: "مدة الاحتفاظ بالبيانات",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>بيانات الحساب:</strong> طوال مدة حسابك النشط. عند الحذف،
            نُحذف بياناتك خلال 30 يوماً (فترة سماح).
          </li>
          <li>
            <strong>البيانات المالية (مساهمات، إيصالات، صرف):</strong>{" "}
            <strong>5 سنوات</strong> وفق متطلبات المحاسبة المغربية، ثم تُحذف
            نهائياً.
          </li>
          <li>
            <strong>سجل النشاط (AuditLog):</strong> 24 شهراً، يُحذف تلقائياً.
          </li>
          <li>
            <strong>الإشعارات:</strong> 12 شهراً من تاريخ الإرسال.
          </li>
          <li>
            <strong>عند الطلب:</strong> يمكنك طلب حذف بياناتك الشخصية فوراً
            (بياناتك المالية تُحفظ للفترة القانونية).
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: Hand,
    n: 6,
    title: "حقوقك",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>وفقاً للقانون 09-08، تتمتّع بالحقوق التالية:</p>
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>حق الوصول:</strong> معرفة ما إذا كنا نُعالج بياناتك والحصول
            على نسخة منها.
          </li>
          <li>
            <strong>حق التصحيح:</strong> تعديل أي بيانات غير صحيحة أو ناقصة.
          </li>
          <li>
            <strong>حق الحذف:</strong> «حق النسيان» — حذف بياناتك الشخصية (مع
            احترام الالتزامات القانونية للاحتفاظ بالبيانات المالية).
          </li>
          <li>
            <strong>حق نقل البيانات:</strong> استلام بياناتك بصيغة قابلة للقراءة
            آلياً (JSON).
          </li>
          <li>
            <strong>حق الاعتراض:</strong> الاعتراض على معالجة بياناتك لأسباب
            مشروعة.
          </li>
          <li>
            <strong>حق سحب الموافقة:</strong> في أي وقت، دون التأثير على قانونية
            المعالجة قبل السحب.
          </li>
          <li>
            <strong>حق تقديم شكوى لـ CNDP:</strong> اللجنة الوطنية لمراقبة حماية
            البيانات الشخصية.
          </li>
        </ul>
        <p className="text-xs">
          لممارسة أيّ من هذه الحقوق، راسلنا على{" "}
          <a
            href="mailto:privacy@syba-community.ma"
            className="text-primary underline underline-offset-2"
          >
            privacy@syba-community.ma
          </a>{" "}
          — نستجيب خلال 30 يوماً كحدّ أقصى.
        </p>
      </div>
    ),
  },
  {
    icon: Share2,
    n: 7,
    title: "مشاركة البيانات",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          <strong className="text-foreground">
            لا نشارك بياناتك الشخصية مع أي طرف ثالث تجاري.
          </strong>
        </p>
        <p>الاستثناءات الوحيدة:</p>
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>مزوّد الاستضافة (Supabase):</strong> قاعدة البيانات يستضيفها
            Supabase في الاتحاد الأوروبي (فرانكفورت/لندن) — مشفّرة في الراحة (at
            rest) وفي النقل (TLS).
          </li>
          <li>
            <strong>مزوّد البريد (Brevo):</strong> لإرسال الإيصالات والإشعارات
            فقط — لا يستعمل بياناتك لأغراضه الخاصة.
          </li>
          <li>
            <strong>بوابة الدفع (CMI):</strong> عند تفعيل المدفوعات الإلكترونية،
            تتمّ عبر بوابة CMI المغربية الرسمية — لا نلمس بيانات بطاقتك أبداً.
          </li>
          <li>
            <strong>السلطة القضائية:</strong> إن طُلب منّا قانونياً (أمر محكمة)،
            نلتزم. لكنّنا نُبلّغك قبل ذلك (إذا سُمح لنا قانونياً).
          </li>
        </ul>
        <p className="text-xs">
          لا نبيع بياناتك، لا نُؤجّرها، لا نتبادلها مع أي منصة أخرى.
        </p>
      </div>
    ),
  },
  {
    icon: Lock,
    n: 8,
    title: "أمن البيانات",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>نتّخذ إجراءات تقنية وتنظيمية صارمة لحماية بياناتك:</p>
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>bcrypt لكلمات المرور:</strong> خوارزمية تجزئة (hash) قوية
            مع salt فريد لكل مستخدم.
          </li>
          <li>
            <strong>HTTPS / TLS 1.3:</strong> كل الاتصالات مشفّرة بين متصفّحك
            وخوادمنا.
          </li>
          <li>
            <strong>تشفير في الراحة (at rest):</strong> قاعدة بيانات Supabase
            مشفّرة (AES-256).
          </li>
          <li>
            <strong>المصادقة الثنائية (2FA):</strong> اختيارية للحسابات العادية،
            إلزامية للأدوار الحسّاسة (أمين الصندوق، المشرف العام).
          </li>
          <li>
            <strong>سجل التدقيق (AuditLog):</strong> كل عملية حسّاسة
            (تسجيل دخول، صرف، تغيير حالة) تُسجَّل مع IP و User-Agent.
          </li>
          <li>
            <strong>قائمة IP المسموح بها:</strong> يمكن للمشرف العام تقييد الوصول
            للوحة الإدارة من IPs محدّدة.
          </li>
          <li>
            <strong>نسخ احتياطية يومية:</strong> مشفّرة، تُحفظ في منطقة Supabase
            الأوروبية.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: Cookie,
    n: 9,
    title: "الكوكيز والتتبّع",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>نستخدم ملفات تعريف الارتباط (cookies) للأغراض التالية فقط:</p>
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>الكوكيز الضرورية:</strong> جلسة المصادقة (next-auth.session)،
            رمز CSRF، تفضيل اللغة. لا يمكن للمنصة العمل بدونها.
          </li>
          <li>
            <strong>كوكيز التفضيلات:</strong> حفظ الوضع (فاتح/داكن)، تفضيلات
            الإشعارات، قرار الكوكيز نفسه. تُحفظ 30 يوماً.
          </li>
          <li>
            <strong>كوكيز إحصائية (اختيارية):</strong> قد نستعمل Plausible أو
            Vercel Analytics (لا تتبّع فردي، لا cross-site tracking).
          </li>
        </ul>
        <p>
          <strong className="text-foreground">
            لا نستعمل Google Analytics، لا Facebook Pixel، لا إعلانات تتبّع.
          </strong>
        </p>
        <p className="text-xs">
          عند أول زيارة، يظهر لك بانر الموافقة على الكوكيز. يمكنك قبول الكل، رفض
          غير الضروري، أو تخصيص الاختيارات. القرار يُحفظ 30 يوماً.
        </p>
      </div>
    ),
  },
  {
    icon: Globe,
    n: 10,
    title: "نقل البيانات الدولية",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          قاعدة بياناتنا مستضافة من <strong className="text-foreground">Supabase</strong>{" "}
          في الاتحاد الأوروبي (منطقة <strong>فرانكفورت (eu-central-1)</strong> أو{" "}
          <strong>لندن (eu-west-2)</strong>). منطقة الاتحاد الأوروبي توفّر مستوى
          حماية بيانات مماثلاً للقانون المغربي 09-08 (وفق CNDP).
        </p>
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>الخوادم:</strong> Supabase EU — لا تخرج بياناتك للولايات
            المتحدة أو أي دولة خارج الاتحاد الأوروبي.
          </li>
          <li>
            <strong>البريد:</strong> Brevo (فرنسا/أوروبا) — مزوّد أوروبي يتوافق
            مع GDPR.
          </li>
          <li>
            <strong>الاستضافة الأمامية:</strong> Vercel — قد تستضيف في عدة مناطق
            عالمية (edge). لا تُخزَّن بياناتك الشخصية على الـedge، فقط أصول
            الموقع (HTML/CSS/JS).
          </li>
        </ul>
        <p className="text-xs">
          أيّ نقل لبياناتك خارج المغرب يتمّ فقط إلى دول توفّر مستوى حماية كافياً،
          وفق متطلبات CNDP.
        </p>
      </div>
    ),
  },
  {
    icon: FileWarning,
    n: 11,
    title: "CNDP — كيفية تقديم شكوى",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          إذا رأيت أنّنا لم نحترم حقوقك وفقاً للقانون 09-08، يمكنك تقديم شكوى
          للّجنة الوطنية لمراقبة حماية البيانات الشخصية (CNDP):
        </p>
        <ol className="list-decimal ps-5 space-y-1.5 text-foreground/90">
          <li>
            تواصل معنا أولاً على{" "}
            <a
              href="mailto:privacy@syba-community.ma"
              className="text-primary underline underline-offset-2"
            >
              privacy@syba-community.ma
            </a>{" "}
            — نحاول حلّ المشكلة خلال 15 يوماً.
          </li>
          <li>إن لم نحلّها، توجّه إلى موقع CNDP الرسمي:</li>
        </ol>
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-sm text-foreground">
            <strong>اللجنة الوطنية لمراقبة حماية البيانات الشخصية</strong>
            <br />
            العنوان: شارع متّى، الرباط، المغرب
            <br />
            الموقع:{" "}
            <a
              href="https://www.cnp.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
              dir="ltr"
            >
              www.cnp.ma
            </a>
            <br />
            البريد:{" "}
            <a
              href="mailto:cnp@cnp.ma"
              className="text-primary underline underline-offset-2"
              dir="ltr"
            >
              cnp@cnp.ma
            </a>
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: RefreshCw,
    n: 12,
    title: "التعديلات على السياسة",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          قد نُحدّث هذه السياسة دورياً لتعكس تغيّرات في المنصة أو في القانون.
          سنُشعرك بأيّ تعديل جوهري عبر بريد إلكتروني + إشعار داخل المنصة قبل 30
          يوماً من سريانه.
        </p>
        <p>
          نسخة السياسة الحالية: <strong className="text-foreground">1.0</strong> —
          تاريخ آخر تحديث: 2026/01/01.
        </p>
      </div>
    ),
  },
  {
    icon: Mail,
    n: 13,
    title: "الاتصال بنا",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>لأيّ سؤال يتعلّق بخصوصيتك:</p>
        <ul className="list-none ps-0 space-y-1.5 text-foreground/90">
          <li className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <a
              href="mailto:privacy@syba-community.ma"
              className="text-primary underline underline-offset-2"
              dir="ltr"
            >
              privacy@syba-community.ma
            </a>
          </li>
          <li className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <span>مسؤول حماية البيانات: لجنة النزاهة بالحي</span>
          </li>
          <li className="flex items-center gap-2">
            <Database className="size-4 text-primary" />
            <span>حي سيدي يوسف بن علي الصنهاجي، مراكش، المغرب</span>
          </li>
        </ul>
        <p className="text-xs">
          نستجيب لطلبات الخصوصية خلال 30 يوماً كحدّ أقصى (غالباً أسرع).
        </p>
      </div>
    ),
  },
];

const FR_SECTIONS = [
  {
    title: "Politique de confidentialité (résumé)",
    body: (
      <div
        className="space-y-3 text-sm leading-relaxed text-muted-foreground"
        dir="ltr"
      >
        <p>
          La plateforme <strong>Sidi Youssef Ben Ali Al-Asima</strong> est une
          plateforme communautaire solidaire gérée par les résidents du quartier
          Sidi Youssef Ben Ali Sanhaji à Marrakech, dans le respect de la loi
          marocaine 09-08 relative à la protection des données personnelles et
          de la CNDP (Commission Nationale de Contrôle de la Protection des
          Données Personnelles).
        </p>
        <p>
          Nous collectons uniquement les données nécessaires : nom complet, e-mail,
          téléphone, numéro de carte d'identité nationale (optionnel, chiffré
          bcrypt), contributions et demandes de fonds, journal d'audit.
        </p>
        <p>
          Nous ne partageons <strong>aucune donnée personnelle avec des tiers
          commerciaux</strong>. Les données sont hébergées sur Supabase (Union
          Européenne — Francfort/Londres), chiffrées au repos et en transit.
        </p>
        <p>
          Vous disposez des droits d'accès, de rectification, d'effacement, de
          portabilité et d'opposition. Pour exercer ces droits :{" "}
          <a
            href="mailto:privacy@syba-community.ma"
            className="text-primary underline underline-offset-2"
          >
            privacy@syba-community.ma
          </a>
          . Pour déposer une plainte auprès de la CNDP :{" "}
          <a
            href="https://www.cnp.ma"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            www.cnp.ma
          </a>
          .
        </p>
      </div>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-10">
      {/* الرأس */}
      <header className="space-y-3 text-center">
        <Badge
          variant="outline"
          className="bg-secondary/5 text-secondary border-secondary/20"
        >
          <Shield className="size-3" />
          القانون 09-08 — CNDP
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          سياسة الخصوصية
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          نتعامل مع بياناتك بالشفافية والاحترام الذي يستحقه أهل حي سيدي يوسف بن
          علي. هذه الوثيقة تشرح بصراحة كل ما يتعلّق ببياناتك. اقرأها براحة.
        </p>
      </header>

      <ZelligeDivider variant="stars" />

      {/* الأقسام العربية */}
      <div className="space-y-6">
        {AR_SECTIONS.map((section) => (
          <Card key={section.n} className="warm-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <section.icon className="size-5" />
                </div>
                <h2 className="font-heading text-lg font-bold text-foreground">
                  <span className="text-accent">{section.n}.</span>{" "}
                  {section.title}
                </h2>
              </div>
              {section.body}
            </CardContent>
          </Card>
        ))}
      </div>

      <ZelligeDivider variant="wave" />

      {/* القسم الفرنسي */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-accent/5 text-accent border-accent/20"
          >
            Version française
          </Badge>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Politique de confidentialité
          </h2>
        </div>
        {FR_SECTIONS.map((s) => (
          <Card key={s.title} className="warm-shadow">
            <CardContent className="p-6 space-y-3">
              <h3 className="font-heading text-base font-bold text-foreground">
                {s.title}
              </h3>
              {s.body}
            </CardContent>
          </Card>
        ))}
      </section>

      <ZelligeDivider variant="diamond" />

      {/* إشارة CNDP */}
      <section>
        <Card className="bg-gradient-to-br from-secondary/5 to-accent/5 border-secondary/15">
          <CardContent className="p-6 space-y-3 text-center">
            <Shield className="mx-auto size-8 text-secondary" />
            <h2 className="font-heading text-lg font-bold text-foreground">
              إشارة CNDP
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              هذه المنصة مُسجّلة لدى اللجنة الوطنية لمراقبة حماية البيانات
              الشخصية (CNDP) وفقاً للقانون المغربي رقم 09-08. رقم الإخطار يُنشر
              هنا فور الحصول عليه.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="https://www.cnp.ma"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-xs text-foreground hover:bg-accent/10 transition-colors"
              >
                <Shield className="size-3.5 text-secondary" />
                CNDP — www.cnp.ma
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Mail className="size-3.5" />
                تواصل معنا
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* روابط سريعة */}
      <section className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/terms"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ScrollText className="size-3.5" />
          شروط الاستخدام
        </Link>
        <span className="text-muted-foreground/30">•</span>
        <Link
          href="/about"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          من نحن
        </Link>
        <span className="text-muted-foreground/30">•</span>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Mail className="size-3.5" />
          اتصل بنا
        </Link>
      </section>
    </div>
  );
}
