// v73 — FAQ page (أسئلة شائعة)
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, MessageCircle, Phone, Mail } from "lucide-react";

const FAQ = [
  { q: "ما هو وَصَل؟", a: "وَصَل شبكة اجتماعية مغربية وطنية تجمع المغاربة من طنجة إلى الكويرة. تتيح للأحياء والعائلات التعارف والتنافس الشريف والتضامن." },
  { q: "كيف أسجّل في المنصة؟", a: "اضغط على \"تسجيل الدخول\" في الأعلى ثم \"إنشاء حساب جديد\". تحتاج رقم هاتف مغربي وبريد إلكتروني." },
  { q: "ما هو صندوق المعروف؟", a: "صندوق تضامني شهري تجمع فيه المساهمات بالدرهم المغربي. يستعمل لمساعدة العائلات المحتاجة في حالات المرض والوفاة والأعراس والطوارئ." },
  { q: "كيف أنشئ جمعية أو تعاونية؟", a: "اذهب إلى قسم \"المنظمات الوطنية\"، اضغط على \"أضف منظمة\"، اختر النوع (جمعية/تعاونية/تعاضدية)، املأ النموذج. ستظهر منظمتك بعد المراجعة." },
  { q: "ما هو بنك الوقت؟", a: "بنك الوقت يتيح تبادل المهارات بالوقت بدل المال. تعطي ساعة درس، تأخذ ساعة مساعدة. كل ساعة = ساعة، بغض النظر عن المهارة." },
  { q: "كيف يعمل نظام المنافسة بين الأحياء؟", a: "كل حي له درجة فخر (0-1000) مبنية على: التضامن + النشاط + التفاعل + فخر العائلات + النمو. الأحياء المتصدّرة تحصل على شارات وبطولات." },
  { q: "هل البيانات آمنة؟", a: "نعم، نستخدم تشفير bcrypt لكلمة السر، وJWT للجلسات، ولا نشارك بياناتك مع أي طرف ثالث. تفاصيل في صفحة حماية البيانات." },
  { q: "كيف أبلغ عن مشكلة؟", a: "اذهب إلى صندوق الشكاوى (link في الأسفل)، أو راسلنا مباشرة عبر البريد الإلكتروني. نلتزم بالرد خلال 48 ساعة." },
];

export const metadata = { title: "أسئلة شائعة | وَصَل", description: "إجابات عن أسئلة المغاربة حول وَصَل" };

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHero eyebrow="مساعدة" title="أسئلة شائعة" subtitle="إجابات لأكثر الأسئلة تكراراً حول وَصَل" />

      <section className="container mx-auto max-w-3xl px-4 py-10">
        <Card className="mb-6 bg-gradient-to-br from-teal-50/60 to-background dark:from-teal-950/20 border-teal-300/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-8 w-8 text-teal-700 dark:text-teal-300" />
              <div>
                <h2 className="font-bold">لم تجد إجابتك؟</h2>
                <p className="text-sm text-muted-foreground">تواصل معنا أو اسأل المساعد الذكي وَصَّال</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <a href="/assistant" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-teal-700 text-white text-sm hover:bg-teal-800">
                <MessageCircle className="h-4 w-4" /> اسأل وَصَّال
              </a>
              <a href="/complaints" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input text-sm hover:bg-muted">
                صندوق الشكاوى
              </a>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-2">
          {FAQ.map((item, i) => (
            <Card key={i}>
              <AccordionItem value={`item-${i}`} className="border-0">
                <CardHeader className="p-0">
                  <AccordionTrigger className="px-4 py-3 text-right hover:no-underline">
                    <CardTitle className="text-sm font-semibold text-right">{item.q}</CardTitle>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
