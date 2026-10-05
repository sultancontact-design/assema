// v71.0 Section A — وَصَّال Assistant Page (AI in Darija + MSA)
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Globe, MessageSquare, ShieldCheck, Lightbulb } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "وَصَّال — المساعد الذكي | وَصَل",
  description: "مساعد ذكي يجاوب بالدارجة والفصحى — عن المنصة والمساطر الإدارية المغربية",
};

const SAMPLE_QUESTIONS = [
  { q: "كيفاش نسجّل جمعية فالمغرب؟", tag: "جمعيات" },
  { q: "شنو هو وَصَل؟", tag: "تعريف" },
  { q: "بشحال من منطقة كاينين فالمغرب؟", tag: "جغرافيا" },
  { q: "كيفاش نشارك فصندوق المعروف؟", tag: "تضامن" },
  { q: "آش هي الفرق بين التعاونية والتعاضدية؟", tag: "منظمات" },
  { q: "How do I create a cooperative in Morocco?", tag: "English" },
];

export default async function AssistantPage() {
  // Stats for header
  const stats = {
    organizations: await db.organization.count({ where: { isActive: true } }),
    communes: await db.commune.count(),
    regions: await db.region.count(),
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="v71.0 — مساعد ذكي"
        title="وَصَّال"
        subtitle="مساعد ذكي يجاوب بالدارجة والفصحى عن المنصة والإجراءات المغربية"
      />

      <section className="container mx-auto max-w-5xl px-4 py-10">
        {/* Feature row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Globe, label: "ثلاث لغات", desc: "الدارجة + الفصحى + الفرنسية" },
            { icon: MessageSquare, label: "محادثة سياقية", desc: "يتذكر آخر 12 سؤال" },
            { icon: ShieldCheck, label: "إجابات آمنة", desc: "لا نصائح قانونية نهائية" },
            { icon: Lightbulb, label: "إقتراحات ذكية", desc: "يستعمل بيانات المنصة الحية" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.label}>
                <CardContent className="p-4">
                  <Icon className="h-6 w-6 text-teal-700 dark:text-teal-300 mb-2" />
                  <p className="font-semibold text-sm">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Live counts badge */}
        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>مزوّد ببيانات حيّة:</span>
          <Badge variant="outline" className="text-xs">{stats.organizations} منظمة</Badge>
          <Badge variant="outline" className="text-xs">{stats.regions} جهة</Badge>
          <Badge variant="outline" className="text-xs">{stats.communes} جماعة</Badge>
        </div>

        {/* Chat */}
        <AssistantChat sampleQuestions={SAMPLE_QUESTIONS} />

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-6 max-w-2xl mx-auto">
          ⚠️ وَصَّال مساعد ذكاء اصطناعي. إجاباته إرشادية فقط — للاستشارات القانونية أو الطبية، رجاءً استشر مختصّاً.
        </p>
      </section>
    </div>
  );
}
