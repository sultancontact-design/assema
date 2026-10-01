import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FeedClient } from "@/components/feed/feed-client";
import { PageHero } from "@/components/community/page-hero";

export const dynamic = "force-dynamic";
export const metadata = { title: "الحي الآن" };

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/feed");
  return (
    <div className="flex flex-col">
      <PageHero section="feed" title="الحي الآن" subtitle="كل ما يحدث في سيدي يوسف بن علي — في مكان واحد" image="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1920&q=80" imageAlt="الحي الآن" badge="Feed الحي" />
      <div className="w-full max-w-[1400px] mx-auto px-4 py-8">
        <FeedClient currentUserId={user.id} />
      </div>
    </div>
  );
}
