// v71.0 Section E — Time Bank API
// GET /api/timebank?type=offers|requests&category=&urgency=
// POST /api/timebank  Body: { kind: "offer"|"request", title, description, category, hours, ... }
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "offers"; // offers | requests | both
    const category = searchParams.get("category") ?? undefined;
    const urgency = searchParams.get("urgency") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

    if (type === "offers" || type === "both") {
      const offers = await db.timeOffer.findMany({
        where: {
          status: "open",
          ...(category ? { category } : {}),
        },
        orderBy: [{ createdAt: "desc" }],
        take: limit,
      });
      if (type === "offers") return NextResponse.json({ offers });
      const requests = await db.timeRequest.findMany({
        where: {
          status: "open",
          ...(category ? { category } : {}),
          ...(urgency ? { urgency } : {}),
        },
        orderBy: [
          { urgency: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
      });
      return NextResponse.json({ offers, requests });
    }

    if (type === "requests") {
      const requests = await db.timeRequest.findMany({
        where: {
          status: "open",
          ...(category ? { category } : {}),
          ...(urgency ? { urgency } : {}),
        },
        orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
        take: limit,
      });
      return NextResponse.json({ requests });
    }

    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  } catch (error) {
    console.error("[timebank/list] error:", error);
    return NextResponse.json({ offers: [], requests: [] });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const body = await req.json();
    const { kind, title, description, category, hours, urgency, regionId, regionName, provinceName, communeName } = body;

    if (!kind || !["offer", "request"].includes(kind)) {
      return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
    }
    if (!title || title.length < 5) {
      return NextResponse.json({ error: "title_too_short" }, { status: 400 });
    }
    const safeHours = Math.min(Math.max(parseFloat(hours) || 1, 0.25), 40);

    // Ensure ledger exists
    await db.timeLedger.upsert({
      where: { userId: currentUser.id },
      create: { userId: currentUser.id },
      update: {},
    });

    if (kind === "offer") {
      const offer = await db.timeOffer.create({
        data: {
          userId: currentUser.id,
          title: title.slice(0, 200),
          description: description?.slice(0, 1000) ?? null,
          category: category ?? "general",
          hoursOffered: safeHours,
          regionId: regionId ?? null,
          regionName: regionName ?? null,
          provinceName: provinceName ?? null,
          communeName: communeName ?? null,
          status: "open",
        },
      });
      return NextResponse.json({ offer }, { status: 201 });
    } else {
      const request = await db.timeRequest.create({
        data: {
          userId: currentUser.id,
          title: title.slice(0, 200),
          description: description?.slice(0, 1000) ?? null,
          category: category ?? "general",
          hoursNeeded: safeHours,
          urgency: ["low", "normal", "high", "urgent"].includes(urgency) ? urgency : "normal",
          regionId: regionId ?? null,
          regionName: regionName ?? null,
          provinceName: provinceName ?? null,
          communeName: communeName ?? null,
          status: "open",
        },
      });
      return NextResponse.json({ request }, { status: 201 });
    }
  } catch (error) {
    console.error("[timebank/create] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
