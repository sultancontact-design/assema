# DESIGN.md — قواعد صارمة لا استثناءات

> v35.0 — مستخلصة من 7 مهارات تصميم (Anthropic frontend-design، design-taste-frontend، ui-ux-pro-max، podo/design-agent-skills، addyosmani-quality، color-expert، baseline-ui) + مرجع Kiranism dashboard.

## 1. الهوية (Subject Matter)

منصة اجتماعية مغربية تضامنية تُرقمن "المعروف المغربي" — تقاليد التكافل بين أسر الحي. الجمهور: ربّات البيوت، المسنّون، الشباب الحاسبي في حي سيدي يوسف بن علي بمراكش. الطابع: دافئ، احترافي، عصري، مُلتصق بالهوية المراكشية (زليج، طين، نحاس). لا يجوز أن يبدو كـ SaaS عام.

## 2. الألوان (semantic tokens — لا تكرار)

```css
--primary: 15 85% 55%;       /* #E85A3D برتقالي مراكش (طين محروق) */
--secondary: 155 60% 40%;    /* #299B6D أخضر زمردي (زليج) */
--accent: 42 95% 55%;         /* #F5B220 ذهبي دافئ (نحاس مصقول) */
--background: 35 40% 98%;     /* #FBF8F3 كريمي دافئ (ورق مراكشي) */
--foreground: 20 20% 12%;    /* #1F1A17 بني عميق */
--muted-foreground: 20 8% 45%; /* رمادي دافئ */
```

- لون رئيسي واحد (#E85A3D) + لون مساعد واحد (#F5B220) + محايدات. لا بنفسجي. لا أزرق SaaS.
- التدرّجات (gradient) مسموحة فقط على أزرار رئيسية بنفس نطاق الأساسي (primary→orange-600)، لا على النص العادي.

## 3. ❌ محظور (Anti-AI-Slop — من Anthropic frontend-design)

| المحظور | لماذا |
|---|---|
| Inter / Roboto / Arial / system-ui | خطوط عامة لا تحمل هوية |
| تدرّج بنفسجي على خلفية بيضاء | أخطر علامة AI slop |
| 3+ بطاقات ميزات متطابقة في صف واحد | شبكة منتظمة = قالب عام |
| توسيط كل شيء (`text-center` على كل قسم) | يفقد الإيقاع البصري |
| زجاج (glassmorphism) على كل بطاقة | فقط للـ header والـ modal |
| `fade-in` على كل عنصر | يضيّع التركيز |
| `rounded-full` على البطاقات | حواف حادة أكثر احترام للهوية |
| Blue-500 لكل شيء | لا أزرق في لوحتنا |
| `loading spinner` بلا نص | يبدو مكسوراً |
| بنية Hero → features → CTA متوقعة | علامة القوالب |
| عناوين ALL-CAPS مع حروف متباعدة | قالب AI سلوبي |
| تظليل كلمة واحدة في العنوان بلون آخر | قالب AI سلوبي |
| علامات `01 / 02 / 03` ما لم يكن تسلسلاً حقيقياً | زخرفة بلا معنى |
| emoji في النصوص والأزرار والعناوين | غير احترافي — استبدل بـ icons Lucide |

## 4. ✅ مطلوب

- اتجاه جمالي محدد قبل الكود (اختر: editorial / bento / brutalist — لا "clean modern")
- هرمية طباعة واضحة: Display (clamp 3-6rem) → Heading (1.5-3rem) → Body (1rem, line-height 1.7)
- مسافات سخية: 24/32/48/64/96 (لا 8/16 المزدحمة)
- ألوان مقتصدة: 1 primary + 1 accent + 4-5 neutrals
- Bento Grid (شبكة بأحجام متنوعة) بدل grid منتظم
- صور حقيقية للناس والأماكن (لا SVG cartoons)
- حركات هادفة فقط (تأكيد لحظة واحدة، لا fade-and-slide على كل قسم)
- Accessibility WCAG 2.2 AA (تباين 4.5:1 على الأقل)
- RTL كامل من البداية (`dir="rtl"` على html، `ms-`/`me-` بدل `ml-`/`mr-`)
- أهداف لمس ≥ 44px على الموبايل

## 5. Typography

| الدور | الخط | الأوزان | الحجم |
|---|---|---|---|
| Display (hero) | Tajawal | 800 | clamp(3rem, 6vw, 5rem) |
| Heading (H2/H3) | Tajawal | 700 | 1.5rem → 2.5rem |
| Body | IBM Plex Sans Arabic | 400 | 1rem, line-height 1.7 |
| Label/Caption | IBM Plex Sans Arabic | 500 | 0.75rem-0.875rem |
| Mono (data) | JetBrains Mono | 500 | للأرقام في الجداول |

- طول السطر أقل من 80 حرفاً (max-w-prose أو max-w-2xl)
- لا ALL-CAPS على labels عربية
- لا تظليل كلمة واحدة في العنوان — إما العنوان كله باللون الأساسي، أو عادي

## 6. Layout

- Container: `max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8`
- Bento Grid: `grid grid-cols-12 gap-4` مع أعمدة col-span متنوعة (3/4/6/8/9)
- Breakpoints: 640، 768، 1024، 1280، 1536
- Hero غير متمركز: محتوى في عمود واحد (60%) + عنصر بصري (40%) — لا text-center على القسم كله

## 7. Dashboard Rules (من Kiranism reference)

- **KPI Cards**: رقم ضخم (`text-3xl` → `text-4xl`) + label صغير + Badge اتجاه (+12.5% TrendingUp)
- **Charts**: Recharts + gradient fill + tooltips بالعربية
- **Sidebar**: collapsible + icons Lucide + badges للأعداد
- **Tables**: sortable + filterable + pagination (10/page)
- **Empty States**: illustration + CTA (لا "لا توجد بيانات")
- **Loading**: skeleton بنفس بنية المحتوى (لا spinner)
- **Page layout**: `flex flex-col gap-4` مع h2 `text-2xl font-bold` في الأعلى

## 8. Mobile

- أهداف لمس ≥ 44px (`min-h-11`)
- BottomNav (5 عناصر max) + زر "المزيد" → Sheet
- لا hover-dependent (كل action قابل للنقر)
- المحتوى في عمود واحد (لا grid 2 على الموبايل)
- Font sizes: أقل بـ 20% من desktop

## 9. Animations (من framer-motion-best-practices)

- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` أو spring (stiffness 300, damping 30)
- **Duration**: 200-400ms (لا 800ms على كل شيء)
- **الخصائص المُحوَّلة**: `transform` و `opacity` فقط — لا `width/height/margin`
- **prefers-reduced-motion**: احترامه (no parallax، no scale on scroll)
- **حركة واحدة منسّقة** عند تحميل الصفحة (لا fade-up على كل قسم)
- **Hover**: scale 1.02 على البطاقات (لا translateY -8px)
- **Page transition**: 200ms crossfade فقط

## 10. Components Inventory (المكتبات المثبتة)

### مهارات الوكيل (`.agents/skills/`)
- `frontend-design` (Anthropic official) — anti-AI-slop
- `design-taste-frontend` — DESIGN_VARIANCE=8, MOTION_INTENSITY=6, VISUAL_DENSITY=4
- `ui-ux-pro-max` — 50 styles + 97 palettes + 57 font pairings
- `brand-design-md` — brand systems
- `color-expert` — color theory
- `addyosmani-quality` — web performance
- `baseline-ui` — component baseline
- `claude-wireframe-skill` — wireframe-first
- `accessibility-agents` — WCAG 2.2
- `content-strategy` — content design
- `ai-graphic-design-skill` — graphic design
- `brand-guidelines` (Anthropic) — brand guardrails

### مراجع Dashboard
- `Kiranism/next-shadcn-dashboard-starter` (6k+ stars) — نموذج كامل
- `shadcn/ui blocks` — dashboard-01 (Sidebar + Datatable + Area Chart + Section Cards)

### مكتبات UI
- shadcn/ui (New York style) — الأساس
- Lucide icons — أيقونات SVG
- Recharts — رسوم بيانية
- Framer Motion — حركات

## 11. Quality Gates (قبل النشر)

- [ ] لا emoji في أي ملف TSX جديد
- [ ] لا `text-center` على قسم كامل (فقط عناصر محددة)
- [ ] لا 3 بطاقات متطابقة بنفس `sm:grid-cols-3` (استخدم bento متنوع)
- [ ] لا تدرّج بنفسجي/أزرق على خلفية بيضاء
- [ ] أهداف لمس ≥ 44px على الموبايل
- [ ] `prefers-reduced-motion` محترم
- [ ] تباين لون النص ≥ 4.5:1
- [ ] `alt` على كل صورة
- [ ] `aria-label` على كل زر بلا نص
- [ ]骨架 (skeleton) بدل spinner في أقسام Suspense

## 12. القرارات الحاسمة لهذا المشروع

- **نمط Hero**: Editorial Bento — عنوان كبير يسار + بطاقة إحصاء حيّة يمين (RTL: العنوان يمين، البطاقة يسار)
- **نمط أقسام المعاينة**: Bento Grid 12-أعمدة (بطاقة كبيرة 8 أعمدة + بطاقات صغيرة 4 أعمدة)
- **نمط المبادئ الخمسة**: قائمة عمودية مع أرقام كبيرة (1-5) لأنها **تسلسل** فعلي
- **نمط باقات الإعلانات**: بطاقة واحدة بارزة (الذهبية) + بطاقات أصغر جنباً (لا 4 متطابقة)
- **نمط الإحصاءات الحيّة**: رقم ضخم + label + اتجاه (نمط Kiranism KPI)
