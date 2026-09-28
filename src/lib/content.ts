// CMS content helper — for server components
import { db } from "@/lib/db";

// Get a single content value by key (with fallback)
export async function getContent(key: string, fallback: string): Promise<string> {
  try {
    const item = await db.siteContent.findUnique({ where: { key } });
    return item?.value || fallback;
  } catch {
    return fallback;
  }
}

// Get a single image URL by key (with fallback)
export async function getImage(key: string, fallback: string): Promise<string> {
  try {
    const item = await db.imageAsset.findUnique({ where: { key } });
    return item?.url || fallback;
  } catch {
    return fallback;
  }
}

// Batch get content values by keys (returns key→value map)
export async function getContentBatch(keys: string[]): Promise<Record<string, string>> {
  try {
    const items = await db.siteContent.findMany({ where: { key: { in: keys }, isActive: true } });
    return Object.fromEntries(items.map(i => [i.key, i.value]));
  } catch {
    return {};
  }
}

// Batch get image URLs by keys (returns key→url map)
export async function getImageBatch(keys: string[]): Promise<Record<string, string>> {
  try {
    const items = await db.imageAsset.findMany({ where: { key: { in: keys }, isActive: true } });
    return Object.fromEntries(items.map(i => [i.key, i.url]));
  } catch {
    return {};
  }
}
