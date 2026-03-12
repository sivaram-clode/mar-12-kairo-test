# QR Platform — User App

Next.js 14 (App Router) user-facing dashboard for the QR Platform. Connects to a Flask API at `http://localhost:5000`.

## Features

- **Register / Login** — JWT-based authentication
- **Create QR Code** — provide a label and destination URL
- **List QR Codes** — see all your QRs at a glance
- **Edit QR Code** — update destination URL and label inline
- **View Scan Stats** — total scans + 30-day daily breakdown + recent scans
- **Download QR as PNG** — one-click download of the generated QR image

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS v4**
- **Axios** for API calls
- **Jest + React Testing Library** for tests

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example and adjust if needed:

```bash
cp .env.example .env.local
```

`.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start the Flask API (port 5000)

Make sure the backend is running before launching the app.

### 4. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Running Tests

```bash
npm test
```

Runs 24 Jest + RTL tests covering: login, register, QR card (edit/delete/download/stats link), create QR form, and navbar.

## Project Structure

```
user-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx      # Login page
│   │   └── register/page.tsx   # Register page
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Protected layout (redirect if not authed)
│   │   └── dashboard/
│   │       ├── page.tsx        # QR list + create
│   │       └── [id]/stats/page.tsx  # Per-QR stats
│   ├── layout.tsx              # Root layout (AuthProvider)
│   └── page.tsx                # Redirect → /dashboard or /login
├── components/
│   ├── CreateQRForm.tsx        # Expandable create form
│   ├── Navbar.tsx              # Top nav with logout
│   └── QRCard.tsx              # QR item: edit, delete, download, stats
├── lib/
│   ├── api.ts                  # Axios client + API functions
│   └── auth-context.tsx        # Auth context (user, login, register, logout)
└── __tests__/                  # Jest + RTL tests
```

## API Endpoints Consumed

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/qr/` | List user's QR codes |
| POST | `/api/qr/` | Create QR code |
| PATCH | `/api/qr/:id` | Update destination URL / label |
| DELETE | `/api/qr/:id` | Delete QR code |
| GET | `/api/qr/:id/image` | Download QR PNG |
| GET | `/api/qr/:id/stats` | Scan statistics |
