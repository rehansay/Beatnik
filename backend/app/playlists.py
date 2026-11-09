from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from .collections import get_or_create_track, serialize_track
from .models import Playlist, PlaylistTrack, Track
from .schemas import PlaylistInput, TrackInput


def list_playlists(session: Session, user_id: int) -> list[dict]:
    playlists = session.scalars(
        select(Playlist).options(selectinload(Playlist.entries))
        .where(Playlist.user_id == user_id)
        .order_by(Playlist.created_at.desc(), Playlist.id.desc())
    )
    return [
        {
            "id": playlist.id,
            "name": playlist.name,
            "description": playlist.description,
            "trackCount": len(playlist.entries),
        }
        for playlist in playlists
    ]


def get_owned_playlist(session: Session, user_id: int, playlist_id: int) -> Playlist:
    playlist = session.scalars(
        select(Playlist).options(
            joinedload(Playlist.entries).joinedload(PlaylistTrack.track)
        ).where(Playlist.id == playlist_id, Playlist.user_id == user_id)
    ).unique().first()
    if playlist is None:
        raise HTTPException(status_code=404, detail="Playlist not found.")
    return playlist


def serialize_playlist(playlist: Playlist) -> dict:
    return {
        "id": playlist.id,
        "name": playlist.name,
        "description": playlist.description,
        "tracks": [serialize_track(entry.track) for entry in sorted(playlist.entries, key=lambda item: item.position)],
    }


def create_playlist(session: Session, user_id: int, incoming: PlaylistInput) -> dict:
    name = incoming.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Playlist name cannot be empty.")
    playlist = Playlist(user_id=user_id, name=name, description=incoming.description)
    session.add(playlist)
    session.commit()
    session.refresh(playlist)
    return serialize_playlist(playlist)


def delete_playlist(session: Session, user_id: int, playlist_id: int) -> None:
    playlist = get_owned_playlist(session, user_id, playlist_id)
    session.delete(playlist)
    session.commit()


def add_playlist_track(session: Session, user_id: int, playlist_id: int, incoming: TrackInput) -> dict:
    playlist = get_owned_playlist(session, user_id, playlist_id)
    track = get_or_create_track(session, incoming)
    existing = session.scalar(
        select(PlaylistTrack).where(
            PlaylistTrack.playlist_id == playlist.id,
            PlaylistTrack.track_id == track.id,
        )
    )
    if existing is None:
        position = session.scalar(
            select(func.max(PlaylistTrack.position)).where(PlaylistTrack.playlist_id == playlist.id)
        )
        session.add(PlaylistTrack(playlist_id=playlist.id, track_id=track.id, position=(position or 0) + 1))
        session.commit()
    return serialize_playlist(get_owned_playlist(session, user_id, playlist_id))


def remove_playlist_track(
    session: Session,
    user_id: int,
    playlist_id: int,
    provider: str,
    external_id: str,
) -> dict:
    playlist = get_owned_playlist(session, user_id, playlist_id)
    track = session.scalar(
        select(Track).where(Track.provider == provider.lower(), Track.external_id == external_id)
    )
    if track is not None:
        entry = session.scalar(
            select(PlaylistTrack).where(
                PlaylistTrack.playlist_id == playlist.id,
                PlaylistTrack.track_id == track.id,
            )
        )
        if entry is not None:
            session.delete(entry)
            session.commit()
    return serialize_playlist(get_owned_playlist(session, user_id, playlist_id))
