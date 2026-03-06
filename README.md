# ClipMotion

ClipMotion is a web animation editor for creating short animated scenes with characters, keyframes, and timeline playback.

## Core Features

- Auth with email/password and Google
- Project dashboard + multi-scene editor
- Character builder (shape, face, limbs)
- Timeline keyframes for transform + parallax depth
- Expression keyframes for face changes over time
- Canvas tools: select, move, rotate, scale, pen-shape drawing
- Prompt-to-scene generation (AI-style local story scene planner)
- Scene Creator presets (background/middleground/foreground)
- Manual save + autosave with version conflict recovery
- Export to WebM/MP4 (browser support dependent) and project package (`.clipmotion.json`)
- Export clip trim range (start/end time) before download

## Stack

- Next.js 16 (App Router + Turbopack)
- React 19 + TypeScript
- Prisma + Auth.js (NextAuth v5 beta)
- Zustand
- PixiJS
- Tailwind CSS 4

## Requirements

- Node.js 20+
- npm 10+

## Quick Start

1. Install dependencies
```bash
npm install
```

2. Create env file
```bash
cp .env.example .env.local
```

3. Generate Prisma client + run migrations
```bash
npm run prisma:generate
npx prisma migrate deploy
```

4. Start dev server
```bash
npm run dev
```

Open `http://localhost:3000`.

### Local-only DB mode (no cloud required)

Use SQLite locally:

```bash
npm run dev:local
```

This uses `prisma/schema.local.prisma` and creates `prisma/dev.local.db`.

## Database / Infra Notes

- Current default Prisma datasource is PostgreSQL (Supabase-friendly).
- Set both `DATABASE_URL` and `DIRECT_URL` (examples in `.env.example`).
- For Supabase:
  - `DATABASE_URL` should use the pooled connection string (`pgbouncer=true`).
  - `DIRECT_URL` should use the direct Postgres connection (used by Prisma migrations).
- `docker-compose.yml` includes optional local PostgreSQL, Redis, and MinIO.

## Scripts

- `npm run dev` - Prisma generate + Next dev
- `npm run dev:local` - Local SQLite dev (no Supabase)
- `npm run build` - Prisma generate + production build
- `npm run build:local` - Local SQLite build
- `npm run start` - start production server
- `npm run lint` - ESLint
- `npm run test` - Vitest (run once)
- `npm run test:watch` - Vitest watch
- `npm run prisma:generate` - regenerate Prisma client
- `npm run prisma:generate:local` - generate Prisma client from local SQLite schema
- `npm run prisma:dbpush:local` - push local SQLite schema to `prisma/dev.local.db`

## Project Structure

- `src/app` - routes + API handlers
- `src/components` - editor UI and dashboard UI
- `src/engine` - scene graph, keyframes, composition, easing
- `src/store` - Zustand editor/playback/selection state
- `src/hooks` - autosave, playback, keyboard shortcuts
- `src/lib` - shared utilities (db, drawing, constants)
- `prisma` - schema + migrations
- `tests` - unit tests (engine-focused)

## Editor Controls

- `V`: Select tool
- `M`: Move tool
- `R`: Rotate tool
- `S`: Scale tool
- `P`: Pen tool (create custom closed shapes)
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z` (or `Ctrl/Cmd + Y`): Redo
- `Ctrl/Cmd + S`: Save project

## Known Warnings / Troubleshooting

- Next.js 16 may warn that `middleware` convention is deprecated in favor of `proxy`. This is currently a warning and does not block build.
- If push fails with `Permission denied (publickey)`, configure SSH key for GitHub and test with:
```bash
ssh -T git@github.com
```
