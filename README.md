# School Van Tracker (MVP)

## Recommended Windows start

Double-click `START VAN TRACKER.cmd` in the project folder. It checks the dedicated SchoolRide database, backend, and frontend, starts anything missing, writes diagnostics to `logs/`, and opens `http://localhost:5173`.

A straightforward Node.js + PostgreSQL system for:
- live van tracking
- route history recording
- child pickup/dropoff registration
- stop/place registration (including places not on Google Maps)

## Tech stack
- Backend: Node.js, Express, Prisma, PostgreSQL
- Realtime: WebSocket
- Frontend: React + Vite + Leaflet + OpenStreetMap
- Database image: PostGIS-enabled PostgreSQL

## 1) Start with Docker

```bash
docker compose up --build
```

Services:
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`
- Postgres: `localhost:5432`

## 2) Initialize database + seed (first run)

In a new terminal:

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run seed
```

Local PostgreSQL first-run default in this project:
- host: `localhost`
- user: `postgres`
- password: `pri372#nce`
- db: `van_tracker`

Note: in `DATABASE_URL`, `#` must be URL-encoded as `%23` (already set in `.env.example`).

Seed credentials:
- Admin login: `admin@school.com` / `admin1234`
- Van `x-device-key`: `van-device-key-001`

## 3) Simulate van telemetry

Send GPS points from tracker/phone:

```bash
curl -X POST http://localhost:4000/api/telemetry \
  -H "Content-Type: application/json" \
  -H "x-device-key: van-device-key-001" \
  -d "{\"lat\":-1.286389,\"lon\":36.817223,\"speed\":32}"
```

## 4) Main API endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/vans`
- `GET /api/vans/:vanId/track`
- `POST /api/telemetry` (device auth via `x-device-key`)
- `GET /api/stops-places`
- `POST /api/stops-places`
- `GET /api/children`
- `POST /api/children`
- `GET /api/trips`
- `POST /api/trips`
- `POST /api/trips/:tripId/child-events`
- `GET /api/trips/:tripId/summary`

## 5) How unknown places are handled

When staff registers child events, backend tries to match the nearest existing stop within `PROXIMITY_RADIUS_METERS` (default 200m).  
If no stop is near, the UI indicates no match so staff can create a new stop at the current van location.
