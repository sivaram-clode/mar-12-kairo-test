# QR Platform — Admin Dashboard

Next.js 14 admin dashboard for the QR Platform. Runs on **port 3001** and connects to the Flask API at `http://localhost:5000`.

## Features

- **Admin login** — JWT-based authentication with role validation
- **Users table** — view all registered users, activate/deactivate accounts
- **QR Codes table** — platform-wide view of all QR codes across every user
- **Platform stats** — total users, total QR codes, total scans at a glance
- **Daily scan volume chart** — recharts bar chart of scan activity over time
- **Protected routes** — `AuthGuard` component redirects unauthenticated visitors

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Charts | recharts |
| Testing | Jest + React Testing Library |
| API client | Native `fetch` with `Authorization: Bearer` headers |

## Getting Started

```bash
# 1. Install dependencies
NODE_ENV=development npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local if your Flask API runs on a different host/port

# 3. Start the dev server (port 3001)
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) — you'll be redirected to `/login`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Base URL of the Flask API |

See `.env.example` for the full list.

## Flask API Contract

The dashboard expects these endpoints on the Flask API:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Returns `{ access_token }` with an admin JWT |
| `GET` | `/admin/users` | List all users |
| `PATCH` | `/admin/users/:id/toggle` | Activate/deactivate a user |
| `GET` | `/admin/qrcodes` | List all QR codes across users |
| `GET` | `/admin/stats/scans` | `{ total_scans, daily: [{ date, scans }] }` |
| `GET` | `/admin/stats` | `{ total_users, total_qr_codes, total_scans }` |

JWT tokens must include a `role` claim equal to `"admin"`.

## Running Tests

```bash
NODE_ENV=test npx jest --watchAll=false
```

Tests cover: login form (renders, error state, submit), dashboard (stats display, chart, error state), and users page (table render, activate/deactivate interaction).

## Project Structure

```
admin-app/
├── app/
│   ├── login/page.tsx          # Admin login page
│   ├── dashboard/              # Overview with scan chart
│   ├── users/                  # Users management
│   └── qr-codes/               # QR codes viewer
├── components/
│   ├── AuthGuard.tsx           # Redirect if not authenticated
│   ├── Sidebar.tsx             # Navigation sidebar
│   └── charts/
│       └── DailyScanChart.tsx  # recharts daily scan bar chart
├── lib/
│   ├── api.ts                  # Flask API service layer
│   └── auth.ts                 # Token helpers (get/set/decode)
├── __tests__/                  # Jest + RTL test suites
├── .env.example
└── README.md
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Start production server on port 3001 |
| `npm test` | Run Jest test suite |
