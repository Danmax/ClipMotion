# ClipMotion

ClipMotion is a web animation editor built with Next.js, PixiJS, Prisma, and Auth.js.

## Features

- Email/password and Google authentication
- Dashboard for projects and characters
- Character builder (shape + face data)
- Scene editor with timeline, scene tree, and properties panel
- REST API routes for projects and characters

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Prisma ORM
- Auth.js (NextAuth v5 beta) + Prisma Adapter
- Zustand state management
- PixiJS rendering
- Tailwind CSS 4

## Requirements

- Node.js 20+
- npm 10+

Optional local services:

- Redis
- S3-compatible storage (MinIO)
- PostgreSQL (if you switch datasource from SQLite)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Generate Prisma client and apply migrations:

```bash
npm run prisma:generate
npx prisma migrate deploy
```

4. Start development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Notes

- The current Prisma schema uses SQLite (`file:./dev.db`).
- `docker-compose.yml` provides PostgreSQL, Redis, and MinIO for local infrastructure needs.
- If you move to PostgreSQL, update `prisma/schema.prisma` datasource and `.env.local` `DATABASE_URL`.

## Scripts

- `npm run dev` - Generate Prisma client and start Next.js dev server
- `npm run build` - Generate Prisma client and build app
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest once
- `npm run test:watch` - Run Vitest in watch mode
- `npm run prisma:generate` - Regenerate Prisma client

## Project Structure

- `src/app` - App Router pages and API routes
- `src/components` - UI and editor components
- `src/engine` - Scene graph and animation logic
- `src/store` - Zustand editor store
- `src/lib` - Shared utilities (Prisma, S3, etc.)
- `prisma` - Prisma schema and migrations

## Deployment

- Ensure Prisma client is generated during install/build (already configured via `postinstall` and scripts).
- Do not import Prisma from Edge middleware/runtime code paths.
- Configure production environment variables for Auth, DB, Redis, and S3.
