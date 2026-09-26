# PROJECT-STATE.md — توثيق شامل + حماية الإنجازات

> **⚠️ هذا الملف يحمي كل ما تم إنجازه من v1.0 → v35.3. لا تُحذف، لا تُنقل، لا تُعدَّل إلا بإذن صريح.**
> أُنشئ في v36.0 لحماية المنصة من system resets (حدث في dd0eceb — wiped v16-v20).

---

## 1. الإصدارات المُنجزة (v1.0 → v35.3)

| الإصدار | التاريخ | الميزة الرئيسية | commit | الحالة |
|---------|---------|-----------------|--------|--------|
| v35.3 | 2026-09-26 | Hero + Bento لـ 4 صفحات Community (fund + events + store + services) | `215a139` | ✅ منشور |
| v35.2 | 2026-09-25 | Bento للرئيسية (Blog + Contributions + Events + Ads + gap fix) | `13eb346` | ✅ منشور |
| v35.1 | 2026-09-25 | Dashboard Kiranism (4 KPI + 4 Recharts + Live Feed + Alerts) + FileText fix | `3c5c49a` | ✅ منشور |
| v35.0 | 2026-09-24 | 12 مهارة تصميم + DESIGN.md + CLAUDE.md + Hero جديد غير متمركز | `9f2df0a` | ✅ منشور |
| v34.0 | 2026-09-23 | إصلاح 4 مشاكل الخريطة (Arabic + satellite + districts + perf) | `10e039d` | ✅ منشور |
| v32.0 | 2026-09-22 | merge map pages + Stadia satellite + dynamic import + redirect | `5792058` | ✅ منشور |
| v30.0 | 2026-09-21 | CMS full (models + seed + API + admin UI) + revert v28/v29 | `bb565b4` | ✅ منشور |
| v29.0 | 2026-09-20 | real photographs (Unsplash) for store + ethics | `3bcba97` | ✅ منشور |
| v28.0 | 2026-09-20 | REWRITE ethics page + store real icons | `0e6fe29` | ✅ منشور |
| v27.0 | 2026-09-19 | REDESIGN 2026-quality CSS + hero + stats + glassmorphism | `ca234e9` | ✅ منشور |
| v26.0 | 2026-09-18 | fix stats=0 (client-side fetch + AnimatedCounter → plain text) | `65abc68` | ✅ منشور |
| v25.0 | 2026-09-17 | admin dashboard + users/manage + roles + stats fix | `e93b767` | ✅ منشور |
| v24.0 | 2026-09-16 | ticker LTR + fluid layout + hero image + modern CSS | `5c2cf73` | ✅ منشور |
| v22.0 | 2026-09-14 | Feature Control Center (91 flags + 12 categories + 5 statuses) | `ea4ae9a` | ✅ منشور |
| v21.0 | 2026-09-13 | restore sidebar + nav + store + map (recovered from dd0eceb reset) | `c4bc9dd` | ✅ منشور |
| v20.1 | 2026-09-12 | local vendor files + 4G optimization | `5ff1b0d` | ✅ منشور |
| v15.1 | 2026-09-07 | seed 10 articles + footer/sidebar navigation | `3271373` | ✅ منشور |
| v15.0 | 2026-09-07 | REAL prices only (FAOSTAT area=504 Morocco) + 5 axes (A-F) | `1afb610` | ✅ منشور |
| v14.3 | 2026-09-05 | CRITICAL: Remove all fake prices, real sources only | `45d4ab1` | ✅ منشور |
| v14.2 | 2026-09-04 | Auto market prices from official sources + cron job | `9b1e6d4` | ✅ منشور |
| v14.1 | 2026-09-03 | Services directory + Advice board + Market prices | `03285cf` | ✅ منشور |
| v14.0 | 2026-09-02 | AdSlots + MapLibre 3D + Collapsible Sidebar + Phone Privacy | `c1091ca` | ✅ منشور |
| v3.0 | 2026-08-15 | نظام الإدمان (Octalysis + Hook Model + Prospect Theory) | — | ✅ |
| v4.0 | 2026-08-16 | PWA + offline + legal pages | — | ✅ |
| v5.0 | 2026-08-17 | Map (SVG) + admin economy | — | ✅ |
| v7.0 | 2026-08-19 | icons + ads + content + referral | — | ✅ |
| v10.0 | 2026-08-22 | revive (stats + ticker + hero) | — | ✅ |
| v12.0 | 2026-08-24 | security hardening | — | ✅ |
| v13.0 | 2026-08-25 | Vercel deploy | — | ✅ |
| v1.0-v11.0 | 2026-08-10 → 24 | التأسيس + Auth + Fund + Admin + Community + 2FA + SMTP + Demo + Launch | — | ✅ |

---

## 2. الملفات الحساسة (❌ لا تُحذف، لا تُنقل، لا تُعدَّل بدون إذن)

### 2.1 ملفات التصميم (Design System)
```
DESIGN.md                         — قواعد التصميم الصارمة (12 قسم)
CLAUDE.md                         — إرشادات الوكلاء (AI agents)
.agents/skills/                   — 12 مهارة تصميم (12 SKILL.md)
  ├── frontend-design/           — Anthropic official (anti-AI-slop)
  ├── brand-guidelines/           — Anthropic
  ├── design-taste-frontend/      — DESIGN_VARIANCE=8, MOTION=6, DENSITY=4
  ├── ui-ux-pro-max/              — 50 styles + 97 palettes
  ├── accessibility-agents/
  ├── addyosmani-quality/
  ├── ai-graphic-design-skill/
  ├── baseline-ui/
  ├── brand-design-md/
  ├── claude-wireframe-skill/
  ├── color-expert/
  ├── content-strategy/
src/app/globals.css               — Design tokens (Tajawal + IBM Plex + Zellige palette)
src/app/layout.tsx                — Font imports + AdSense + providers
```

### 2.2 المكونات المشتركة (Shared Components)
```
src/components/community/page-hero.tsx       — Hero موحد (4 صفحات تستخدمه)
src/components/community/home-hero.tsx       — Hero الرئيسية (KPI card حيّة)
src/components/community/stories-carousel.tsx — StoriesBento (featured col-span-2)
src/components/community/activity-ticker.tsx — شريط النشاطات
src/components/community/visitor-welcome.tsx — بانر ترحيب الزوار
src/components/community/fomo-banner.tsx     — بانر الإلحاح
src/components/map/three-d-map.tsx           — الخريطة (MapLibre v4.7.1 + ESRI + French labels)
src/components/admin/admin-shell.tsx         — كروم لوحة الإدارة (sidebar + topbar)
src/components/admin/dashboard-client.tsx   — Dashboard Kiranism (4 KPI + 4 charts + Live Feed)
src/components/admin/admin-charts.tsx        — 4 Recharts (Line + Bar + Pie + Area)
src/components/layout/app-chrome.tsx         — App shell (header + sidebar + footer)
src/components/layout/site-header.tsx       — الهيدر (12 رابط)
src/components/layout/bottom-nav.tsx        — Navigation سفلي للموبايل
src/components/shared/zellige-divider.tsx   — فاصل زخرفي مغربي
```

### 2.3 الصفحات المُحسّنة (v35.x redesign)
```
src/app/page.tsx                              — الرئيسية (Hero + Bento Grid)
src/app/admin/dashboard/page.tsx             — Dashboard (Kiranism Bento)
src/app/community/fund/page.tsx              — صندوق المعروف (Hero + Bento balance)
src/app/community/events/page.tsx            — الفعاليات (Hero + Bento featured)
src/app/community/store/page.tsx             — المتجر (Hero + Bento products)
src/app/community/services/page.tsx          — الخدمات (Hero + Bento + filter)
src/app/community/map-3d/page.tsx            — خريطة 3D (MapLibre + 5 markers)
```

### 2.4 ملفات Prisma
```
prisma/schema.prisma              — 57 نموذج (1619 سطر)
prisma/seed.ts                    — Seed رئيسي (admin + 200 users + 50 families)
prisma/seed-blog.ts               — 60 مقالة
prisma/seed-districts.ts          — 5 أحياء (مراكش)
prisma/seed-engagement.ts        — بيانات الإدمان
prisma/seed-missing.ts           — بيانات مكمّلة
prisma/seed-rich.ts              — بيانات غنية
src/lib/db.ts                     — Prisma client
```

### 2.5 ملفات الخريطة (vendor)
```
public/vendor/maplibre-gl.js              — UMD v4.7.1 (local، لا CDN)
public/vendor/maplibre-gl-csp-worker.js   — Worker (same-origin)
public/vendor/maplibre-gl.css              — Styles
```

---

## 3. الصفحات العاملة (102 صفحة)

### 3.1 الصفحات العمومية (8 صفحات)
| المسار | الوصف | HTTP | Auth |
|--------|-------|------|------|
| `/` | الرئيسية (Hero + Bento + live stats) | 200 | عام |
| `/about` | عن المنصة | 200 | عام |
| `/ethics` | الميثاق الأخلاقي | 200 | عام |
| `/privacy-policy` | سياسة الخصوصية | 200 | عام |
| `/privacy-requests` | طلبات حماية البيانات (CNDP 09-08) | 200 | عام |
| `/blog` | المدوّنة (60 مقالة) | 200 | عام |
| `/login` | تسجيل الدخول | 200 | عام |
| `/terms` | الشروط | 200 | عام |

### 3.2 صفحات المجتمع (20 صفحة، auth-gated)
| المسار | الوصف | v35.x redesign |
|--------|-------|---------------|
| `/community` | ملخص الحي | — |
| `/community/fund` | صندوق المعروف | ✅ v35.3 |
| `/community/fund/statement` | كشف الحساب | — |
| `/community/fund/receipt/[id]` | إيصال مساهمة | — |
| `/community/fund/requests/[id]` | طلب صندوق | — |
| `/community/fund/reports` | تقارير الصندوق | — |
| `/community/events` | الفعاليات | ✅ v35.3 |
| `/community/events/[id]` | تفاصيل فعالية + QR | — |
| `/community/store` | المتجر | ✅ v35.3 |
| `/community/services` | دليل الخدمات | ✅ v35.3 |
| `/community/groups` | المجموعات | — |
| `/community/profile` | الملف الشخصي | — |
| `/community/messages` | الرسائل | — |
| `/community/discussions` | النقاشات | — |
| `/community/initiatives` | المبادرات | — |
| `/community/prices` | أسعار السوق | — |
| `/community/prices/report` | أبلغ عن سعر | — |
| `/community/map-3d` | خريطة 3D | ✅ v34.0 |
| `/community/map` | redirect → map-3d | ✅ v32.0 |
| `/community/notifications` | الإشعارات | — |

### 3.3 صفحات الإدارة (40+ صفحة، SUPER_ADMIN فقط)
| المسار | الوصف |
|--------|-------|
| `/admin/dashboard` | لوحة التحكم (Kiranism Bento) ✅ v35.1 |
| `/admin/users/manage` | إدارة المستخدمين |
| `/admin/roles` | الأدوار والصلاحيات |
| `/admin/content` | إدارة المحتوى (CMS) |
| `/admin/feature-control` | مركز التحكم بالميزات (91 flags) |
| `/admin/analytics` | التحليلات المتقدّمة |
| `/admin/audit` | سجلّات التدقيق |
| `/admin/backup` | النسخ الاحتياطي |
| `/admin/badges` | الشارات |
| `/admin/blog` | إدارة المدوّنة |
| `/admin/blog/new` | مقال جديد |
| `/admin/blog/[id]/edit` | تحرير مقال |
| `/admin/challenges` | التحدّيات |
| `/admin/cndp` | طلبات CNDP |
| `/admin/complaints` | الشكاوى |
| `/admin/contributions` | مراجعة المساهمات |
| `/admin/data` | إدارة البيانات |
| `/admin/discussions` | النقاشات |
| `/admin/districts` | الأحياء |
| `/admin/district-monitor` | مراقبة الأحياء |
| `/admin/economy` | اقتصاد النقاط |
| `/admin/engagement` | التفاعل |
| `/admin/events` | الفعاليات |
| `/admin/events/scan` | مسح QR |
| `/admin/families` | العائلات |
| `/admin/fund` | الصندوق |
| `/admin/groups` | المجموعات |
| `/admin/initiatives` | المبادرات |
| `/admin/live` | بثّ مباشر |
| `/admin/messages` | الرسائل |
| `/admin/notifications` | الإشعارات |
| `/admin/ads/*` | 8 أقسام فرعية للإعلانات |

### 3.4 صفحات المصادقة + أخرى
| المسار | الوصف |
|--------|-------|
| `/login` | تسجيل الدخول |
| `/login/2fa` | المصادقة الثنائية (TOTP) |
| `/register` | حساب جديد |
| `/verify-request` | تأكيد البريد |
| `/demo-access` | وصول تجريبي |
| `/tour` | جولة إرشادية |
| `/contact` | اتصل بنا |
| `/guide` | دليل الحي |
| `/history` | تاريخ الحي |
| `/stories` | قصص نجاح |
| `/403` | ممنوع |
| `/~offline` | PWA offline |

---

## 4. قاعدة البيانات (Supabase PostgreSQL)

### 4.1 الإحصاءات الحالية
- **Users**: 200 (موزّعين على 5 أحياء: 56/40/40/32/32)
- **Families**: 50 (موزّعين: 14/10/10/8/8)
- **Contributions**: 509 (58,660 درهم مؤكّدة)
- **Events**: 90+ فعالية
- **BlogPosts**: 60 مقالة
- **StoreItems**: 10 منتجات
- **FeatureFlags**: 91 flag عبر 12 فئة
- **SiteContent**: 43 عنصر CMS
- **ImageAssets**: 10 صور
- **AdSlots**: 7 مواضع
- **RoleDefinitions**: 8 أدوار
- **Districts**: 5 أحياء (كلها بأعضاء حقيقيون بعد v34.0)

### 4.2 النماذج (57 نموذج في 1619 سطر)
النماذج الأساسية: `User`, `Family`, `District`, `Contribution`, `FundRequest`, `Event`, `BlogPost`, `Group`, `StoreItem`, `StoreOrder`, `Service`, `Discussion`, `Initiative`, `MarketPrice`, `PriceReport`, `CndpRequest`, `Ad`, `AdSlot`, `Complaint`, `AuditLog`, `Setting`, `FeatureFlag`, `SiteContent`, `ImageAsset`

نماذج الإدمان (v3.0): `UserStreak`, `VariableReward`, `Challenge`, `UserChallenge`, `Badge`, `UserBadge`, `UserActivity`, `UserRelationship`, `SmartNotification`, `NotificationPreference`, `EngagementMetric`

نماذج التواصل: `DirectMessage`, `Discussion`, `DiscussionReply`, `Notification`, `EmailLog`

### 4.3 الاتصال
- **DATABASE_URL**: pgbouncer pooler (port 6543) — للاستعلامات العادية
- **DIRECT_URL**: direct connection (port 5432) — للـ migrations
- **Supabase project**: `uigwfpddaawiwvsxmggj` (eu-west-2, London)

---

## 5. الـ Stack التقني

| المكون | التقنية | الإصدار |
|--------|---------|---------|
| Framework | Next.js (App Router) | 16 |
| Language | TypeScript | 5 |
| ORM | Prisma | 6.19.2 |
| Database | PostgreSQL (Supabase) | — |
| Auth | NextAuth.js | v4 |
| Styling | Tailwind CSS | 4 |
| UI Library | shadcn/ui (New York) | — |
| Icons | lucide-react | 0.525.0 |
| Charts | Recharts | 2.15.4 |
| Animations | Framer Motion | — |
| Map | MapLibre GL JS | 4.7.1 (UMD, local) |
| Editor | TipTap | — |
| Fonts | Tajawal + IBM Plex Sans Arabic | local (@fontsource) |

---

## 6. قواعد التصميم (DESIGN.md — ملخّص)

### ❌ محظور (Anti-AI-Slop)
- Inter / Roboto / Arial / system-ui
- تدرّج بنفسجي على خلفية بيضاء
- 3+ بطاقات متطابقة في صف واحد (use Bento Grid)
- `text-center` على قسم كامل
- emoji في TSX (use Lucide icons)
- `fade-up` على كل عنصر
- `rounded-full` على البطاقات
- Hero → features → CTA متوقّعة

### ✅ مطلوب
- Bento Grid (12-col، varied col-span)
- typography هرمي: Display (clamp 2-5rem) + Heading + Body (1.7)
- مسافات سخية: 24/32/48/64/96
- ألوان: 1 primary `#E85A3D` + 1 accent `#F5B220` + neutrals
- RTL كامل (`dir="rtl"`, `ms-`/`me-`)
- WCAG 2.2 AA
- `prefers-reduced-motion` محترم
- أهداف لمس ≥ 44px
- Skeletons بدل spinners

---

## 7. البيانات الإنتاجية (Production)

- **URL**: https://assema-sultancontact-design.vercel.app
- **GitHub**: github.com/sultancontact-design/assema
- **Vercel Project ID**: prj_NjOAY42zdv2zHD4UYD4GrFhxkrSU
- **Supabase**: uigwfpddaawiwvsxmggj (eu-west-2, London)
- **Admin credentials**: `admin@syba-community.ma` / `Demo@1234`
- **Auto-deploy**: push to `main` → Vercel build (~100s)

---

## 8. الـ APIs المهمة

### APIs عمومية (بدون auth)
- `GET /api/public/stats` — إحصاءات حيّة (families + contributions + events + total)
- `GET /api/public/activity-feed` — آخر 10 أنشطة عمومية
- `GET /api/public/content` — محتوى CMS

### APIs تتطلب auth
- `GET /api/admin/dashboard` — 18 KPI sections + security
- `GET /api/admin/analytics` — kpis + retentionCurve + engagementByMonth + featureUsage + notificationsByType
- `GET /api/store/items` — قائمة المنتجات
- `POST /api/store/items/[id]/purchase` — شراء منتج بالنقاط

---

## 9. إجراءات الحماية

### 9.1 قبل أي تغيير
1. اقرأ هذا الملف كاملاً
2. اقرأ `DESIGN.md` و `CLAUDE.md`
3. تحقّق من `worklog.md` لآخر الإنجازات
4. لا تُحذف أي ملف من القسم 2

### 9.2 قبل الـ commit
1. `bun run lint` — يجب أن يمرّ (0 errors)
2. تحقّق من `git status` — لا ملفات غير متوقّعة
3. لا تُضِف `tool-results/` أو `awesome-skills/` (في .gitignore)

### 9.3 بعد النشر
1. انتظر 100s للاكتمال البناء
2. `curl -sI <url>` — يجب HTTP 200
3. استخدم Agent Browser + VLM للتحقّق البصري
4. سجّل النتيجة في `worklog.md`

### 9.4 في حالة system reset
1. لا تفزع — البيانات في Supabase (PostgreSQL) محفوظة
2. الكود في GitHub (commit `215a139` أو أحدث)
3. المهارات في `.agents/skills/` (12 SKILL.md)
4. الـ DESIGN.md + CLAUDE.md محفوظة
5. أعد بناء من آخر commit معروف

---

## 10. الإنجازات الرئيسية بالصور (screenshots)

| الإصدار | اللقطة | الوصف |
|---------|--------|-------|
| v35.3 | `/tmp/v35-3-fund.png` | Fund Hero + Bento balance card |
| v35.3 | `/tmp/v35-3-events.png` | Events Hero + Bento featured card |
| v35.3 | `/tmp/v35-3-store.png` | Store Hero + Bento products |
| v35.3 | `/tmp/v35-3-services.png` | Services Hero + Bento + Lucide icons |
| v35.2 | `/tmp/v35-2-contributions.png` | Contributions Bento (featured large) |
| v35.2 | `/tmp/v35-2-blog-focused.png` | StoriesBento (featured 2×2) |
| v35.1 | `/tmp/v35-1-dashboard-final.png` | Dashboard Kiranism (4 KPI + 4 charts) |
| v35.0 | `/tmp/v35-hero-new.png` | Hero غير متمركز + KPI card حيّة |
| v34.0 | `/tmp/map-v34-final.png` | Map with French labels + ESRI satellite |

---

## 11. المهام المُعلّقة (Pending)

- [ ] **المهمة 2 من v35.3**: تثبيت Aceternity/Magic UI (npx shadcn add — يتطلّب network)
- [ ] **المهمة 4 من v35.3**: تطبيق DESIGN.md على `/blog` (Bento للمقالات)
- [ ] **المهمة 5 من v35.3**: لقطات BEFORE/AFTER منظّمة
- [ ] CMS: 43 عنصر (المطلوب 200+)
- [ ] Ticker: 30 emoji (activity feed items)
- [ ] Ethics page: ما زالت بحالة v27 (لها لغة "تحذير")

---

## 12. التحذيرات النهائية

> ⚠️ **لا تُجرِب `bun run build` محلياً** — البناء يتطلّب Vercel environment (Supabase pooler + AdSense + CRON_SECRET).
> ⚠️ **z-ai-web-dev-sdk MUST be backend only** — لا تستخدمه في client components.
> ⚠️ **لا تستخدم `http://localhost:3000`** في الإرشادات — استخدم Preview Panel فقط.
> ⚠️ **البوابة (Caddy gateway)**: أي API لـ port آخر استخدم `?XTransformPort=NNNN` (لا تكتب الـ port في URL).
> ⚠️ **MapLibre v6 ESM-only** — استخدم v4.7.1 UMD (محفوظ في `public/vendor/`).

---

**آخر تحديث**: v36.0 — 2026-09-26
**آخر commit**: `215a139` (v35.3)
**الحالة**: ✅ المنصة تعمل بكامل طاقتها (102 صفحة + 57 نموذج + 12 مهارة تصميم)
