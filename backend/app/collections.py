from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from .models import Favorite, ListeningHistory, Track, User, utc_now
from .schemas import TrackInput


def get_or_create_user(session: Session, claims: dict) -> User:
    google_sub = claims.get("google_sub") or claims.get("sub")
    email = claims.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="The signed-in account has no usable identity.")

    user_id = claims.get("uid")
    user = session.get(User, int(user_id)) if user_id is not None else None
    if user is None and google_sub:
        user = session.scalar(select(User).where(User.google_sub == google_sub))
    if user is None:
        raise HTTPException(status_code=401, detail="The signed-in account no longer exists.")
    user.email = email
    user.display_name = claims.get("name")
    user.picture_url = claims.get("picture")
    session.flush()
    return user


def get_or_create_track(session: Session, incoming: TrackInput) -> Track:
    provider = incoming.provider.strip().lower()
    if not provider or not str(incoming.id).strip():
        raise HTTPException(status_code=422, detail="Track provider and ID are required.")

    external_id = str(incoming.id)
    track = session.scalar(
        select(Track).where(Track.provider == provider, Track.external_id == external_id)
    )
    payload = incoming.model_dump(mode="json", exclude_none=True)
    artist = incoming.artist or {}
    album = incoming.album or {}
    if track is None:
        track = Track(provider=provider, external_id=external_id, title=incoming.title)
        session.add(track)
    track.title = incoming.title
    track.artist_name = artist.get("name")
    track.album_title = album.get("title")
    track.preview_url = incoming.preview
    extra = incoming.model_extra or {}
    track.artwork_url = (
        album.get("cover_medium")
        or album.get("cover")
        or (incoming.artist or {}).get("picture_medium")
        or extra.get("artworkUrl100")
    )
    track.payload = payload
    session.flush()
    return track


def serialize_track(track: Track) -> dict:
    return {**(track.payload or {}), "id": track.external_id, "provider": track.provider}


def list_favorites(session: Session, user_id: int) -> list[dict]:
    records = session.scalars(
        select(Favorite).options(joinedload(Favorite.track))
        .where(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc(), Favorite.id.desc())
    )
    return [serialize_track(record.track) for record in records]


def add_favorite(session: Session, user_id: int, incoming: TrackInput) -> list[dict]:
    track = get_or_create_track(session, incoming)
    favorite = session.scalar(
        select(Favorite).where(Favorite.user_id == user_id, Favorite.track_id == track.id)
    )
    if favorite is None:
        session.add(Favorite(user_id=user_id, track_id=track.id))
    session.commit()
    return list_favorites(session, user_id)


def remove_favorite(session: Session, user_id: int, provider: str, external_id: str) -> list[dict]:
    track_id = session.scalar(
        select(Track.id).where(Track.provider == provider.lower(), Track.external_id == external_id)
    )
    if track_id is not None:
        session.execute(delete(Favorite).where(Favorite.user_id == user_id, Favorite.track_id == track_id))
        session.commit()
    return list_favorites(session, user_id)


def add_listening_event(session: Session, user_id: int, incoming: TrackInput) -> list[dict]:
    track = get_or_create_track(session, incoming)
    session.add(ListeningHistory(user_id=user_id, track_id=track.id, played_at=utc_now()))
    session.commit()
    return list_recent(session, user_id, 10)


def list_recent(session: Session, user_id: int, limit: int) -> list[dict]:
    records = session.scalars(
        select(ListeningHistory).options(joinedload(ListeningHistory.track))
        .where(ListeningHistory.user_id == user_id)
        .order_by(ListeningHistory.played_at.desc(), ListeningHistory.id.desc())
        .limit(limit)
    )
    seen = set()
    tracks = []
    for record in records:
        identity = (record.track.provider, record.track.external_id)
        if identity not in seen:
            seen.add(identity)
            tracks.append(serialize_track(record.track))
    return tracks
