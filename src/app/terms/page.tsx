// ===================================================================
//  /terms — شروط الاستخدام
//  Server Component — عربي
//  12 قسماً + إشارة قانونية في التذييل
// ===================================================================

import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  FileText,
  UserCheck,
  UserPlus,
  Users2,
  Shield,
  Brain,
  AlertTriangle,
  Gavel,
  RefreshCw,
  UserX,
  Scale,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";

export const metadata: Metadata = {
  title: "شروط الاستخدام",
  description:
    "شروط استخدام منصة سيدي يوسف بن علي العاصمة — التزامات المستخدم والمنصة، الملكية الفكرية، حلّ النزاعات وفقاً للقانون المغربي.",
};

const SECTIONS = [
  {
    icon: CheckCircle2,
    n: 1,
    title: "قبول الشروط",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          باستخدامك لمنصة{" "}
          <strong className="text-foreground">سيدي يوسف بن علي العاصمة</strong>{" "}
          (المشار إليها بـ «المنصة»)، فإنّك تُقرّ بأنّك قرأت هذه الشروط وفهمتها
          ووافقت عليها. إن لم توافق على أيّ بند منها، يُرجى عدم استخدام المنصة.
        </p>
        <p>
          موافقتك تُعدّ صريحة عند: إنشاء حساب، تسجيل الدخول، المساهمة في الصندوق،
          التسجيل في فعالية، أو مجرّد تصفّح المحتوى العام.
        </p>
      </div>
    ),
  },
  {
    icon: FileText,
    n: 2,
    title: "التعريفات",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>المنصة:</strong> الموقع الإلكتروني والـAPIs والتطبيق
            (PWA) التابع لـ«سيدي يوسف بن علي العاصمة».
          </li>
          <li>
            <strong>المستخدم:</strong> أيّ شخص يصل للمنصة، سواء كان زائراً أو
            عضواً مسجّلاً.
          </li>
          <li>
            <strong>العضو:</strong> مستخدم أنشأ حساباً فعّالاً وأكمل ملفه.
          </li>
          <li>
            <strong>اللجنة:</strong> لجنة الإدارة المحلية للحي، المكوّنة من: مشرف
            عام، أمين صندوق، مشرف حي، لجنة نزاهة.
          </li>
          <li>
            <strong>المساهمة:</strong> مبلغ يدفعه العضو لصندوق المعروف (شهري،
            عند الطلب، أو لمخصّص).
          </li>
          <li>
            <strong>الطلب:</strong> طلب دعم مالي من الصندوق (مرض، وفاة، عرس،
            تعليم، طوارئ، مشروع صغير).
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: UserPlus,
    n: 3,
    title: "التسجيل والحساب",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            التسجيل مفتوح لأيّ مقيم في حي سيدي يوسف بن علي الصنهاجي بمراكش، أو من
            لهم صلة بالحي.
          </li>
          <li>
            يجب تقديم بيانات صحيحة وكاملة (الاسم، البريد، الهاتف). يُمنع استخدام
            بيانات شخص آخر دون إذنه.
          </li>
          <li>
            كلمة المرور مسؤوليتك — لا تُشاركها مع أحد. ننصح بتفعيل المصادقة
            الثنائية (2FA).
          </li>
          <li>
            أنت مسؤول عن كلّ نشاط يتمّ من حسابك. أبلغنا فوراً عن أيّ استخدام
            غير مصرّح به على{" "}
            <a
              href="mailto:security@syba-community.ma"
              className="text-primary underline underline-offset-2"
            >
              security@syba-community.ma
            </a>
            .
          </li>
          <li>
            لا يُسمح بإنشاء أكثر من حساب لكلّ شخص. الحسابات المكرّرة تُعلَّق.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: Users2,
    n: 4,
    title: "مسؤوليات المستخدم",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>يلتزم المستخدم بالآتي:</p>
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>المحتوى:</strong> لا تنشر محتوى مخالف للقانون المغربي (كراهية،
            عنف، إباحية، تشهير، انتهاك ملكية فكرية).
          </li>
          <li>
            <strong>السلوك:</strong> تعامل الآخرين باحترام. لا تنشر معلومات
            شخصية لأفراد دون إذنهم. لا إزعاج، لا تهديد، لا تخويف.
          </li>
          <li>
            <strong>القانوني:</strong> لا تستعمل المنصة لغسيل أموال، تمويل
            محظور، أو أيّ نشاط غير قانوني. المساهمات بشيكات أو تحويل بنكي
            موثّقة.
          </li>
          <li>
            <strong>الصدق:</strong> عند تقديم طلب دعم، يجب أن تكون المعلومات
            صحيحة. طلب كاذب يُؤدي لإيقاف الحساب + مساءلة قانونية.
          </li>
          <li>
            <strong>التحرّر من الديون:</strong> لا تساهم بمبلغ لا تملكه أو
            يُلحق ضرراً مالياً بأسرتك.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: Shield,
    n: 5,
    title: "مسؤوليات المنصة",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            تُوفّر المنصة خدمة مستقرّة قدر الإمكان، لكن لا تضمن توافراً 100%
            (قد توقف للصيانة أو لظروف خارج إرادتها).
          </li>
          <li>
            تُعالج الطلبات بشفافية وفقاً لسياسة منشورة. كلّ قرار يُسجَّل مع سببه
            في سجل التدقيق (AuditLog).
          </li>
          <li>
            تحمي بياناتك وفقاً لسياسة الخصوصية (القانون 09-08). تُبلّغ السلطة
            المختصّة عند خرق أمني جوهري خلال 72 ساعة.
          </li>
          <li>
            تنشر الإحصاءات المالية للحي بشكل علني (لوحة الشفافية) لكلّ أعضاء
            الحي.
          </li>
          <li>
            تستجيب لاستفسارات وشكاوى المستخدمين خلال 15 يوماً.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: Brain,
    n: 6,
    title: "الملكية الفكرية",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>محتوى المنصة:</strong> الشعار، التصميم، النصوص، الأكواد —
            مملوكة للّجنة. رخصة الاستخدام: المشروع مفتوح المصدر لخدمة المجتمع.
          </li>
          <li>
            <strong>محتوى المستخدم:</strong> أنت تحتفظ بملكية ما تنشر (تعليقات،
            منشورات). لكنّك تمنح المنصة رخصة غير حصرية لعرضه ضمن خدماتها.
          </li>
          <li>
            <strong>العلامات التجارية:</strong> أسماء الأحياء، المؤسسات،
            الفعاليات — ملك أصحابها. لا تستعملها بطريقة تُوحي بانتمائها للمنصة.
          </li>
          <li>
            <strong>الإيصالات الرقمية:</strong> كلّ إيصال صادر عن المنصة موقع
            رقمياً. يُعتبر دليلاً مالياً معتمداً.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: AlertTriangle,
    n: 7,
    title: "إخلاء المسؤولية",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            المنصة أداة تنظيمية تضامنية، لا تضمن نتائج المساهمات أو الطلبات. كلّ
            قرار يتّخذه أمين الصندوق ولجنة النزاهة وفق سياسة منشورة.
          </li>
          <li>
            لا نضمن دقّة كلّ المعلومات المنشورة من المستخدمين (فعاليات، إعلانات
            محلية). راجع المصدر قبل الاعتماد.
          </li>
          <li>
            لا تُعدّ المنصة بديلاً عن مؤسسات رسمية (الجماعات، المحاكم،
            الإدارات) — هي أداة تضامن أهلي.
          </li>
          <li>
            قد تحتوي روابط خارجية على محتوى لا نتحكّم فيه — لا نتحمّل مسؤوليته.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: Scale,
    n: 8,
    title: "حدّ المسؤولية",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          إلى أقصى حدّ يسمح به القانون المغربي، لا تتحمّل المنصة ولا لجنتها أيّ
          مسؤولية عن:
        </p>
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>أضرار مباشرة أو غير مباشرة ناجمة عن استخدام المنصة أو تعطّلها.</li>
          <li>خسارات مالية ناجمة عن قرارات اللجنة (رفض طلب، تأخير صرف).</li>
          <li>
            محتوى منشور من مستخدمين (تعليقات، منشورات) — المسؤولية على ناشره.
          </li>
          <li>
            خرق أمني استثنائي رغم اتّخاذنا إجراءات تقنية معقولة (TLS، bcrypt،
            AuditLog).
          </li>
        </ul>
        <p className="text-xs">
          إجمالي مسؤولية المنصة لا يتجاوز قيمة مساهمتك الشهرية الأخيرة.
        </p>
      </div>
    ),
  },
  {
    icon: RefreshCw,
    n: 9,
    title: "التعديلات",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          قد نُعدّل هذه الشروط دورياً. سنُشعرك بأيّ تعديل جوهري عبر بريد إلكتروني
          + إشعار داخل المنصة قبل 30 يوماً من سريانه. استمرارك في استخدام
          المنصة بعد سريان التعديل يُعدّ قبولاً ضمنياً.
        </p>
        <p>
          النسخة الحالية: <strong className="text-foreground">1.0</strong> — آخر
          تحديث: 2026/01/01.
        </p>
      </div>
    ),
  },
  {
    icon: UserX,
    n: 10,
    title: "إنهاء الحساب",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>يمكن إنهاء حسابك في الحالات التالية:</p>
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>بطلبك:</strong> من صفحة الملف الشخصي → «حذف الحساب».
            بياناتك المالية تُحفظ 5 سنوات (قانون)، الباقي يُحذف خلال 30 يوماً.
          </li>
          <li>
            <strong>من قِبلنا:</strong> عند خرق جوهري لهذه الشروط (احتيال،
            انتحال شخصية، نشر محتوى مخالف). نُبلّغك بالسبب قبل الإنهاء (إذا سمح
            القانون).
          </li>
          <li>
            <strong>تلقائياً:</strong> عند خمول الحساب 24 شهراً متواصلة (لا
            تسجيل دخول ولا نشاط).
          </li>
        </ul>
        <p>
          عند الإنهاء، تبقى التزاماتك المالية تجاه الصندوق سارية (مساهمات غير
          مُكتملة، التزامات بأصول قانونية).
        </p>
      </div>
    ),
  },
  {
    icon: Gavel,
    n: 11,
    title: "حلّ النزاعات — القانون المغربي",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <ul className="list-disc ps-5 space-y-1.5 text-foreground/90">
          <li>
            <strong>القانون المُطبَّق:</strong> القانون المغربي، وتحديداً
            القانون 09-08 (الخصوصية)، قانون الالتزامات والعقود، قانون المساطر
            المدنية.
          </li>
          <li>
            <strong>الوساطة:</strong> عند نزاع، نلجأ أولاً للّجنة النزاهة
            المحلية كوسيط. هي مكلّفة بالاستماع للطرفين وإصدار توصية غير ملزمة.
          </li>
          <li>
            <strong>الاختصاص القضائي:</strong> في حال فشل الوساطة، تُرفع
            القضايا أمام{" "}
            <strong className="text-foreground">
              المحاكم الابتدائية بمراكش
            </strong>
            .
          </li>
          <li>
            <strong>التحكيم:</strong> في النزاعات المالية الكبرى (≥ 50,000
            درهم)، يمكن الاتفاق على تحكيم وفق مركز التحكيم المغربي.
          </li>
          <li>
            <strong>المدّة:</strong> أيّ دعوى يجب رفعها خلال 12 شهراً من تاريخ
            علمك بالضرر، وإلا سقطت بالتقادم.
          </li>
        </ul>
      </div>
    ),
  },
  {
    icon: Mail,
    n: 12,
    title: "الاتصال",
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>لأيّ استفسار حول هذه الشروط:</p>
        <ul className="list-none ps-0 space-y-1.5 text-foreground/90">
          <li className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <a
              href="mailto:legal@syba-community.ma"
              className="text-primary underline underline-offset-2"
              dir="ltr"
            >
              legal@syba-community.ma
            </a>
          </li>
          <li className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <Link
              href="/contact"
              className="text-primary underline underline-offset-2"
            >
              صفحة الاتصال الكاملة
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <Gavel className="size-4 text-primary" />
            <span>لجنة النزاهة — حي سيدي يوسف بن علي، مراكش</span>
          </li>
        </ul>
      </div>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-10">
      {/* الرأس */}
      <header className="space-y-3 text-center">
        <Badge
          variant="outline"
          className="bg-primary/5 text-primary border-primary/20"
        >
          <FileText className="size-3" />
          وثيقة قانونية
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          شروط الاستخدام
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          باستخدامك لهذه المنصة، فأنت تُقرّ بقراءتك لهذه الشروط وقبولك لها. هي
          تحكم العلاقة بينك وبين لجنة الحي، وتحمي حقوق الطرفين.
        </p>
      </header>

      <ZelligeDivider variant="stars" />

      {/* الأقسام */}
      <div className="space-y-6">
        {SECTIONS.map((section) => (
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

      <ZelligeDivider variant="diamond" />

      {/* الإشارة القانونية */}
      <section>
        <Card className="bg-gradient-to-br from-secondary/5 to-accent/5 border-secondary/15">
          <CardContent className="p-6 space-y-3 text-center">
            <Scale className="mx-auto size-8 text-secondary" />
            <h2 className="font-heading text-lg font-bold text-foreground">
              إشارة قانونية
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              هذه الشروط مُعدّة وفقاً للقانون المغربي، وتحديداً القانون 09-08
              (الخصوصية)، قانون الالتزامات والعقود، وقانون المساطر المدنية.
              الاختصاص القضائي: المحاكم الابتدائية بمراكش.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/privacy-policy"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-xs text-foreground hover:bg-accent/10 transition-colors"
              >
                <Shield className="size-3.5 text-secondary" />
                سياسة الخصوصية
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
          href="/privacy-policy"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Shield className="size-3.5" />
          سياسة الخصوصية
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
