import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ServicesDirectory } from "@/components/community/services-directory";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "PROFESSION", label: "مهن", icon: "🔧" },
  { value: "CRAFT", label: "حرف", icon: "🎨" },
  { value: "HEALTH", label: "صحة", icon: "🏥" },
  { value: "EDUCATION", label: "تعليم", icon: "📚" },
  { value: "ADVICE", label: "نصائح", icon: "💡" },
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold mb-2">دليل الخدمات</h1>
      <p className="text-sm text-muted-foreground mb-6">مهن، حرف، نصائح، وخدمات في حي سيدي يوسف بن علي</p>
      <ServicesDirectory services={serialized} categories={CATEGORIES} />
    </div>
  );
}
