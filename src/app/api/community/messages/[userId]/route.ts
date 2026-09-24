// ===================================================================
//  API: /api/community/messages/[userId]
//  GET   — يجلب كل الرسائل بين المستخدم الحالي و [userId]
//  PATCH — يضع علامة "مقروءة" على كل الرسائل المستقبَلة من [userId]
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// ===================================================================
//  GET — المحادثة مع مستخدم محدّد
// ===================================================================

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للوصول إلى المحادثة" },
        { status: 401 }
      );
    }

    const { userId: peerId } = await params;
    if (!peerId) {
      return NextResponse.json(
        { error: "معرّف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    // التحقّق من وجود الطرف الآخر
    const peer = await db.user.findUnique({
      where: { id: peerId },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        profession: true,
        districtId: true,
      },
    });
    if (!peer) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // جلب كل الرسائل بين الطرفين (كلا الاتجاهين) — مرتّبة تصاعدياً
    const messages = await db.directMessage.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: peerId },
          { senderId: peerId, receiverId: user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 500,
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        readAt: true,
        createdAt: true,
      },
    });

    // تعليم كل الرسائل المُستقبَلة من peerId كمقروءة (fire-and-forget)
    db.directMessage
      .updateMany({
        where: {
          senderId: peerId,
          receiverId: user.id,
          readAt: null,
        },
        data: { readAt: new Date() },
      })
      .catch((err) =>
        console.error("[messages read-update] failed:", err)
      );

    return NextResponse.json({
      success: true,
      peer: {
        id: peer.id,
        fullName: peer.fullName,
        avatar: peer.avatar,
        profession: peer.profession,
      },
      messages: messages.map((m) => ({
        ...m,
        createdAt:
          m.createdAt instanceof Date
            ? m.createdAt.toISOString()
            : m.createdAt,
        readAt: m.readAt
          ? m.readAt instanceof Date
            ? m.readAt.toISOString()
            : m.readAt
          : null,
      })),
    });
  } catch (err) {
    console.error("[GET /api/community/messages/[userId]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المحادثة" },
      { status: 500 }
    );
  }
}

// ===================================================================
//  PATCH — تعليم الرسائل كمقروءة
// ===================================================================

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const { userId: peerId } = await params;
    if (!peerId) {
      return NextResponse.json(
        { error: "معرّف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    const result = await db.directMessage.updateMany({
      where: {
        senderId: peerId,
        receiverId: user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      markedRead: result.count,
    });
  } catch (err) {
    console.error("[PATCH /api/community/messages/[userId]]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعليم الرسائل كمقروءة" },
      { status: 500 }
    );
  }
}
