// v71.0 Section 10 — Voice Rooms
// GET /api/voice/rooms — list audio rooms (live + scheduled)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const onlyLive = searchParams.get("live") === "true";
    const regionId = searchParams.get("regionId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

    const rooms = await db.audioRoom.findMany({
      where: {
        isActive: true,
        ...(onlyLive ? { isLive: true } : {}),
        ...(regionId ? { regionId } : {}),
      },
      orderBy: [{ isLive: "desc" }, { scheduledFor: "asc" }],
      take: limit,
      include: { region: { select: { id: true, nameAr: true, name: true, slug: true } } },
    });

    const stats = {
      total: rooms.length,
      live: rooms.filter((r) => r.isLive).length,
      scheduled: rooms.filter((r) => !r.isLive && r.scheduledFor).length,
      totalListeners: rooms.reduce((s, r) => s + r.currentListeners, 0),
    };

    return NextResponse.json({ rooms, stats });
  } catch (error) {
    console.error("[voice/rooms] error:", error);
    return NextResponse.json({ rooms: [], stats: { total: 0, live: 0, scheduled: 0, totalListeners: 0 } });
  }
}

// POST — create an audio room
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, topic, hostId, hostName, regionId, scheduledFor, isPublic } = body;

    if (!title) {
      return NextResponse.json({ error: "title_required" }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, "-").replace(/^-+|-+$/g, "");
    const livekitRoomName = `wassal-${slug}-${Date.now().toString(36)}`;

    const room = await db.audioRoom.create({
      data: {
        title: title.slice(0, 300),
        description: description?.slice(0, 1000) ?? null,
        topic: topic ?? null,
        hostId: hostId ?? null,
        hostName: hostName ?? null,
        regionId: regionId ?? null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        isPublic: isPublic ?? true,
        isLive: false,
        livekitRoomName,
      },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("[voice/create] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
