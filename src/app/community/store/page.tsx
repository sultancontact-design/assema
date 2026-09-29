import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { StoreClient } from "@/components/community/store-client";
import { PageHero } from "@/components/community/page-hero";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const sessionUser = await getCurrentUser().catch(() => null);

  // v58.0: اجلب points مباشرة من DB (session لا يحوي points)
  let userPoints = 0;
  if (sessionUser) {
    const freshUser = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { points: true, level: true },
    });
    userPoints = freshUser?.points ?? 0;
  }

  return (
    <div className="flex flex-col">
      <PageHero
        title="متجر النقاط"
        subtitle="استبدل نقاطك بمنتجات وميزات حصرية — تجميدات، شارات، ومكافآت رقمية تدعم تفاعلك مع الحي."
        image="https://images.unsplash.com/photo-1607082348824-0cd0a4ab1c0d?auto=format&fit=crop&w=1920&q=80"
        imageAlt="متجر النقاط — منتجات وميزات"
        badge={sessionUser ? `${userPoints} نقطة` : "ابدأ بكسب النقاط"}
      />
      <StoreClient userPoints={userPoints} embedded />
    </div>
  );
}
