import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const [users, families, contributions, events, blogPosts, storeItems, groups, discussions, initiatives] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.family.count(),
    db.contribution.count(),
    db.event.count(),
    db.blogPost.count({ where: { status: "published" } }),
    db.storeItem.count(),
    db.group.count(),
    db.discussion.count(),
    db.initiative.count(),
  ]);
  const contribSum = await db.contribution.aggregate({ _sum: { amount: true } });
  console.log(`Users: ${users}, Families: ${families}, Contributions: ${contributions}`);
  console.log(`Events: ${events}, BlogPosts: ${blogPosts}, StoreItems: ${storeItems}`);
  console.log(`Groups: ${groups}, Discussions: ${discussions}, Initiatives: ${initiatives}`);
  console.log(`Total contributions amount: ${contribSum._sum.amount ?? 0} DH`);
}
main().finally(() => db.$disconnect());
