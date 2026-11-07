# Beatnik API

FastAPI service for Beatnik. The React app remains in the repository root.

## Run locally

From the repository root, run these PowerShell commands. They first move into
`backend`, so the requirements file and Python app are found correctly:

```powershell
Set-Location .\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The health check is available at `http://localhost:8000/health`. The trending
route is `http://localhost:8000/api/trending`; it returns ranked US Top Songs
from Apple's public chart feed. You can request another two-letter storefront
or a smaller chart with `/api/trending?country=in&limit=25`. The React Trending
screen calls this route. Selecting **Preview** looks up a matching Deezer track
and opens it in Beatnik's existing player. Upstream timeouts and invalid
responses return a controlled HTTP 502 instead of crashing the service.
