# StudioSpace — Server

## Features

- Express v4 REST endpoints and MongoDB native driver data storage.
- Better Auth email/password and optional Google OAuth using the Mongo adapter.
- HTTPOnly JWT cookie in addition to checked active Better Auth session, owner-based authorization, and Zod validation.
- Studio CRUD, user reservations and host-side booking status workflow with 30-minute unique slot locks.
- MongoDB wishlist and optional ImgBB image uploading, with MIME and size guards.

## Tech stack

Node.js 20+ (22 recommended), Express, Better Auth + Mongo adapter, MongoDB, jose, cookie-parser, cors, Zod, multer.

## Local setup

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

Fill in `MONGODB_URI`, `BETTER_AUTH_SECRET`, and `STUDIO_JWT_SECRET` before starting. Read the root README for detailed setup and production cookie advice.

## API routes

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/health` | GET | Public | Health check |
| `/api/auth/*` | GET/POST | Better Auth | Login, registration, Google OAuth, session |
| `/api/security/token` | POST | Session | Issue HTTPOnly JWT cookie |
| `/api/studios` | GET, POST | Public, private | Search or create studios |
| `/api/studios/mine` | GET | Private | My studios |
| `/api/studios/:id` | GET, PATCH, DELETE | Public, owner | Studio details, update, delete |
| `/api/bookings` | POST | Private | Request booking |
| `/api/bookings/mine` | GET | Private | My reservations |
| `/api/bookings/hosting` | GET | Private | My incoming guest requests |
| `/api/bookings/:id/status` | PATCH | Host | Confirm, complete, decline |
| `/api/bookings/:id/cancel` | PATCH | Guest | Cancel pending booking |
| `/api/wishlist` | GET | Private | My saved studios |
| `/api/wishlist/:id` | POST | Private | Toggle saved studio |
| `/api/uploads` | POST | Private | Upload cover image to ImgBB |

## Tests

```bash
npm test
```

Test credentials after local seed: `examiner@studiospace.test` / `DemoPass123`. The seeded account owns the six example studios. Never seed default accounts in a public production database.
