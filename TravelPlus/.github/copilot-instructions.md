<!-- .github/copilot-instructions.md -->
# TravelPin — Copilot instructions

This file contains short, actionable guidance for AI coding assistants working on the TravelPin repository. Focus on concrete, discoverable patterns and commands used by this project.

1. Big picture
- Frontend: Angular 20 app in `src/` (CLI-generated). Entry points: `src/main.ts`, `src/main.server.ts` (SSR). UI code lives under `src/app/`.
- Backend: simple Node/Express server at `Backend/server.js` using SQLite. Database file: `Backend/database.sqlite` and seed script `Backend/scripts/seed-database.js`.
- Integration: Frontend calls backend via `ApiService` (`src/app/services/api.service.ts`). Default `apiUrl` is in `src/environments/environment.ts` (`http://localhost:3000/api`).

2. Run / build / dev workflows
- Frontend dev server: from repo root run `npm start` (maps to `ng serve`) — serves on `http://localhost:4200`.
- Backend dev server: `cd Backend && npm run dev` (uses `nodemon`), default port `3000`.
- Seed DB (sample data): `cd Backend && npm run init-db` runs `Backend/scripts/seed-database.js` which writes to `Backend/database.sqlite`.
- SSR: root `npm run dev:ssr` builds and runs server-side bundle; see `package.json` scripts `build:ssr` and `serve:ssr:TravelPin`.

3. Data & API patterns (important)
- Backend routes: `Backend/server.js` exposes routes under `/api` (examples: `/api/auth/*`, `/api/destinos`, `/api/viajes`, `/api/favoritos`, `/api/health`). Inspect `Backend/server.js` for full set.
- DB schema: tables include `usuarios`, `destinos`, `favoritos`, `viajes`, `viaje_destinos`, `gastos`, `pagos`, `participantes`. Keep migrations/columns consistent with these names.
- Auth: JWT-based. `Backend/server.js` reads `process.env.JWT_SECRET` (default fallback present). Do not hardcode secrets into commits—use env vars when testing.
- Response shape mismatch: many frontend service methods expect objects shaped like `{ success, count, data }` (see `ApiService`), but `Backend/server.js` currently returns raw arrays/objects (e.g. `res.json(destinos)`). When editing endpoints, either adapt backend responses to include the wrapper or update `ApiService` accordingly—search both sides before changing.

4. Project-specific conventions and gotchas
- Language: many identifiers/comments are Spanish (e.g., `destinos`, `viajes`, `usuario`). Keep translations consistent when adding code or tests.
- Frontend models and services: look in `src/app/models/` and `src/app/services/`. Prefer updating interfaces there when changing API fields.
- Two SQLite packages: root `package.json` lists `better-sqlite3` but the backend uses `sqlite3` (`Backend/package.json`). For server work, treat `Backend/package.json` as source-of-truth for runtime deps.
- Seed data: `Backend/scripts/seed-database.js` inserts example `destinos` with remote image URLs (Unsplash). The seed script deletes rows in `destinos` before inserting — be cautious when running on non-dev DBs.

5. Testing & debugging
- Frontend tests: `ng test` (Karma) from repo root. Use `npm test` which maps to `ng test`.
- To debug frontend + backend locally: run `npm start` (frontend) and `cd Backend && npm run dev` (backend). Ensure `environment.apiUrl` points to `http://localhost:3000/api`.
- Health check: `GET /api/health` (Backend) returns status/timestamp — useful for smoke checks.

6. Where to look first when asked to implement features
- API shape or bug in data flow: `Backend/server.js`, `Backend/scripts/seed-database.js`, and `src/app/services/api.service.ts`.
- UI/UX: component files under `src/app/components/` (e.g., `home`, `explore`, `destination-detail`). Each component follows Angular CLI structure: `.ts`, `.html`, `.css`.
- Models: `src/app/models/*` — update these when changing API fields.

7. Example quick tasks (how to run them)
- Start full dev environment (Windows PowerShell):
```
cd c:\Users\joel_\Desktop\proyecto\TravelPin
npm start      # frontend on 4200
cd Backend
npm run dev    # backend on 3000
```
- Seed local DB:
```
cd Backend
npm run init-db
```

If you want me to adjust or expand any section (more examples, add checklist for PRs, or enforce response wrappers), tell me which part to iterate on.
