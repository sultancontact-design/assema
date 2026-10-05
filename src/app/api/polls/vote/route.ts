// v72.0 — Vote on a poll
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const body = await req.json();
    const { pollId, optionId } = body;

    if (!pollId || optionId === undefined) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const poll = await db.communityPoll.findUnique({ where: { id: pollId } });
    if (!poll || poll.status !== "active") {
      return NextResponse.json({ error: "poll_not_found_or_closed" }, { status: 404 });
    }
    if (poll.expiresAt && new Date() > poll.expiresAt) {
      return NextResponse.json({ error: "poll_expired" }, { status: 400 });
    }

    // Check if already voted
    const existing = await db.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId: currentUser.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "already_voted" }, { status: 409 });
    }

    // Parse options, increment vote, save
    const options = JSON.parse(poll.options);
    const optIdx = options.findIndex((o: any) => o.id === String(optionId));
    if (optIdx < 0) {
      return NextResponse.json({ error: "invalid_option" }, { status: 400 });
    }
    options[optIdx].votes = (options[optIdx].votes || 0) + 1;
    const newTotal = poll.totalVotes + 1;

    await db.$transaction([
      db.pollVote.create({
        data: {
          pollId,
          userId: currentUser.id,
          voterName: currentUser.name,
          optionId: String(optionId),
        },
      }),
      db.communityPoll.update({
        where: { id: pollId },
        data: { options: JSON.stringify(options), totalVotes: newTotal },
      }),
    ]);

    return NextResponse.json({
      poll: { id: pollId, totalVotes: newTotal, options },
      myVote: optionId,
    });
  } catch (error) {
    console.error("[polls/vote] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
