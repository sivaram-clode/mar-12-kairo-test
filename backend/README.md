# QR Platform — Flask Backend

REST API for QR code generation, scan tracking, and redirect management.

## Stack

- **Python / Flask** — REST API
- **SQLAlchemy + Flask-Migrate** (Alembic) — ORM + migrations
- **PostgreSQL** — primary datastore
- **Flask-JWT-Extended** — JWT auth (user & admin roles)
- **qrcode[pil]** — PNG generation
- **pytest** — test suite

## Setup

```bash
# 1. Create and activate venv
python -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets

# 4. Initialise DB + run migrations
flask db upgrade

# 5. Run the dev server
flask run
```

## Database Schema

| Table      | Purpose                                           |
|------------|---------------------------------------------------|
| `users`    | Registered accounts (role: user / admin)          |
| `qr_codes` | QR code records with destination URL & PNG path   |
| `scans`    | Scan events: IP, user-agent, referer, timestamp   |

## API Endpoints

### Auth
| Method | Path              | Auth     | Description            |
|--------|-------------------|----------|------------------------|
| POST   | /api/auth/register| —        | Register new account   |
| POST   | /api/auth/login   | —        | Login, receive JWT     |
| GET    | /api/auth/me      | JWT      | Get own profile        |

### QR Codes
| Method | Path                  | Auth  | Description                          |
|--------|-----------------------|-------|--------------------------------------|
| POST   | /api/qr/              | JWT   | Create QR code + generate PNG        |
| GET    | /api/qr/              | JWT   | List own QR codes (admin: all)       |
| GET    | /api/qr/<id>          | JWT   | Get single QR code                   |
| PATCH  | /api/qr/<id>          | JWT   | Update destination URL / label       |
| DELETE | /api/qr/<id>          | JWT   | Delete QR code                       |
| GET    | /api/qr/<id>/image    | JWT   | Download PNG image                   |
| GET    | /api/qr/<id>/stats    | JWT   | Scan statistics                      |

### Redirect
| Method | Path      | Auth | Description                           |
|--------|-----------|------|---------------------------------------|
| GET    | /r/<code> | —    | Track scan and redirect to destination|

## Running Tests

```bash
# Make sure TEST_DATABASE_URL is set in .env (or env)
pytest tests/ -v
```

## Migrations

```bash
# Auto-generate after model changes
flask db migrate -m "describe change"
# Review migrations/versions/<rev>.py before applying
flask db upgrade
```

## Roles

- **user** — CRUD on own QR codes, view own stats
- **admin** — CRUD on all QR codes, view all stats
