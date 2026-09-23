// ===================================================================
//  صفحة تاريخ الحي — /history
//  4 أقسام مع ZelligeDivider بينها
//  - يوسف بن علي الصنهاجي
//  - ذاكرة المكان
//  - صور قديمة (placeholder)
//  - شهادات كبار السن (placeholder)
// ===================================================================

import Link from "next/link";
import {
  History,
  User,
  MapPin,
  Image as ImageIcon,
  Quote,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "تاريخ الحي",
  description:
    "تاريخ حي سيدي يوسف بن علي الصنهاجي بمراكش — أحد رجال مراكش السبعة، ذاكرة المكان، الصور القديمة، وشهادات كبار السن.",
};

// ─────────── شهادات كبار السن ───────────
const ELDERS_TESTIMONIES = [
  {
    quote:
      "كان الحيّ كله عائلة واحدة. إذا مات أحد، تجدنا كلنا نعزّي. وإذا فرح أحد، نُفرح كلنا. ما كان شيء اسمه «الأنا»، كان كل شيء «النانحن».",
    name: "الحاج عبد السلام المراكشي",
    age: "82 سنة",
    role: "كبير الحي",
  },
  {
    quote:
      "كنا نلعبون الكرة في الزنقة والكبار يفرّون علينا بالطيوب. لما نتعب، يدخلونا أي دار، يطعمونا الخبز والزيت، ويرجعونا لوالدينا.",
    name: "الحاجة فاطمة الصنهاجي",
    age: "75 سنة",
    role: "حارسة الذاكرة",
  },
  {
    quote:
      "المسجد كان قلب الحي. نتعلم فيه، نتزاور، نتساعد. إن فقد أحد درهماً، يجمع له الإمام من المصليين قبل أن تغرب الشمس.",
    name: "السي محمد بنعمر",
    age: "78 سنة",
    role: "إمام متقاعد",
  },
];

// ─────────── صور قديمة (placeholder cards) ───────────
const OLD_PHOTOS = [
  {
    title: "ساحة الحي سنة 1965",
    description: "سوق الأحد الأسبوعي في ساحة سيدي يوسف بن علي.",
    color: "from-primary/20 to-accent/10",
  },
  {
    title: "المسجد العتيق قبل الترميم",
    description: "الصورة الأصلية للمسجد قبل ترميمه في الثمانينيات.",
    color: "from-secondary/20 to-primary/10",
  },
  {
    title: "زنقة الصفّافين",
    description: "صفّافو النحاس المغربي التقليديين في ورشاتهم.",
    color: "from-accent/20 to-secondary/10",
  },
  {
    title: "مقام الولي",
    description: "مقام سيدي يوسف بن علي الصنهاجي رحمه الله.",
    color: "from-primary/15 to-secondary/15",
  },
];

export default function HistoryPage() {
  return (
    <section className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      {/* ─────────── الترويسة ─────────── */}
      <header className="text-center mb-10">
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-primary/20 mb-3"
        >
          <History className="size-3 ms-1.5" />
          ذاكرة الحي
        </Badge>
        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-foreground mb-3">
          تاريخ سيدي يوسف بن علي
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          حي عريق يحمل اسم أحد رجال مراكش السبعة — سيدي يوسف بن علي
          الصنهاجي. هذه قصة المكان وأهله، نرويها من ذاكرة من عاشوها.
        </p>
        <ZelligeDivider variant="diamond" className="opacity-70 mt-4" />
      </header>

      {/* ─────────── القسم 1: يوسف بن علي الصنهاجي ─────────── */}
      <article className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="grid place-items-center size-12 rounded-xl bg-primary/10 text-primary shrink-0">
            <User className="size-6" />
          </span>
          <div>
            <Badge variant="outline" className="mb-1">
              القسم الأول
            </Badge>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              يوسف بن علي الصنهاجي
            </h2>
          </div>
        </div>
        <Card className="warm-shadow border-border/60">
          <CardContent className="p-6 space-y-4 text-base text-foreground leading-relaxed">
            <p>
              هو <strong>سيدي يوسف بن علي الصنهاجي</strong>، أحد رجال مراكش
              السبعة الذين دُفنوا في المدينة العتيقة. ينتمي إلى قبيلة
              صنهاجة الأمازيغية العريقة، عاش في مراكش في القرون الوسطى،
              وكان من الأولياء الصالحين الذين يحضرهم الناس في حياتهم
              وزاروا قبورهم بعد مماتهم.
            </p>
            <p>
              سُمّي الحي باسمه تيمناً به وطلباً لبركته. مقامه في قلب الحي
              كان ملتقى للعلماء والفقراء والسالكين، وما زال إلى اليوم
              مقصداً لمن يبحث عن السكينة والرحمة.
            </p>
            <p>
              كانت حكايات كراماته تتناقلها الأجيال: شفاء مريض، ردّ ضالّ عن
              طريقه، تفريج كربة عن معسر. هذه الحكايا ليست مجرد ماضٍ، بل
              نَفَس الحي الذي يتنفّسه إلى اليوم — نَفَسُ المعروف والرحمة.
            </p>
          </CardContent>
        </Card>
      </article>

      <ZelligeDivider variant="wave" className="opacity-60 my-10" />

      {/* ─────────── القسم 2: ذاكرة المكان ─────────── */}
      <article className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="grid place-items-center size-12 rounded-xl bg-secondary/10 text-secondary shrink-0">
            <MapPin className="size-6" />
          </span>
          <div>
            <Badge variant="outline" className="mb-1">
              القسم الثاني
            </Badge>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              ذاكرة المكان
            </h2>
          </div>
        </div>
        <Card className="warm-shadow border-border/60">
          <CardContent className="p-6 space-y-4 text-base text-foreground leading-relaxed">
            <p>
              حي سيدي يوسف بن علي يقع في جنوب شرق المدينة العتيقة بمراكش،
              يمتد من أسوار المدينة القديمة إلى الأحياء الحديثة. تكسوه
              بيوتات طينية وحجرية ما زالت تحفظ روح العمارة المغربية
              التقليدية: فناء داخلي، سقوف خشبية، زليج ملوّن، وأبواب
              خشبية منقوشة.
            </p>
            <p>
              كانت زناقته الصغيرة تضجّ بصنّاع التقليديين: صفّافين،
              نحّاسين، حدّادين، خيّاطين، بنّائين. كل عائلة تتوارث
              حرفتها أباً عن جدّ، وكان سوق الحي الأسبوعي يجمع البائع
              والمشتري في رابطة معروف دائمة.
            </p>
            <p>
              مع التمدّن والتوسّع العمراني، تبدّل كثير من معالم الحي،
              لكن روحه بقيت — روحة الجماعة التي تتكافل في الأفراح
              والأتراح، وتحفظ كرامة الفقير بحصارها له بحبّ لا بإذلال.
            </p>
          </CardContent>
        </Card>
      </article>

      <ZelligeDivider variant="stars" className="opacity-60 my-10" />

      {/* ─────────── القسم 3: صور قديمة ─────────── */}
      <article className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="grid place-items-center size-12 rounded-xl bg-accent/10 text-accent shrink-0">
            <ImageIcon className="size-6" />
          </span>
          <div>
            <Badge variant="outline" className="mb-1">
              القسم الثالث
            </Badge>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              صور من الذاكرة
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OLD_PHOTOS.map((photo) => (
            <Card
              key={photo.title}
              className="warm-shadow border-border/60 overflow-hidden h-full"
            >
              <div
                className={`bg-gradient-to-br ${photo.color} h-40 grid place-items-center`}
              >
                <span className="text-6xl opacity-30">📷</span>
              </div>
              <CardContent className="p-4 space-y-1.5">
                <h3 className="font-heading font-bold text-foreground text-base">
                  {photo.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {photo.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          📸 مساهمتك بصور تاريخية من أرشيف عائلتك تثري ذاكرة الحي. تواصل
          معنا عبر <Link href="/contact" className="text-primary underline underline-offset-2">صفحة الاتصال</Link>.
        </p>
      </article>

      <ZelligeDivider variant="diamond" className="opacity-60 my-10" />

      {/* ─────────── القسم 4: شهادات كبار السن ─────────── */}
      <article className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="grid place-items-center size-12 rounded-xl bg-primary/10 text-primary shrink-0">
            <Quote className="size-6" />
          </span>
          <div>
            <Badge variant="outline" className="mb-1">
              القسم الرابع
            </Badge>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              شهادات كبار السن
            </h2>
          </div>
        </div>
        <div className="space-y-4">
          {ELDERS_TESTIMONIES.map((t, idx) => (
            <Card
              key={idx}
              className="warm-shadow border-border/60 bg-muted/20"
            >
              <CardContent className="p-5 space-y-3">
                <Quote className="size-5 text-accent opacity-60" />
                <blockquote className="text-base text-foreground leading-relaxed">
                  «{t.quote}»
                </blockquote>
                <footer className="flex items-center gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">
                      {t.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t.role} — {t.age}
                    </span>
                  </div>
                </footer>
              </CardContent>
            </Card>
          ))}
        </div>
      </article>

      {/* ─────────── خاتمة + CTA ─────────── */}
      <Card className="warm-shadow border-primary/30 bg-primary/5">
        <CardContent className="p-6 text-center">
          <h3 className="font-heading text-xl font-bold text-foreground mb-2">
            ذاكرتنا الحية
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-md mx-auto">
            تاريخ الحي ليس ماضياً مدفوناً، بل نَفَسٌ نتنفّسه كل يوم في
            مساهماتنا وأفراحنا وأتراحنا. ساهم في حفظ هذه الذاكرة.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-11">
              <Link href="/community">
                <span>انضم لمجتمع الحي</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11">
              <Link href="/contact">
                <span>شارك قصتك</span>
              </Link>
            </Button>
          </div>
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
