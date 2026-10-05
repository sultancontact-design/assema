// v70.0 Section 6 — Vote on a resource (Product Hunt + HN style)
// POST /api/resources/vote  Body: { resourceId, vote: 1 | -1 }
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resourceId, vote, userId, voterName } = body;

    if (!resourceId || ![1, -1].includes(vote)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    // Look up existing vote by user (if userId provided)
    let existing = null;
    if (userId) {
      existing = await db.resourceVote.findUnique({
        where: { resourceId_userId: { resourceId, userId } },
      });
    }

    if (existing) {
      // Switch vote
      await db.resourceVote.update({
        where: { id: existing.id },
        data: { vote },
      });
      // Adjust resource counter
      await db.resourceLink.update({
        where: { id: resourceId },
        data: {
          upvotes: { increment: vote === 1 ? 1 : (existing.vote === 1 ? -1 : 0) },
          downvotes: { increment: vote === -1 ? 1 : (existing.vote === -1 ? -1 : 0) },
        },
      });
    } else {
      await db.resourceVote.create({
        data: { resourceId, vote, userId: userId ?? null, voterName: voterName ?? null },
      });
      // Increment counter
      await db.resourceLink.update({
        where: { id: resourceId },
        data: vote === 1 ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } },
      });
    }

    const resource = await db.resourceLink.findUnique({
      where: { id: resourceId },
      select: { id: true, upvotes: true, downvotes: true },
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("[resources/vote] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
