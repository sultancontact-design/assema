// ===================================================================
//  middleware-db.ts — مساعد قاعدة البيانات للـmiddleware
//  الـmiddleware لا يمكنه استخدام Prisma مباشرة (Edge runtime)
//  هذا الملف يُصدّر dummy client (الفحص الفعلي عبر fetch في middleware.ts)
// ===================================================================

export function createPrismaClientForMiddleware(): null {
  return null;
}
