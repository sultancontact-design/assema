import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DiscussionsList } from "@/components/community/discussions-list";

export const dynamic = "force-dynamic";

export default async function DiscussionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/discussions");
  const discussions = await db.discussion.findMany({
    include: { author: { select: { id: true, fullName: true } }, _count: { select: { replies: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const serialized = discussions.map(d => ({
    id: d.id, title: d.title, content: d.content, category: d.category,
    views: d.views, repliesCount: d._count.replies, authorName: d.author.fullName,
    createdAt: d.createdAt.toISOString(),
  }));
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold mb-6">نقاشات الحي</h1>
      <DiscussionsList discussions={serialized} currentUserId={user.id} />
    </div>
  );
}
