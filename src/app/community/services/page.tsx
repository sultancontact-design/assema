import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { ServicesDirectory } from "@/components/community/services-directory";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "PROFESSION", label: "مهن" },
  { value: "CRAFT", label: "حرف" },
  { value: "HEALTH", label: "صحة" },
  { value: "EDUCATION", label: "تعليم" },
  { value: "ADVICE", label: "نصائح" },
];

export default async function ServicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/services");

  const services = await db.service.findMany({
    where: { isActive: true },
    include: { _count: { select: { serviceReviews: true } } },
    orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
    take: 50,
  });

  const serialized = services.map(s => ({
    id: s.id, title: s.title, titleAr: s.titleAr, description: s.description,
    category: s.category, subcategory: s.subcategory, phone: s.phone,
    whatsapp: s.whatsapp, address: s.address, price: s.price,
    rating: s.rating, reviews: s.reviews, isVerified: s.isVerified,
    reviewCount: s._count.serviceReviews,
  }));

  return (
    <div className="flex flex-col">
      <PageHero
        title="دليل الخدمات"
        subtitle="مهن، حرف، نصائح، وخدمات في حي سيدي يوسف بن علي — معلّمون، حرفيون، ومتخصّصون من جيرانك."
        image="https://images.unsplash.com/photo-1581338834637-9aa4fdda0ae6?auto=format&fit=crop&w=1920&q=80"
        imageAlt="دليل الخدمات — مهنيون وحرفيون"
        badge={`${serialized.length} خدمة`}
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ServicesDirectory services={serialized} categories={CATEGORIES} />
      </div>
    </div>
  );
}
