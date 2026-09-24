import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { id } = await params;
  try {
    await db.initiativeVote.create({ data: { initiativeId: id, userId: user.id } });
    await db.initiative.update({ where: { id }, data: { votes: { increment: 1 } } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "صوّتّ بالفعل" }, { status: 409 });
  }
}
