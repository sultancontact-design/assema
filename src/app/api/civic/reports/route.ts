// v71.0 Section 8 — Civic Reports
// GET /api/civic/reports?category=pothole&status=verified
// POST /api/civic/reports — submit a new civic report

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const regionId = searchParams.get("regionId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

    const reports = await db.civicReport.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
        ...(regionId ? { regionId } : {}),
      },
      orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
      take: limit,
      include: { region: { select: { id: true, nameAr: true, name: true, slug: true } } },
    });

    const stats = {
      total: reports.length,
      critical: reports.filter((r) => r.priority === "critical").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
      pending: reports.filter((r) => ["submitted", "verified", "assigned", "in_progress"].includes(r.status)).length,
    };

    return NextResponse.json({ reports, stats });
  } catch (error) {
    console.error("[civic/list] error:", error);
    return NextResponse.json({ reports: [], stats: { total: 0, critical: 0, resolved: 0, pending: 0 } });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, category, priority, latitude, longitude, address, regionId, reportedById, reportedByName, contactPhone, photoUrl } = body;

    if (!title || !category) {
      return NextResponse.json({ error: "title_and_category_required" }, { status: 400 });
    }

    // Generate readable report number
    const year = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 9000) + 1000;
    const reportNumber = `CR-MA-${year}-${seq}`;

    const report = await db.civicReport.create({
      data: {
        reportNumber,
        title: title.slice(0, 300),
        description: description?.slice(0, 1000) ?? null,
        category,
        priority: priority ?? "normal",
        status: "submitted",
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        address: address?.slice(0, 500) ?? null,
        regionId: regionId ?? null,
        reportedById: reportedById ?? null,
        reportedByName: reportedByName?.slice(0, 200) ?? null,
        contactPhone: contactPhone?.slice(0, 50) ?? null,
        photoUrl: photoUrl ?? null,
        isVerified: false,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("[civic/create] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
