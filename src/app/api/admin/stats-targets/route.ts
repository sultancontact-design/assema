import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "USER";
    const q = searchParams.get("q") || "";

    if (type === "USER") {
      const users = await db.user.findMany({
        where: q ? { OR: [{ fullName: { contains: q } }, { email: { contains: q } }] } : {},
        select: { id: true, fullName: true, email: true, avatar: true, points: true },
        take: 20, orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ users });
    }
    if (type === "VIDEO") {
      const videos = await db.video.findMany({
        where: q ? { title: { contains: q } } : {},
        select: { id: true, title: true, sourceUrl: true, likes: true, shares: true, comments: true, views: true, user: { select: { fullName: true } } },
        take: 20, orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ videos });
    }
    if (type === "POST") {
      const posts = await db.blogPost.findMany({
        where: q ? { title: { contains: q } } : {},
        select: { id: true, title: true, views: true },
        take: 20, orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ posts });
    }
    return NextResponse.json({ users: [], videos: [], posts: [] });
  } catch (error) {
    console.error("[stats-targets] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
