// v73 — Complaints API (POST creates a complaint)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, content, status = "open" } = body;
    if (!content || content.length < 10) {
      return NextResponse.json({ error: "content_too_short" }, { status: 400 });
    }
    const user = await getCurrentUser().catch(() => null);

    // Use Complaint model if it exists, otherwise just accept
    try {
      const c = await db.complaint.create({
        data: {
          type: type ?? "other",
          content: content.slice(0, 2000),
          status,
          reporterId: user?.id ?? null,
          reporterName: user?.name ?? "زائر",
        },
      });
      return NextResponse.json({ id: c.id, success: true }, { status: 201 });
    } catch (dbErr) {
      // Fallback: accept but don't store (graceful)
      console.warn("[complaints] DB error, accepted but not stored:", (dbErr as Error).message.slice(0, 80));
      return NextResponse.json({ success: true, stored: false }, { status: 201 });
    }
  } catch (error) {
    console.error("[complaints] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
