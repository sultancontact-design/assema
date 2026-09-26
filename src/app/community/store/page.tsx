import { getCurrentUser } from "@/lib/auth";
import { StoreClient } from "@/components/community/store-client";
import { PageHero } from "@/components/community/page-hero";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const user = await getCurrentUser().catch(() => null);
  return (
    <div className="flex flex-col">
      <PageHero
        title="متجر النقاط"
        subtitle="استبدل نقاطك بمنتجات وميزات حصرية — تجميدات، شارات، ومكافآت رقمية تدعم تفاعلك مع الحي."
        image="https://images.unsplash.com/photo-1607082348824-0cd0a4ab1c0d?auto=format&fit=crop&w=1920&q=80"
        imageAlt="متجر النقاط — منتجات وميزات"
        badge={user ? `${user.points} نقطة` : "ابدأ بكسب النقاط"}
      />
      <StoreClient userPoints={user?.points ?? null} embedded />
    </div>
  );
}
