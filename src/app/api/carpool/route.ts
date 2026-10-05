// v72.0 — Carpool API (community ride share)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "active";
    const origin = searchParams.get("origin") ?? undefined;
    const destination = searchParams.get("destination") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 100);

    const rides = await db.carpool.findMany({
      where: {
        status,
        ...(origin ? { originCity: { contains: origin } } : {}),
        ...(destination ? { destinationCity: { contains: destination } } : {}),
      },
      orderBy: [{ departureTime: "asc" }],
      take: limit,
      include: { _count: { select: { bookings: true } } },
    });

    return NextResponse.json({ rides });
  } catch (error) {
    console.error("[carpool/list] error:", error);
    return NextResponse.json({ rides: [] });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const body = await req.json();
    const { originCity, destinationCity, departureTime, seatsTotal, pricePerSeat, notes, contactInfo, vehicleInfo, regionName } = body;

    if (!originCity || !destinationCity || !departureTime) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const depTime = new Date(departureTime);
    if (isNaN(depTime.getTime()) || depTime.getTime() < Date.now()) {
      return NextResponse.json({ error: "invalid_departure_time" }, { status: 400 });
    }

    const carpool = await db.carpool.create({
      data: {
        driverId: currentUser.id,
        originCity: originCity.slice(0, 100),
        destinationCity: destinationCity.slice(0, 100),
        departureTime: depTime,
        seatsTotal: Math.min(Math.max(parseInt(seatsTotal) || 4, 1), 8),
        seatsTaken: 0,
        pricePerSeat: Math.max(parseFloat(pricePerSeat) || 0, 0),
        notes: notes?.slice(0, 500) ?? null,
        contactInfo: contactInfo?.slice(0, 100) ?? null,
        vehicleInfo: vehicleInfo?.slice(0, 100) ?? null,
        regionName: regionName ?? null,
        status: "active",
      },
    });

    return NextResponse.json({ carpool }, { status: 201 });
  } catch (error) {
    console.error("[carpool/create] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
