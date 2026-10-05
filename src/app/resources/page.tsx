// v70.0 Section 6 — Resources Hub (PH + Show HN style)
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ResourcesClient } from "@/components/resources/resources-client";
import { PageHero } from "@/components/community/page-hero";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "موارد وَصَل — أدوات ومقالات للمغاربة",
  description: "مجموعة منسّقة من روابط لأفضل الموارد المغربية والعربية: GitHub repos, أدوات, دورات, مقالات.",
};

export default async function ResourcesPage() {
  const me = await getCurrentUser();
  const resources = await db.resourceLink.findMany({
    where: { isActive: true },
    orderBy: [
      { pinned: "desc" },
      { pinnedOrder: "asc" },
      { upvotes: "desc" },
      { publishedAt: "desc" },
    ],
    take: 60,
  });

  // Serialize Date objects to strings — they can't cross the RSC boundary
  const serializableResources = resources.map((r) => ({
    ...r,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    createdAt: r.createdAt?.toISOString() ?? null,
    updatedAt: r.updatedAt?.toISOString() ?? null,
    pinnedAt: r.pinnedAt?.toISOString() ?? null,
  }));

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="v70.0 — الموارد"
        title="موارد وَصَل"
        subtitle="مجموعة منسّقة من روابط، أدوات، مقالات، ودورات — للمغاربة الذين يبنون"
      />

      <section className="container mx-auto max-w-6xl px-4 py-12">
        <ResourcesClient
          resources={serializableResources}
          loggedIn={!!me}
          userId={me?.id ?? null}
          userName={me?.name ?? null}
        />
      </section>
    </div>
  );
}
