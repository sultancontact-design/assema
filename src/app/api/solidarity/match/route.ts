// v71.0 Section 7 — Solidarity Match Engine
// GET /api/solidarity/match?userId=xxx or ?type=offer&category=skill
// Returns matched offers + needs based on tag/category overlap + geographic proximity

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const category = searchParams.get("category");
    const type = searchParams.get("type") ?? "all"; // offers | needs | all
    const regionId = searchParams.get("regionId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 100);

    const where: any = { isActive: true, isFulfilled: false };
    if (category) where.category = category;
    if (regionId) where.regionId = regionId;

    const [offers, needs] = await Promise.all([
      type === "needs" ? [] : db.solidarityOffer.findMany({
        where, take: limit,
        orderBy: [{ isUrgent: "desc" }, { publishedAt: "desc" }],
        include: { region: { select: { id: true, nameAr: true, name: true, slug: true } } },
      }),
      type === "offers" ? [] : db.solidarityNeed.findMany({
        where, take: limit,
        orderBy: [{ isUrgent: "desc" }, { publishedAt: "desc" }],
        include: { region: { select: { id: true, nameAr: true, name: true, slug: true } } },
      }),
    ]);

    // Compute matches: for each need, find best offer with shared tags
    const matches: any[] = [];
    for (const n of needs) {
      const nTags = new Set((n.tags ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean));
      const candidates = offers
        .filter((o) => o.category === n.category || o.tags?.split(",").some((t) => nTags.has(t.trim().toLowerCase())))
        .map((o) => {
          const oTags = new Set((o.tags ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean));
          const shared = [...nTags].filter((t) => oTags.has(t));
          const geo = n.regionId && o.regionId === n.regionId ? 0.3 : 0;
          const score = (shared.length * 0.4) + geo + (n.isUrgent ? 0.2 : 0);
          return { offer: o, score, sharedTags: shared };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      matches.push({ need: n, matches: candidates });
    }

    return NextResponse.json({
      offers,
      needs,
      matches: matches.filter((m) => m.matches.length > 0),
      totals: {
        offers: offers.length,
        needs: needs.length,
        matchable: matches.filter((m) => m.matches.length > 0).length,
      },
    });
  } catch (error) {
    console.error("[solidarity/match] error:", error);
    return NextResponse.json({ offers: [], needs: [], matches: [], totals: { offers: 0, needs: 0, matchable: 0 } });
  }
}
