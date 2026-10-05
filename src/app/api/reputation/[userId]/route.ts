// v72.0 — Reputation Score API
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const score = await db.reputationScore.findUnique({
      where: { userId },
    });

    if (!score) {
      // Return a fresh score for new users
      return NextResponse.json({
        score: { userId, score: 0, level: "newcomer", endorsementsReceived: 0, transactionsCompleted: 0, ledgerEntriesCount: 0, pollsCreated: 0, lostFoundResolved: 0, carpoolsCompleted: 0, blogsPublished: 0, daysActive: 0 },
        isNew: true,
      });
    }

    // Recent reputation events (last 20)
    const events = await db.reputationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ score, events });
  } catch (error) {
    console.error("[reputation/get] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// POST — record a reputation event (for future use)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await req.json();
    const { eventType, delta, description, refId } = body;

    if (!eventType || typeof delta !== "number") {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const event = await db.reputationEvent.create({
      data: {
        userId,
        eventType: String(eventType).slice(0, 50),
        delta: Math.max(-50, Math.min(50, delta)),
        description: description?.slice(0, 200) ?? null,
        refId: refId?.slice(0, 50) ?? null,
      },
    });

    // Recompute score (sum of deltas)
    const agg = await db.reputationEvent.aggregate({
      where: { userId },
      _sum: { delta: true },
    });

    // Update ReputationScore
    const level =
      (agg._sum.delta ?? 0) >= 800 ? "luminary" :
      (agg._sum.delta ?? 0) >= 400 ? "expert" :
      (agg._sum.delta ?? 0) >= 200 ? "trusted" :
      (agg._sum.delta ?? 0) >= 50 ? "contributor" : "newcomer";

    await db.reputationScore.upsert({
      where: { userId },
      create: {
        userId,
        score: agg._sum.delta ?? 0,
        level,
      },
      update: {
        score: agg._sum.delta ?? 0,
        level,
      },
    });

    return NextResponse.json({ event, newScore: agg._sum.delta ?? 0, level });
  } catch (error) {
    console.error("[reputation/post] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
