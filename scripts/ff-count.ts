import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const total = await db.featureFlag.count();
  const active = await db.featureFlag.count({ where: { status: "ACTIVE" } });
  console.log(`FeatureFlags: ${total} (${active} ACTIVE)`);
  const byCat = await db.featureFlag.groupBy({ by: ["category"], _count: true, orderBy: { category: "asc" } });
  for (const c of byCat) console.log(`  ${c.category}: ${c._count}`);
}
main().finally(() => db.$disconnect());
