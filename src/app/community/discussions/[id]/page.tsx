import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DiscussionDetail } from "@/components/community/discussion-detail";

export const dynamic = "force-dynamic";

export default async function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const disc = await db.discussion.findUnique({
    where: { id },
    include: {
      author: { select: { fullName: true } },
      replies: {
        include: { author: { select: { fullName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!disc) redirect("/community/discussions");
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <DiscussionDetail discussion={disc} currentUserId={user.id} />
    </div>
  );
}
