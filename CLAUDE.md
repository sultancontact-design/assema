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
