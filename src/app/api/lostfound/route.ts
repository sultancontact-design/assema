// v72.0 — Lost & Found API
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const status = searchParams.get("status") ?? "open";
    const q = searchParams.get("q") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 100);

    const items = await db.lostFound.findMany({
      where: {
        status,
        ...(type ? { type } : {}),
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { description: { contains: q } },
                { location: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[lostfound/list] error:", error);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const body = await req.json();
    const { type, title, description, category, location, regionName, provinceName, imageUrl, contactInfo, reward } = body;

    if (!type || !["lost", "found"].includes(type)) {
      return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    }
    if (!title || title.length < 5) {
      return NextResponse.json({ error: "title_too_short" }, { status: 400 });
    }

    const item = await db.lostFound.create({
      data: {
        userId: currentUser.id,
        type,
        title: title.slice(0, 200),
        description: description?.slice(0, 1000) ?? null,
        category: category ?? "other",
        location: location ?? null,
        regionName: regionName ?? null,
        provinceName: provinceName ?? null,
        imageUrl: imageUrl ?? null,
        contactInfo: contactInfo ?? null,
        reward: typeof reward === "number" && reward > 0 ? reward : null,
        status: "open",
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[lostfound/create] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
