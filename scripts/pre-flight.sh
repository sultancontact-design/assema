#!/bin/bash
# ===================================================================
#  pre-flight.sh — فحص قبل أي مهمة (v36.1)
#  استدعاء: ./scripts/pre-flight.sh
#  يتحقّق من: ملفات التوثيق + الـ skills + lint + git state
# ===================================================================
set -e

PROJECT_ROOT="/home/z/my-project"
cd "$PROJECT_ROOT" || { echo "❌ Project root not found"; exit 1; }

echo "═══════════════════════════════════════════════════════════════"
echo "  PRE-FLIGHT CHECK — v36.1"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ━━━ 1. ملفات التوثيق المقدّسة ━━━
echo "━━━ 1. Sacred Documentation Files ━━━"
SACRED_FILES=(
  "PROJECT-STATE.md"
  "DESIGN.md"
  "CLAUDE.md"
  "worklog.md"
)
ALL_OK=true
for f in "${SACRED_FILES[@]}"; do
  if [ -f "$f" ]; then
    LINES=$(wc -l < "$f")
    echo "  ✅ $f ($LINES lines)"
  else
    echo "  ❌ $f MISSING"
    ALL_OK=false
  fi
done
echo ""

# ━━━ 2. مهارات التصميم ━━━
echo "━━━ 2. Design Skills (.agents/skills/) ━━━"
if [ -d ".agents/skills" ]; then
  SKILL_COUNT=$(ls -d .agents/skills/*/ 2>/dev/null | wc -l)
  echo "  ✅ $SKILL_COUNT skills installed"
  ls -d .agents/skills/*/ 2>/dev/null | sed 's|.agents/skills/|    - |;s|/$||' | head -15
else
  echo "  ❌ .agents/skills/ MISSING"
  ALL_OK=false
fi
echo ""

# ━━━ 3. مكونات مشتركة حساسة ━━━
echo "━━━ 3. Sensitive Shared Components ━━━"
SENSITIVE_COMPONENTS=(
  "src/components/community/page-hero.tsx"
  "src/components/community/home-hero.tsx"
  "src/components/community/stories-carousel.tsx"
  "src/components/community/activity-ticker.tsx"
  "src/components/map/three-d-map.tsx"
  "src/components/admin/admin-shell.tsx"
  "src/components/admin/dashboard-client.tsx"
  "src/components/admin/admin-charts.tsx"
  "src/components/layout/app-chrome.tsx"
  "src/components/layout/site-header.tsx"
  "src/components/layout/bottom-nav.tsx"
  "src/components/shared/zellige-divider.tsx"
)
for f in "${SENSITIVE_COMPONENTS[@]}"; do
  if [ -f "$f" ]; then
    echo "  ✅ $f"
  else
    echo "  ⚠️  $f (missing — check if it was renamed)"
  fi
done
echo ""

# ━━━ 4. ملفات vendor ━━━
echo "━━━ 4. Vendor Files (MapLibre local) ━━━"
VENDOR_FILES=(
  "public/vendor/maplibre-gl.js"
  "public/vendor/maplibre-gl-csp-worker.js"
  "public/vendor/maplibre-gl.css"
)
for f in "${VENDOR_FILES[@]}"; do
  if [ -f "$f" ]; then
    SIZE=$(du -h "$f" | cut -f1)
    echo "  ✅ $f ($SIZE)"
  else
    echo "  ❌ $f MISSING"
    ALL_OK=false
  fi
done
echo ""

# ━━━ 5. Prisma ━━━
echo "━━━ 5. Prisma Schema ━━━"
if [ -f "prisma/schema.prisma" ]; then
  LINES=$(wc -l < prisma/schema.prisma)
  MODELS=$(grep -c "^model " prisma/schema.prisma)
  echo "  ✅ prisma/schema.prisma ($LINES lines, $MODELS models)"
else
  echo "  ❌ prisma/schema.prisma MISSING"
  ALL_OK=false
fi
echo ""

# ━━━ 6. Git state ━━━
echo "━━━ 6. Git State ━━━"
LAST_COMMIT=$(git log --oneline -1)
echo "  Last commit: $LAST_COMMIT"
BRANCH=$(git branch --show-current)
echo "  Branch: $BRANCH"
CHANGES=$(git status --short | wc -l | tr -d ' ')
if [ "$CHANGES" -gt 0 ]; then
  echo "  ⚠️  $CHANGES uncommitted changes"
else
  echo "  ✅ Clean working tree"
fi

# Tags
TAGS=$(git tag -l "v*-stable" | wc -l | tr -d ' ')
echo "  Stable tags: $TAGS"
git tag -l "v*-stable" 2>/dev/null | sed 's/^/    - /' | head -5
echo ""

# ━━━ 7. Lint check (optional, skip if dev server running) ━━━
echo "━━━ 7. Lint Check ━━━"
if bun run lint 2>&1 | tail -1 | grep -q "✖"; then
  echo "  ❌ Lint FAILED"
  bun run lint 2>&1 | tail -10
  ALL_OK=false
else
  echo "  ✅ Lint passed (0 errors)"
fi
echo ""

# ━━━ 8. Production health ━━━
echo "━━━ 8. Production Health ━━━"
PROD_URL="https://assema-sultancontact-design.vercel.app"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$PROD_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✅ Production ($PROD_URL) — HTTP 200"
else
  echo "  ⚠️  Production returned HTTP $HTTP_CODE"
fi
echo ""

# ━━━ Summary ━━━
echo "═══════════════════════════════════════════════════════════════"
if [ "$ALL_OK" = true ]; then
  echo "  ✅ ALL CHECKS PASSED — safe to proceed"
else
  echo "  ❌ SOME CHECKS FAILED — review before proceeding"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Read PROJECT-STATE.md (full system state)"
echo "  2. Read DESIGN.md (design rules)"
echo "  3. Read CLAUDE.md Hard NOs"
echo "  4. git tag pre-<your-task>  # before big changes"
echo "  5. TodoWrite to track your task"
echo "  6. After: update worklog.md + PROJECT-STATE.md"
