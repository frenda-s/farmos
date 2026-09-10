# FarmDesk - Digital Farm Management System

FarmDesk (FarmOS) is a lightweight, digital farm journal and agricultural management web application. It provides location-based crop suggestions, growth tracking, field operations recording, expense logging, and a nearby store directory.

All crop suggestions and analytics are driven by deterministic public agricultural data and formula-based rules without third-party AI dependencies.

## Architecture & Tech Stack

The project is structured as a pnpm monorepo:

- **Frontend (`apps/web`)**: Built with Vue 3, Vite, Tailwind CSS v4, Pinia, Vue Router, and Leaflet (OpenStreetMap integration). Designed around a newspaper minimalism aesthetic.
- **Backend (`apps/api`)**: Powered by Hono API framework and Turso/libSQL (local SQLite file for development, remote Turso for production). Runs locally via `@hono/node-server` and deploys to Cloudflare Workers via Wrangler.
- **Single Worker Deployment**: Cloudflare Worker serves `/api/*` requests via Hono and static SPA frontend assets on all other routes.

## Prerequisites

- Node.js 18+
- pnpm 8+

## Quick Start

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Initialize and seed local database (creates SQLite database and seeds initial data):

   ```bash
   pnpm --filter @farmdesk/api db:seed
   ```

3. Start development servers (API on port 8787 and Web on port 5173):

   ```bash
   pnpm dev
   ```

4. Access the web interface at `http://localhost:5173`.

   Demo Credentials:
   - Email: `demo@farmdesk.vn`
   - Password: `123456`

## Repository Layout

```text
farmos/
├── apps/
│   ├── api/          # Hono backend API service and database migrations/seeds
│   └── web/          # Vue 3 SPA frontend application
├── package.json      # Monorepo root scripts
├── pnpm-workspace.yaml
└── README.md
```

## Cloudflare Worker Deployment

Both the API and static frontend assets are deployed together to a single Cloudflare Worker.

1. Build static frontend assets:

   ```bash
   pnpm --filter @farmdesk/web build
   ```

2. Deploy worker and static assets to Cloudflare:

   ```bash
   pnpm --filter @farmdesk/api deploy
   ```

### Worker Environment Variables

Configure environment variables in Cloudflare Worker dashboard or via Wrangler CLI:

- `TURSO_URL` (Variable): Turso database URL (e.g., `libsql://farmos-frenda.aws-ap-northeast-1.turso.io`)
- `TURSO_TOKEN` (Secret): Turso authentication token (`wrangler secret put TURSO_TOKEN`)
- `JWT_SECRET` (Secret): Secret key for signing authentication tokens (`wrangler secret put JWT_SECRET`)

### Remote Database Seeding

To seed data into a remote Turso database instance:

```bash
cd apps/api
DATABASE_URL="libsql://your-database.turso.io" \
TURSO_AUTH_TOKEN="your-turso-auth-token" \
pnpm exec tsx src/seed.ts
```
