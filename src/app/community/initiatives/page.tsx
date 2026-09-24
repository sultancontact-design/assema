import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { InitiativesList } from "@/components/community/initiatives-list";

export const dynamic = "force-dynamic";

export default async function InitiativesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/initiatives");
  const initiatives = await db.initiative.findMany({
    include: { proposer: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const serialized = initiatives.map(i => ({ id: i.id, title: i.title, description: i.description, category: i.category, status: i.status, votes: i.votes, proposerName: i.proposer.fullName, createdAt: i.createdAt.toISOString() }));
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold mb-6">مبادرات الحي</h1>
      <InitiativesList initiatives={serialized} currentUserId={user.id} />
    </div>
  );
}
