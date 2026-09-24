import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const initiatives = await db.initiative.findMany({
    include: { proposer: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(initiatives);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const { title, description, category } = await request.json();
  if (!title?.trim() || !description?.trim()) return NextResponse.json({ error: "العنوان والوصف مطلوبان" }, { status: 400 });
  const init = await db.initiative.create({
    data: { title: title.trim(), description: description.trim(), proposerId: user.id, category: category || "SOCIAL" },
  });
  return NextResponse.json({ success: true, id: init.id }, { status: 201 });
}
