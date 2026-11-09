import asyncio
import hmac
import json
import os
import re
import secrets
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import jwt
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request as FastAPIRequest
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

from .auth import authenticate_email_user, create_access_token, create_email_user, create_or_link_google_user
from .auth_schemas import EmailLoginInput, EmailSignupInput
from .collections import (
    add_favorite,
    add_listening_event,
    get_or_create_user,
    list_favorites,
    list_recent,
    remove_favorite,
)
from .database import get_db
from .schemas import PlaylistInput, TrackInput
from .playlists import (
    add_playlist_track,
    create_playlist,
    delete_playlist,
    get_owned_playlist,
    list_playlists,
    remove_playlist_track,
    serialize_playlist,
)


APPLE_TOP_SONGS_URL = "https://rss.applemarketingtools.com/api/v2/{country}/music/most-played/{limit}/songs.json"
DEEZER_SEARCH_URL = "https://deezerdevs-deezer.p.rapidapi.com/search"
UPSTREAM_TIMEOUT_SECONDS = 12
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
AUTH_COOKIE_NAME = "beatnik_access_token"
OAUTH_STATE_COOKIE_NAME = "beatnik_oauth_state"

# Load the repository-root .env for local development. Deployed services should
# provide these values through their environment configuration.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

app = FastAPI(title="Beatnik API", version="0.1.0")

allowed_origins = os.getenv(
    "BEATNIK_CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip().rstrip("/") for origin in allowed_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
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


def _auth_config():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    if not all((client_id, client_secret)):
        raise HTTPException(status_code=503, detail="Google sign-in is not configured on the server.")
    return client_id, client_secret, redirect_uri, _jwt_signing_secret()


def _jwt_signing_secret():
    jwt_secret = os.getenv("BEATNIK_JWT_SECRET")
    if not jwt_secret:
        raise HTTPException(status_code=503, detail="Authentication is not configured on the server.")
    return jwt_secret


def _set_auth_cookie(response, token: str, request: FastAPIRequest, secure: bool | None = None):
    response.set_cookie(
        AUTH_COOKIE_NAME,
        token,
        httponly=True,
        secure=request.url.scheme == "https" if secure is None else secure,
        samesite="lax",
        max_age=3600,
        path="/",
    )


def _exchange_google_code(code: str, client_id: str, client_secret: str, redirect_uri: str):
    payload = urlencode({
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }).encode("utf-8")
    request = Request(
        GOOGLE_TOKEN_URL,
        data=payload,
        headers={"Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urlopen(request, timeout=UPSTREAM_TIMEOUT_SECONDS) as response:
        token_response = json.loads(response.read().decode("utf-8"))
    if not isinstance(token_response, dict) or not token_response.get("id_token"):
        raise ValueError("Google did not return an ID token.")
    return token_response["id_token"]


@app.get("/auth/google")
async def google_login():
    client_id, _, redirect_uri, _ = _auth_config()
    state = secrets.token_urlsafe(32)
    query = urlencode({
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    })
    response = RedirectResponse(f"{GOOGLE_AUTH_URL}?{query}", status_code=302)
    response.set_cookie(
        OAUTH_STATE_COOKIE_NAME,
        state,
        httponly=True,
        secure=redirect_uri.startswith("https://"),
        samesite="lax",
        max_age=600,
    )
    return response


@app.get("/auth/google/callback")
async def google_callback(
    request: FastAPIRequest,
    code: str = "",
    state: str = "",
    error: str = "",
    session: Session = Depends(get_db),
):
    client_id, client_secret, redirect_uri, jwt_secret = _auth_config()
    frontend_url = os.getenv("REACT_APP_FRONTEND_URL", "http://localhost:3000").rstrip("/")
    response = RedirectResponse(f"{frontend_url}/auth/callback", status_code=302)
    state_cookie = request.cookies.get(OAUTH_STATE_COOKIE_NAME, "")
    response.delete_cookie(OAUTH_STATE_COOKIE_NAME, samesite="lax")
    if error or not code or not state or not state_cookie or not hmac.compare_digest(state, state_cookie):
        response = RedirectResponse(f"{frontend_url}/auth/callback?error=google_sign_in_failed", status_code=302)
        response.delete_cookie(OAUTH_STATE_COOKIE_NAME, samesite="lax")
        return response

    try:
        google_id_token = await asyncio.to_thread(
            _exchange_google_code, code, client_id, client_secret, redirect_uri
        )
        claims = await asyncio.to_thread(
            id_token.verify_oauth2_token, google_id_token, GoogleRequest(), client_id
        )
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, GoogleAuthError, jwt.PyJWTError):
        return RedirectResponse(f"{frontend_url}/auth/callback?error=google_sign_in_failed", status_code=302)

    if not claims.get("sub") or not claims.get("email_verified"):
        return RedirectResponse(f"{frontend_url}/auth/callback?error=google_sign_in_failed", status_code=302)

    try:
        user = create_or_link_google_user(session, claims)
    except HTTPException:
        return RedirectResponse(f"{frontend_url}/auth/callback?error=google_sign_in_failed", status_code=302)
    access_token = create_access_token(user, jwt_secret)
    _set_auth_cookie(response, access_token, request, secure=redirect_uri.startswith("https://"))
    return response


def get_current_claims(request: FastAPIRequest) -> dict:
    jwt_secret = _jwt_signing_secret()
    token = request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in.")
    try:
        return jwt.decode(token, jwt_secret, algorithms=["HS256"], issuer="beatnik")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session is invalid or expired.") from None


@app.get("/auth/me")
async def current_user(claims: dict = Depends(get_current_claims)):
    return claims


@app.post("/auth/signup")
def signup_with_email(
    credentials: EmailSignupInput,
    request: FastAPIRequest,
    session: Session = Depends(get_db),
):
    user = create_email_user(session, str(credentials.email), credentials.password, credentials.name)
    token = create_access_token(user, _jwt_signing_secret())
    response = JSONResponse({"user": {"id": user.id, "email": user.email, "name": user.display_name}})
    _set_auth_cookie(response, token, request)
    return response


@app.post("/auth/login")
def login_with_email(
    credentials: EmailLoginInput,
    request: FastAPIRequest,
    session: Session = Depends(get_db),
):
    user = authenticate_email_user(session, str(credentials.email), credentials.password)
    token = create_access_token(user, _jwt_signing_secret())
    response = JSONResponse({"user": {"id": user.id, "email": user.email, "name": user.display_name}})
    _set_auth_cookie(response, token, request)
    return response


@app.post("/auth/logout")
async def logout():
    response = JSONResponse({"ok": True})
    response.delete_cookie(
        AUTH_COOKIE_NAME,
        path="/",
        samesite="lax",
        secure=os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000").startswith("https://"),
        httponly=True,
    )
    return response


@app.get("/api/me/favorites")
def get_favorites(
    claims: dict = Depends(get_current_claims),
    session: Session = Depends(get_db),
):
    user = get_or_create_user(session, claims)
    result = list_favorites(session, user.id)
    session.commit()
    return {"data": result}


@app.post("/api/me/favorites")
def create_favorite(
    track: TrackInput,
    claims: dict = Depends(get_current_claims),
    session: Session = Depends(get_db),
):
    user = get_or_create_user(session, claims)
    return {"data": add_favorite(session, user.id, track)}


@app.delete("/api/me/favorites/{provider}/{external_id}")
def delete_favorite(
    provider: str,
    external_id: str,
    claims: dict = Depends(get_current_claims),
    session: Session = Depends(get_db),
):
    user = get_or_create_user(session, claims)
    return {"data": remove_favorite(session, user.id, provider, external_id)}


@app.get("/api/me/recently-played")
def get_recently_played(
    limit: int = Query(default=10, ge=1, le=50),
    claims: dict = Depends(get_current_claims),
    session: Session = Depends(get_db),
):
    user = get_or_create_user(session, claims)
    result = list_recent(session, user.id, limit)
    session.commit()
    return {"data": result}


@app.post("/api/me/recently-played")
def record_played_track(
    track: TrackInput,
    claims: dict = Depends(get_current_claims),
    session: Session = Depends(get_db),
):
    user = get_or_create_user(session, claims)
    return {"data": add_listening_event(session, user.id, track)}


@app.get("/api/me/playlists")
def get_playlists(
    claims: dict = Depends(get_current_claims),
    session: Session = Depends(get_db),
):
    user = get_or_create_user(session, claims)
    result = list_playlists(session, user.id)
    session.commit()
    return {"data": result}


@app.post("/api/me/playlists")
def post_playlist(
    playlist: PlaylistInput,
    claims: dict = Depends(get_current_claims),
    session: Session = Depends(get_db),
):
    user = get_or_create_user(session, claims)
    return {"data": create_playlist(session, user.id, playlist)}


@app.get("/api/me/playlists/{playlist_id}")
def get_playlist(
    playlist_id: int,
    claims: dict = Depends(get_current_claims),
    session: Session = Depends(get_db),
):
    user = get_or_create_user(session, claims)
    return {"data": serialize_playlist(get_owned_playlist(session, user.id, playlist_id))}


@app.delete("/api/me/playlists/{playlist_id}")
def remove_playlist(
    playlist_id: int,
    claims: dict = Depends(get_current_claims),
    session: Session = Depends(get_db),
):
    user = get_or_create_user(session, claims)
    delete_playlist(session, user.id, playlist_id)
    return {"ok": True}


@app.post("/api/me/playlists/{playlist_id}/tracks")
def post_playlist_track(
    playlist_id: int,
    track: TrackInput,
    claims: dict = Depends(get_current_claims),
    session: Session = Depends(get_db),
):
    user = get_or_create_user(session, claims)
    return {"data": add_playlist_track(session, user.id, playlist_id, track)}


@app.delete("/api/me/playlists/{playlist_id}/tracks/{provider}/{external_id}")
def delete_playlist_track(
    playlist_id: int,
    provider: str,
    external_id: str,
    claims: dict = Depends(get_current_claims),
    session: Session = Depends(get_db),
):
    user = get_or_create_user(session, claims)
    return {
        "data": remove_playlist_track(session, user.id, playlist_id, provider, external_id)
    }


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


def _load_deezer_search(query: str):
    api_key = os.getenv("RAPIDAPI_KEY") or os.getenv("REACT_APP_RAPIDAPI_KEY")
    api_host = os.getenv("RAPIDAPI_HOST") or os.getenv(
        "REACT_APP_RAPIDAPI_HOST", "deezerdevs-deezer.p.rapidapi.com"
    )
    if not api_key:
        raise HTTPException(status_code=503, detail="Music search is not configured.")

    request = Request(
        f"{DEEZER_SEARCH_URL}?{urlencode({'q': query})}",
        headers={
            "Accept": "application/json",
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": api_host,
        },
    )
    with urlopen(request, timeout=UPSTREAM_TIMEOUT_SECONDS) as response:
        if response.status != 200:
            raise HTTPException(status_code=502, detail="The music search service returned an error.")
        return json.loads(response.read().decode("utf-8"))


@app.get("/api/search")
async def search_tracks(q: str = Query(min_length=1, max_length=200)):
    query = q.strip()
    if not query:
        raise HTTPException(status_code=422, detail="Search query cannot be empty.")

    try:
        result = await asyncio.to_thread(_load_deezer_search, query)
    except HTTPException:
        raise
    except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="Music search is temporarily unavailable.") from None

    if not isinstance(result, dict) or not isinstance(result.get("data"), list):
        raise HTTPException(status_code=502, detail="The music search response was not in the expected format.")
    return result
