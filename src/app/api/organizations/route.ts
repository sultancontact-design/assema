// v70.0 Section 4 — List Organizations (with filters)
// GET /api/organizations?type=ASSOCIATION&regionId=xxx&q=search
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const regionId = searchParams.get("regionId") ?? undefined;
    const provinceId = searchParams.get("provinceId") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    const verifiedOnly = searchParams.get("verified") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);

    const organizations = await db.organization.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(type ? { type } : {}),
        ...(regionId ? { regionId } : {}),
        ...(provinceId ? { provinceId } : {}),
        ...(verifiedOnly ? { verifiedBadge: true } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { nameFr: { contains: q } },
                { description: { contains: q } },
                { mission: { contains: q } },
                { tags: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        region: { select: { id: true, name: true, nameAr: true, slug: true } },
        province: { select: { id: true, name: true, nameAr: true, slug: true } },
      },
      orderBy: [{ verifiedBadge: "desc" }, { membersCount: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    const totals = {
      count: organizations.length,
      totalBalance: organizations.reduce((s, o) => s + (o.balance || 0), 0),
      totalRaised: organizations.reduce((s, o) => s + (o.totalRaised || 0), 0),
      totalMembers: organizations.reduce((s, o) => s + (o.membersCount || 0), 0),
    };

    return NextResponse.json({ organizations, totals });
  } catch (error) {
    console.error("[organizations/list] error:", error);
    return NextResponse.json({ organizations: [], totals: { count: 0, totalBalance: 0, totalRaised: 0, totalMembers: 0 } }, { status: 200 });
  }
}
