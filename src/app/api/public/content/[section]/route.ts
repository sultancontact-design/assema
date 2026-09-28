// GET: public content by section (no auth — for rendering pages)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const items = await db.siteContent.findMany({ where: { section, isActive: true }, select: { key: true, value: true } });
  const images = await db.imageAsset.findMany({ where: { section, isActive: true }, select: { key: true, url: true, alt: true } });
  const contentMap = Object.fromEntries(items.map(i => [i.key, i.value]));
  const imageMap = Object.fromEntries(images.map(i => [i.key, i.url]));
  return NextResponse.json({ content: contentMap, images: imageMap });
}
