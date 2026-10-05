// v72.0 — Polls page (Reddit-style community polls)
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PollsClient } from "@/components/polls/polls-client";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Vote, BarChart3, Users, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "استطلاعات وَصَل | وَصَل", description: "استطلاعات رأي مجتمعية مغربية" };

export default async function PollsPage() {
  const me = await getCurrentUser();

  const polls = await db.communityPoll.findMany({
    where: { status: "active" },
    orderBy: [{ totalVotes: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  // Serialize dates
  const serialized = polls.map((p) => ({
    ...p,
    expiresAt: p.expiresAt?.toISOString() ?? null,
    createdAt: p.createdAt?.toISOString() ?? null,
    updatedAt: p.updatedAt?.toISOString() ?? null,
  }));

  const stats = {
    totalPolls: polls.length,
    totalVotes: polls.reduce((s, p) => s + (p.totalVotes || 0), 0),
    avgPerPoll: polls.length > 0 ? Math.round(polls.reduce((s, p) => s + (p.totalVotes || 0), 0) / polls.length) : 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero eyebrow="v72.0 — استطلاعات" title="استطلاعات وَصَل" subtitle="أصوات المغاربة في قضايا المجتمع والثقافة والتكنولوجيا" />

      <section className="container mx-auto max-w-5xl px-4 py-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card><CardContent className="p-4 text-center">
            <Vote className="h-5 w-5 text-teal-700 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.totalPolls}</p>
            <p className="text-xs text-muted-foreground">استطلاع نشط</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.totalVotes}</p>
            <p className="text-xs text-muted-foreground">صوت</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-rose-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.avgPerPoll}</p>
            <p className="text-xs text-muted-foreground">متوسط لكل استطلاع</p>
          </CardContent></Card>
        </div>

        <PollsClient initialPolls={serialized} loggedIn={!!me} userId={me?.id ?? null} />
      </section>
    </div>
  );
}
