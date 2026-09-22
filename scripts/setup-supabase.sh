#!/bin/bash
# ===================================================================
#  scripts/setup-supabase.sh
#  يُجهّز Prisma للـPostgreSQL + يرحّل الـSchema + يُشغّل الـseed
#  على Supabase (بعد استئناف المشروع من الإيقاف)
# ===================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🚀 إعداد سيدي يوسف بن علي العاصمة على Supabase               ║"
echo "╚══════════════════════════════════════════════════════════════╝"

echo ""
echo "⚠️  قبل التشغيل، تأكّد من:"
echo "  1. المشروع نشط على Supabase (ليس paused)"
echo "  2. اذهب إلى: https://supabase.com/dashboard/project/uigwfpddaawiwvsxmggj"
echo "  3. إن كان موقوفاً → اضغط 'Restore project'"
echo "  4. انتظر 2-3 دقائق للاستئناف"
echo ""
read -p "هل المشروع نشط؟ اضغط Enter للمتابعة أو Ctrl+C للإلغاء..."

# 1) نسخ احتياطي للـschema الحالي
echo ""
echo "━━━ 1) نسخ احتياطي للـschema ━━━"
cp prisma/schema.prisma prisma/schema.prisma.sqlite-backup
echo "✓ نسخ احتياطي: prisma/schema.prisma.sqlite-backup"

# 2) تحويل provider من sqlite إلى postgresql
echo ""
echo "━━━ 2) تحويل Prisma إلى PostgreSQL ━━━"
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
if ! grep -q "directUrl" prisma/schema.prisma; then
  sed -i 's|url      = env("DATABASE_URL")|url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")|' prisma/schema.prisma
fi
echo "✓ تم تحديث prisma/schema.prisma"

# 3) إعداد .env
echo ""
echo "━━━ 3) إعداد .env ━━━"
cat > .env << 'EOF'
# Supabase Pooler (Transaction mode — للتطبيق)
DATABASE_URL="postgresql://postgres.uigwfpddaawiwvsxmggj:assema%40Admin2024@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Pooler (Session mode — للـmigrations)
DIRECT_URL="postgresql://postgres.uigwfpddaawiwvsxmggj:assema%40Admin2024@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

NEXTAUTH_SECRET=b36bee322af553fed7ed4ad41e71867c58e79152f211fdc3321cabe4c2c838ca
NEXTAUTH_URL=http://localhost:3000

DEMO_MODE=true

SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="سيدي يوسف بن علي العاصمة <test@syba.local>"
SMTP_ENABLED="false"
EOF
echo "✓ تم تحديث .env بإعدادات Supabase"

# 4) توليد Prisma Client
echo ""
echo "━━━ 4) توليد Prisma Client لـPostgreSQL ━━━"
bun run db:generate

# 5) دفع الـSchema
echo ""
echo "━━━ 5) دفع الـSchema لـSupabase ━━━"
bun run db:push --accept-data-loss

# 6) تشغيل الـseed
echo ""
echo "━━━ 6) تشغيل الـseed (بيانات مغربية واقعية) ━━━"
bun run db:seed

# 7) التحقق
echo ""
echo "━━━ 7) التحقق من البيانات ━━━"
bun -e "
import { db } from './src/lib/db';
(async () => {
  const users = await db.user.count();
  const families = await db.family.count();
  const contributions = await db.contribution.count();
  const requests = await db.fundRequest.count();
  const events = await db.event.count();
  const groups = await db.group.count();
  console.log('✅ البيانات في Supabase:');
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
echo "✅ اكتمل الإعداد على Supabase!"
echo ""
echo "الخطوات التالية:"
echo "  1. اضبط NEXTAUTH_URL في .env برابط Vercel الفعلي"
echo "  2. اضبط DEMO_MODE=false في .env"
echo "  3. اضبط Environment Variables في Vercel"
echo "  4. انشر على Vercel: bash scripts/deploy-to-vercel.sh"
