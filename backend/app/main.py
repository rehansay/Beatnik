import asyncio
import json
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware


APPLE_TOP_SONGS_URL = "https://rss.applemarketingtools.com/api/v2/{country}/music/most-played/{limit}/songs.json"
UPSTREAM_TIMEOUT_SECONDS = 12

app = FastAPI(title="Beatnik API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def _load_apple_chart(country: str, limit: int):
    request = Request(
        APPLE_TOP_SONGS_URL.format(country=country, limit=limit),
        headers={"Accept": "application/json", "User-Agent": "Beatnik/0.1"},
    )

    with urlopen(request, timeout=UPSTREAM_TIMEOUT_SECONDS) as response:
        if response.status != 200:
            raise HTTPException(
                status_code=502,
                detail="The music chart service returned an error.",
            )
        return json.loads(response.read().decode("utf-8"))


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/trending")
async def get_trending(
    country: str = Query(default="us", min_length=2, max_length=2),
    limit: int = Query(default=50, ge=1, le=100),
):
    country = country.lower()
    if not re.fullmatch(r"[a-z]{2}", country):
        raise HTTPException(status_code=422, detail="Country must be a two-letter code.")

    try:
        chart = await asyncio.to_thread(_load_apple_chart, country, limit)
    except HTTPException:
        raise
    except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError):
        raise HTTPException(
            status_code=502,
            detail="Trending tracks are temporarily unavailable.",
        ) from None

    feed = chart.get("feed") if isinstance(chart, dict) else None
    results = feed.get("results") if isinstance(feed, dict) else None
    if not isinstance(results, list):
        raise HTTPException(
            status_code=502,
            detail="The music chart response was not in the expected format.",
        )

    tracks = []
    for rank, item in enumerate(results, start=1):
        if not isinstance(item, dict) or not item.get("name") or not item.get("artistName"):
            continue

        tracks.append(
            {
                "rank": rank,
                "id": str(item.get("id") or item.get("url") or rank),
                "name": item["name"],
                "artistName": item["artistName"],
                "artworkUrl100": item.get("artworkUrl100"),
                "url": item.get("url"),
            }
        )

    return {"country": country.upper(), "source": "Apple Music Top Songs", "data": tracks}
