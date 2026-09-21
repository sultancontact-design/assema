# Task 7d — Events Detail Builder (full-stack-developer)

## Context
- **Project**: سيدي يوسف بن علي العاصمة — منصة المعروف الرقمي
- **Stack**: Next.js 16 App Router + TypeScript + Tailwind 4 + shadcn/ui + Prisma (SQLite)
- **Style**: Moroccan Modern (warm-shadow + ZelligeDivider + Tajawal)
- **RTL**: dir="rtl" lang="ar"
- **Auth**: `getCurrentUser()` from `@/lib/auth`
- **DB**: `db` from `@/lib/db`
- **Previous agents** (read before starting):
  - `0-Main.md` (worklog)
  - `4-admin-dashboard-builder.md`
  - `7b-1-admin-sections-builder-1.md`
  - `3-fund-module-builder.md`
  - `7c-fund-pdf-builder.md` (most recent — used same QR pattern + style)

## Task
بناء صفحة تفاصيل الفعالية + QR + تقييم + صفحة مسح QR للحضور

## Files Created (10 files / 2,886 lines)

### Library
- `src/lib/qr-code.ts` (57 lines) — QR generator helper using `qrcode` library
  - `generateQrCodeDataUrl(text, opts?)` → base64 PNG data URL
  - `generateQrCodeSvg(text, opts?)` → SVG string
  - Both graceful on error (return "")

### Client Components
- `src/components/community/event-rating.tsx` (211 lines)
  - 5-star rating with hover + click + keyboard (radio group)
  - Textarea (max 500 chars with counter)
  - Switch for "anonymous rating"
  - Submit button → POST /api/community/events/[id]/rate
  - After submit: shows "شكراً على تقييمك!" card with framer-motion
- `src/components/community/event-detail-client.tsx` (356 lines)
  - Renders 4 states: registered (ticket card + cancel button), can-register (CTA), seats-full (warning), registration-closed
  - Ticket card: title, date, location, ticketCode, QR image, status badge
  - Print ticket button (`window.print()`)
  - Save QR PNG button (data URL → blob download)
  - Cancel registration button with AlertDialog confirm
  - All fetches to relative URLs, sonner toast feedback
- `src/components/admin/event-scan-client.tsx` (595 lines)
  - 2 tabs: "إدخال يدوي" (text input + Enter key submits) + "تتبّع الحضور" (filterable list)
  - 3 stat boxes: total registered / attended / remaining
  - ScanResultCard: 4 visual states (success/already/not_found/error) with motion
  - Filter list by name OR ticketCode (case-insensitive)
  - Avatar + Badge per attendee (REGISTERED blue, ATTENDED emerald)
  - Updates the list in-place after each scan
- `src/components/community/event-rating.tsx` (211 lines) — described above

### Server Components
- `src/app/community/events/[id]/page.tsx` (848 lines)
  - Hero: cover image or gradient+emoji, title, type badge, status badge, dates, location, organizer
  - Description: split by `\n` into paragraphs (prose-slate)
  - Map: uses `event.locationMapSvg` if present (dangerouslySetInnerHTML), else DefaultMap SVG with pin
  - Stats: 4 StatCards (max/registered/attended/remaining) + Progress bar
  - Action buttons + Ticket card via EventDetailClient
  - Registrations table (visible to staff only, max-h-96 + custom-scrollbar + sticky header)
  - Gallery grid (if event completed + galleryImages JSON parsed)
  - Rating section: average rating + EventRating form + list of comments
  - ZelligeDivider between sections
- `src/app/admin/events/scan/page.tsx` (89 lines)
  - Auth + role check (handled by admin/layout.tsx)
  - Fetches open events (PUBLISHED+ONGOING) in user's district
  - Fetches recent registrations (200) for those events
  - Passes to EventScanClient

### API Routes
- `POST /api/community/events/[id]/register` (223 lines)
  - Auth required + same district check
  - Validates: event exists, registration open, PUBLISHED/ONGOING status
  - Prevents duplicate (409 with existing ticketCode)
  - Checks maxAttendees (400 if full)
  - Generates ticketCode: `EV-{YYYY}-{NNN}` (sequential per year)
  - qrCode = ticketCode (frontend renders as QR image)
  - **Revives CANCELLED registration** (preserves @@unique(eventId, userId) constraint)
  - Creates Notification to organizer + AuditLog (event.registration.created)
  - 201 + { registration, ticketCode }
- `POST /api/community/events/[id]/cancel` (109 lines)
  - Auth required
  - Finds active registration (REGISTERED or ATTENDED)
  - 400 if ATTENDED (cannot cancel after attendance)
  - 404 if no active registration
  - Sets status=CANCELLED + AuditLog (event.registration.cancelled, severity=warning)
  - 200 + { success, message }
- `POST /api/community/events/[id]/rate` (154 lines)
  - Auth required
  - Body: { rating: 1-5, comment?: string, anonymous?: boolean }
  - Validates: event exists, COMPLETED status, user has ATTENDED registration
  - Prevents duplicate rating (409 if AuditLog exists for same user+event)
  - Stores as AuditLog: action=event.rated, entity=Event, entityId, metadata=JSON({rating, comment, anonymous, ticketCode})
  - 201 + { success, ratingId, rating }
- `POST /api/admin/events/scan` (244 lines)
  - Auth required + hasPermission(event.manage-registrations) OR is event organizer
  - Body: { ticketCode }
  - Searches by exact match (case-insensitive in SQLite via toUpperCase) + fallback by qrCode
  - 404 if not found, 400 if empty, 403 if cross-district or no permission
  - 409 + attendee info if already ATTENDED (so admin can see who)
  - Updates status=ATTENDED, attendedAt=now
  - Creates Notification to attendee + AuditLog (event.attendance.marked)
  - 200 + { attendee, event, registration }

## Lint Result
- ✅ ESLint: 0 errors, 0 warnings (clean exit 0)
- Removed 4 unused eslint-disable directives (no-img-element / no-danger) after ESLint flagged them as unused

## Verification Tests (curl + NextAuth cookies)

### Page Tests
| Test | URL | Result |
|------|-----|--------|
| Event detail page (authenticated) | GET /community/events/cmuaspzm7018solyt1fjq7h3u | 200 OK, 369,005 bytes |
| Event detail page (unauth) | same | 307 redirect to /login |
| Admin scan page (authenticated) | GET /admin/events/scan | 200 OK, 90,100 bytes |
| Non-existent event | GET /community/events/nonexistent | 404 |
| Completed event page (rating section) | GET /community/events/cmuaspzo901ecolyt19hhc2eu | 200 OK, contains "متوسط التقييم", "أرسل التقييم" |

### API Tests
| Test | Method | URL | Body | Expected | Got |
|------|--------|-----|------|----------|-----|
| Register (unauth) | POST | /api/community/events/[id]/register | {} | 401 | 401 ✓ |
| Register (auth) | POST | ... | {} | 201 | 201 + {ticketCode: "EV-2026-001"} ✓ |
| Register (duplicate) | POST | ... | {} | 409 | 409 + "أنت مسجّل..." ✓ |
| Cancel (REGISTERED → CANCELLED) | POST | /api/community/events/[id]/cancel | {} | 200 | 200 + "تم إلغاء التسجيل" ✓ |
| Cancel (no active reg) | POST | ... | {} | 404 | 404 + "لا يوجد تسجيل نشط لإلغائه" ✓ |
| Re-register (revive CANCELLED) | POST | ... | {} | 201 | 201 + {ticketCode: "EV-2026-002"} (new!) ✓ |
| Scan (unauth) | POST | /api/admin/events/scan | {ticketCode:"EV-2024-001"} | 401 | 401 ✓ |
| Scan (valid) | POST | ... | {ticketCode:"EV-2024-001"} | 200 | 200 + {attendee: "فاطمة الرامي", status: ATTENDED} ✓ |
| Scan (already attended) | POST | ... | same | 409 | 409 + "تم تسجيل الحضور مسبقاً" + attendee ✓ |
| Scan (not found) | POST | ... | {ticketCode:"EV-9999-999"} | 404 | 404 + "لا توجد تذكرة..." ✓ |
| Scan (empty) | POST | ... | {} | 400 | 400 + "رقم التذكرة مطلوب" ✓ |
| Cancel after ATTENDED | POST | /api/community/events/[id]/cancel | {} | 400 | 400 + "لا يمكن إلغاء التسجيل بعد تسجيل الحضور" ✓ |
| Rate (PUBLISHED event) | POST | /api/community/events/[id]/rate | {rating:5} | 400 | 400 + "لا يمكن تقييم فعالية لم تكتمل بعد" ✓ |
| Rate (invalid 0) | POST | ... | {rating:0} | 400 | 400 + "التقييم يجب أن يكون عدداً صحيحاً بين 1 و 5" ✓ |
| Rate (invalid 6) | POST | ... | {rating:6} | 400 | 400 + same ✓ |
| Rate (unauth) | POST | ... | {rating:5} | 401 | 401 ✓ |
| Rate (COMPLETED + ATTENDED) | POST | /api/community/events/cm...qafela/rate | {rating:5,comment:"فعالية رائعة..."} | 201 | 201 + {ratingId, rating} ✓ |
| Rate (duplicate) | POST | ... | {rating:4} | 409 | 409 + "سبق وأن أرسلت تقييماً..." ✓ |

### QR Library Test
- `generateQrCodeDataUrl("EV-2024-001")` → `data:image/png;base64,iVBORw0KGgoAAAANSU...` (1,814 bytes) ✓
- `generateQrCodeSvg("EV-2024-001")` → `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" ...` (918 bytes) ✓
- `generateQrCodeDataUrl("")` → `""` (graceful on empty input) ✓

## DB Restoration After Tests
- Deleted admin's test registration (id=cmuat5sil0003olb3xn9c6wxy)
- Restored فاطمة الرامي's registration (EV-2024-001) to REGISTERED, attendedAt=null
- Deleted 1 test rating audit log (event.rated)
- Deleted 5 test audit logs (2 register + 1 cancel + 2 attendance.marked)
- Deleted 4 test notifications (organizer + attendee)

## Key Decisions
1. **Removed `motion.section` from server component** — framer-motion `createMotionComponent()` cannot be called from a server component. Kept motion in client components (EventDetailClient, EventRating, EventScanClient).
2. **Stored ratings in AuditLog** (not a separate Rating model) — per task spec. action=`event.rated`, entity=`Event`, entityId=eventId, metadata=JSON({rating, comment, anonymous, ticketCode}). Page reads them with `db.auditLog.findMany({ where: { action: "event.rated", entity: "Event", entityId } })`.
3. **Revived CANCELLED registrations** instead of creating new rows — Prisma's @@unique([eventId, userId]) constraint prevents duplicate rows. Updated existing row with new ticketCode + qrCode + status=REGISTERED.
4. **qrCode field = ticketCode** (same value) — per spec, frontend renders the string as a QR image via `generateQrCodeDataUrl`. This allows the scan API to search by either qrCode or ticketCode.
5. **Generated ticketCode as `EV-{YYYY}-{NNN}`** — counts all registrations whose ticketCode starts with `EV-{year}-` and adds 1. Year from `new Date().getFullYear()`. So in 2026 → "EV-2026-001".
6. **Scan API returns 409 + attendee info** when already attended (not just error message) — so admin/staff can verify who already scanned in.
7. **Used AlertDialog** (not regular Dialog) for cancel confirmation — semantically appropriate for destructive action.
8. **DefaultMap SVG** is a simple inline SVG (gradient bg + grid + roads + a pin marker) when event has no `locationMapSvg`. Renders location text at the bottom.
9. **DangerouslySetInnerHTML for `event.locationMapSvg`** — admin can provide custom SVG (safe since only staff with `event.edit` permission can set it).
10. **Prose-slate for description** — split by `\n` into paragraphs for natural formatting. Used `prose` class for future-proofing if markdown is added.

## Stage Summary
- ✅ 10 files created (~2,886 lines total)
- ✅ ESLint clean (0 errors, 0 warnings)
- ✅ All Arabic text, RTL from line 1, logical properties (ps-/pe-/ms-/me-)
- ✅ Moroccan Modern style: warm-shadow on cards, ZelligeDivider between sections (4 variants: diamond/wave/stars/minimal)
- ✅ Touch targets: h-11/h-12 for primary buttons, h-10 for secondary
- ✅ Custom scrollbar on tables (max-h-96 overflow-y-auto + custom-scrollbar)
- ✅ shadcn/ui components: Card, Button, Badge, Progress, Avatar, Separator, AlertDialog, Tabs, Input, Textarea, Label, Switch
- ✅ sonner for toast notifications (success/error/warning)
- ✅ framer-motion for entrance animations on client components only
- ✅ QR rendering: server-side via generateQrCodeDataUrl, frontend via `<img src={dataUrl}>`
- ✅ Audit logs created for all mutations: event.registration.created/cancelled, event.attendance.marked, event.rated
- ✅ Notifications to organizer (on register) + attendee (on scan)
- ✅ DB restored to original state after all tests
- ✅ 17 API tests passed (401/404/400/409/200/201 as expected)
- ✅ 5 page tests passed (200/307/404)
- ✅ 3 QR library tests passed (dataUrl/svg/empty)
