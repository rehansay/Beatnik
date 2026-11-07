import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCompactDisc,
  FaDownload,
  FaHeart,
  FaList,
  FaMusic,
  FaPlay,
  FaUser,
} from 'react-icons/fa';
import {
  FAVORITES_KEY,
  RECENTLY_PLAYED_KEY,
  readTrackList,
  subscribeToTrackList,
} from '../../utils/trackStorage';
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
  const [activeSection, setActiveSection] = useState('songs');
  const [favorites, setFavorites] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const navigate = useNavigate();
  const { selectQueue } = usePlayer();

  useEffect(() => {
    const unsubscribeFavorites = subscribeToTrackList(FAVORITES_KEY, setFavorites);
    const unsubscribeRecentlyPlayed = subscribeToTrackList(RECENTLY_PLAYED_KEY, setRecentlyPlayed);
    setFavorites(readTrackList(FAVORITES_KEY));
    setRecentlyPlayed(readTrackList(RECENTLY_PLAYED_KEY));

    return () => {
      unsubscribeFavorites();
      unsubscribeRecentlyPlayed();
    };
  }, []);

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

  const renderSection = () => {
    if (activeSection === 'playlists') {
      return favorites.length ? (
        <div className="library-collection-grid">
          <button
            className="library-collection-card playlist-card"
            type="button"
            onClick={() => navigate('/favorites')}
          >
            <span className="playlist-art"><FaHeart aria-hidden="true" /></span>
            <strong>Favorites</strong>
            <span>{favorites.length} {favorites.length === 1 ? 'song' : 'songs'}</span>
          </button>
          <p className="library-section-note">Custom playlists can be added in a future step.</p>
        </div>
      ) : renderEmptyState(
        'No playlists yet',
        'Save songs to Favorites to see your first collection here. Custom playlists are not available yet.'
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
