// v70.0 Section 4 — Get single Organization by slug + ledger summary
// GET /api/organizations/[slug]
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const organization = await db.organization.findUnique({
      where: { slug },
      include: {
        region: { select: { id: true, name: true, nameAr: true, slug: true } },
        province: { select: { id: true, name: true, nameAr: true, slug: true } },
        members: {
          take: 20,
          orderBy: { joinedAt: "desc" },
        },
        ledgerEntries: {
          orderBy: { occurredAt: "desc" },
          take: 50,
        },
      },
    });

    if (!organization || organization.deletedAt) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Aggregate ledger by type + status
    const ledgerStats = await db.ledgerEntry.groupBy({
      by: ["entryType", "status"],
      where: { organizationId: organization.id },
      _sum: { amount: true },
      _count: { _all: true },
    });

    return NextResponse.json({ organization, ledgerStats });
  } catch (error) {
    console.error("[organizations/get] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
