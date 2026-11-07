# Beatnik

Beatnik is a React music discovery app with a FastAPI backend. The frontend
handles the screens and playback; the backend serves trending charts and
forwards search requests to Deezer using a server-side RapidAPI key.

## Run locally

You need Node.js/npm and Python installed. From the repository root, create
your local environment file:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace `RAPIDAPI_KEY` with your RapidAPI key. Keep `.env`
private; it is ignored by Git.

Start the backend in **Terminal 1**:

```powershell
Set-Location .\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Start the frontend in **Terminal 2**, from the repository root:

```powershell
npm install
npm start
```

Open `http://localhost:3000`. Keep both processes running. The frontend uses
`http://127.0.0.1:8000` for the API by default. Check that the backend is
available at `http://127.0.0.1:8000/health`.

## Verify changes

Run the React component and interaction checks from the repository root:

```powershell
npm test -- --watchAll=false --runInBand
```

The current checks cover Feed search states, Favorites persistence and removal,
the Player empty state, and playback continuity while navigating between app
sections.

## Environment settings

| Variable | Used by | Purpose |
| --- | --- | --- |
| `RAPIDAPI_KEY` | Backend | Required key for Deezer search through RapidAPI. |
| `RAPIDAPI_HOST` | Backend | RapidAPI host; defaults to `deezerdevs-deezer.p.rapidapi.com`. |
| `BEATNIK_CORS_ORIGINS` | Backend | Comma-separated exact frontend origins allowed to call the API. Defaults to the two local React origins. |
| `REACT_APP_BACKEND_URL` | Frontend build | Base URL for FastAPI. Defaults to `http://127.0.0.1:8000`. |

Only put public configuration in `REACT_APP_` variables. React embeds those
values into the browser build, so never put API keys or other secrets there.

## Deployment

Deploy the React `build` output as a static site and run `backend/` as a Python
ASGI web service. Configure the service settings as follows:

**Frontend static site**

- Build command: `npm install && npm run build`
- Publish directory: `build`
- Build environment variable: `REACT_APP_BACKEND_URL=https://<your-api-domain>`
- Configure a single-page-app fallback so unknown paths serve `/index.html`;
  this lets React Router routes such as `/trending` work after a page refresh.

**FastAPI web service**

- Root directory: `backend` (or set the service working directory to it)
- Install command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port <platform-port>`
- Runtime environment variables: `RAPIDAPI_KEY` and
  `BEATNIK_CORS_ORIGINS=https://<your-frontend-domain>`
- Add `RAPIDAPI_HOST` only if using a non-default RapidAPI host.

Use the actual HTTPS origins assigned by your host, with no path or trailing
slash. If a custom domain or preview domain also needs access, add each exact
origin as a comma-separated value. Set the frontend API URL and backend CORS
origins to match the deployed services, then redeploy both so the settings take
effect. Verify `/health`, `/api/trending`, and a Feed search on the live site.

See [backend/README.md](backend/README.md) for the API routes and backend
details.
