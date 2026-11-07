# Beatnik API

FastAPI service for Beatnik. The React app remains in the repository root.

The backend provides the Trending chart and proxies music searches to Deezer.
The RapidAPI key stays on the server and is not included in the React bundle.

## Run locally

From the repository root, run these PowerShell commands. They first move into
`backend`, so the requirements file and Python app are found correctly:

```powershell
Set-Location .\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The backend reads `RAPIDAPI_KEY` and optionally `RAPIDAPI_HOST` from the process
environment. For local development it also loads the repository-root `.env`.
Use `RAPIDAPI_KEY` and `RAPIDAPI_HOST` there; the previous
`REACT_APP_RAPIDAPI_KEY` and `REACT_APP_RAPIDAPI_HOST` names remain supported
for migration. Do not commit `.env` or expose the key in frontend code.

For deployment, set `RAPIDAPI_KEY` in the backend service's environment. Set
`BEATNIK_CORS_ORIGINS` to a comma-separated list of allowed frontend origins,
for example `https://beatnik.example.com`. The default allows the two local
React development origins.

The health check is available at `http://localhost:8000/health`. The trending
route is `http://localhost:8000/api/trending`; it returns ranked US Top Songs
from Apple's public chart feed. You can request another two-letter storefront
or a smaller chart with `/api/trending?country=in&limit=25`. The React Trending
screen calls this route. Selecting **Preview** looks up a matching Deezer track
and opens it in Beatnik's existing player. Upstream timeouts and invalid
responses return a controlled HTTP 502 instead of crashing the service.
Feed search also uses `/api/search?q=...`, which sends Deezer credentials only
from FastAPI. Set `REACT_APP_BACKEND_URL` in the frontend build environment to
the deployed API base URL; locally it defaults to `http://127.0.0.1:8000`.
