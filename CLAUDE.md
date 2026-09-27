# CLAUDE.md — Project Context for AI Agents

## Project
"سيدي يوسف بن علي العاصمة" — Moroccan community solidarity platform digitizing "المعروف المغربي".

## Stack
Next.js 16 (App Router) + TypeScript 5 + Prisma (PostgreSQL/Supabase) + NextAuth + Tailwind CSS 4 + shadcn/ui + Framer Motion.

## Routes
- `/` — homepage (the ONLY user-visible public route)
- `/community/*` — auth-gated community features
- `/admin/*` — admin dashboard (auth-gated, ADMIN role)
- `/blog`, `/ethics`, `/about`, `/privacy-policy`, `/login` — public

## Design Skills (installed in `.agents/skills/`)
Before writing UI, read these in order:
1. `.agents/skills/frontend-design/SKILL.md` (Anthropic — anti-AI-slop rules)
2. `DESIGN.md` (project-specific design rules — REQUIRED reading)
3. `.agents/skills/design-taste-frontend/SKILL.md` (variance/motion/density dials)
4. `.agents/skills/ui-ux-pro-max/SKILL.md` (styles/palettes/fonts reference)

## Critical Rules (from DESIGN.md)
- NO Inter/Roboto/Arial — use Tajawal + IBM Plex Sans Arabic (already configured)
- NO purple gradients on white
- NO 3+ identical feature cards — use Bento Grid (12-col, varied col-span)
- NO centered everything — asymmetric layouts
- NO emoji in TSX files — use Lucide icons
- NO `text-center` on entire sections
- Generous spacing: 24/32/48/64/96 (not 8/16)
- ONE orchestrated motion on page load (not fade-up on every section)
- `prefers-reduced-motion` must be respected
- Touch targets ≥ 44px on mobile
- RTL from day one (`dir="rtl"`, `ms-`/`me-`)

## Reference
- Kiranism dashboard: `/tmp/skill-repos/next-shadcn-dashboard-starter/src/app/dashboard/overview/` (parallel routes pattern: layout.tsx + @sales + @area_stats + @bar_stats + @pie_stats)

## Commands
- `bun run dev` — start dev server (background)
- `bun run lint` — ESLint check
- `bun run db:push` — push Prisma schema

## Database
- `import { db } from "@/lib/db"` — Prisma client
- `import { getCurrentUser } from "@/lib/auth"` — current user (server-side)
- PostgreSQL on Supabase (pooled via pgbouncer)

## Production
- URL: https://assema-sultancontact-design.vercel.app
- GitHub: sultancontact-design/assema
- Auto-deploy on push to main
- Admin credentials: `admin@syba-community.ma` / `Demo@1234`

---

## 🚫 Hard NOs — ممنوع تماماً

1. **لا تحذف أي ملف موجود** — حتى لو بدا غير مستخدم
2. **لا تعيد البناء من الصفر** — اقرأ PROJECT-STATE.md أولاً
3. **لا تستخدم `git reset --hard`** — استخدم `git revert` بدلاً منها
4. **لا تستخدم `rm -rf`** — أبداً، حتى للمجلدات المؤقتة
5. **لا تُغيّر `prisma/schema.prisma` بدون migration** — استخدم `bun run db:push` بعد التعديل
6. **لا تحذف migration موجود** — حتى لو فشل، علّقه بدلاً من حذفه
7. **لا تحذف مكونات مشتركة** (PageHero، KpiCard، ActivityTicker، ThreeDMap، AdminShell)
8. **لا تحذف مهارات `.agents/skills/`** — 12 مهارة تصميم محمية
9. **لا تحذف DESIGN.md، CLAUDE.md، PROJECT-STATE.md** — ملفات التوثيق مقدّسة
10. **لا تُعيد كتابة `globals.css`** — أضف فقط، لا تستبدل
11. **لا تحذف Design tokens من CSS** — `--primary`, `--secondary`, `--accent` مقدّسة
12. **لا تُغيّر ألوان DESIGN.md بدون سبب موثق** — الألوان هي هوية المنصة
13. **لا تحذف نظام FeatureFlags** — 91 flag عبر 12 فئة، يتحكم بكل الميزات
14. **لا تُغيّر NEXTAUTH_SECRET، CRON_SECRET، DATABASE_URL** — بيانات إنتاجية حساسة
15. **لا تستخدم `bun run build`** — البناء يتطلّب Vercel environment كاملة
16. **لا تكتب `http://localhost:3000`** — استخدم Preview Panel فقط
17. **لا تستخدم z-ai-web-dev-sdk في client side** — backend only
18. **لا تضِف port في URL** — استخدم `?XTransformPort=NNNN` عبر gateway

## ✅ Hard YESs — مطلوب دائماً

1. **اقرأ `PROJECT-STATE.md`** في بداية كل جلسة (آخر حالة للمنصة)
2. **اقرأ `DESIGN.md`** قبل أي تصميم أو تعديل UI
3. **اقرأ `CLAUDE.md`** (خصوصاً Hard NOs أعلاه)
4. **افحص `git log --oneline -20`** لفهم آخر التغييرات
5. **اعمل `git tag`** قبل أي تغيير كبير (مثال: `git tag pre-v36-refactor`)
6. **ادفع بعد كل ملف صغير** — لا تنتظر اكتمال المهمة كاملة
7. **اختبر محلياً (`bun run lint`)** قبل push — يجب 0 errors
8. **حدّث `PROJECT-STATE.md`** بعد كل مهمة (القسم 1: الإصدارات + القسم 11: المهام)
9. **إذا فشل شيء، ارجع لآخر commit ناجح** — `git revert HEAD --no-edit`
10. **إذا لم تتأكد، اسأل — لا تخمن** — التخمين يكسر المنصة
11. **استخدم TodoWrite** لتتبع المهام المتعددة
12. **سجّل كل مهمة في `worklog.md`** (Task ID + Agent + Task + Work Log + Stage Summary)
13. **تحقّق بصرياً (Agent Browser + VLM)** بعد كل نشر — "it compiles" ليس كافياً
14. **احترم `prefers-reduced-motion`** في كل animation
15. **استخدم Skeleton بدل Spinner** في حالات التحميل

## 🛡️ نظام Recovery

### System Reset (فقدان كامل للبيئة المحلية)

**ما يحدث**: الـ sandbox يُعاد ضبطه، الملفات المحلية تُحذف.

**ما لا يُفقد**:
- ✅ **الكود في GitHub** → `git clone https://github.com/sultancontact-design/assema.git`
- ✅ **DB في Supabase** → لا تتأثر (PostgreSQL مدار خارجياً)
- ✅ **Skills في `.agents/skills/`** → مُلتزم بها في GitHub (commit 9f2df0a)
- ✅ **بيانات .env** → في Vercel Dashboard (Environment Variables)
- ✅ **الـ Deployments السابقة** → في Vercel (rollback بنقرة)

**خطوات Recovery**:
```bash
# 1. استنساخ الكود
git clone https://github.com/sultancontact-design/assema.git my-project
cd my-project

# 2. تثبيت الـ dependencies
bun install

# 3. تشغيل الـ dev server
bun run dev  # يعمل على port 3000

# 4. تحقّق من آخر commit
git log --oneline -5
# يجب أن يكون آخر commit: 151bc9c (v36.0) أو أحدث

# 5. اقرأ PROJECT-STATE.md لفهم الحالة الحالية
cat PROJECT-STATE.md | head -50

# 6. تحقّق من الإنتاج
curl -sI https://assema-sultancontact-design.vercel.app/
# يجب HTTP 200
```

### Rollback سريع (عند فشل تغيير)

```bash
# 1. ارجع لآخر commit ناجح
git revert HEAD --no-edit
git push origin main

# 2. انتظر Vercel rebuild (~100s)

# 3. تحقّق
curl -sI https://assema-sultancontact-design.vercel.app/

# 4. سجّل في worklog.md
```

### Recovery من Vercel (بدون git)

1. اذهب لـ Vercel Dashboard → Project → Deployments
2. اعثر على آخر deployment ناجح (✅ Ready)
3. انقر "⋯" → "Promote to Production"
4. انتظر 10-30s للـ promotion
5. تحقّق من الإنتاج

### Recovery من Supabase (DB فقط)

إذا فسدت البيانات:
1. اذهب لـ Supabase Dashboard → Project → Database → Backups
2. اختر آخر backup (يومي تلقائي)
3. اضغط "Restore"
4. انتظر 2-5 دقائق
5. تحقّق: `curl https://assema-sultancontact-design.vercel.app/api/public/stats`

## 📋 Pre-Flight Checklist (قبل أي مهمة)

- [ ] قرأت `PROJECT-STATE.md`؟
- [ ] قرأت `DESIGN.md`؟
- [ ] قرأت `CLAUDE.md` (Hard NOs)؟
- [ ] فحصت `git log --oneline -5`؟
- [ ] أنشأت `git tag` إذا كان التغيير كبير؟
- [ ] الـ TodoList محدّثة؟
- [ ] `bun run lint` يمرّ (0 errors)؟
- [ ] اللقطة BEFORE محفوظة (screenshot)؟
- [ ] سأحدّث `worklog.md` بعد الإنجاز؟
- [ ] سأحدّث `PROJECT-STATE.md` (القسم 1 + 11)؟

## 🔗 ملفات التوثيق المقدّسة (لا تُحذف أبداً)

| الملف | الوصف | متى أُنشئ |
|------|-------|-----------|
| `PROJECT-STATE.md` | توثيق شامل (12 قسم، 378 سطر) | v36.0 (commit 151bc9c) |
| `DESIGN.md` | قواعد التصميم الصارمة (12 قسم) | v32.0 → v35.0 |
| `CLAUDE.md` | هذا الملف (إرشادات الوكلاء) | v35.0 → v36.1 |
| `worklog.md` | سجلّ كل المهام (45+ Task ID) | v1.0 → present |
| `.agents/skills/` | 12 مهارة تصميم | v35.0 (commit 9f2df0a) |
