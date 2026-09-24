// ===================================================================
//  API: /api/community/initiatives/[id]
//  GET — يُرجع تفاصيل مبادرة + قائمة الداعمين
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للوصول إلى المبادرة" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "معرّف المبادرة مطلوب" },
        { status: 400 }
      );
    }

    const initiative = await db.initiative.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        status: true,
        votes: true,
        budget: true,
        targetDate: true,
        createdAt: true,
        updatedAt: true,
        proposer: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            profession: true,
          },
        },
        supporters: {
          take: 50,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
                profession: true,
              },
            },
          },
        },
      },
    });

    if (!initiative) {
      return NextResponse.json(
        { error: "المبادرة غير موجودة" },
        { status: 404 }
      );
    }

    // هل المستخدم صوّت؟
    const myVote = await db.initiativeVote.findUnique({
      where: {
        initiativeId_userId: {
          initiativeId: id,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      initiative: {
        ...initiative,
        createdAt:
          initiative.createdAt instanceof Date
            ? initiative.createdAt.toISOString()
            : initiative.createdAt,
        updatedAt:
          initiative.updatedAt instanceof Date
            ? initiative.updatedAt.toISOString()
            : initiative.updatedAt,
        targetDate: initiative.targetDate
          ? initiative.targetDate instanceof Date
            ? initiative.targetDate.toISOString()
            : initiative.targetDate
          : null,
        hasVoted: !!myVote,
      },
    });
  } catch (err) {
    console.error("[GET /api/community/initiatives/[id]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المبادرة" },
      { status: 500 }
    );
  }
}
