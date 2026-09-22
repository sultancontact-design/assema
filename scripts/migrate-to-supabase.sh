#!/bin/bash
# ===================================================================
#  scripts/migrate-to-supabase.sh
#  يرحّل الـSchema + البيانات من SQLite المحلي إلى Supabase PostgreSQL
#  الاستخدام:
#    DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true" \
#    DIRECT_URL="postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres" \
#    bash scripts/migrate-to-supabase.sh
# ===================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🚀 ترحيل سيدي يوسف بن علي العاصمة إلى Supabase               ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# التحقق من المتغيّرات
if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ]; then
  echo "❌ خطأ: DATABASE_URL و DIRECT_URL مطلوبان"
  echo ""
  echo "الاستخدام:"
  echo '  DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true" \'
  echo '  DIRECT_URL="postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres" \'
  echo "  bash scripts/migrate-to-supabase.sh"
  exit 1
fi

echo ""
echo "📌 DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "📌 DIRECT_URL:   ${DIRECT_URL:0:50}..."
echo ""

# نسخ احتياطي للـschema الأصلي
cp prisma/schema.prisma prisma/schema.prisma.sqlite-backup
echo "✓ نسخ احتياطي: prisma/schema.prisma.sqlite-backup"

# تحويل provider من sqlite إلى postgresql
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
# إضافة directUrl
if ! grep -q "directUrl" prisma/schema.prisma; then
  sed -i 's|url      = env("DATABASE_URL")|url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")|' prisma/schema.prisma
fi
echo "✓ تحديث schema.prisma: sqlite → postgresql + directUrl"

# 1) توليد Prisma Client للـPostgreSQL
echo ""
echo "━━━ 1) توليد Prisma Client ━━━"
bun run db:generate

# 2) دفع الـSchema لـSupabase (DIRECT_URL)
echo ""
echo "━━━ 2) دفع الـSchema لـSupabase ━━━"
DATABASE_URL="$DIRECT_URL" bun run db:push --accept-data-loss

# 3) ملء البيانات التجريبية (DIRECT_URL)
echo ""
echo "━━━ 3) ملء البيانات التجريبية ━━━"
DATABASE_URL="$DIRECT_URL" bun run db:seed

# 4) التحقق
echo ""
echo "━━━ 4) التحقق ━━━"
DATABASE_URL="$DIRECT_URL" bun -e "
import { db } from './src/lib/db';
(async () => {
  const users = await db.user.count();
  const families = await db.family.count();
  const contributions = await db.contribution.count();
  const requests = await db.fundRequest.count();
  const events = await db.event.count();
  const groups = await db.group.count();
  console.log('✅ التحقق من البيانات في Supabase:');
  console.log('   المستخدمون:', users);
  console.log('   العائلات:', families);
  console.log('   المساهمات:', contributions);
  console.log('   طلبات الصرف:', requests);
  console.log('   الفعاليات:', events);
  console.log('   المجموعات:', groups);
  await db.\$disconnect();
})();
"

echo ""
echo "✅ اكتمل الترحيل إلى Supabase!"
echo ""
echo "الخطوات التالية:"
echo "  1. تحقّق من Supabase Dashboard → Table Editor"
echo "  2. اضبط DATABASE_URL + DIRECT_URL في Vercel Environment Variables"
echo "  3. انشر على Vercel"
