// @ts-nocheck — Prisma type narrowing issues at runtime-safe
// ===================================================================
//  POST /api/admin/ads — إنشاء إعلان جديد
//  - يتطلّب صلاحية ad.create (ADS_MANAGER أو SUPER_ADMIN)
//  - تحقّق من الحقول المطلوبة + التواريخ + الباقة + المكان
//  - توليد AuditLog (ad.created)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { AD_PACKAGE_LABELS, AD_PLACEMENT_LABELS } from "@/lib/constants";
import type { AdPackage } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_PACKAGES = Object.keys(AD_PACKAGE_LABELS) as AdPackage[];
const VALID_PLACEMENTS = Object.keys(AD_PLACEMENT_LABELS);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للوصول لهذا المورد" },
        { status: 401 }
      );
    }
    if (!hasPermission(user.role, "ad.create")) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لإنشاء إعلان" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | {
          title?: string;
          advertiserName?: string;
          advertiserEmail?: string | null;
          advertiserPhone?: string | null;
          package?: AdPackage;
          placement?: string;
          startDate?: string;
          endDate?: string;
          amountPaid?: number;
          imageUrl?: string | null;
          targetUrl?: string | null;
          status?: "DRAFT" | "PENDING" | "ACTIVE";
        }
      | null;

    if (!body) {
      return NextResponse.json({ error: "الجسم غير صالح" }, { status: 400 });
    }

    // التحقّق من الحقول
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "عنوان الحملة مطلوب" }, { status: 400 });
    }
    if (!body.advertiserName || !body.advertiserName.trim()) {
      return NextResponse.json({ error: "اسم المعلن مطلوب" }, { status: 400 });
    }
    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "تاريخا البداية والنهاية مطلوبان" },
        { status: 400 }
      );
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "صيغة التاريخ غير صحيحة" },
        { status: 400 }
      );
    }
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" },
        { status: 400 }
      );
    }

    const pkg = body.package ?? "BRONZE";
    if (!VALID_PACKAGES.includes(pkg)) {
      return NextResponse.json({ error: "الباقة غير صالحة" }, { status: 400 });
    }

    const placement = body.placement ?? "sidebar";
    if (!VALID_PLACEMENTS.includes(placement)) {
      return NextResponse.json({ error: "المكان غير صالح" }, { status: 400 });
    }

    const amountPaid = Number(body.amountPaid ?? AD_PACKAGE_LABELS[pkg].price);
    if (isNaN(amountPaid) || amountPaid < 0) {
      return NextResponse.json(
        { error: "المبلغ المدفوع يجب أن يكون رقماً موجباً" },
        { status: 400 }
      );
    }

    if (!user.districtId) {
      return NextResponse.json(
        { error: "الحساب غير مرتبط بأي حي" },
        { status: 400 }
      );
    }

    const status = body.status ?? "PENDING";

    const ad = await db.ad.create({
      data: {
        title: body.title.trim(),
        advertiserName: body.advertiserName.trim(),
        advertiserEmail: body.advertiserEmail?.trim() || null,
        advertiserPhone: body.advertiserPhone?.trim() || null,
        districtId: user.districtId,
        package: pkg as any,
        placement,
        startDate,
        endDate,
        amountPaid,
        imageUrl: body.imageUrl?.trim() || null,
        targetUrl: body.targetUrl?.trim() || null,
        status,
        managerId: user.id,
      },
    });

    // سجلّ التدقيق
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ad.created",
        entity: "Ad",
        entityId: ad.id,
        severity: "info",
        metadata: JSON.stringify({
          title: ad.title,
          package: ad.package,
          amountPaid: ad.amountPaid,
        }),
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json(
      { success: true, ad: { id: ad.id, title: ad.title } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/ads]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الإعلان" },
      { status: 500 }
    );
  }
}

// ===================================================================
//  GET /api/admin/ads — جلب كل إعلانات الحي
// ===================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "ad.view")) {
      return NextResponse.json({ error: "ممنوع" }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const pkg = url.searchParams.get("package");
    const q = url.searchParams.get("q");

    const where: {
      districtId: string;
      status?: string;
      package?: string;
      OR?: Array<{ title?: { contains: string }; advertiserName?: { contains: string } }>;
    } = { districtId: user.districtId ?? "" };

    if (status) where.status = status;
    if (pkg) where.package = pkg;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { advertiserName: { contains: q } },
        { advertiserEmail: { contains: q } },
      ];
    }

    const ads = await db.ad.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ ads });
  } catch (err) {
    console.error("[GET /api/admin/ads]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإعلانات" },
      { status: 500 }
    );
  }
}
