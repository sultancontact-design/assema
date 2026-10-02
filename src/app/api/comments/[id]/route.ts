import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const comment = await db.comment.findUnique({ where: { id } });
    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (comment.userId !== user.id && dbUser?.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.comment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[comment DELETE] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
