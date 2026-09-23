// ===================================================================
//  GET  /api/community/notifications — قائمة الإشعارات
//  POST /api/community/notifications — تحديث (markAllRead / markAsRead)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getSmartNotifications,
  markAsRead,
  markAllRead,
  getUnreadCount,
} from "@/lib/notification-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const [notifications, unreadCount] = await Promise.all([
      getSmartNotifications(user.id, unreadOnly),
      getUnreadCount(user.id),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("[GET /api/community/notifications]:", err);
    return NextResponse.json(
      { error: "تعذّر جلب الإشعارات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { action?: "markAllRead" | "markAsRead"; notificationId?: string }
      | null;

    if (body?.action === "markAsRead" && body.notificationId) {
      await markAsRead(body.notificationId);
      return NextResponse.json({ success: true });
    }

    // default: mark all as read
    await markAllRead(user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/community/notifications]:", err);
    return NextResponse.json(
      { error: "تعذّر تحديث الإشعارات" },
      { status: 500 }
    );
  }
}
