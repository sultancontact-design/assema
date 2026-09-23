// ===================================================================
//  API: /api/community/messages/search-users
//  GET — بحث عن مستخدم لبدء محادثة جديدة ( ضمن نفس الحي )
//  ?q=   بحث بالاسم
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return NextResponse.json({ success: true, users: [] });
    }

    // نُفضّل المستخدمين في نفس حي المستخدم الحالي
    const users = await db.user.findMany({
      where: {
        id: { not: user.id },
        status: "ACTIVE",
        deletedAt: null,
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [
        // المستخدمون من نفس الحي أولاً
        { districtId: "asc" },
        { fullName: "asc" },
      ],
      select: {
        id: true,
        fullName: true,
        avatar: true,
        profession: true,
        districtId: true,
      },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        ...u,
        isSameDistrict: u.districtId === user.districtId,
      })),
    });
  } catch (err) {
    console.error("[GET /api/community/messages/search-users]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء البحث عن المستخدمين" },
      { status: 500 }
    );
  }
}
