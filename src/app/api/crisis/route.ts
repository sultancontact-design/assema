// v71.0 Section 11 — Crisis + Resources + Volunteer Slots
// GET /api/crisis — list active crises with needs + volunteer slots
// POST — create a new crisis (admin only in real use)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "active";
    const regionId = searchParams.get("regionId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);

    const crises = await db.crisis.findMany({
      where: {
        isActive: true,
        ...(status !== "all" ? { status } : {}),
        ...(regionId ? { regionId } : {}),
      },
      orderBy: [{ severity: "desc" }, { startedAt: "desc" }],
      take: limit,
      include: {
        region: { select: { id: true, nameAr: true, name: true, slug: true } },
        resourceNeeds: { orderBy: [{ isFulfilled: "asc" }, { urgency: "desc" }] },
        volunteerSlots: { orderBy: [{ isFilled: "asc" }, { role: "asc" }] },
      },
    });

    const stats = {
      total: crises.length,
      critical: crises.filter((c) => c.severity === "critical").length,
      totalAffected: crises.reduce((s, c) => s + (c.affectedPeople ?? 0), 0),
      totalNeeds: crises.reduce((s, c) => s + c.resourceNeeds.length, 0),
      unfilledNeeds: crises.reduce(
        (s, c) => s + c.resourceNeeds.filter((n) => !n.isFulfilled).length,
        0
      ),
      totalVolunteerSlots: crises.reduce((s, c) => s + c.volunteerSlots.length, 0),
      unfilledSlots: crises.reduce(
        (s, c) => s + c.volunteerSlots.filter((v) => !v.isFilled).length,
        0
      ),
    };

    return NextResponse.json({ crises, stats });
  } catch (error) {
    console.error("[crisis/list] error:", error);
    return NextResponse.json({ crises: [], stats: { total: 0, critical: 0, totalAffected: 0, totalNeeds: 0, unfilledNeeds: 0, totalVolunteerSlots: 0, unfilledSlots: 0 } });
  }
}
