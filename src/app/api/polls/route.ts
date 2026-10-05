// v72.0 — Community Polls API (Reddit-style)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? undefined;
    const status = searchParams.get("status") ?? "active";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 100);

    const polls = await db.communityPoll.findMany({
      where: {
        status,
        ...(category ? { category } : {}),
      },
      orderBy: [{ totalVotes: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: { _count: { select: { votes: true } } },
    });

    return NextResponse.json({ polls });
  } catch (error) {
    console.error("[polls/list] error:", error);
    return NextResponse.json({ polls: [] });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, options, isAnonymous, regionName, duration } = body;

    if (!title || title.length < 5) {
      return NextResponse.json({ error: "title_too_short" }, { status: 400 });
    }
    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: "min_2_options" }, { status: 400 });
    }

    // Build options JSON: [{id, text, votes: 0}]
    const safeOptions = options.slice(0, 6).map((o: any, i: number) => ({
      id: String(i),
      text: String(o.text ?? o).slice(0, 100),
      votes: 0,
    }));

    const poll = await db.communityPoll.create({
      data: {
        userId: currentUser.id,
        title: title.slice(0, 200),
        description: description?.slice(0, 1000) ?? null,
        category: category ?? "general",
        options: JSON.stringify(safeOptions),
        isAnonymous: !!isAnonymous,
        regionName: regionName ?? null,
        duration: duration ?? null,
        expiresAt: duration ? new Date(Date.now() + duration * 3600 * 1000) : null,
        status: "active",
      },
    });

    return NextResponse.json({ poll }, { status: 201 });
  } catch (error) {
    console.error("[polls/create] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
