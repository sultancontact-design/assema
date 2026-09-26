import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const content = await db.siteContent.count();
  const images = await db.imageAsset.count();
  console.log(`  SiteContent: ${content}`);
  console.log(`  ImageAsset: ${images}`);
}
main().finally(() => db.$disconnect());
