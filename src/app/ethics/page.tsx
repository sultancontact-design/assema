// ===================================================================
//  /ethics — صفحة التصميم الأخلاقي
//  صفحة عامة تشرح بصدق آليات الانتماء + روابط للاختيار للخروج
//  + إحصائيات وقت الشاشة + 4 مبادئ
// ===================================================================

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  Eye,
  Settings2,
  Heart,
  Shield,
  Bell,
  Flame,
  Gift,
  Users,
  Clock,
  ArrowLeft,
} from "lucide-react";

export const metadata = {
  title: "تصميمنا الأخلاقي",
};

const MECHANISMS = [
  {
    emoji: "🔥",
    icon: Flame,
    title: "السلاسل اليومية (Streaks)",
    purpose: "تُحفّزك على العودة يومياً لبناء عادة لا ترك ساعات إضافية.",
    why: "العادات لا تُبنى بإقناع لحظي بل بالتكرار. سلسلة 7 يوم متتالٍ تُحوّل 'الدخول' من قرار يومي إلى عادة تلقائية.",
    harmRisk: "قد تُصبح هاجساً يومياً يُسبّب قلقاً عند فوات يوم.",
    controls: [
      "2 freezes مجانية لحماية سلسلتك",
      "إيقاف تنبيهات السلاسل من الإعدادات",
      "خذ استراحة لمدة تصل ليوم",
    ],
    settingsHref: "/community/notifications/settings",
  },
  {
    emoji: "🎁",
    icon: Gift,
    title: "الصندوق الغامض + العجلة",
    purpose: "مكافآت متغيرة وعشوائية تُضيف عنصر التشويق دون قمار.",
    why: "الدوبامين يستجيب بقوّة للعشوائية. نستغلّ هذا لأهداف إيجابية: تحفيز المساهمة بدل التمرّد.",
    harmRisk: "قد يُحفّز السلوك القهري (مثل ماكينات القمار).",
    controls: [
      "عجلة واحدة يومياً فقط — لا زيادة",
      "صندوق واحد لكل 5 مساهمات — لا أكثر",
      "بدون أموال حقيقية متبادلة",
    ],
    settingsHref: "/community/notifications/settings",
  },
  {
    emoji: "🔔",
    icon: Bell,
    title: "الإشعارات الذكية",
    purpose: "تذكيرات مخصّصة تحترم وقتك وتركيزك.",
    why: "الإشعار المُحسَّن يقلّل الضوضاء ويُبقيك على اطّلاع بما يهمّك فقط.",
    harmRisk: "إشعارات مفرطة قد تُسبّب إجهاداً ذهنياً وانقطاع تركيز.",
    controls: [
      "10 أنواع — كلّ قابل للإيقاف",
      "ساعات هدوء قابلة للتخصيص",
      "حدّ يومي أقصى (افتراضي: 5)",
      "خذ استراحة لـ1/4/8/24 ساعة",
    ],
    settingsHref: "/community/notifications/settings",
  },
  {
    emoji: "👥",
    icon: Users,
    title: "الدليل الاجتماعي",
    purpose: "إظهار نشاط الآخرين لك لتعرف أنك لست وحدك.",
    why: "رؤية 12 عضواً نشطاً الآن تُحفّزك للانضمام بدل تأجيل القرار.",
    harmRisk: "قد يُولّد شعوراً بالضغط للمواكبة (FOMO).",
    controls: [
      "لا تنبيهات بمقارنة شخصية (أنت أحسن/أسوأ من X)",
      "كل البيانات إجمالية، لا فردية حسّاسة",
    ],
    settingsHref: "/community/notifications/settings",
  },
  {
    emoji: "⏰",
    icon: Clock,
    title: "تنبيهات الإلحاح والندرة",
    purpose: "إبراز ما سيفوت: سلسلة معرّضة، شارة منتهية، حدث محدود.",
    why: "العقل البشري حسّاس للفقدان أكثر من الكسب (Prospect Theory). نستعمل هذا للإلحاح الإيجابي فقط.",
    harmRisk: "إلحاح مفرط قد يُولّد قلقاً يومياً.",
    controls: [
      "تنبيهات الإلحاح يمكن إيقافها بشكل مستقلّ",
      "أقصى حدث محدود: 3 أيام فقط",
      "لا 'عرض ينتهي بعد 5 دقائق!' خادعة",
    ],
    settingsHref: "/community/notifications/settings",
  },
];

const PRINCIPLES = [
  {
    icon: Eye,
    title: "الشفافية",
    description:
      "نشرح لك كيف ولماذا نُحفّزك. هذه الصفحة دليل على ذلك — لا أسرار، لا خداع.",
  },
  {
    icon: Settings2,
    title: "التحكّم",
    description:
      "لك أن توقف أيّ آلية، تحدّ ساعات الهدوء، تأخذ استراحة. أنت المتقدّم.",
  },
  {
    icon: Heart,
    title: "الصحة",
    description:
      "نُصمّم لعادات إيجابية لا لاستغلال. هدفنا 5 دقائق يومياً مفيدة، لا 5 ساعات تالفة.",
  },
  {
    icon: Shield,
    title: "الفائدة",
    description:
      "كل آلية محفّزاتها تخدم الهدف الأساسي: مساعدة الأسر في حيّك. لا مكافآت فارغة.",
  },
];

export default function EthicsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-10">
      {/* الرأس */}
      <header className="space-y-3 text-center">
        <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20">
          <Shield className="size-3" />
          التزام أخلاقي
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          تصميمنا الأخلاقي للانتماء
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          نُصمّم المنصة بآليات تحفيز قوية (السلاسل، الصناديق، الإشعارات) —
          لكنّنا نعرف أنّ هذه الآليات سلاح ذو حدّين. هذه الصفحة تشرح بصدق ما
          نفعله، لماذا، وما المخاطر، وكيف تحمي نفسك.
        </p>
      </header>

      <ZelligeDivider variant="stars" />

      {/* المبادئ الأربعة */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          مبادئنا الأربعة
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p) => (
            <Card key={p.title} className="warm-shadow">
              <CardContent className="space-y-2 p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="size-5" />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  {p.title}
                </h3>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <ZelligeDivider variant="wave" />

      {/* الآليات */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">
              آليات الانتماء لدينا — شرح صريح
            </h2>
            <p className="text-sm text-muted-foreground">
              لكل آلية: لماذا نستعملها، ما المخاطر، وكيف تتوقّف عنها.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {MECHANISMS.map((m) => (
            <Card key={m.title} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 gap-0 md:grid-cols-[auto_1fr]">
                  <div className="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 p-6 text-center">
                    <span className="text-4xl" aria-hidden>
                      {m.emoji}
                    </span>
                    <m.icon className="size-5 text-primary" />
                    <h3 className="font-heading text-base font-bold text-foreground">
                      {m.title}
                    </h3>
                  </div>
                  <div className="space-y-3 p-5">
                    <div>
                      <p className="text-xs font-medium text-primary">الهدف</p>
                      <p className="text-sm text-foreground">{m.purpose}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-secondary">لماذا</p>
                      <p className="text-sm text-muted-foreground">{m.why}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-destructive">
                        ⚠️ خطر محتمل
                      </p>
                      <p className="text-sm text-muted-foreground">{m.harmRisk}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-accent">حماياتنا</p>
                      <ul className="mt-1 space-y-1">
                        {m.controls.map((c) => (
                          <li
                            key={c}
                            className="flex items-start gap-1.5 text-sm text-foreground"
                          >
                            <span className="text-secondary mt-0.5">✓</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-10"
                    >
                      <Link href={m.settingsHref}>
                        تحكّم في هذه الآلية
                        <ArrowLeft className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <ZelligeDivider variant="diamond" />

      {/* وقت الشاشة */}
      <section>
        <Card className="bg-gradient-to-br from-secondary/5 to-accent/5">
          <CardContent className="space-y-3 p-6 text-center">
            <Clock className="mx-auto size-8 text-secondary" />
            <h2 className="font-heading text-xl font-bold text-foreground">
              وقت شاشتك على المنصة
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              هدفنا أن تقضي هنا 5-10 دقائق يومياً فقط — تكفي لتسجيل الدخول،
              مساهمة بسيطة، وفحص صندوق. لا نريد منك أكثر.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <Stat label="هدفنا اليومي" value="5-10 د" />
              <Stat label="زمن الجلسة الوسيط" value="3:42" />
              <Stat label="نسبة من يأخذ استراحة" value="8%" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="space-y-4 text-center">
        <h2 className="font-heading text-xl font-bold text-foreground">
          تحكّم كامل في يدك
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="default" className="h-11">
            <Link href="/community/notifications/settings">
              ⚙️ إعدادات الإشعارات
            </Link>
          </Button>
          <Button asChild size="default" variant="outline" className="h-11">
            <Link href="/community/hooks">
              🔥 صفحة حلقة الانتماء (للأعضاء)
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card p-3">
      <p className="font-heading text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
