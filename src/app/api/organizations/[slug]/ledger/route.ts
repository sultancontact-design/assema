// v70.0 Section 4 — Add a ledger entry (transparent Open-Collective-style)
// POST /api/organizations/[slug]/ledger
// Body: { entryType: "CREDIT" | "DEBIT", amount, description, category, createdByName }
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_TYPES = new Set(["CREDIT", "DEBIT"]);
const VALID_CATEGORIES = new Set([
  "donation",
  "expense",
  "membership",
  "grant",
  "salary",
  "other",
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { entryType, amount, description, category, createdByName } = body;

    if (!VALID_TYPES.has(entryType)) {
      return NextResponse.json({ error: "invalid_entry_type" }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    }
    if (!description || description.length < 3) {
      return NextResponse.json({ error: "description_required" }, { status: 400 });
    }
    const safeCategory = VALID_CATEGORIES.has(category) ? category : "other";

    const organization = await db.organization.findUnique({ where: { slug } });
    if (!organization || organization.deletedAt) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const entry = await db.ledgerEntry.create({
      data: {
        organizationId: organization.id,
        entryType,
        amount,
        currency: organization.currency || "MAD",
        description,
        category: safeCategory,
        source: "internal",
        status: "pending",
        createdByName: createdByName ?? "مجهول",
      },
    });

    return NextResponse.json({ entry, organizationId: organization.id }, { status: 201 });
  } catch (error) {
    console.error("[organizations/ledger POST] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// GET ledger entries for an org
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const entryType = searchParams.get("entryType") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

    const organization = await db.organization.findUnique({ where: { slug } });
    if (!organization) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const entries = await db.ledgerEntry.findMany({
      where: {
        organizationId: organization.id,
        ...(entryType ? { entryType } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ entries, organization: { id: organization.id, name: organization.name, slug: organization.slug, balance: organization.balance } });
  } catch (error) {
    console.error("[organizations/ledger GET] error:", error);
    return NextResponse.json({ entries: [] }, { status: 200 });
  }
}
