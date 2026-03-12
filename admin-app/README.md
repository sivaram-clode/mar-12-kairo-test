# QR Platform Admin Dashboard

A Next.js 14 admin dashboard for managing the QR Platform. Built with TypeScript, Tailwind CSS, and Recharts.

## Features

- **Login** (`/login`) — Admin-only login with JWT authentication
- **Dashboard** (`/dashboard`) — Platform overview with stat cards and daily scan volume chart
- **Users** (`/users`) — User management table with Activate/Deactivate controls
- **QR Codes** (`/qr-codes`) — View all QR codes across the platform with search

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) (charts)
- [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/react)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running at `http://localhost:5000` (or configured via env)

### Installation

```bash
cd admin-app
npm install
```

### Environment Variables

Copy the example env file and configure it:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000` |

### Development

```bash
npm run dev
```

Opens on [http://localhost:3001](http://localhost:3001).

### Production Build

```bash
npm run build
npm run start
```

### Testing

```bash
npm test
```

Run with coverage:

```bash
npm test -- --coverage
```

## Project Structure

```
admin-app/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Redirect to /dashboard or /login
│   ├── login/
│   │   └── page.tsx        # Admin login form
│   ├── dashboard/
│   │   └── page.tsx        # Platform stats + daily scan chart
│   ├── users/
│   │   └── page.tsx        # Users management table
│   └── qr-codes/
│       └── page.tsx        # QR codes table
├── components/
│   ├── AuthGuard.tsx       # Route protection component
│   └── Sidebar.tsx         # Navigation sidebar
├── lib/
│   └── auth.ts             # JWT auth utilities
├── __tests__/
│   ├── login.test.tsx
│   ├── dashboard.test.tsx
│   └── users.test.tsx
├── jest.config.js
├── jest.setup.js
├── .env.example
└── package.json
```

## API Endpoints Used

The admin dashboard communicates with these backend API endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `POST /api/auth/login` | POST | Authenticate and receive JWT |
| `GET /api/admin/stats` | GET | Platform statistics |
| `GET /api/admin/scans/daily?days=30` | GET | Daily scan volume data |
| `GET /api/admin/users` | GET | List all users |
| `PATCH /api/admin/users/:id/toggle` | PATCH | Activate/deactivate a user |
| `GET /api/admin/qr-codes` | GET | List all QR codes |

All endpoints (except login) require `Authorization: Bearer <token>` header.

## Authentication

- JWT is stored in `localStorage` under the key `admin_token`
- On login, the token payload is decoded to check `role === 'admin'`
- Non-admin users are rejected at login
- All protected pages redirect to `/login` if no valid admin token is found
