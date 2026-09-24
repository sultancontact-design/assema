// ===================================================================
//  /api/admin/ads/slots/[id] — تعديل وحذف مساحة إعلانية (AdSlot)
//  - PATCH: تحديث المساحة (SUPER_ADMIN فقط)
//  - DELETE: حذف المساحة (SUPER_ADMIN فقط)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const VALID_POSITIONS = [
  "HEADER",
  "SIDEBAR_TOP",
  "SIDEBAR_BOTTOM",
  "IN_FEED",
  "FOOTER",
  "LEFT",
  "RIGHT",
] as const;
const VALID_TYPES = ["IMAGE", "SCRIPT", "HTML", "ADSENSE"] as const;

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  position: z.enum(VALID_POSITIONS).optional(),
  type: z.enum(VALID_TYPES).optional(),
  content: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  linkUrl: z.string().url().optional().or(z.literal("")).nullable(),
  width: z.number().int().positive().max(2000).optional().nullable(),
  height: z.number().int().positive().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(-100).max(100).optional(),
  startDate: z.string().datetime().optional().or(z.literal("")).nullable(),
  endDate: z.string().datetime().optional().or(z.literal("")).nullable(),
  // إعادة ضبط الإحصاءات (اختياري)
  resetStats: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للوصول لهذا المورد" },
        { status: 401 }
      );
    }
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "هذا القسم مخصّص للمشرف العام فقط" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "البيانات غير صحيحة",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const existing = await db.adSlot.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "المساحة غير موجودة" },
        { status: 404 }
      );
    }

    const { resetStats, ...rest } = parsed.data;
    const data: Record<string, unknown> = {};
    if (rest.name !== undefined) data.name = rest.name.trim();
    if (rest.position !== undefined) data.position = rest.position;
    if (rest.type !== undefined) data.type = rest.type;
    if (rest.content !== undefined)
      data.content = rest.content?.trim() || null;
    if (rest.imageUrl !== undefined)
      data.imageUrl = rest.imageUrl?.trim() || null;
    if (rest.linkUrl !== undefined)
      data.linkUrl = rest.linkUrl?.trim() || null;
    if (rest.width !== undefined) data.width = rest.width;
    if (rest.height !== undefined) data.height = rest.height;
    if (rest.isActive !== undefined) data.isActive = rest.isActive;
    if (rest.priority !== undefined) data.priority = rest.priority;
    if (rest.startDate !== undefined)
      data.startDate = rest.startDate ? new Date(rest.startDate) : null;
    if (rest.endDate !== undefined)
      data.endDate = rest.endDate ? new Date(rest.endDate) : null;
    if (resetStats) {
      data.views = 0;
      data.clicks = 0;
    }

    const updated = await db.adSlot.update({
      where: { id },
      data,
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "adslot.updated",
        entity: "AdSlot",
        entityId: id,
        severity: "info",
        metadata: JSON.stringify({
          changes: Object.keys(data),
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({ slot: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/ads/slots/[id]]:", err);
    return NextResponse.json(
      { error: "تعذّر تحديث المساحة الإعلانية" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للوصول لهذا المورد" },
        { status: 401 }
      );
    }
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "هذا القسم مخصّص للمشرف العام فقط" },
        { status: 403 }
      );
    }

    const existing = await db.adSlot.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "المساحة غير موجودة" },
        { status: 404 }
      );
    }

    await db.adSlot.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "adslot.deleted",
        entity: "AdSlot",
        entityId: id,
        severity: "warning",
        metadata: JSON.stringify({
          name: existing.name,
          position: existing.position,
          type: existing.type,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/ads/slots/[id]]:", err);
    return NextResponse.json(
      { error: "تعذّر حذف المساحة الإعلانية" },
      { status: 500 }
    );
  }
}
