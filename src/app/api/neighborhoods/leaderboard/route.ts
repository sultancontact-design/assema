// v73 — Neighborhood Pride Leaderboard API
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const districts = await db.districtPride.findMany({
      orderBy: [{ prideScore: "desc" }],
      take: 50,
    });

    const topFamilies = await db.familyPride.findMany({
      orderBy: [{ prideScore: "desc" }],
      take: 30,
    });

    const challenges = await db.districtChallenge.findMany({
      where: { status: "active" },
      orderBy: [{ endsAt: "asc" }],
      take: 10,
    });

    const featuredStories = await db.neighborhoodStory.findMany({
      where: { isApproved: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 6,
    });

    const badges = await db.achievementBadge.findMany({
      orderBy: [{ rarity: "desc" }, { pointsAwarded: "desc" }],
      take: 20,
    });

    return NextResponse.json({
      districts,
      topFamilies,
      challenges,
      featuredStories,
      badges,
      totals: {
        districts: districts.length,
        families: topFamilies.length,
        activeChallenges: challenges.length,
        stories: featuredStories.length,
        badges: badges.length,
      },
    });
  } catch (error) {
    console.error("[neighborhoods/leaderboard] error:", error);
    return NextResponse.json({
      districts: [],
      topFamilies: [],
      challenges: [],
      featuredStories: [],
      badges: [],
      totals: { districts: 0, families: 0, activeChallenges: 0, stories: 0, badges: 0 },
    });
  }
}
