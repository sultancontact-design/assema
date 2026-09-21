# Task ID: 7c — Fund PDF Builder

## Summary
أكملتُ وحدة صندوق المعروف الكاملة بإضافة 4 صفحات + 4 مكوّنات PDF + 4 APIs:

### Pages (4)
- `/community/fund/statement` — كشف حساب الأسرة (transactions table + LineChart + year filter)
- `/community/fund/receipt/[id]` — الإيصال الرقمي (QR + Moroccan arch + PDF/Share buttons)
- `/community/fund/requests/[id]` — تتبّع طلب (WorkflowTimeline + approvals + audit trail)
- `/community/fund/reports` — تقارير دورية (Tabs: daily/weekly/monthly/yearly + custom range + CSV/PDF export)

### PDF Components (4) — in src/lib/pdf/
- `fund-statement-pdf.tsx` — كشف حساب الأسرة (معاملات + رصيد + سلسلة شهرية)
- `fund-receipt-pdf.tsx` — إيصال رقمي (UUID + QR + مبلغ كبير)
- `fund-request-pdf.tsx` — تتبّع طلب (anonymousCode + approvals + audit trail)
- `fund-periodic-report-pdf.tsx` — تقرير دوري (5 KPIs + transactions + monthly series)

### API Routes (4) — in src/app/api/fund/
- `GET /api/fund/statement/pdf?year=YYYY` — auth + familyId required
- `GET /api/fund/receipt/[id]/pdf` — auth + owner or TREASURER/SUPER_ADMIN
- `GET /api/fund/requests/[id]/pdf` — auth + owner or staff
- `GET /api/fund/reports/[period]/pdf?from=&to=` — auth + hasPermission(fund.report.view)

## Stats
- 16 ملفاً جديداً (~4,880 سطر إجمالي)
- ESLint: نظيف 100% (0 errors, 0 warnings)
- 9 PDFs مُولَّدة فعليّة بحجم 17,041 – 28,718 بايت، PDF v1.3، 1-3 صفحة
- كل APIs الـ4: 401 بدون مصادقة، 200 بعد المصادقة، 400 للأخطاء المتوقّعة

## Key technical decisions
1. **Content-Disposition RFC 5987**: `filename="ascii-fallback.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}` لتجنّب خطأ ByteString في الأسماء العربية
2. **بدلاً من `include: { reviewedBy: {...} }`**: استعملت `db.user.findUnique({ where: { id: request.reviewedById } })` لأن المخطّط لا يحوي علاقات named لـreviewedBy/disbursedBy
3. **FUND_REQUEST_STATUS_LABELS**: يُرجع كائناً `{label, color, step}` — استعملت `.label` بدل القيمة المباشرة
4. **QR Code**: استعملت `qrcode` lib بـ`toDataURL` → data:image/png;base64 → `<img>` في الصفحة + `<Image>` في PDF
5. **WorkflowTimeline**: 5 خطوات أفقية + معالجة REJECTED منفصلة (بطاقة حمراء)
6. **framer-motion**: motion.div بـinitial/animate على بطاقات الإحصاءات (stagger 0.05s)
7. **recharts**: LineChart للرصيد الشهري + LineChart للمساهمات vs الصرف
8. **xlsx**: تصدير CSV مباشرة في fund-reports-client لكل تبويب

## Workflow
1. Server page يجمع البيانات عبر Prisma + يبني transactions + يمرّر لـClient component
2. Client component يعرض UI + Tabs + Charts + أزرار تنزيل
3. التنزيل: `fetch(url) → blob → a.download` (تفادي CORS)
4. PDF APIs: `renderToBuffer(React.createElement(Document, { data }))` → Response مع Content-Type: application/pdf

## All routes verified
- ✅ 4 صفحات: 200 OK بعد الـlogin
- ✅ 4 APIs: 200 + application/pdf + size > 0 بعد المصادقة
- ✅ 4 APIs: 401 بدون مصادقة
- ✅ فلترة سنة statement + نطاق تاريخ reports يعملان
- ✅ 400 لفترة غير صالحة (invalid period)
