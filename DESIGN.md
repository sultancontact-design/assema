# DESIGN.md — سيدي يوسف بن علي العاصمة

## الهوية
منصة اجتماعية مغربية للحي. اللغة: عربية RTL. الطابع: تضامني، دافئ، احترافي.

## الألوان (CSS Variables — semantic tokens)
--primary: 15 85% 55%       /* #E85A3D برتقالي مراكش */
--secondary: 155 60% 40%   /* #299B6D أخضر زمردي */
--accent: 42 95% 55%       /* #F5B220 ذهبي دافئ */
--background: 35 40% 98%   /* #FBF8F3 كريمي */
--foreground: 20 20% 12%   /* #1F1A17 بني عميق */

## قواعد صارمة (لا استثناءات)
❌ لا Inter / Roboto / Arial
❌ لا purple gradients on white
❌ لا 3+ feature cards متماثلة في صف واحد
❌ لا rounded-full على البطاقات
❌ لا كل شيء متمركز
❌ لا fade-in عاملي على كل عنصر
❌ لا glassmorphism عشوائي (فقط للأعلى: header, modal)
❌ لا إيموجي كأيقونات رئيسية (استخدم Lucide أو صور حقيقية)

## قواعد إيجابية
✅ Typography هرمي: display (clamp 3-6rem) + heading + body
✅ مسافات سخية: 24/32/48/64/96
✅ ألوان: 1 primary + 1 accent + neutrals
✅ واقعية: أرقام حقيقية، محتوى عربي أصيل
✅ Accessibility: WCAG 2.2 AA
✅ RTL كامل من اليوم الأول
✅ Glassmorphism فقط للأعلى (header، modal)
✅ صور فوتوغرافية حقيقية (Unsplash) بدل إيموجي

## Typography
- Display: Tajawal 700-800 (clamp 3-6rem، letter-spacing -0.02em)
- Heading: Cairo 600-700
- Body: IBM Plex Arabic 400 (1.6 line-height)
- Mono: JetBrains Mono (للأرقام)

## Layout
- Container: max-w-[1400px] mx-auto px-4 lg:px-8
- Grid: 1 / 2 / 3 / 4 أعمدة حسب الشاشة
- Spacing: Tailwind scale (4px base)

## مكونات محظورة
- "3 feature cards in a row" — استخدم bento grid
- "centered hero with gradient" — استخدم split hero بصورة
- "card with icon + title + desc" — استخدم بطاقات غنية بصور
- "emoji as primary icon" — استخدم Lucide SVG أو صور حقيقية
