# Task 4 — Admin Dashboard Builder

**Agent:** full-stack-developer
**Task:** بناء لوحة السوبر أدمن (5 صفحات + 1 layout + 1 sidebar + 1 API)

## Files Created (4,800 lines total)

### Layout & Shell
- `src/app/admin/layout.tsx` (51) — Server component, auth + role check (SUPER_ADMIN/TREASURER/ETHICS_COMMITTEE/DISTRICT_MOD), redirects to /login if no user, to /community if wrong role
- `src/components/admin/admin-shell.tsx` (475) — 'use client'. Sidebar (right in RTL) + Topbar (sticky, breadcrumb + theme toggle + bell + user dropdown) + main content. Mobile: sidebar collapses to Sheet on right side. 10 sidebar links with lucide icons (LayoutDashboard, Users, Users2, HeartHandshake, CalendarDays, MessageSquareWarning, Megaphone, BarChart3, History, Settings). Active link: bg-muted text-foreground, accent dot. Logout via signOut() + router.push('/')
- `src/components/layout/app-chrome.tsx` (31) — Client wrapper that conditionally shows public SiteHeader/SiteFooter/BottomNav based on usePathname. Skips them on `/admin/*` so admin has its own chrome.

### Stats library + API
- `src/lib/admin/stats.ts` (286) — `getAdminStats(districtId)` aggregates 10 KPIs + 12-month user growth + 6 fund-request types + 3 contribution methods + 10 recent audit logs + 3 urgent alert counts. Single batched Promise.all.
- `src/app/api/admin/stats/route.ts` (54) — GET handler. Auth + role check. Returns full AdminStats JSON.

### Page 1: Dashboard `/admin`
- `src/app/admin/page.tsx` (560) — Server component fetches stats via lib + detailed urgent lists (ethics requests, complaints, ads). Renders 10 KPI cards (2/3/4/5 cols responsive grid), 3 charts section, latest 10 audit activity list, urgent alerts card, ethics/complaints/ads detail cards, district heatmap (placeholder SVG)
- `src/components/admin/dashboard-charts.tsx` (272) — Client. Recharts LineChart (12-month user growth), BarChart (6 fund request types with type-specific colors), PieChart (3 contribution methods with donut style). RTL-aware with custom tooltips.
- `src/components/admin/district-heatmap.tsx` (110) — Client. Pure SVG grid (12x8 cells) showing activity density via opacity modulation. Includes legend gradient.

### Page 2: Users `/admin/users`
- `src/app/admin/users/page.tsx` (69) — Server. Fetches up to 500 users in district with family + district info. Maps to AdminUserRow shape.
- `src/components/admin/users-table.tsx` (770) — Client. Search input (debounced 300ms) + role select + status select. 9-column Table (id, name, email, phone, district, role badge, status badge, registration date, actions). Row actions dropdown: عرض/تعديل/تغيير الدور/تعطيل-تفعيل/حذف with dialogs and AlertDialog confirmations. Pagination 50/page client-side.

### Page 3: Fund admin `/admin/fund`
- `src/app/admin/fund/page.tsx` (96) — Server. Fetches 200 latest contributions + 200 fund requests with approvals count.
- `src/components/admin/fund-admin-tables.tsx` (755) — Client. Tabs: المساهمات + الطلبات. Contributions table with status filter; TREASURER/SUPER_ADMIN can confirm/reject pending (calls PATCH API, reject opens note dialog). Requests table with status filter; ETHICS_COMMITTEE/SUPER_ADMIN see "تصويت اللجنة" button for requiresEthics requests → opens dialog with 5-progress-bar vote UI (APPROVE/REJECT/ABSTAIN buttons + note field) → calls POST vote API.

### Page 4: Audit log `/admin/audit`
- `src/app/admin/audit/page.tsx` (233) — Server. Reads searchParams (action/severity/from/to), filters server-side via Prisma where, fetches 100 logs with actor info. Renders 6-column Table with action Arabic translation + severity badge + formatted timestamp.
- `src/components/admin/audit-log-filters.tsx` (144) — Client. Search input (debounced 300ms) + severity Select + from/to date inputs. Updates URL via router.replace() → server refetches.

### Page 5: Settings `/admin/settings`
- `src/app/admin/settings/page.tsx` (101) — Server. Fetches 8 settings from Setting table (with defaults for missing ones), district info + counts. Passes to client form.
- `src/components/admin/settings-form.tsx` (295) — Client. 4 sections: site (name/tagline/description), fund (threshold/deadline), community (3 targets), backup (button → toast), district info. Save button → POST /api/admin/settings (stub).

### Supporting APIs (extra, not in original spec, for functional demo)
- `src/app/api/admin/contributions/[id]/status/route.ts` (135) — PATCH. TREASURER/SUPER_ADMIN. Confirms or rejects PENDING contribution. Updates status, confirmedById/At, note. Creates notification to user + audit log entry.
- `src/app/api/admin/fund-requests/[id]/vote/route.ts` (154) — POST. ETHICS_COMMITTEE/SUPER_ADMIN. Records vote (APPROVE/REJECT/ABSTAIN) with unique constraint preventing double voting. Returns updated approval counts.
- `src/app/api/admin/settings/route.ts` (44) — POST stub. Auth + role check. Returns success without persisting.

### Placeholder pages (sidebar nav links)
- `src/app/admin/families/page.tsx` (10)
- `src/app/admin/events/page.tsx` (10)
- `src/app/admin/complaints/page.tsx` (10)
- `src/app/admin/ads/page.tsx` (10)
- `src/app/admin/reports/page.tsx` (10)
- `src/components/admin/coming-soon.tsx` (40) — shared "قيد التطوير" template

## Modifications
- `src/app/layout.tsx` — Removed SiteHeader/SiteFooter/BottomNav imports, replaced with `<AppChrome>` wrapper. Public chrome still rendered on public routes, hidden on /admin/*.

## Testing
- ESLint clean (0 errors, 0 warnings)
- All admin routes return 200 OK when authenticated as admin@syba-community.ma:
  /admin, /admin/users, /admin/fund, /admin/audit, /admin/settings,
  /admin/families, /admin/events, /admin/complaints, /admin/ads, /admin/reports
- /admin returns 307 redirect to /login?callbackUrl=/admin when unauthenticated ✓
- /api/admin/stats returns 200 with full KPI JSON (verified shape with python json.load) ✓
- PATCH /api/admin/contributions/[id]/status: 200 success on real PENDING contribution ✓
- POST /api/admin/fund-requests/[id]/vote: 201 success, 400 on duplicate vote ✓
- /admin/audit with searchParams (action/severity/from) all return 200 ✓

## Key Decisions
- **AppChrome pattern** for hiding public chrome on admin pages instead of route groups — non-invasive, doesn't require moving existing files.
- **Shared stats library** (`src/lib/admin/stats.ts`) — both the API and the dashboard page call `getAdminStats(districtId)`. Avoids duplicate query logic.
- **Client-side filtering on Users page** (50/page in-memory) since seed only has 200 users; simpler than server-side pagination for the demo.
- **Server-side filtering on Audit page** with URL searchParams — clean URL state, supports back/forward, server refetches on filter change.
- **Extra APIs built** (contributions status PATCH + fund-requests vote POST) — the task spec says "button → calls API" for fund admin, so these endpoints are needed for the demo to be functional. Settings POST is also stubbed.
- **MINIMAL REFINED admin style**: clean borders (border-border), subtle bg-muted for sidebar, single accent color (gold/copper #C8842A), no warm-shadow, no zellige dividers. Buttons h-11 (44px touch target). Icons strokeWidth 1.5px.
- **Framer-motion entrance** on main content area (opacity 0→1, y 4→0, 0.2s ease-out).
- **RTL with logical properties**: ps-/pe-/ms-/me-/start-/end-, no ml-/mr-/pl-/pr-, no text-left. text-start everywhere.
- **10 sidebar links** as required by spec, even though only 5 pages are built. The 5 placeholders use a shared ComingSoon component.
