# Deployment Guide

This project ships as **two Vercel projects backed by one hosted MySQL database**:

| Part | What it is | Vercel project | Root directory |
|------|-----------|----------------|----------------|
| Frontend | React 19 + Vite static site | `pm-client` | `client` |
| Backend | Express API (serverless function) | `pm-server` | `server` |
| Database | MySQL (hosted) | — | — |

**Why no `vercel.json` is needed for the backend:** Vercel auto-detects an Express app when an
entrypoint named `server`/`app`/`index` exists at the project root or under `src/` and it exports
the app. This repo already satisfies that: `server/src/server.js` exports `app` and only calls
`app.listen()` off-Vercel (`if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL)`).

> Warning: **SQLite will not work on Vercel.** Serverless functions have a read-only, ephemeral
> filesystem, so the `database.sqlite` file is lost on every request. You **must** use MySQL
> (`DB_TYPE=mysql`), which is already the default in `server/.env`.

---

## 0. Prerequisites

- A [Vercel](https://vercel.com) account.
- The code pushed to a **GitHub / GitLab / Bitbucket** repository.
  (A root `.gitignore` was added so `node_modules/`, `dist/` and `.env` are **not** committed.)
- Node.js 20+ locally (this repo was built with Node 20.18).

### Push the code to git
```bash
cd "e:/project management project"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

---

## 1. Create a hosted MySQL database

Pick any free/trial MySQL-compatible provider, for example:
**Aiven**, **TiDB Cloud Serverless**, **Clever Cloud**, **Railway**, or **db4free.net**.

Create a database named `project_management` (or any name) and note these values:
`host`, `port`, `user`, `password`, `database name`.

### Create the tables
MySQL does **not** auto-create tables (only the SQLite driver does). Run the schema once against
your new database — either via your provider's SQL console/web UI, or from a terminal:

```bash
mysql -h <host> -P <port> -u <user> -p <database> < "e:/project management project/server/database-schema.sql"
```

Or paste the contents of **`server/database-schema.sql`** into the provider's query editor and run it.
It creates three tables: `users`, `projects`, `tasks` (matching the exact columns the API uses).

---

## 2. Deploy the backend to Vercel

1. In Vercel: **Add New -> Project -> Import** your repository.
2. Set **Root Directory** to `server`.
3. Leave **Framework Preset** on *Other* (Vercel detects the Express server automatically).
   Leave Build/Output commands empty.
4. Expand **Environment Variables** and add:

   | Name | Example value |
   |------|---------------|
   | `JWT_SECRET` | a long random string |
   | `DB_TYPE` | `mysql` |
   | `DB_HOST` | your MySQL host |
   | `DB_PORT` | `3306` (or your provider's port) |
   | `DB_USER` | your MySQL user |
   | `DB_PASSWORD` | your MySQL password |
   | `DB_NAME` | `project_management` |
   | `DB_SSL` | `true` if your provider requires TLS, otherwise omit |

   > Do **not** set `PORT` - Vercel manages it. `NODE_ENV=production` is set automatically.

5. **Deploy**. When it finishes, open `https://<your-backend>.vercel.app/api/health`.
   You should see: `{"status":"OK","message":"Project Management API is running."}`

**Fallback (only if auto-detection fails):** add a `server/vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "src/server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.js" }]
}
```

---

## 3. Deploy the frontend to Vercel

1. In Vercel: **Add New -> Project -> Import** the same repository again.
2. Set **Root Directory** to `client`.
3. Framework Preset: **Vite** (build `npm run build`, output `dist` are auto-filled).
4. Add an environment variable:

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://<your-backend>.vercel.app/api` |

   > `client/src/utils/api.js` now reads `import.meta.env.VITE_API_URL || '/api'`, so locally it
   > still uses the Vite proxy, and in production it points at your backend.

5. **Deploy**. Open the frontend URL - the SPA fallback in `client/vercel.json`
   (`/(.*)` -> `/index.html`) makes client-side routes like `/projects` survive a page refresh.

---

## 4. Verify the whole flow

1. Open the frontend URL -> register a new account.
2. Create a project and a task.
3. Refresh the page -> you should stay logged in and the data should persist (it is in MySQL).

`CORS` is already open on the backend (`app.use(cors())`), so cross-domain requests from the
frontend are allowed out of the box.

---

## 5. Alternative: avoid `VITE_API_URL` by proxying through the frontend

If you prefer the frontend to call `/api` on its own domain (no CORS, no env var), replace
`client/vercel.json` with a proxy rewrite pointing at your backend:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://<your-backend>.vercel.app/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
With this in place `VITE_API_URL` can be left unset.

---

## 6. Local development (unchanged)

```bash
# Terminal 1 - backend (uses server/.env; set DB_TYPE=sqlite to run without MySQL)
cd server
npm install
npm run dev            # http://localhost:5000

# Terminal 2 - frontend (proxies /api -> localhost:5000)
cd client
npm install
npm run dev            # http://localhost:3000
```

---

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `500` errors on every API call after deploy | Tables not created in MySQL. Run `server/database-schema.sql`. |
| `ER_NOT_SUPPORTED_AUTH_MODE` / TLS errors | Provider requires SSL -> set `DB_SSL=true`. |
| Frontend loads but API calls fail with CORS/404 | `VITE_API_URL` is wrong or missing, or the backend URL is wrong. |
| `Cannot find module 'sqlite3'` during Vercel build | Remove the unused native dependency: `cd server && npm uninstall sqlite3`, then delete its `require` line in `db.js` (only used for local SQLite). |
| Routes 404 on refresh | Ensure `client/vercel.json` exists with the `/(.*)` -> `/index.html` rewrite. |
| `Too many connections` to MySQL | Serverless scales instances; keep `connectionLimit` low or use a provider connection pooler. |

## Notes & limitations

- **Rate limiting** (`express-rate-limit`) uses in-memory storage in `authRoutes.js`. On serverless
  each instance keeps its own counters, so the effective limit is approximate. For a stricter limit,
  move the store to a shared service (e.g. Upstash Redis).
- **JWT** tokens are signed with `JWT_SECRET`; change the dev secret before going live.
- The backend's `cors()` allows all origins. Tighten it to your frontend domain in production if desired:
  `app.use(cors({ origin: 'https://<your-frontend>.vercel.app' }))`.

