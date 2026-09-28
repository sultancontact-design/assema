import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BlogWriterClient } from "@/components/community/blog-writer-client";
import { PageHero } from "@/components/community/page-hero";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "اكتب مقالاً",
};

export default async function CommunityBlogNewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/blog/new");

  const categories = await db.blogPost
    .findMany({
      where: { status: "published" },
      select: { category: true },
      distinct: ["category"],
      take: 20,
    })
    .catch(() => []);

  const availableCategories = Array.from(
    new Set(categories.map((c) => c.category))
  );

  return (
    <div className="flex flex-col">
      <PageHero
        title="اكتب مقالاً"
        subtitle="شارك معرفتك مع جيرانك — مقالات توعوية في الصحة، التربية، المالية، والمجتمع."
        image="https://images.unsplash.com/photo-1455390582226-e60560e0d1d3?auto=format&fit=crop&w=1920&q=80"
        imageAlt="كتابة مقال — مشاركة المعرفة"
        badge="مساهمة مجتمعية"
      />
      <BlogWriterClient
        userId={user.id}
        authorName={user.fullName}
        availableCategories={availableCategories}
      />
    </div>
  );
}
