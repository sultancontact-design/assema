// v70.0 Section 6 — List Resources (Product Hunt + Show HN style)
// GET /api/resources?category=github&tag=nextjs&q=search
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? undefined;
    const tag = searchParams.get("tag") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

    const resources = await db.resourceLink.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
        ...(tag ? { tags: { contains: tag } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { description: { contains: q } },
                { tags: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: [
        { pinned: "desc" },
        { pinnedOrder: "asc" },
        { upvotes: "desc" },
        { publishedAt: "desc" },
      ],
      take: limit,
      include: { _count: { select: { votes: true } } },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("[resources/list] error:", error);
    return NextResponse.json({ resources: [] }, { status: 200 });
  }
}

// POST — submit a new resource
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, url, description, category, tags, submittedById, submittedBy, sourcePlatform } = body;

    if (!title || !url) {
      return NextResponse.json({ error: "title_and_url_required" }, { status: 400 });
    }

    const existing = await db.resourceLink.findUnique({ where: { url } });
    if (existing) {
      return NextResponse.json({ error: "duplicate_url", existing }, { status: 409 });
    }

    const resource = await db.resourceLink.create({
      data: {
        title: title.slice(0, 300),
        url,
        description: description?.slice(0, 1000) ?? null,
        category: category ?? "general",
        tags: tags ?? null,
        submittedById: submittedById ?? null,
        submittedBy: submittedBy ?? null,
        sourcePlatform: sourcePlatform ?? "Manual",
      },
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("[resources/create] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
