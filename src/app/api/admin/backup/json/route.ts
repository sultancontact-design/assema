// ===================================================================
//  GET /api/admin/backup/json — تصدير JSON لكل الجداول
//  - يتطلّب صلاحية admin.backup
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "admin.backup")) {
      return NextResponse.json({ error: "ممنوع" }, { status: 403 });
    }

    // جلب كل الجداول الرئيسية (نأخذ أول 1000 صف لكل جدول للأمان)
    const [
      districts,
      families,
      users,
      groups,
      groupMembers,
      contributions,
      fundRequests,
      fundRequestApprovals,
      events,
      eventRegistrations,
      notifications,
      ads,
      complaints,
      auditLogs,
      settings,
    ] = await Promise.all([
      db.district.findMany({ take: 1000 }),
      db.family.findMany({ take: 1000 }),
      db.user.findMany({
        take: 1000,
        select: {
          id: true, firstName: true, lastName: true, fullName: true, email: true,
          phone: true, role: true, status: true, districtId: true, familyId: true,
          isFamilyHead: true, profession: true, skills: true, interests: true,
          gender: true, points: true, level: true,
          createdAt: true, updatedAt: true, deletedAt: true,
        },
      }),
      db.group.findMany({ take: 1000 }),
      db.groupMember.findMany({ take: 1000 }),
      db.contribution.findMany({ take: 1000 }),
      db.fundRequest.findMany({ take: 1000 }),
      db.fundRequestApproval.findMany({ take: 1000 }),
      db.event.findMany({ take: 1000 }),
      db.eventRegistration.findMany({ take: 1000 }),
      db.notification.findMany({ take: 1000 }),
      db.ad.findMany({ take: 1000 }),
      db.complaint.findMany({ take: 1000 }),
      db.auditLog.findMany({ take: 1000 }),
      db.setting.findMany({ take: 1000 }),
    ]);

    // ملاحظة: لا نُصدّر passwordHash — نُخفي الحقول الحساسة
    const safeUsers = users.map((u) => ({
      ...u,
      // لا نُصدّر كلمات المرور — نضع علامة بديلة
      passwordHash: "[REDACTED]",
    }));

    const dump = {
      _meta: {
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
        version: "1.0.0",
        counts: {
          districts: districts.length,
          families: families.length,
          users: users.length,
          groups: groups.length,
          groupMembers: groupMembers.length,
          contributions: contributions.length,
          fundRequests: fundRequests.length,
          fundRequestApprovals: fundRequestApprovals.length,
          events: events.length,
          eventRegistrations: eventRegistrations.length,
          notifications: notifications.length,
          ads: ads.length,
          complaints: complaints.length,
          auditLogs: auditLogs.length,
          settings: settings.length,
        },
      },
      districts,
      families,
      users: safeUsers,
      groups,
      groupMembers,
      contributions,
      fundRequests,
      fundRequestApprovals,
      events,
      eventRegistrations,
      notifications,
      ads,
      complaints,
      auditLogs,
      settings,
    };

    const jsonStr = JSON.stringify(dump, null, 2);
    const buf = Buffer.from(jsonStr, "utf-8");
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `syba-backup-${dateStr}.json`;

    // سجلّ التدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "backup.json",
        entity: "Database",
        entityId: null,
        severity: "info",
        metadata: JSON.stringify({
          type: "json",
          size: buf.length,
          filename,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": String(buf.length),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/backup/json]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تصدير JSON" },
      { status: 500 }
    );
  }
}
