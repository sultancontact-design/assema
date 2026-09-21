import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// في وضع التطوير: أحياناً يُبقى Turbopack نسخة قديمة من PrismaClient في
// الذاكرة بعد تعديل schema.prisma وتشغيل `bun run db:push`. لضمان عمل
// الموديلات الجديدة (مثل AllowedIP)، نتحقّق من العميل الحالي قبل إعادة
// استعماله من الكاش.
function isStalePrisma(p: PrismaClient | undefined): boolean {
  if (!p) return false
  try {
    const probe = p as unknown as { allowedIP?: unknown }
    return !probe.allowedIP
  } catch {
    return false
  }
}

if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  if (isStalePrisma(globalForPrisma.prisma)) {
    try {
      void globalForPrisma.prisma.$disconnect()
    } catch {
      // تجاهل الأخطاء الصامتة
    }
    globalForPrisma.prisma = undefined
  }
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
