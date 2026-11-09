import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCompactDisc,
  FaDownload,
  FaHeart,
  FaList,
  FaMusic,
  FaPlay,
  FaPlus,
  FaTrash,
  FaUser,
} from 'react-icons/fa';
import backend from '../../api/backend';
import { usePlayer } from '../../context/PlayerContext';
import './library.css';

const sections = [
  { id: 'playlists', label: 'Playlists', icon: <FaList aria-hidden="true" /> },
  { id: 'artists', label: 'Artists', icon: <FaUser aria-hidden="true" /> },
  { id: 'albums', label: 'Albums', icon: <FaCompactDisc aria-hidden="true" /> },
  { id: 'songs', label: 'Songs', icon: <FaMusic aria-hidden="true" /> },
  { id: 'downloaded', label: 'Downloaded', icon: <FaDownload aria-hidden="true" /> },
];

function Library() {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(
    () => searchParams.get('section') === 'playlists' ? 'playlists' : 'songs'
  );
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState('');
  const navigate = useNavigate();
  const { favorites, recentlyPlayed, selectQueue, sessionUser } = usePlayer();

  useEffect(() => {
    if (activeSection !== 'playlists' || !sessionUser) return undefined;
    let isActive = true;
    setPlaylistLoading(true);
    backend.get('/api/me/playlists')
      .then((response) => {
        if (isActive) setPlaylists(response.data?.data || []);
      })
      .catch(() => {
        if (isActive) setPlaylistError('Could not load your playlists. Please try again.');
      })
      .finally(() => {
        if (isActive) setPlaylistLoading(false);
      });
    return () => { isActive = false; };
  }, [activeSection, sessionUser]);

  const tracksById = new Map();
  [...favorites, ...recentlyPlayed].forEach((track) => {
    if (track?.id != null) tracksById.set(String(track.id), track);
  });
  const libraryTracks = Array.from(tracksById.values());

  const artists = new Map();
  const albums = new Map();
  libraryTracks.forEach((track) => {
    const artistName = track.artist?.name || 'Unknown artist';
    const artistKey = String(track.artist?.id || artistName);
    if (!artists.has(artistKey)) artists.set(artistKey, { name: artistName, tracks: [] });
    artists.get(artistKey).tracks.push(track);

    const albumName = track.album?.title || 'Unknown album';
    const albumKey = String(track.album?.id || `${artistKey}-${albumName}`);
    if (!albums.has(albumKey)) albums.set(albumKey, { name: albumName, artist: artistName, tracks: [] });
    albums.get(albumKey).tracks.push(track);
  });

  const playTracks = (queue, index = 0) => {
    selectQueue(queue, index);
    navigate('/player');
  };

  const renderEmptyState = (title, message) => (
    <div className="library-empty-state">
      <FaMusic aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      <button type="button" onClick={() => navigate('/')}>Explore music</button>
    </div>
  );

  const renderSongs = (songs) => (
    <div className="library-song-list">
      {songs.map((track, index) => (
        <button
          className="library-song-row"
          key={track.id}
          type="button"
          onClick={() => playTracks(songs, index)}
        >
          <img src={track.album?.cover_medium} alt="" loading="lazy" />
          <span className="library-song-copy">
            <strong>{track.title || 'Untitled track'}</strong>
            <span>{track.artist?.name || 'Unknown artist'}</span>
          </span>
          <FaPlay className="library-row-play" aria-hidden="true" />
        </button>
      ))}
    </div>
  );

  const openPlaylist = async (playlistId) => {
    setPlaylistError('');
    try {
      const response = await backend.get(`/api/me/playlists/${playlistId}`);
      setSelectedPlaylist(response.data?.data || null);
    } catch {
      setPlaylistError('Could not open this playlist. Please try again.');
    }
  };

  const createPlaylist = async (event) => {
    event.preventDefault();
    if (!playlistName.trim()) return;
    setPlaylistLoading(true);
    setPlaylistError('');
    try {
      const response = await backend.post('/api/me/playlists', {
        name: playlistName.trim(),
        description: playlistDescription.trim() || null,
      });
      const created = response.data?.data;
      setPlaylists((current) => [{ ...created, trackCount: 0 }, ...current]);
      setSelectedPlaylist(created);
      setPlaylistName('');
      setPlaylistDescription('');
      setShowPlaylistForm(false);
    } catch (requestError) {
      setPlaylistError(requestError.response?.data?.detail || 'Could not create your playlist.');
    } finally {
      setPlaylistLoading(false);
    }
  };

  const deletePlaylist = async (playlistId) => {
    setPlaylistError('');
    try {
      await backend.delete(`/api/me/playlists/${playlistId}`);
      setPlaylists((current) => current.filter((playlist) => playlist.id !== playlistId));
      if (selectedPlaylist?.id === playlistId) setSelectedPlaylist(null);
    } catch {
      setPlaylistError('Could not delete this playlist. Please try again.');
    }
  };

  const addTrackToPlaylist = async (track) => {
    if (!selectedPlaylist) return;
    setPlaylistError('');
    try {
      const response = await backend.post(
        `/api/me/playlists/${selectedPlaylist.id}/tracks`,
        track
      );
      const updated = response.data?.data;
      setSelectedPlaylist(updated);
      setPlaylists((current) => current.map((playlist) => (
        playlist.id === updated.id ? { ...playlist, trackCount: updated.tracks.length } : playlist
      )));
    } catch {
      setPlaylistError('Could not add this song to the playlist.');
    }
  };

  const removeTrackFromPlaylist = async (track) => {
    if (!selectedPlaylist) return;
    setPlaylistError('');
    try {
      const response = await backend.delete(
        `/api/me/playlists/${selectedPlaylist.id}/tracks/${encodeURIComponent(track.provider || 'deezer')}/${encodeURIComponent(track.id)}`
      );
      const updated = response.data?.data;
      setSelectedPlaylist(updated);
      setPlaylists((current) => current.map((playlist) => (
        playlist.id === updated.id ? { ...playlist, trackCount: updated.tracks.length } : playlist
      )));
    } catch {
      setPlaylistError('Could not remove this song from the playlist.');
    }
  };

  const renderSection = () => {
    if (activeSection === 'playlists') {
      if (!sessionUser) {
        return (
          <div className="library-empty-state">
            <FaList aria-hidden="true" />
            <h2>Sign in to create playlists</h2>
            <p>Your custom playlists are saved to your Beatnik account.</p>
            <button type="button" onClick={() => navigate('/auth')}>Sign in or create account</button>
          </div>
        );
      }

      if (selectedPlaylist) {
        const playlistTrackIds = new Set(selectedPlaylist.tracks.map((item) => `${item.provider || 'deezer'}:${item.id}`));
        return (
          <div className="library-playlist-detail">
            {playlistError && <p className="library-playlist-error" role="alert">{playlistError}</p>}
            <button className="library-playlist-back" type="button" onClick={() => setSelectedPlaylist(null)}>
              <FaArrowLeft aria-hidden="true" /> All playlists
            </button>
            <div className="library-playlist-detail-heading">
              <div>
                <h3>{selectedPlaylist.name}</h3>
                {selectedPlaylist.description && <p>{selectedPlaylist.description}</p>}
              </div>
              <button
                className="library-playlist-play"
                type="button"
                disabled={!selectedPlaylist.tracks.length}
                onClick={() => playTracks(selectedPlaylist.tracks)}
              >
                <FaPlay aria-hidden="true" /> Play playlist
              </button>
            </div>
            {selectedPlaylist.tracks.length ? (
              <div className="library-song-list">
                {selectedPlaylist.tracks.map((track, index) => (
                  <div className="library-playlist-track" key={`${track.provider}-${track.id}`}>
                    <button className="library-song-row" type="button" onClick={() => playTracks(selectedPlaylist.tracks, index)}>
                      <img src={track.album?.cover_medium} alt="" loading="lazy" />
                      <span className="library-song-copy">
                        <strong>{track.title || 'Untitled track'}</strong>
                        <span>{track.artist?.name || 'Unknown artist'}</span>
                      </span>
                      <FaPlay className="library-row-play" aria-hidden="true" />
                    </button>
                    <button className="library-playlist-remove-track" type="button" onClick={() => removeTrackFromPlaylist(track)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : <p className="library-section-note">This playlist is empty. Add songs from your library below.</p>}
            {libraryTracks.length > 0 && (
              <div className="library-playlist-add">
                <h4>Add songs from your library</h4>
                {libraryTracks.map((track) => {
                  const identity = `${track.provider || 'deezer'}:${track.id}`;
                  const alreadyAdded = playlistTrackIds.has(identity);
                  return (
                    <div className="library-playlist-add-row" key={identity}>
                      <span><strong>{track.title || 'Untitled track'}</strong><small>{track.artist?.name || 'Unknown artist'}</small></span>
                      <button type="button" disabled={alreadyAdded} onClick={() => addTrackToPlaylist(track)}>
                        <FaPlus aria-hidden="true" /> {alreadyAdded ? 'Added' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="library-playlists">
          {playlistError && <p className="library-playlist-error" role="alert">{playlistError}</p>}
          <div className="library-playlist-toolbar">
            <p>Create playlists and organize songs from your library.</p>
            <button type="button" onClick={() => setShowPlaylistForm((open) => !open)}>
              <FaPlus aria-hidden="true" /> New playlist
            </button>
          </div>
          {showPlaylistForm && (
            <form className="library-playlist-form" onSubmit={createPlaylist}>
              <label>Playlist name<input value={playlistName} onChange={(event) => setPlaylistName(event.target.value)} maxLength={100} required /></label>
              <label>Description (optional)<input value={playlistDescription} onChange={(event) => setPlaylistDescription(event.target.value)} maxLength={500} /></label>
              <button type="submit" disabled={playlistLoading}>{playlistLoading ? 'Creating...' : 'Create playlist'}</button>
            </form>
          )}
          {playlistLoading && <p className="library-section-note" role="status">Loading playlists...</p>}
          <div className="library-collection-grid">
            <button className="library-collection-card playlist-card" type="button" onClick={() => navigate('/favorites')}>
              <span className="playlist-art"><FaHeart aria-hidden="true" /></span>
              <strong>Favorites</strong>
              <span>{favorites.length} {favorites.length === 1 ? 'song' : 'songs'}</span>
            </button>
            {playlists.map((playlist) => (
              <article className="library-collection-card library-playlist-card" key={playlist.id}>
                <button className="library-playlist-open" type="button" onClick={() => openPlaylist(playlist.id)}>
                  <span className="playlist-art"><FaList aria-hidden="true" /></span>
                  <strong>{playlist.name}</strong>
                  <span>{playlist.trackCount} {playlist.trackCount === 1 ? 'song' : 'songs'}</span>
                </button>
                <button className="library-playlist-delete" type="button" aria-label={`Delete ${playlist.name}`} onClick={() => deletePlaylist(playlist.id)}>
                  <FaTrash aria-hidden="true" /> Delete
                </button>
              </article>
            ))}
          </div>
          {!playlistLoading && playlists.length === 0 && !favorites.length && (
            <p className="library-section-note">No playlists yet. Create one to get started.</p>
          )}
        </div>
      );
    }

    if (activeSection === 'artists') {
      const artistList = Array.from(artists.entries());
      return artistList.length ? (
        <div className="library-collection-grid">
          {artistList.map(([id, artist]) => (
            <button
              className="library-collection-card"
              type="button"
              key={id}
              onClick={() => playTracks(artist.tracks)}
            >
              <img src={artist.tracks[0].artist?.picture_medium || artist.tracks[0].album?.cover_medium} alt="" loading="lazy" />
              <strong>{artist.name}</strong>
              <span>{artist.tracks.length} {artist.tracks.length === 1 ? 'saved song' : 'saved songs'}</span>
            </button>
          ))}
        </div>
      ) : renderEmptyState('No artists yet', 'Save a favorite or play a song and its artist will appear here.');
    }

    if (activeSection === 'albums') {
      const albumList = Array.from(albums.entries());
      return albumList.length ? (
        <div className="library-collection-grid">
          {albumList.map(([id, album]) => (
            <button
              className="library-collection-card"
              type="button"
              key={id}
              onClick={() => playTracks(album.tracks)}
            >
              <img src={album.tracks[0].album?.cover_medium} alt="" loading="lazy" />
              <strong>{album.name}</strong>
              <span>{album.artist} · {album.tracks.length} {album.tracks.length === 1 ? 'saved song' : 'saved songs'}</span>
            </button>
          ))}
        </div>
      ) : renderEmptyState('No albums yet', 'Save a favorite or play a song and its album will appear here.');
    }

    if (activeSection === 'downloaded') {
      return renderEmptyState(
        'No downloads yet',
        'Offline downloads are not supported yet. This section will show tracks once downloading is added.'
      );
    }

    return libraryTracks.length
      ? renderSongs(libraryTracks)
      : renderEmptyState('Your songs will show up here', 'Save a favorite or play a song to start building your library.');
  };

  const sectionTitle = sections.find((section) => section.id === activeSection)?.label || 'Songs';

  return (
    <main className="library-page">
      <header className="library-header">
        <div>
          <p className="library-eyebrow">YOUR COLLECTION</p>
          <h1>Library</h1>
          <p className="library-subtitle">Your favorites and recently played music, together in one place.</p>
        </div>
        <span className="library-count">{libraryTracks.length} {libraryTracks.length === 1 ? 'saved track' : 'saved tracks'}</span>
      </header>

      <nav className="library-tabs" aria-label="Library sections" role="tablist">
        {sections.map((section) => (
          <button
            className={`library-tab${activeSection === section.id ? ' active' : ''}`}
            type="button"
            role="tab"
            id={`library-tab-${section.id}`}
            aria-selected={activeSection === section.id}
            aria-controls="library-panel"
            key={section.id}
            onClick={() => setActiveSection(section.id)}
          >
            {section.icon}
            <span>{section.label}</span>
          </button>
        ))}
      </nav>

      <section
        className="library-panel"
        id="library-panel"
        role="tabpanel"
        aria-labelledby={`library-tab-${activeSection}`}
      >
        <div className="library-panel-heading">
          <h2>{sectionTitle}</h2>
          {activeSection === 'songs' && libraryTracks.length > 0 && (
            <span>Favorites and recently played</span>
          )}
        </div>
        {renderSection()}
      </section>
    </main>
  );
}

export default Library;
