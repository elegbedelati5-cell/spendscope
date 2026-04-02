# SpendScope

Technical overview of the SpendScope monorepo: a JWT-authenticated expense tracking API (Express + Prisma) and a React (Vite) single-page client.

## Stack

| Layer | Technology |
|--------|-------------|
| API | Node.js, Express 5, Prisma ORM |
| Database | SQLite (default dev); Postgres URL supported via `DATABASE_URL` |
| Auth | JWT (`Authorization: Bearer <token>`), bcrypt password hashing |
| Client | React 19, React Router 7, Vite 8, Tailwind CSS 4, Axios, Recharts, Framer Motion |

## Repository layout

```
SPENSCOPE/
├── backend/          # Express API, Prisma schema, controllers, routes
│   ├── prisma/       # schema.prisma, migrations / dev.db (gitignored when local)
│   └── ...
├── frontend/         # Vite React app
│   └── src/
└── README.md
```

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm (or compatible package manager)

## Backend

### Environment

Copy `backend/.env.example` to `backend/.env` and set at minimum:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma connection string. Default dev: `file:./prisma/dev.db` (SQLite relative to `backend/`) |
| `JWT_SECRET` | Signing secret; **required**, minimum 8 characters (enforced at startup) |
| `PORT` | Listen port (default `4000`) |
| `FRONTEND_ORIGIN` | Comma-separated allowed CORS origins (e.g. `http://localhost:5173`). In non-production, `localhost` / `127.0.0.1` HTTP(S) origins are also allowed |

### Database

```bash
cd backend
npm install
npm run db:generate
npm run db:push
```

`db:push` applies `prisma/schema.prisma` to the database (SQLite file or remote Postgres depending on `DATABASE_URL`).

### Run

```bash
npm run dev    # nodemon
# or
npm start      # node server.js
```

Health check: `GET http://localhost:4000/health` → `{ "ok": true }`.

## Frontend

### Environment

Optional: `frontend/.env` (or `.env.local`) with:

```env
VITE_API_URL=http://localhost:4000
```

If unset, the client defaults to `http://localhost:4000` (see `frontend/src/api/client.js`).

### Run

```bash
cd frontend
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview   # optional: serve dist locally
```

Serve `frontend/dist` behind any static host; configure that host’s origin in `FRONTEND_ORIGIN` for the API.

## API surface (summary)

All JSON unless noted. Authenticated routes expect header: `Authorization: Bearer <jwt>`.

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login, returns token + user |

### Authenticated (`/expenses`, `/analytics`, `/me`)

**Expenses**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/expenses` | Create expense (body: amount, category, description?, date) |
| GET | `/expenses` | Paginated list; query: `page`, `pageSize`, `from`, `to`, `category`, `search` |
| DELETE | `/expenses/:id` | Delete expense |

**Analytics**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/dashboard` | Totals, clusters, trend, recent rows, month insights |
| GET | `/analytics/clusters` | Category totals for a month (`year`, `month` query) |
| GET | `/analytics/health-score` | Essential vs discretionary score (current month) |
| GET | `/analytics/insights` | Rolling 30-day vs prior 30-day insights |
| GET | `/analytics/prediction` | Month-to-date pace forecast; optional `?budget=` (number) |

**User**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Current user profile |
| PATCH | `/me` | Update profile fields (e.g. name, currency, notification flags) |
| POST | `/me/password` | Change password |
| DELETE | `/me` | Delete account; JSON body `{ "password": "<current>" }` |

Refer to route and controller files for exact request/response shapes and validation errors.

## Data model (Prisma)

- **User**: `id`, `email`, `passwordHash`, optional `name`, `currency`, `notifyReminders`, `notifyReports`, timestamps.
- **Expense**: `id`, `userId`, `amount` (Decimal), `category`, `description`, `date`, `createdAt`. Cascading delete when user is removed.

Indexes on expenses: `userId`, composite `(userId, date)`.

## Client routes (React)

| Path | Notes |
|------|--------|
| `/` | Landing (redirects to `/dashboard` if authenticated) |
| `/login`, `/signup` | Auth (guest-only) |
| `/dashboard` | Main layout: dashboard home |
| `/dashboard/add` | Add expense form |
| `/dashboard/transactions` | Filtered list, pagination, CSV export (client-generated from API data) |
| `/dashboard/settings` | Profile, password, preferences, account deletion |

JWT is stored in `localStorage` (key `token`) and attached by Axios interceptors.

## Error handling

- API returns JSON `{ error: string }` for many client-visible failures.
- Global Express error handler returns `500` with `{ error: 'Server error' }` for unhandled exceptions.

## Security notes (operators)

- Use a long, random `JWT_SECRET` in production.
- Restrict `FRONTEND_ORIGIN` to known web app origins in production.
- Run HTTPS in production; avoid exposing database files or credentials.

## License

See project owner; not specified in this README.
