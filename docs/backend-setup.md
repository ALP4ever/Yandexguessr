# Backend Setup

This repository now contains a backend scaffold in `server/` for a PostgreSQL-backed leaderboard.

## What Was Added

- `server/` with an Express API
- `server/prisma/schema.prisma` with `Player`, `Game`, and `Round`
- `lib/backendApi.ts` with ready-to-use frontend fetch helpers
- `Dockerfile.fullstack` as a future fullstack deployment example

## API Endpoints

- `GET /api/health`
- `POST /api/games`
- `GET /api/leaderboard`

## Local Setup

1. Install frontend dependencies if they are not already installed:

```powershell
npm install
```

2. Install backend dependencies:

```powershell
cd server
npm install
cd ..
```

3. Create environment files:

- Root `.env`:

```env
VITE_YANDEX_MAPS_API_KEY=your-yandex-maps-api-key
VITE_API_BASE_URL=http://localhost:3000
```

- `server/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sakhaguessr?schema=public
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
SERVE_STATIC=false
```

4. Start PostgreSQL locally. The quickest option is Docker:

```powershell
docker run --name sakhaguessr-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=sakhaguessr `
  -p 5432:5432 `
  -d postgres:16-alpine
```

5. Generate the Prisma client and run the first migration:

```powershell
cd server
npm run prisma:generate
npm run prisma:migrate -- --name init_leaderboard
cd ..
```

6. Run the frontend and backend in separate terminals:

- Terminal 1:

```powershell
npm run dev:client
```

- Terminal 2:

```powershell
npm run dev:server
```

7. Verify the API:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

## How To Connect It To The Current Frontend

1. On the final results screen in `App.tsx`, add:
- `playerName`
- `leaderboard`
- `isSubmittingScore`
- `leaderboardError`

2. Import helpers from `lib/backendApi.ts`:

```ts
import { fetchLeaderboard, submitGameResult } from "./lib/backendApi.ts";
```

3. After the user enters a name on the final results screen, call:

```ts
await submitGameResult({
  playerName,
  mode: gameMode,
  rounds: roundHistory.map((round) => ({
    roundNumber: round.roundNumber,
    score: round.score,
    distanceKm: round.distanceKm,
  })),
});
```

4. Then fetch the leaderboard for the current mode:

```ts
const data = await fetchLeaderboard({ mode: gameMode, limit: 20 });
```

5. Render `data.items` in the final results modal.

## Timeweb Deployment Plan

Use your current `Dockerfile` until the backend is fully installed and tested locally.

When you are ready for production:

1. Create a PostgreSQL database in Timeweb Cloud.
2. Copy the connection string into the `DATABASE_URL` environment variable.
3. Add these variables in Timeweb:
- `DATABASE_URL`
- `PORT=3000`
- `HOST=0.0.0.0`
- `SERVE_STATIC=true`
- `CORS_ORIGIN=*`
- `VITE_YANDEX_MAPS_API_KEY=...`

4. Replace the current deployment Dockerfile with `Dockerfile.fullstack`.
5. Build and deploy the container.
6. After the first deploy, open a console in the container and run:

```powershell
cd /app/server
npm run prisma:deploy
```

7. Check:
- `GET /api/health`
- frontend loading
- `POST /api/games`
- `GET /api/leaderboard`

## Recommended Next Step

The scaffold currently supports an MVP leaderboard where the frontend sends round summaries.

If you want protection against cheating later, the next iteration should move round validation to the backend:

- backend creates a session
- backend stores the target coordinates
- frontend submits only guesses
- backend calculates score and writes the final result
