// ===================================================================
//  صفحة قصص النجاح — /stories
//  - 10 بطاقات قصص (placeholder)
//  - فلتر فئة (نجاح مهني، تجاوز أزمة، تضامن، تعليم)
//  - زر "شارك قصتك"
// ===================================================================

import Link from "next/link";
import {
  Sparkles,
  Filter,
  Heart,
  GraduationCap,
  Sprout,
  Briefcase,
  ChevronLeft,
  CalendarDays,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { STORY_CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "قصص نجاح",
  description:
    "قصص نجاح حقيقية من حي سيدي يوسف بن علي — نجاحات مهنية، تجاوز الأزمات، التضامن، والتعليم.",
};

// ─────────── خريطة الأيقونات للفئات ───────────
const CATEGORY_ICONS: Record<string, typeof Heart> = {
  PROFESSIONAL: Briefcase,
  RESILIENCE: Sprout,
  SOLIDARITY: Heart,
  EDUCATION: GraduationCap,
};

// ─────────── 10 قصص نجاح ───────────
const STORIES = [
  {
    id: "s1",
    title: "من الفرّان إلى صاحب مخبزة",
    excerpt:
      "بدأ محمد كفرّان في مخبزة الحي، تعلّم الصنعة، ادّخر، فتح مخبزته الخاصة التي تطعم اليوم 30 عائلة.",
    author: "محمد بنشقرون",
    date: "أكتوبر 2024",
    category: "PROFESSIONAL",
    color: "from-primary/15 to-accent/10",
  },
  {
    id: "s2",
    title: "مرض لم يُقعدها",
    excerpt:
      "أصابت فاطمة علة في الركبة، اعتقد الجميع أن حياتها انتهت. تعافت بالدعم، وفتحت ورشة خياطة في بيتها.",
    author: "فاطمة العمراني",
    date: "سبتمبر 2024",
    category: "RESILIENCE",
    color: "from-secondary/15 to-primary/10",
  },
  {
    id: "s3",
    title: "صندوق المعروف أنقذ عرس ابنتي",
    excerpt:
      "توفّي زوجها وتركها مع ثلاث بنات. عندما كبرت الكبرى وأرادت الزواج، تكفّل صندوق الحي بمصاريف العرس.",
    author: "الحاجة سعاد",
    date: "أغسطس 2024",
    category: "SOLIDARITY",
    color: "from-accent/15 to-secondary/10",
  },
  {
    id: "s4",
    title: "أوّل طبيبة من زنقة الحرّارين",
    excerpt:
      "نافسة على مقعد في كلية الطب، تعثرت مرتين، لكن دعم الجيران ومثابرة والدتها جعلها اليوم طبيبة أطفال.",
    author: "د. سلمى الحراق",
    date: "يوليوز 2024",
    category: "EDUCATION",
    color: "from-primary/15 to-secondary/10",
  },
  {
    id: "s5",
    title: "نجار عجوز يُعلّم الصغار",
    excerpt:
      "في الستين من عمره، فتح الحاج عمر ورشته لأبناء الحي مجاناً، يحافظ على صناعة النجارة المغربية.",
    author: "الحاج عمر الصنهاجي",
    date: "يونيو 2024",
    category: "EDUCATION",
    color: "from-accent/15 to-primary/10",
  },
  {
    id: "s6",
    title: "أرملة تربّي أربعة أطباء",
    excerpt:
      "توفي زوجها في حادث. ربّت أبناءها الأربعة بمفردها، اليوم كلهم أطباء. قصة صبر وإيمان.",
    author: "الحاجة نزهة",
    date: "ماي 2024",
    category: "RESILIENCE",
    color: "from-secondary/15 to-accent/10",
  },
  {
    id: "s7",
    title: "جمعية خيرية من 5 أفراد إلى 500",
    excerpt:
      "بدأت بـ5 نساء يجمعن الدراهم لأرامل الحي، اليوم جمعيتهن تخدم 500 أسرة شهرياً.",
    author: "جمعية أمل الحي",
    date: "أبريل 2024",
    category: "SOLIDARITY",
    color: "from-primary/15 to-accent/10",
  },
  {
    id: "s8",
    title: "من سائق تاكسي إلى مالك شركة نقل",
    excerpt:
      "بعد 20 سنة كأجير، ادّخر وساهم جيرانه، اليوم يملك شركة نقل صغيرة تشغّل 12 عاملاً من الحي.",
    author: "عبد الرحمان التازي",
    date: "مارس 2024",
    category: "PROFESSIONAL",
    color: "from-accent/15 to-secondary/10",
  },
  {
    id: "s9",
    title: "أول أمية تحفظ القرآن كاملاً بعد الستين",
    excerpt:
      "لم تذهب للمدرسة قط. في الستين، التحقت بمدرسة المسجد المسائية، حفظت القرآن، وتعلّمت الكتابة.",
    author: "الحاجة عيشة",
    date: "فبراير 2024",
    category: "EDUCATION",
    color: "from-secondary/15 to-primary/10",
  },
  {
    id: "s10",
    title: "حملة رمضان تطعم 200 أسرة",
    excerpt:
      "في رمضان، جمع شباب الحي تبرّعات وطبخوا 200 وجبة يومياً طوال الشهر للأسر المعوزة.",
    author: "شباب سيدي يوسف",
    date: "يناير 2024",
    category: "SOLIDARITY",
    color: "from-primary/15 to-accent/10",
  },
];

// ─────────── الفلترة ───────────
interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categoryFilter =
    typeof params.category === "string" ? params.category : "ALL";

  const filteredStories =
    categoryFilter === "ALL"
      ? STORIES
      : STORIES.filter((s) => s.category === categoryFilter);

  return (
    <section className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      {/* ─────────── الترويسة ─────────── */}
      <header className="text-center mb-8">
        <Badge
          variant="secondary"
          className="bg-accent/10 text-accent border-accent/20 mb-3"
        >
          <Sparkles className="size-3 ms-1.5" />
          قصص نجاح
        </Badge>
        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-foreground mb-2">
          قصص من حيّنا
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          حكايات حقيقية لأهل الحي: نجاحات مهنية، تجاوز أزمات، تضامن
          جماعي، ومسارات تعليمية ملهمة. هذه ليست قصصاً خيالية، بل نَفَسُ
          الحي الذي يتنفّسه كل يوم.
        </p>
        <ZelligeDivider variant="diamond" className="opacity-70 mt-4" />
      </header>

      {/* ─────────── شريط فلترة الفئة ─────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="size-4" />
          فلتر:
        </span>
        <Button
          asChild
          variant={categoryFilter === "ALL" ? "default" : "outline"}
          size="sm"
          className="h-10"
        >
          <Link href="/stories">الكل</Link>
        </Button>
        {STORY_CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c.value];
          const isActive = categoryFilter === c.value;
          return (
            <Button
              key={c.value}
              asChild
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="h-10 gap-1.5"
            >
              <Link href={`/stories?category=${c.value}`}>
                <Icon className="size-3.5" />
                <span>{c.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>

      {/* ─────────── شبكة القصص ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStories.map((story) => {
          const Icon = CATEGORY_ICONS[story.category] ?? Heart;
          const cat = STORY_CATEGORIES.find((c) => c.value === story.category);
          return (
            <Card
              key={story.id}
              className="warm-shadow border-border/60 h-full overflow-hidden flex flex-col transition-all hover:border-primary/30 hover:-translate-y-0.5"
            >
              <div
                className={`bg-gradient-to-br ${story.color} h-32 grid place-items-center`}
              >
                <Icon className="size-12 text-foreground/40" />
              </div>
              <CardContent className="p-5 space-y-3 flex-1 flex flex-col">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-secondary/10 text-secondary border-secondary/20 text-xs"
                  >
                    {cat?.icon} {cat?.label}
                  </Badge>
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground leading-tight">
                  {story.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {story.excerpt}
                </p>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t border-border/60">
                  <span className="flex items-center gap-1.5">
                    <User className="size-3.5" />
                    {story.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {story.date}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─────────── CTA "شارك قصتك" ─────────── */}
      <Card className="warm-shadow border-primary/30 bg-primary/5 mt-10">
        <CardContent className="p-6 text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
            قصتك تستحق أن تُروى
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-md mx-auto">
            هل لديك قصة نجاح، تجاوز أزمة، أو تجربة تضامن؟ شاركها لتلهم
            غيرك في الحي. كل قصة فجر جديد لمن يحتاجها.
          </p>
          <Button asChild size="lg" className="h-12 px-6">
            <Link href="/contact">
              <Sparkles className="size-4" />
              <span>شارك قصتك</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center">
        <Button asChild variant="ghost" size="sm" className="h-9">
          <Link href="/">
            <ChevronLeft className="size-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </Button>
      </div>
    </section>
  );
}
