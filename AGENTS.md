<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Guidelines

## Build and Test

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build production bundle: `npm run build`
- Start production server: `npm start`
- Lint: `npm run lint`
- There is currently no dedicated automated test script in `package.json`.

## Architecture

- `app/` contains App Router pages and route handlers.
- `app/api/` contains REST endpoints for administrators, condominiums, plans, payments, and webhooks.
- `lib/db/` contains database setup (`data-source.ts`), entity schemas, and seed/bootstrap logic.
- `lib/data/` contains data access/query modules used by pages and handlers.
- `lib/auth/` contains password and session/auth guard logic.
- `lib/payments/` contains AbacatePay integration and payment settlement logic.
- Route-local UI components live in `app/**/_components/`.

## Conventions

- Keep domain naming aligned with the existing Portuguese business language (`administrador`, `condominio`, `pagamento`) even when writing code in English syntax.
- Prefer kebab-case filenames for components and app helpers (for example `login-form.tsx`, `payment-status-panel.tsx`).
- TypeORM uses `EntitySchema` definitions in `lib/db/entities/` instead of decorator-based entities.
- Server-only modules should continue importing `server-only` where already used.
- Keep validation and parsing close to action boundaries (see `app/**/actions.ts`).

## Environment and Runtime Gotchas

- `SESSION_SECRET` is required for login/session flows.
- `ABACATEPAY_API_KEY` is required to create PIX charges; missing key causes payment creation to fail.
- SQLite is used locally by default; DB file path can be configured with `DB_FILENAME`.
- On Vercel runtime, DB storage path handling differs (`/tmp/serverbox`), so avoid assumptions tied to local paths.
- Database bootstrap and legacy schema compatibility logic exist in `lib/db/data-source.ts`; preserve this behavior when refactoring startup.

## References

- Setup, domain model, API examples, and AbacatePay configuration: `README.md`
