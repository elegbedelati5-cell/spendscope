# SpendScope

SpendScope is a personal expense tracking dashboard built with a modern full-stack JavaScript stack. It helps users log spending, visualize habits, and surface analytics from their own data.

---

## 1. Product overview

SpendScope is a web app for **manual expense tracking with analytics**, aimed especially at users who work in **Nigerian Naira (₦ / NGN)**.

### What users can do

- Track expenses (amount, category, description, date)
- See monthly totals, category breakdowns, and multi-month trends
- Review a **financial health score** (essential vs discretionary mix)
- Read **rolling insights** (30-day windows) and a **month-end spending forecast**
- Filter, search, and paginate transactions; **export CSV** for the current filter set
- Manage an account: profile, password, preferences, **delete account**

### Limitations (current version)

- No bank linking or automatic transaction import
- No native mobile apps (web only)
- No live subscription billing in this repository (demo upgrade UI only)

---

## 2. Technical overview

### Architecture

| Layer | Technology |
|--------|------------|
| API | Node.js, Express 5 |
| ORM | Prisma |
| Database | SQLite (default dev); PostgreSQL via `DATABASE_URL` |
| Auth | JWT (`Authorization: Bearer <token>`), bcrypt password hashing |
| Client | React 19, React Router 7 |
| Bundler | Vite 8 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Animations | Framer Motion |

### Repository structure

```
SPENSCOPE/
├── backend/
│   ├── prisma/           # schema.prisma; dev.db (local, often gitignored)
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── server.js
├── frontend/
│   └── src/
└── README.md
```

### Core features (by domain)

**Authentication**

- Register, login, JWT session
- Change password, delete account (password-confirmed)

**Expense management**

- Create expenses; list with pagination and filters (`from`, `to`, `category`, `search`)
- Delete by id

**Analytics**

- Dashboard aggregates, category clusters, trend series, recent rows, short month insights
- Health score, 30-day insights, prediction endpoint (optional `?budget=`)

**Transactions (client)**

- Consumes list API; CSV is generated in the browser from fetched rows

### API surface

All JSON unless noted. Authenticated routes expect: `Authorization: Bearer <jwt>`.

**Public**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness → `{ "ok": true }` |
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login; returns token + user |

**Expenses**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/expenses` | Create (`amount`, `category`, `description?`, `date`) |
| GET | `/expenses` | Paginated; query: `page`, `pageSize`, `from`, `to`, `category`, `search` |
| DELETE | `/expenses/:id` | Delete |

**Analytics**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/dashboard` | Totals, clusters, trend, recent, insights |
| GET | `/analytics/clusters` | Category totals for a month (`year`, `month`) |
| GET | `/analytics/health-score` | Current-month essential vs discretionary score |
| GET | `/analytics/insights` | Rolling 30d vs prior 30d |
| GET | `/analytics/prediction` | Month forecast; optional `?budget=` (number) |

**User (`/me`)**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Current profile |
| PATCH | `/me` | Update fields (e.g. `name`, `currency`, notification flags) |
| POST | `/me/password` | Change password |
| DELETE | `/me` | Delete account; body `{ "password": "<current>" }` |

Request/response details and validation errors: see `backend/controllers` and `backend/routes`.

### Data model (Prisma)

**User**

- `id`, `email`, `passwordHash`, `name?`, `currency`, `notifyReminders`, `notifyReports`, `createdAt`

**Expense**

- `id`, `userId`, `amount` (Decimal), `category`, `description`, `date`, `createdAt`

**Relationship:** `User` 1 — *many* `Expense` (cascade delete on user removal).

Indexes on `Expense`: `userId`, composite `(userId, date)`.

### Client routes (React)

| Path | Role |
|------|------|
| `/` | Landing; redirects to `/dashboard` if authenticated |
| `/login`, `/signup` | Auth (guest-only) |
| `/dashboard` | Shell + home dashboard |
| `/dashboard/add` | Add expense |
| `/dashboard/transactions` | Filters, pagination, CSV export |
| `/dashboard/settings` | Profile, password, prefs, delete account |

JWT: stored in `localStorage` (`token`); Axios attaches it to API calls.

### Error handling

- Many failures return `{ "error": "<message>" }`.
- Unhandled server errors: `500` with `{ "error": "Server error" }`.

---

## 3. Developer setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm (or compatible package manager)

### Backend

Copy `backend/.env.example` → `backend/.env` and set:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | e.g. `file:./prisma/dev.db` (SQLite, relative to `backend/`) or Postgres URL |
| `JWT_SECRET` | **Required**, ≥ 8 characters (enforced at startup) |
| `PORT` | Default `4000` |
| `FRONTEND_ORIGIN` | Comma-separated CORS origins (e.g. `http://localhost:5173`). Non-production also allows localhost/127.0.0.1 |

```bash
cd backend
npm install
npm run db:generate
npm run db:push
npm run dev
```

- API: **http://localhost:4000**
- Health: `GET http://localhost:4000/health`

`npm start` runs `node server.js` without nodemon.

### Frontend

Optional `frontend/.env` / `.env.local`:

```env
VITE_API_URL=http://localhost:4000
```

Default base URL is `http://localhost:4000` if unset (`frontend/src/api/client.js`).

```bash
cd frontend
npm install
npm run dev
```

- App: **http://localhost:5173**

Production:

```bash
npm run build
npm run preview   # optional local preview of dist/
```

Serve `frontend/dist` from a static host; add that origin to `FRONTEND_ORIGIN`.

### Security notes (operators)

- Use a long, random `JWT_SECRET` in production.
- Restrict `FRONTEND_ORIGIN` to real app origins in production.
- Use HTTPS; do not expose database files or credentials.

### License

See repository owner; not specified here.
