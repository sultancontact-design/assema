import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { ProfileEditClient } from "@/components/community/profile-edit/profile-edit-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "تعديل الملف الشخصي" };

export default async function ProfileEditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/community/profile/edit");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      firstName: true, lastName: true, email: true, phone: true,
      profession: true, skills: true, interests: true,
    },
  });

  if (!dbUser) redirect("/community/profile");

  return (
    <div className="flex flex-col">
      <PageHero
        title="تعديل الملف الشخصي"
        subtitle="حدّث بياناتك الشخصية، مهنتك، مهاراتك، وروابط التواصل الاجتماعي."
        image="https://images.unsplash.com/photo-1560161655-9d11b9531c4f?auto=format&fit=crop&w=1920&q=80"
        imageAlt="تعديل الملف الشخصي"
        badge="إعدادات الحساب"
      />
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileEditClient initial={{
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          email: dbUser.email,
          phone: dbUser.phone,
          profession: dbUser.profession,
          skills: dbUser.skills,
          interests: dbUser.interests,
          bio: null,
          socialInstagram: null,
          socialTiktok: null,
          socialFacebook: null,
          socialWhatsapp: null,
          isPublic: true,
          allowMessages: true,
        }} />
      </div>
    </div>
  );
}
