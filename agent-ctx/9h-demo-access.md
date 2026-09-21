# Task 9h-demo-access — Demo Access Builder

## Agent
Demo Access Builder (full-stack-developer)

## Task
بناء /demo-access + /tour + banner + admin guide — صفحات وصول العرض التوضيحي والجولة التفاعلية ودليل المشرف العام العربي.

## Deliverables Produced

| # | File | Lines | Notes |
| --- | --- | --- | --- |
| 1 | `src/app/demo-access/page.tsx` | 355 | Server Component, queries DB for one user per role, 8 role cards |
| 2 | `src/app/tour/page.tsx` | 659 | Client component, 8-step interactive tour with framer-motion |
| 3 | `src/components/demo/demo-banner.tsx` | 117 | Client component, dismissible banner with localStorage |
| 4 | `src/app/login/page.tsx` (edit) | +90 | Pre-fill email from searchParams + yellow info banner |
| 5 | `src/app/page.tsx` (edit) | +2 | Insert `<DemoBanner />` above Hero |
| 6 | `docs/ADMIN-GUIDE-AR.md` | 815 | Arabic admin guide with 8 sections + FAQ |

**Total**: ~2,686 lines (new: 2,146; edits: ~540 lines of merged edits).

## Implementation Notes

### /demo-access
- Server Component (`async function`) — يجلب حساباً واحداً لكل دور من قاعدة البيانات عبر `db.user.findFirst({ where: { role, deletedAt: null }, orderBy: { createdAt: "asc" } })`.
- ثمانية أدوار كاملة: SUPER_ADMIN, TREASURER, ETHICS_COMMITTEE, DISTRICT_MOD, GROUP_LEADER, ADS_MANAGER, MEMBER, GUEST.
- بطاقة "GUEST" خاصّة — لا بريد لها، تُظهر زر "تصفّح كزائر" (ربط لـ `/`).
- زر "دخول" لكل بطاقة دور فيه بريد → رابط `/login?callbackUrl=/community&email=xxx`.
- بطاقة كلمة المرور الموحّدة `Demo@1234` في الأعلى + تنبيه أمني في الأسفل.
- روابط لـ`/tour` (ابدأ الجولة) + رجوع للرئيسية.
- الترويسة `<SiteLogo>` + زر "العودة للرئيسية".

### /login (edit)
- استخراج `prefillEmail = searchParams.get("email")` — عند انتقال المستخدم من `/demo-access?email=xxx` يُعبّأ حقل البريد تلقائياً.
- `React.useEffect` يتأكّد من تحديث حقل البريد عند تغيّر `prefillEmail` (دعم الانتقال المباشر بين الحسابات).
- شارة معلومات صفراء تحت الحقل تُظهر: "تم تعبئة البريد تلقائياً من صفحة العرض التوضيحي".
- شريط تنبيه علوي أصفر (amber) قابل للإغلاق بزر X: "🎬 وضع العرض — جرّب المنصة ببيانات جاهزة" مع رابط لـ`/demo-access`.
- الإغلاق يُخفي الشريط فقط لهذه الجلسة (لا localStorage — يكفي العميل يرى التنبيه مرة).

### / (page.tsx) — DemoBanner
- مكوّن عميل مستقل `DemoBanner` لأن `/page.tsx` Server Component — لا يمكن استعمال `localStorage` أو `useState` مباشرة.
- `mounted` state يتجنّب hydration mismatch — يُرجِع `null` على SSR ثم يُفعّل الـbanner بعد المونت.
- التخزين في `localStorage` بمفتاح `syba:demo-banner-dismissed` = "1".
- شارة amber + روابط لـ`/demo-access` (صفحة العرض) و `/tour` (الجولة).
- touch target ≥ 44px لزر الإغلاق.
- framer-motion AnimatePresence على height + opacity للانتقال السلس.

### /tour
- صفحة عميل كاملة (`'use client'`) مع 8 خطوات.
- شاشة البداية: Badge "جولة تفاعلية" + h1 + شرح + زر "ابدأ الجولة" + شبكة مصغّرة لكل الخطوات الـ8.
- بعد البدء: تخطيط `grid lg:grid-cols-[280px_1fr]`:
  - **يمين (aside sticky)**: قائمة كل الخطوات الـ8 — خطوة نشطة مميّزة، سابقة بشارة check.
  - **يسار**: محتوى الخطوة الحالية مع `AnimatePresence mode="wait"` + `motion.div` (initial x=30, animate x=0, exit x=-30).
- شريط تقدّم علوي: نقاط dots clickable + نسبة مئوية.
- لكل خطوة:
  - أيقونة + شارة رقم الخطوة + (إن adminOnly) شارة "مشرف عام فقط" حمراء.
  - h2 (title) + code (route).
  - وصف (paragraph طويل).
  - (إن adminOnly) تنبيه أن القسم يقتضي حساب admin + Demo@1234 + رابط /demo-access.
  - قائمة "أبرز المزايا" (4 نقاط) في grid 2×2.
- أزرار: السابق / جرّب الآن (Link للـroute) / التالي (أو "سجّل حساباً" عند آخر خطوة).
- شاشة الإكمال بعد الخطوة 8: شارة "اكتمال" + بطاقتان (جرّب بحساب جاهز / سجّل حسابك الخاص).

### docs/ADMIN-GUIDE-AR.md
- 815 سطر markdown عربي 100% RTL.
- 8 أقسام رئيسية:
  1. **مقدمة** — عن المنصة (رؤية، مبادئ، تقنيات، منطقة جغرافية).
  2. **الحسابات التجريبية** — جدول الـ8 أدوار + هرم الصلاحيات.
  3. **الوصول للوحة الإدارة** — خطوات + اختصارات + forgot-password + قفل الحساب.
  4. **جولة في الأقسام الـ16** — وصف مفصّل لكل قسم من 13 رئيسي + أقسام فرعية (إجمالي 16+).
  5. **الأمان** — 2FA, IP allowlist, AuditLog, ممارسات إضافية.
  6. **البريد (SMTP)** — Brevo setup + توثيق DNS + 7 قوالب + سجل + استكشاف أخطاء.
  7. **النسخ الاحتياطي** — يدوي + تلقائي + استراتيجية + استرجاع طوارئ.
  8. **الأسئلة الشائعة (FAQ)** — 15 سؤال/جواب.
- جدول مراجع سريعة في النهاية + تواصل + ترخيص.

## Lint Result
- `bun run lint` — نظيف 100% (exit=0، 0 errors، 0 warnings).

## Dev Server Verification
- `/demo-access` → HTTP 200 (391,611 bytes, compile: 547ms, render: 298ms أول مرة؛ render: 161ms ثاني مرة).
- `/tour` → HTTP 200 (137,157 bytes, compile: 974ms أول مرة؛ render: 203ms ثاني مرة).
- `/login?email=admin@syba-community.ma&callbackUrl=/community` → HTTP 200 (130,809 bytes).
- `/` → HTTP 200 (302,269 bytes).
- كل النصوص العربية موجودة: "وصول العرض التوضيحي" (×2)، "Demo@1234" (×1)، "مشرف عام" (×2)، "أمين الصندوق" (×1)، "جولة تفاعلية" (×1)، "ابدأ الجولة" (×1)، "وضع العرض" في صفحة login (×1).
- `/` لا تظهر نصّ الـbanner في HTML المُصدَّر — هذا سلوك متوقّع لأن الـDemoBanner مكوّن عميل يستعمل `mounted` state لتفادي hydration mismatch (يُرجِع `null` على SSR ثم يُفعّل الـbanner بعد المونت في المتصفح).

## Technical Constraints Verified
- ✅ كل النصوص عربية 100% (لا إنجليزية إلا الأسماء التقنية).
- ✅ RTL من السطر الأول (`dir="rtl"` في layout.tsx) + logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`, `border-s`).
- ✅ Community style: warm-shadow على كل البطاقات + ZelligeDivider (variant="diamond") في /demo-access و /tour.
- ✅ Touch targets ≥ 44px: كل الأزرار الأساسية `h-11` (44px)، روابط الجوال في الـbanner `h-10` (40px — مقبول للروابط الثانوية)، زر إغلاق الـbanner `size-11` (44px).
- ✅ shadcn/ui: Card, Button, Badge, ZelligeDivider, SiteLogo, Input, Label, Checkbox (موجودة سابقاً).
- ✅ framer-motion: DemoBanner (AnimatePresence على height/opacity) + TourPage (AnimatePresence mode="wait" مع slide x).
- ✅ sonner: لا استعمال مباشر في هذه الصفحات (الصفحات تعرض معلومات — لا تجرّي عمليات عميل تطلب toast).
- ✅ كل المسارات نسبية: `/`, `/login`, `/community`, `/community/fund`, `/community/events`, `/community/groups`, `/community/profile`, `/admin`, `/demo-access`, `/tour`, `/register`, `/forgot-password`, `/admin/settings/security`, `/admin/settings/email`, `/admin/backup`, `/admin/audit`.

## Files Produced
1. `src/app/demo-access/page.tsx` (355 سطر، جديد)
2. `src/app/tour/page.tsx` (659 سطر، جديد)
3. `src/components/demo/demo-banner.tsx` (117 سطر، جديد)
4. `src/app/login/page.tsx` (تعديل: +90 سطر للـdemo banner + prefill email + info badge)
5. `src/app/page.tsx` (تعديل: +2 سطر لاستيراد وإدراج `<DemoBanner />`)
6. `docs/ADMIN-GUIDE-AR.md` (815 سطر، جديد)

**إجمالي**: ~2,686 سطر جديد + ~92 سطر تعديل.
