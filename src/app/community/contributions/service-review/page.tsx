import { db } from "@/lib/db";
import { ServiceReviewForm } from "@/components/community/contributions/service-review-form";

export const dynamic = "force-dynamic";

export default async function ServiceReviewPage() {
  const services = await db.service.findMany({
    where: { isActive: true },
    orderBy: { titleAr: "asc" },
    take: 100,
    select: { id: true, title: true, titleAr: true },
  });
  return <ServiceReviewForm services={services} />;
}
