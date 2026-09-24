import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdviceList } from "@/components/community/advice-list";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "HEALTH", label: "صحة" },
  { value: "EDUCATION", label: "تعليم" },
  { value: "FINANCE", label: "مالية" },
  { value: "RELIGION", label: "دينية" },
  { value: "FAMILY", label: "عائلية" },
];

export default async function AdvicePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/advice");

  const advice = await db.advice.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const serialized = advice.map(a => ({
    id: a.id, title: a.title, content: a.content, category: a.category,
    likes: a.likes, views: a.views, createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold mb-2">نصائح ومقالات</h1>
      <p className="text-sm text-muted-foreground mb-6">نصائح من أهل الحي لكل العائلات</p>
      <AdviceList advice={serialized} categories={CATEGORIES} currentUserId={user.id} />
    </div>
  );
}
