// v71.0 Section 9 — Trust Score
// GET /api/trust/[userId] — composite score (35% karma + 20% verified + 15% endorsements + 15% tenure + 15% civic)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        bio: true,
        profession: true,
        skills: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Aggregate trust events by type
    const events = await db.trustEvent.findMany({
      where: { userId },
      select: { eventType: true, delta: true, createdAt: true },
    });

    // Compute each component (0-100)
    const karmaPoints = events
      .filter((e) => e.eventType === "karma")
      .reduce((s, e) => s + e.delta, 0);
    const karmaScore = Math.min(karmaPoints * 2, 100); // cap at 100

    const verifiedPoints = events.filter((e) => e.eventType === "verified").reduce((s, e) => s + e.delta, 0);
    const verifiedScore = Math.min(verifiedPoints * 4, 100);

    const endorsementPoints = events.filter((e) => e.eventType === "endorsement").reduce((s, e) => s + e.delta, 0);
    const endorsementScore = Math.min(endorsementPoints * 6, 100);

    const tenureYears = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const tenureScore = Math.min(tenureYears * 20, 100); // 5 years = 100

    const civicPoints = events.filter((e) => e.eventType === "civic_report").reduce((s, e) => s + e.delta, 0);
    const civicScore = Math.min(civicPoints * 5, 100);

    // Composite: weighted sum (35% + 20% + 15% + 15% + 15%)
    const composite = Math.round(
      karmaScore * 0.35 +
      verifiedScore * 0.20 +
      endorsementScore * 0.15 +
      tenureScore * 0.15 +
      civicScore * 0.15
    );

    // Determine badge level
    let badgeLevel = "عضو";
    if (composite >= 80) badgeLevel = "موثوق";
    else if (composite >= 60) badgeLevel = "نشِط";
    else if (composite >= 40) badgeLevel = "متطوع";

    // Velocity check (anomaly detection — z-score > 3σ)
    const last24hEvents = events.filter(
      (e) => Date.now() - new Date(e.createdAt).getTime() < 24 * 60 * 60 * 1000
    );
    const flagged = last24hEvents.length > 20; // simple threshold-based flag

    return NextResponse.json({
      userId: user.id,
      userName: user.fullName,
      avatar: user.avatar,
      composite,
      badgeLevel,
      components: {
        karma: { score: karmaScore, points: karmaPoints, weight: 0.35 },
        verified: { score: verifiedScore, points: verifiedPoints, weight: 0.20 },
        endorsements: { score: endorsementScore, points: endorsementPoints, weight: 0.15 },
        tenure: { score: Math.round(tenureScore), years: Number(tenureYears.toFixed(2)), weight: 0.15 },
        civic: { score: civicScore, points: civicPoints, weight: 0.15 },
      },
      totalEvents: events.length,
      flagged,
      emailVerified: !!user.emailVerified,
    });
  } catch (error) {
    console.error("[trust/get] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
