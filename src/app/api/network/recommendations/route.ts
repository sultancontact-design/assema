// v70.0 Section 5 — National Networking Recommendations
// GET /api/network/recommendations?limit=10
// Hybrid: profile-tags (collaborative) + geo (province) + graph (2nd-degree) + shared orgs
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "auth_required", recommendations: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

    // Fetch current user's context
    const me = await db.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        name: true,
        cityId: true,
        regionId: true,
        profileTags: { take: 20 },
      },
    });

    if (!me) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Get the user's tags set
    const myTagSet = new Set(
      me.profileTags.map((t) => `${t.tagType}:${t.tag.toLowerCase()}`)
    );

    // Fetch candidate users (not me, not already followed)
    // Limit to those with at least 1 shared tag OR same province OR same region
    const candidatesRaw = await db.user.findMany({
      where: {
        id: { not: me.id },
        status: { not: "SUSPENDED" },
        OR: [
          { profileTags: { some: {} } },
          ...(me.regionId ? [{ regionId: me.regionId }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        bio: true,
        avatar: true,
        regionId: true,
        cityId: true,
        region: { select: { id: true, nameAr: true, name: true, slug: true } },
        city: { select: { id: true, nameAr: true, name: true, slug: true } },
        profileTags: { take: 10 },
        organizationMembers: {
          take: 5,
          select: { organizationId: true, role: true },
        },
      },
      take: 50, // pull 50 candidates, then rank
    });

    // Get my org memberships (for shared-org scoring)
    const myOrgs = await db.organizationMember.findMany({
      where: { userId: me.id, isActive: true },
      select: { organizationId: true },
      take: 10,
    });
    const myOrgSet = new Set(myOrgs.map((o) => o.organizationId));

    // Get my follows (to exclude already-followed)
    const myFollowsRaw = await db.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true },
      take: 200,
    });
    const myFollowSet = new Set(myFollowsRaw.map((f) => f.followingId));

    // Score each candidate
    const scored = candidatesRaw
      .filter((c) => !myFollowSet.has(c.id))
      .map((c) => {
        // Score: tags overlap (collaborative filtering)
        const theirTagSet = new Set(
          c.profileTags.map((t) => `${t.tagType}:${t.tag.toLowerCase()}`)
        );
        const sharedTags = [...myTagSet].filter((t) => theirTagSet.has(t));
        const scoreTags = myTagSet.size > 0 ? sharedTags.length / Math.max(1, myTagSet.size) : 0;

        // Score: geographic proximity
        let scoreGeo = 0;
        if (me.regionId && c.regionId === me.regionId) scoreGeo += 0.5;
        if (me.cityId && c.cityId === me.cityId) scoreGeo += 0.5;

        // Score: shared organizations
        const sharedOrgs = c.organizationMembers.filter((om) =>
          myOrgSet.has(om.organizationId)
        );
        const scoreOrg = Math.min(sharedOrgs.length * 0.3, 1.0);

        // Score: graph (placeholder — would compute 2nd-degree via follows)
        // For perf, we approximate: 0.0 baseline. Real graph matching would require
        // a recursive query which is too expensive in SQLite; we leave as 0.
        const scoreGraph = 0.0;

        // Composite: weighted sum (40% tags, 30% geo, 20% org, 10% graph)
        const score =
          scoreTags * 0.4 + scoreGeo * 0.3 + scoreOrg * 0.2 + scoreGraph * 0.1;

        // Human-readable reasons
        const reasons: string[] = [];
        if (sharedTags.length > 0) {
          reasons.push(`${sharedTags.length} اهتمام مشترك`);
        }
        if (me.regionId && c.regionId === me.regionId) {
          reasons.push("نفس الجهة");
        }
        if (me.cityId && c.cityId === me.cityId) {
          reasons.push("نفس المدينة");
        }
        if (sharedOrgs.length > 0) {
          reasons.push(`${sharedOrgs.length} منظمة مشتركة`);
        }

        return {
          userId: c.id,
          name: c.name,
          avatar: c.avatar,
          bio: c.bio,
          region: c.region,
          city: c.city,
          score: Number(score.toFixed(3)),
          scoreTags,
          scoreGeo,
          scoreOrg,
          scoreGraph,
          reasons: reasons.join(" · ") || "توصياتك",
          sharedTagCount: sharedTags.length,
          sharedTags: sharedTags.slice(0, 3),
          sharedOrgCount: sharedOrgs.length,
        };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({ recommendations: scored, myContext: { id: me.id, name: me.name, tagCount: me.profileTags.length } });
  } catch (error) {
    console.error("[network/recs] error:", error);
    return NextResponse.json({ error: "internal_error", recommendations: [] }, { status: 500 });
  }
}
