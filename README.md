# Beatnik

Beatnik is a React music discovery and preview app with a FastAPI backend and a
Neon PostgreSQL database. It uses Apple’s public Top Songs feed for Trending
and Deezer search through RapidAPI for playable previews.

## Features

- Search music and browse the Apple Music Trending chart.
- Preview tracks with persistent playback controls.
- Sign in with Google or create an account with email and password.
- Save favorites and listening history to Neon while signed in. Guests keep
  using browser storage.
- Create playlists in Library, add or remove saved tracks, and play playlists.
- Add the current track to a playlist from the Player screen.
- Beatnik logo in the top bar, with Feed, Trending, Player, Favorites, Library,
  and Account navigation in the left sidebar.

## Run locally

You need Node.js/npm and Python. From the repository root, create the local
environment file:

```powershell
Copy-Item .env.example .env
```

Fill in the private values in `.env`: RapidAPI credentials, Google OAuth
credentials, a random `BEATNIK_JWT_SECRET`, and the Neon `DATABASE_URL`. Keep
this file private and out of Git. The Google redirect URI must match the URI
registered in Google Cloud Console.

Install backend dependencies, apply database migrations, and start FastAPI in
**Terminal 1**:

```powershell
Set-Location .\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Start the React app in **Terminal 2**, from the repository root:

```powershell
npm install
npm start
```

Open `http://localhost:3000`. The local API base URL is
`http://localhost:8000`; check that the backend is available at
`http://localhost:8000/health`.

## API overview

- `GET /api/trending` — Apple Music chart.
- `GET /api/search?q=...` — Deezer search through RapidAPI.
- `/auth/google`, `/auth/signup`, `/auth/login`, `/auth/me`, `/auth/logout` —
  account sign-in and session routes.
- `/api/me/favorites`, `/api/me/recently-played` — account collections.
- `/api/me/playlists` — account playlists and playlist tracks.

See [backend/README.md](backend/README.md) for request details and migration
instructions.

## Regression checks

Run the frontend regression suite from the repository root:

```powershell
npm test -- --watchAll=false --runInBand
```

The starter suite covers Feed search states, Favorites persistence and removal,
the Player empty state, and playback continuity while navigating between app
sections. Backend authentication, database, and playlist flows do not yet have
automated regression tests.

## Configuration

| Variable | Used by | Purpose |
| --- | --- | --- |
| `RAPIDAPI_KEY` | Backend | Required RapidAPI key for Deezer search. |
| `RAPIDAPI_HOST` | Backend | RapidAPI host; defaults to `deezerdevs-deezer.p.rapidapi.com`. |
| `GOOGLE_CLIENT_ID` | Backend | Google OAuth web client ID. |
| `GOOGLE_CLIENT_SECRET` | Backend | Google OAuth secret; keep private. |
| `GOOGLE_REDIRECT_URI` | Backend | OAuth callback registered in Google Cloud Console. |
| `BEATNIK_JWT_SECRET` | Backend | Signing key for Beatnik JWT sessions. |
| `DATABASE_URL` | Backend | Neon PostgreSQL connection string; keep private. |
| `REACT_APP_FRONTEND_URL` | Backend | Frontend destination after Google sign-in. |
| `BEATNIK_CORS_ORIGINS` | Backend | Comma-separated allowed frontend origins. |
| `REACT_APP_BACKEND_URL` | Frontend build | FastAPI base URL; defaults to `http://localhost:8000`. |

Only put public configuration in `REACT_APP_` variables. React embeds these
values in the browser build, so secrets must stay in backend environment
variables.

## Current limitations

- Email addresses are not verified, and password reset is not implemented.
- JWT sessions expire after one hour; there is no refresh-token flow.
- Existing guest favorites and listening history are not imported into an
  account automatically.
- Playlists can be created, deleted, and populated, but not renamed or
  reordered.
- Offline downloads are not supported.
