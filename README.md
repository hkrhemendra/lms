# City College Library

A college library management system for the catalogue, members, circulation, fines, reservations, notifications, and reports. Data is stored in JSON files so the app can run without a database.

## Setup

```bash
npm install
cp .env.example .env.local
# set AUTH_SECRET to a long random string
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

JSON writes work with `npm run dev` and `npm start`. Serverless hosts such as Vercel have a read-only filesystem, so writes will not persist there. That is expected until a database is added.

## Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@library.edu | admin123 |
| Librarian | librarian@library.edu | lib123 |
| Student | student@library.edu | student123 |
| Faculty | faculty@library.edu | faculty123 |

## Scripts

- `npm run dev` — local app
- `npm run seed` — reset `/data` with sample books, members, loans, fines, and reservations
- `npm test` — circulation rule tests
- `npm run build` — production build

## Folder map

- `/data` — JSON collections. Not served from `public/`.
- `src/app` — routes for the public site, login, and the admin, librarian, and member areas
- `src/components` — layout and feature UI
- `src/lib/data` — the only place that reads and writes JSON
- `src/lib/services` — issue, return, renew, reserve, fine, and report rules
- `src/lib/actions` — server actions (auth check, validation, then a service call)
- `src/proxy.ts` — role gate for `/admin`, `/librarian`, and `/member`

## Switching to MySQL later

Only `src/lib/data/json-store.ts` and `src/lib/data/repositories` need to change. Pages, server actions, and services call repository functions and do not know the files exist. Replace each repository method with the same inputs and outputs against MySQL, and delete the JSON store.
