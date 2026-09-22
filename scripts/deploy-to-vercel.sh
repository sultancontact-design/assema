#!/bin/bash
# ===================================================================
#  scripts/deploy-to-vercel.sh
#  يُجهّز المشروع للنشر على Vercel (يدوياً عبر Vercel Dashboard أو CLI)
#  الاستخدام: bash scripts/deploy-to-vercel.sh
# ===================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🌐 نشر سيدي يوسف بن علي العاصمة على Vercel                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"

echo ""
echo "━━━ 1) التحقق من الجاهزية ━━━"

# فحص .env.example
if [ -f ".env.example" ]; then
  echo "✓ .env.example موجود"
else
  echo "❌ .env.example مفقود"
  exit 1
fi

# فحص vercel.json
if [ -f "vercel.json" ]; then
  echo "✓ vercel.json موجود"
else
  echo "❌ vercel.json مفقود"
  exit 1
fi

# فحص .gitignore
if grep -q ".env" .gitignore; then
  echo "✓ .gitignore يحوي .env"
else
  echo "❌ .gitignore لا يحوي .env"
  exit 1
fi

# فحص NEXTAUTH_SECRET في .env.example (لا قيمة حقيقية)
if grep -q "غيّرني" .env.example; then
  echo "✓ NEXTAUTH_SECRET placeholder صحيح في .env.example"
else
  echo "⚠️ تأكّد أن NEXTAUTH_SECRET ليس مفتوحاً في .env.example"
fi

# فحص DEMO_MODE في vercel.json
if grep -q "DEMO_MODE" vercel.json; then
  echo "✓ DEMO_MODE مضبوط في vercel.json (false للإنتاج)"
else
  echo "⚠️ DEMO_MODE غير مضبوط في vercel.json"
fi

echo ""
echo "━━━ 2) الاختيار: نشر عبر Dashboard أم CLI؟ ━━━"
echo ""
echo "خيار A (موصى به للـMVP): Vercel Dashboard"
echo "  1. ادفع الكود إلى GitHub:"
echo "     git add . && git commit -m 'v1.0.0 — Launch'"
echo "     git push origin main"
echo "  2. اذهب إلى https://vercel.com/new"
echo "  3. Import المستودع من GitHub"
echo "  4. Framework Preset: Next.js (auto-detected)"
echo "  5. أضف Environment Variables (من .env.example)"
echo "  6. Deploy"
echo ""
echo "خيار B: Vercel CLI"
echo "  1. ثبّت: npm i -g vercel"
echo "  2. سجّل دخول: vercel login"
echo "  3. انشر: vercel --prod"
echo "  4. أضف Environment Variables: vercel env add"
echo ""

echo "━━━ 3) Environment Variables المطلوبة ━━━"
echo ""
cat .env.example | grep -v "^#" | grep "=" | grep -v "^$"

echo ""
echo "━━━ 4) بعد النشر ━━━"
echo ""
echo "  1. افتح https://<project>.vercel.app"
echo "  2. اختبر login: admin@syba-community.ma / Demo@1234"
echo "  3. اذهب لـ/admin → 16 قسم"
echo "  4. فعّل 2FA: /admin/settings/security"
echo "  5. فعّل IP allowlist: /admin/settings/security/ips"
echo "  6. اضبط SMTP (Brevo): /admin/settings/email"
echo ""
echo "📚 راجع: docs/POST-DEPLOYMENT-CHECKLIST.md"
