// ===================================================================
//  /api/admin/ads/slots — إدارة مساحات الإعلان (AdSlot)
//  - GET: قائمة كل المساحات مع الإحصاءات
//  - POST: إنشاء مساحة جديدة (SUPER_ADMIN فقط)
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
type AdSlotPosition = (typeof VALID_POSITIONS)[number];

const VALID_TYPES = ["IMAGE", "SCRIPT", "HTML", "ADSENSE"] as const;
type AdSlotType = (typeof VALID_TYPES)[number];

export const AD_SLOT_POSITION_LABELS: Record<AdSlotPosition, string> = {
  HEADER: "الترويسة",
  SIDEBAR_TOP: "الشريط الجانبي علوي",
  SIDEBAR_BOTTOM: "الشريط الجانبي سفلي",
  IN_FEED: "داخل التدفق",
  FOOTER: "التذييل",
  LEFT: "يسار",
  RIGHT: "يمين",
};

export const AD_SLOT_TYPE_LABELS: Record<AdSlotType, string> = {
  IMAGE: "صورة",
  SCRIPT: "سكربت",
  HTML: "HTML",
  ADSENSE: "AdSense",
};

const createSchema = z.object({
  name: z.string().min(2).max(120),
  position: z.enum(VALID_POSITIONS),
  type: z.enum(VALID_TYPES),
  content: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  linkUrl: z.string().url().optional().or(z.literal("")).nullable(),
  width: z.number().int().positive().max(2000).optional().nullable(),
  height: z.number().int().positive().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(-100).max(100).optional(),
  startDate: z.string().datetime().optional().or(z.literal("")).nullable(),
  endDate: z.string().datetime().optional().or(z.literal("")).nullable(),
});

export async function GET() {
  try {
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

    const slots = await db.adSlot.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 200,
    });

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("[GET /api/admin/ads/slots]:", err);
    return NextResponse.json(
      { error: "تعذّر جلب المساحات الإعلانية" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "البيانات غير صحيحة",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slot = await db.adSlot.create({
      data: {
        name: data.name.trim(),
        position: data.position,
        type: data.type,
        content: data.content?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        linkUrl: data.linkUrl?.trim() || null,
        width: data.width ?? null,
        height: data.height ?? null,
        isActive: data.isActive ?? true,
        priority: data.priority ?? 0,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "adslot.created",
        entity: "AdSlot",
        entityId: slot.id,
        severity: "info",
        metadata: JSON.stringify({
          name: slot.name,
          position: slot.position,
          type: slot.type,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/ads/slots]:", err);
    return NextResponse.json(
      { error: "تعذّر إنشاء المساحة الإعلانية" },
      { status: 500 }
    );
  }
}
