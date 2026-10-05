// v73 — Complaints page (صندوق الشكاوى)
import { PageHero } from "@/components/community/page-hero";
import { ComplaintsClient } from "@/components/community/complaints-client";

export const metadata = { title: "صندوق الشكاوى | وَصَل", description: "أبلغ عن مشكلة أو اقتراح" };

export default function ComplaintsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHero eyebrow="مساعدة" title="صندوق الشكاوى" subtitle="نبني وَصَل معاً — كل ملاحظة تُساعدنا نتحسّن" />
      <section className="container mx-auto max-w-3xl px-4 py-10">
        <ComplaintsClient />
      </section>
    </div>
  );
}
