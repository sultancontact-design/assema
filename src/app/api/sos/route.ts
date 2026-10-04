// v71.0 Section 11b — SOS Alert
// POST /api/sos — submit SOS alert (after long-press + audio confirm)
// GET /api/sos — list active alerts (admin)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userName, userPhone, latitude, longitude, address, regionId, triggerType, audioUrl } = body;

    if (!userName && !userPhone) {
      return NextResponse.json({ error: "user_identifier_required" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 9000) + 3000;
    const alertNumber = `SOS-MA-${year}-${seq}`;

    // 2-step verification: must include audio confirmation
    const isVerified = !!audioUrl;

    const alert = await db.sosAlert.create({
      data: {
        alertNumber,
        userId: userId ?? null,
        userName: userName?.slice(0, 200) ?? null,
        userPhone: userPhone?.slice(0, 50) ?? null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        address: address?.slice(0, 500) ?? null,
        regionId: regionId ?? null,
        triggerType: triggerType ?? "manual_long_press",
        audioUrl: audioUrl ?? null,
        status: "active",
        isVerified,
      },
    });

    return NextResponse.json({ alert, verified: isVerified }, { status: 201 });
  } catch (error) {
    console.error("[sos/create] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "active";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

    const alerts = await db.sosAlert.findMany({
      where: status === "all" ? {} : { status },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { region: { select: { nameAr: true, name: true, slug: true } } },
    });

    return NextResponse.json({ alerts, total: alerts.length });
  } catch (error) {
    console.error("[sos/list] error:", error);
    return NextResponse.json({ alerts: [], total: 0 });
  }
}
