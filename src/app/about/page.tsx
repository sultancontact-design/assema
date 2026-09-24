// ===================================================================
//  /about — من نحن
//  Server Component (مع قسم client-side فرamer-motion للأنميشن)
//  8 أقسام: Hero، القصة، الرؤية، 5 مبادئ، الفريق، الشركاء، الأثر، شكر للمؤسسين
// ===================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getFundStats } from "@/lib/fund-stats";
import { formatNumber } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  Heart,
  Eye,
  HandCoins,
  Users,
  Sparkles,
  Building2,
  TrendingUp,
  MapPin,
  Scale,
  Shield,
  Leaf,
  TrendingUp as Trend,
  HandHeart,
  ArrowLeft,
} from "lucide-react";
import { AboutEntrance } from "@/components/community/about-entrance";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "من نحن",
  description:
    "قصة منصة سيدي يوسف بن علي العاصمة — من حي بمراكش إلى عاصمة المعروف الرقمي. رؤيتنا، مبادئنا الخمسة، فريقنا، وأثرنا.",
};

const PRINCIPLES = [
  {
    icon: Shield,
    title: "الكرامة",
    description:
      "كلّ أسرة تستحقّ الدعم بكرامة. لا سؤال عن اللون، العرق، أو الانتماء. لا تفاوض على إنسانيّتك.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Eye,
    title: "الشفافية",
    description:
      "كلّ درهم مُسجَّل، كلّ قرار مُعلَّل. لوحة شفافية عامة، إيصالات رقمية موقّعة، سجلّ تدقيق كامل.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Leaf,
    title: "الاستدامة",
    description:
      "لا مساهمة فوق طاقتك. شهر 20 درهم أكبر من 200 درهم مرّة واحدة. الاستمرارية أصعب من البداية.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Trend,
    title: "التوسّع",
    description:
      "نبدأ بحيّ واحد. لكنّنا نبني بنية تصلح لكلّ أحياء المغرب. من حيّ إلى عاصمة — من عاصمة إلى مغرب.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: HandHeart,
    title: "المعروف",
    description:
      "نُرقمن قيمة عريقة مغربية. «المعروف» ليس صدقة، بل التزام جماعي. نُرجع له كيانه عبر التكنولوجيا.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
];

const TEAM_PLACEHOLDER = [
  {
    role: "المشرف العام",
    name: "يُعلَن قريباً",
    bio: "تنسيق عام، علاقات خارجية، تطوير الرؤية.",
  },
  {
    role: "أمين الصندوق",
    name: "يُعلَن قريباً",
    bio: "إدارة المساهمات، الصرف، الإيصالات، الشفافية المالية.",
  },
  {
    role: "مشرف الحي",
    name: "يُعلَن قريباً",
    bio: "تنظيم الفعاليات، إدارة المجموعات، استقبال الأعضاء الجدد.",
  },
  {
    role: "لجنة النزاهة",
    name: "3 أعضاء مستقلّون",
    bio: "مراجعة الطلبات الكبرى، الوساطة في النزاعات، ضمان العدالة.",
  },
];

const PARTNERS_PLACEHOLDER = [
  {
    name: "الجماعة الترابية لمراكش",
    type: "دعم مؤسسي",
    icon: Building2,
  },
  {
    name: "مؤسسات أهلية محلية",
    type: "شراكة مجتمعية",
    icon: Users,
  },
  {
    name: "CNDP — اللجنة الوطنية",
    type: "إطار قانوني",
    icon: Shield,
  },
  {
    name: "Supabase EU",
    type: "استضافة البيانات",
    icon: Sparkles,
  },
];

async function getImpactStats() {
  let families = 0;
  let contributions = 0;
  let balance = 0;
  let events = 0;
  try {
    const [f, s, ev] = await Promise.all([
      db.family.count({ where: { isActive: true, deletedAt: null } }),
      getFundStats(),
      db.event.count({ where: { deletedAt: null } }),
    ]);
    families = f;
    contributions = s.totalContributions;
    balance = s.balance;
    events = ev;
  } catch {
    // DB غير متاح
  }
  return { families, contributions, balance, events };
}

export default async function AboutPage() {
  const stats = await getImpactStats();
  const impactStats = [
    {
      label: "أسرة مسجّلة",
      value: formatNumber(stats.families),
      icon: Users,
      color: "text-secondary",
    },
    {
      label: "درهم مساهم",
      value: formatNumber(stats.contributions),
      icon: HandCoins,
      color: "text-primary",
    },
    {
      label: "درهم رصيد الصندوق",
      value: formatNumber(stats.balance),
      icon: Scale,
      color: "text-accent",
    },
    {
      label: "فعالية منظّمة",
      value: formatNumber(stats.events),
      icon: Sparkles,
      color: "text-primary",
    },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 space-y-12">
      {/* 1. Hero */}
      <AboutEntrance hero delay={0}>
        <header className="space-y-5 text-center pt-4">
          <Badge
            variant="outline"
            className="bg-secondary/5 text-secondary border-secondary/20"
          >
            <MapPin className="size-3" />
            حي سيدي يوسف بن علي الصنهاجي — مراكش
          </Badge>
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl md:text-5xl leading-tight">
            سيدي يوسف بن علي العاصمة
            <br />
            <span className="text-primary">من حيّ إلى عاصمة</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            نحن أهل حيٍّ، اجتمعنا لنُرقمن «المعروف المغربي» — قيمة عريقة تجمع
            الأسر حول التضامن والتكافل. من حيٍّ صغير بمدينة مراكش، نُطلق تجربةً
            نأمل أن تكون نموذجاً لكلّ أحياء المغرب.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild size="default" className="h-11">
              <Link href="/community">
                <Heart className="size-4" />
                انضمّ للمجتمع
              </Link>
            </Button>
            <Button asChild size="default" variant="outline" className="h-11">
              <Link href="/community/fund">
                <HandCoins className="size-4" />
                ساهم في الصندوق
              </Link>
            </Button>
          </div>
        </header>
      </AboutEntrance>

      <ZelligeDivider variant="diamond" />

      {/* 2. القصة */}
      <AboutEntrance delay={0.1}>
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20"
            >
              <Heart className="size-3" />
              قصّتنا
            </Badge>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              من حيّ بمراكش
            </h2>
          </div>
          <Card className="warm-shadow">
            <CardContent className="p-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                حيّ سيدي يوسف بن علي الصنهاجي ليس مجرّد عنوان على خريطة مراكش.
                هو ذاكرة: مسجد عتيق، أزقّة ضيّقة، عائلات عاشت فيه لأجيال، أفراح
                وأتراح تُقاسَم عند الفجر.
              </p>
              <p>
                كم مرّة فقد أحدنا أباً أو أُمّاً، ووجد الجيران قد سبقوه بجمع
                المبلغ؟ كم مرّة اقترح أحدهم زواجاً، فتسارع الجميع للمساهمة؟ كم
                فعالية نظّمها أهل الحيّ من غير ميزانية، فقط بإرادة جماعية؟
              </p>
              <p>
                لكنّ الزمن تغيّر. صار الناس أقلّ تفرّغاً، الأسر أكثر انشغالاً،
                والشباب أقلّ حضوراً في الحيّ. «المعروف» — قيمة عريقة مغربية —
                بدأ يفقد روحه. لم يَعُد الجيران يعرف بعضهم كما بالأمس.
              </p>
              <p>
                فجاءت الفكرة: لماذا لا نُرجع للمعروف كيانه، لكن بشفافية العصر؟
                منصة بسيطة، بالعربية، تحترم خصوصية الجار، تُسجّل كلّ درهم،
                تُعطي إيصالاً رقمياً، تُنظّم الفعاليات، وتسمح لكلّ أسرة بأن ترى
                أثرها في الصندوق.
              </p>
              <p>
                ليست منصة تكنولوجية لأجل التكنولوجيا. هي امتداد لحياة حيّ عاش
                فيها الناس أجمل ما عرفوا من تكافل — نُعيد لها روحها بالأدوات
                التي نستعملها اليوم.
              </p>
            </CardContent>
          </Card>
        </section>
      </AboutEntrance>

      <ZelligeDivider variant="wave" />

      {/* 3. الرؤية */}
      <AboutEntrance delay={0.15}>
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-accent/5 text-accent border-accent/20"
            >
              <Eye className="size-3" />
              رؤيتنا
            </Badge>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              رقمنة المعروف المغربي
            </h2>
          </div>
          <Card className="bg-gradient-to-br from-secondary/5 to-accent/5 border-secondary/15 warm-shadow">
            <CardContent className="p-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                نتخيّل يوماً يكون فيه كلّ حيّ مغربي له صندوق معروف رقمي:
                <strong className="text-foreground"> شفّاف</strong>،{" "}
                <strong className="text-foreground">بسيط</strong>،{" "}
                <strong className="text-foreground">آمن</strong>.
              </p>
              <p>
                نتخيّل يوماً لا يحتاج فيه الأهالي لتنظيم فعالية على الورق — يكفي
                زرٌّ واحد. نتخيّل يوماً تتلقّى فيه الأسرة الدعم في يومها الأسوأ
                دون أن تضطرّ لطلبٍ شخصي.
              </p>
              <p>
                نتخيّل يوماً يقول فيه شاب: «ساهمتُ في عرس جاري عبر الهاتف» —
                فيبتسم، لأنّ المعروف لم يمت، بل تجدّد.
              </p>
              <p className="text-foreground font-medium pt-2">
                من حيٍّ واحد، إلى عاصمة، إلى مغرب — نموذج تضامن رقمي مغربي
                أصيل.
              </p>
            </CardContent>
          </Card>
        </section>
      </AboutEntrance>

      <ZelligeDivider variant="stars" />

      {/* 4. المبادئ الخمسة */}
      <AboutEntrance delay={0.2}>
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20"
            >
              <Shield className="size-3" />
              مبادئنا
            </Badge>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              المبادئ الخمسة
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            خمس قيم تحكم كلّ قرار نتّخذه — في المنتج، في العلاقات، في المال.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <AboutEntrance key={p.title} delay={0.25 + i * 0.05} card>
                <Card className="h-full warm-shadow">
                  <CardContent className="p-5 space-y-3">
                    <div
                      className={`flex size-11 items-center justify-center rounded-lg ${p.bg} ${p.color}`}
                    >
                      <p.icon className="size-5" />
                    </div>
                    <h3 className="font-heading text-base font-bold text-foreground">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>
                  </CardContent>
                </Card>
              </AboutEntrance>
            ))}
          </div>
        </section>
      </AboutEntrance>

      <ZelligeDivider variant="diamond" />

      {/* 5. الفريق */}
      <AboutEntrance delay={0.3}>
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-secondary/5 text-secondary border-secondary/20"
            >
              <Users className="size-3" />
              فريقنا
            </Badge>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              من يُدير الحيّ؟
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            لجنة محلية من سكان الحي. لا رواتب — تبرّع بالوقت. (سيُعلن عن أسماء
            اللجنة فور الإطلاق الرسمي).
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TEAM_PLACEHOLDER.map((member) => (
              <Card key={member.role} className="warm-shadow">
                <CardContent className="p-5 space-y-2">
                  <Badge
                    variant="outline"
                    className="bg-accent/5 text-accent border-accent/20"
                  >
                    {member.role}
                  </Badge>
                  <h3 className="font-heading text-base font-bold text-foreground">
                    {member.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </AboutEntrance>

      <ZelligeDivider variant="minimal" />

      {/* 6. الشركاء */}
      <AboutEntrance delay={0.35}>
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-accent/5 text-accent border-accent/20"
            >
              <Building2 className="size-3" />
              شركاؤنا
            </Badge>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              من يساندنا
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PARTNERS_PLACEHOLDER.map((partner) => (
              <Card key={partner.name} className="warm-shadow">
                <CardContent className="p-5 space-y-2 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <partner.icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    {partner.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    {partner.type}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </AboutEntrance>

      <ZelligeDivider variant="wave" />

      {/* 7. الأثر — إحصاءات حية */}
      <AboutEntrance delay={0.4}>
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20"
            >
              <TrendingUp className="size-3" />
              أثرنا
            </Badge>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              أثرٌ حيٌّ الآن
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            أرقام حقيقية من قاعدة بياناتنا — لا تزيّ، لا إعلان. آخر تحديث عند
            تحميل الصفحة.
          </p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {impactStats.map((stat) => (
              <Card key={stat.label} className="warm-shadow">
                <CardContent className="p-5 space-y-2 text-center">
                  <div
                    className={`mx-auto flex size-9 items-center justify-center rounded-lg bg-muted ${stat.color}`}
                  >
                    <stat.icon className="size-4" />
                  </div>
                  <p className={`font-heading text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </AboutEntrance>

      <ZelligeDivider variant="diamond" />

      {/* 8. شكر للمؤسسين — أول 100 */}
      <AboutEntrance delay={0.45}>
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-secondary/5 text-secondary border-secondary/20"
            >
              <Heart className="size-3" />
              شكر
            </Badge>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              شكرٌ لأوّل 100 مؤسّس
            </h2>
          </div>
          <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-primary/15 warm-shadow">
            <CardContent className="p-6 space-y-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Heart className="size-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">
                شارة المؤسّس (Founder Badge)
              </h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                أوّل 100 عضو يلتحقون بمنصة الحيّ يحصلون على شارة «المؤسّس» — شارة
                دائمة في ملفهم، تذكير بأنّهم كانوا هنا قبل أن تصبح المنصة
                رائجة. شارة لا تُمنح إلا مرّة واحدة، لا تُقدّر بثمن.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="size-9 rounded-full bg-primary/10"
                    aria-hidden="true"
                  />
                ))}
                <span className="text-xs text-muted-foreground">
                  +92 مؤسّس
                </span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                8 أعضاء سجّلوا حتى الآن — بقي 92 مكاناً للحصول على الشارة.
              </p>
            </CardContent>
          </Card>
        </section>
      </AboutEntrance>

      <ZelligeDivider variant="stars" />

      {/* CTA نهائي */}
      <AboutEntrance delay={0.5}>
        <section className="space-y-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            كن جزءاً من القصّة
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            منصة المعروف لا تعمل بدون أهلها. انضمّ، ساهم بما تستطيع، احضر
            فعالية، شارك في مجموعة. كلّ مساهمة تُبنى بها ذاكرة الحيّ.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild size="default" className="h-11">
              <Link href="/register">
                <Sparkles className="size-4" />
                أنشئ حساباً
              </Link>
            </Button>
            <Button asChild size="default" variant="outline" className="h-11">
              <Link href="/contact">
                <ArrowLeft className="size-4" />
                تواصل معنا
              </Link>
            </Button>
          </div>
        </section>
      </AboutEntrance>
    </div>
  );
}
