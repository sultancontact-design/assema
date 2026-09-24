// ===================================================================
//  GET /api/public/activity-feed
//  - endpoint عمومي بدون مصادقة
//  - يستعلم UserActivity حيث isPublic=true، آخر 10
//  - يُرجع JSON array of { type, description, timeAgo }
//  - يُقنّع أسماء المستخدمين: "أحمد ب." (الاسم الأول + حرف واحد من اللقب)
//  - لو لا توجد نشاطات: يُرجع رسائل ثابتة احتياطية
// ===================================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 30;

interface ActivityRow {
  type: string;
  description: string;
  createdAt: Date;
  user?: { firstName: string; lastName: string } | null;
}

// -------------------------------------------------------------------
//  تنسيق الفارق الزمني بالعربية
// -------------------------------------------------------------------
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `قبل ${days} يوم`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `قبل ${weeks} أسبوع`;
  const months = Math.floor(days / 30);
  return `قبل ${months} شهر`;
}

// -------------------------------------------------------------------
//  قناع الاسم: "محمد" + "بنشقرون" → "محمد ب."
// -------------------------------------------------------------------
function maskName(user?: { firstName: string; lastName: string } | null): string {
  if (!user) return "أحد الجيران";
  const first = user.firstName.trim() || "جار";
  const lastInitial = user.lastName.trim().charAt(0);
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

// -------------------------------------------------------------------
//  الرسائل الاحتياطية الثابتة (عند فراغ النشاطات)
// -------------------------------------------------------------------
const FALLBACK_ACTIVITIES = [
  { type: "default", description: "انضمّت 200 عائلة إلى الحي حتى الآن", timeAgo: "الآن" },
  { type: "default", description: "كونّا مجتمعاً رقمياً للحفاظ على المعروف", timeAgo: "الآن" },
  { type: "default", description: "تعرّف على مبادئنا الخمسة في الشفافية والكرامة", timeAgo: "الآن" },
  { type: "default", description: "صندوق المعروف يبدأ بحيّك ويصل إلى المدينة", timeAgo: "الآن" },
  { type: "default", description: "5 فعاليات تضامنية قادمة في الأحياء", timeAgo: "الآن" },
  { type: "default", description: "كن أوّل من يدعم المعروف في حيّك", timeAgo: "الآن" },
];

// -------------------------------------------------------------------
//  GET handler — العمومي
// -------------------------------------------------------------------
export async function GET() {
  try {
    const rows = await db.userActivity.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        type: true,
        description: true,
        createdAt: true,
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (rows.length === 0) {
      return NextResponse.json(FALLBACK_ACTIVITIES);
    }

    const data = (rows as ActivityRow[]).map((row) => {
      const masked = maskName(row.user ?? null);
      const baseDescription = row.description?.trim() || "أحدث نشاطاً في الحي";

      // إن كان النص يبدأ بـ"أنا" أو بفعل، لا نُضيف القناع (مثال: "انضمّ محمد")
      // خلاف ذلك نُضيف الاسم المقنّع أمام النص
      const startsWithName = /^(أنا|إنّني|قام|ساهم|انضمّ|شارك|حصل|سجّل|أضاف|أرسل|بدأ)\b/.test(
        baseDescription
      );
      const description = startsWithName
        ? `${masked} ${baseDescription}`
        : baseDescription;

      return {
        type: row.type || "default",
        description,
        timeAgo: formatTimeAgo(new Date(row.createdAt)),
      };
    });

    return NextResponse.json(data);
  } catch {
    // أي خطأ في DB → نُرجع الاحتياطية حتى لا تتعطّل الواجهة
    return NextResponse.json(FALLBACK_ACTIVITIES);
  }
}
