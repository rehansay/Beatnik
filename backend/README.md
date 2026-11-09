# Beatnik API

FastAPI service for the Beatnik React app. The backend serves the Apple Music
Trending chart, proxies Deezer search through RapidAPI, authenticates users,
and persists signed-in users’ collections and playlists in Neon PostgreSQL.

## Local setup

From the repository root, copy `.env.example` to `.env` and configure the
backend-only secrets and service URLs. The backend loads that root `.env` for
local development. Do not commit it or put secrets in `REACT_APP_` variables.

From the repository root, install dependencies and move into `backend`:

```powershell
Set-Location .\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The Alembic migrations create the `users`, `tracks`, `favorites`,
`listening_history`, `playlists`, and `playlist_tracks` tables. To apply future
schema changes, run `python -m alembic upgrade head` from this directory after
updating the backend dependencies.

## Environment variables

- `RAPIDAPI_KEY` and optional `RAPIDAPI_HOST` configure server-side Deezer
  search.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`
  configure Google OAuth. The redirect URI must exactly match Google Cloud
  Console.
- `BEATNIK_JWT_SECRET` signs Beatnik session tokens. Use a long random value.
- `DATABASE_URL` is the Neon PostgreSQL URI. The backend accepts Neon
  `postgresql://` URLs and uses the `psycopg` driver.
- `REACT_APP_FRONTEND_URL` is where Google sign-in returns the browser.
- `BEATNIK_CORS_ORIGINS` is a comma-separated list of allowed frontend origins.

The OAuth and email/password login routes set a one-hour HTTP-only JWT cookie.
`GET /auth/me` returns the active identity and `POST /auth/logout` clears the
cookie. Email passwords are stored as Argon2 hashes using `pwdlib`. Email
addresses are not currently verified. Google sign-in can link to an existing
email account when Google confirms the same verified email address.

## Routes

### Music

- `GET /health` — service health check.
- `GET /api/trending?country=us&limit=50` — Apple Music Top Songs chart.
- `GET /api/search?q=...` — Deezer search. The RapidAPI key remains on the
  backend.

### Authentication

- `GET /auth/google` and `GET /auth/google/callback` — Google OAuth flow.
- `POST /auth/signup` — create an email/password account. Body: `email`,
  `password` (at least 8 characters), and optional `name`.
- `POST /auth/login` — email/password login.
- `GET /auth/me` — return the current JWT identity.
- `POST /auth/logout` — clear the session cookie.

### Signed-in collections

All `/api/me` routes require the Beatnik HTTP-only session cookie.

- `GET /api/me/favorites`
- `POST /api/me/favorites` with a track object
- `DELETE /api/me/favorites/{provider}/{external_id}`
- `GET /api/me/recently-played?limit=10`
- `POST /api/me/recently-played` with a track object

### Playlists

- `GET /api/me/playlists` — list the signed-in user’s playlists.
- `POST /api/me/playlists` — create a playlist with `name` and optional
  `description`.
- `GET /api/me/playlists/{playlist_id}` — get playlist details and tracks.
- `DELETE /api/me/playlists/{playlist_id}` — delete a playlist.
- `POST /api/me/playlists/{playlist_id}/tracks` — add a track object.
- `DELETE /api/me/playlists/{playlist_id}/tracks/{provider}/{external_id}` —
  remove a track.

Playlist operations are scoped to the authenticated user. The React Library
supports playlist creation, deletion, playback, and adding/removing tracks.
The Player screen also has an **Add to playlist** icon for the current track.
Signed-out guests continue using browser storage for Favorites and listening
history; custom playlists require an account.

## Deployment

Deploy this directory as a Python ASGI service with working directory `backend`:

- Install: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port <platform-port>`
- Configure `RAPIDAPI_KEY`, Google OAuth credentials, `BEATNIK_JWT_SECRET`,
  `DATABASE_URL`, `REACT_APP_FRONTEND_URL`, and `BEATNIK_CORS_ORIGINS` in the
  service environment.

Use HTTPS origins in production, update the Google redirect URI to the
deployed callback, and run `alembic upgrade head` as part of deployment before
serving traffic.
