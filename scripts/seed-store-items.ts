import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const count = await db.storeItem.count();
  console.log(`StoreItems: ${count}`);
  if (count === 0) {
    // Seed 10 items
    const items = [
      { name: "تجميد السلسلة", description: "احتفظ بسلسلتك ولو فاتك يوم", icon: "🧊", pricePoints: 50, type: "FREEZE", stock: null },
      { name: "شارة المؤسّس", description: "شارة فخرية للأعضاء المؤسّسين", icon: "👑", pricePoints: 500, type: "BADGE", stock: 10 },
      { name: "شارة داعم الصندوق", description: "للأعضاء الذين تبرّعوا بأكثر من 1000 درهم", icon: "💝", pricePoints: 200, type: "BADGE", stock: null },
      { name: "شارة رمضان", description: "لمن حافظ على سلسلة 30 يوماً", icon: "🌙", pricePoints: 150, type: "BADGE", stock: null },
      { name: "شارة المحترف", description: "للأعضاء المحترفين", icon: "⭐", pricePoints: 100, type: "BADGE", stock: null },
      { name: "حدّ أقصى مضاعف", description: "تخصّص ميزة ترفع حدّك الأقصى للمساهمة", icon: "💎", pricePoints: 300, type: "FEATURE", stock: 50 },
      { name: "أولوية في الفعاليات", description: "تسجيل مبكّر في الفعاليات", icon: "⚡", pricePoints: 250, type: "FEATURE", stock: 100 },
      { name: "خصم 10%", description: "خصم على رسوم معالجة الطلبات", icon: "🎁", pricePoints: 100, type: "DISCOUNT", stock: null },
      { name: "دليل الحي PDF", description: "تحميل دليل شامل بالأماكن المفيدة", icon: "📚", pricePoints: 75, type: "DIGITAL", stock: null },
      { name: "خلفية رمضان", description: "خلفية شاشة رمضانية حصرية", icon: "🖼️", pricePoints: 80, type: "DIGITAL", stock: null },
    ];
    for (const it of items) {
      const exists = await db.storeItem.findFirst({ where: { name: it.name } });
      if (!exists) await db.storeItem.create({ data: { ...it, isActive: true } });
    }
    console.log("Seeded 10 store items");
  }
}
main().finally(() => db.$disconnect());
