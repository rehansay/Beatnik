import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './player.css';
import { FaPlay, FaPause, FaHeart, FaList, FaPlus, FaRegHeart } from 'react-icons/fa';
import {
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoVolumeLow,
  IoVolumeHigh,
} from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import backend from '../../api/backend';

function formatTime(time) {
  if (!Number.isFinite(time) || time <= 0) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function Player() {
  const {
    track,
    queue,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackError,
    collectionError,
    isFavorite,
    togglePlayback,
    next,
    previous,
    seek,
    setVolume,
    toggleFavorite,
    sessionUser,
  } = usePlayer();
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [addingPlaylistId, setAddingPlaylistId] = useState(null);
  const [playlistMessage, setPlaylistMessage] = useState('');

  if (!track) {
    return (
      <div className="playerEmptyState">
        <h2>Choose a song to play</h2>
        <p>Pick a track from Feed, Trending, or Favorites to open it here.</p>
        <Link to="/">Explore music</Link>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumeProgress = volume * 100;

  const openPlaylistMenu = async () => {
    if (playlistMenuOpen) {
      setPlaylistMenuOpen(false);
      return;
    }
    setPlaylistMenuOpen(true);
    setPlaylistMessage('');
    if (!sessionUser) return;

    setLoadingPlaylists(true);
    try {
      const response = await backend.get('/api/me/playlists');
      setPlaylists(response.data?.data || []);
    } catch {
      setPlaylistMessage('Could not load your playlists. Please try again.');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const addToPlaylist = async (playlist) => {
    setAddingPlaylistId(playlist.id);
    setPlaylistMessage('');
    try {
      await backend.post(`/api/me/playlists/${playlist.id}/tracks`, track);
      setPlaylistMessage(`Added to ${playlist.name}.`);
    } catch {
      setPlaylistMessage(`Could not add this song to ${playlist.name}.`);
    } finally {
      setAddingPlaylistId(null);
    }
  };

  return (
    <div
      className="playerScreen"
      style={{ backgroundImage: `url(${track.album?.cover_big || ''})` }}
    >
      <div className="playerCard">
        <h1 className="songTitle">{track.title || 'Untitled track'}</h1>
        <h2 className="artistName">{track.artist?.name || 'Unknown artist'}</h2>

        <img
          src={track.album?.cover_big || track.album?.cover_medium}
          alt={`${track.title || 'Track'} album artwork`}
          className={`playerCover ${isPlaying ? 'rotate' : ''}`}
        />

        <div className="controls">
          <button
            type="button"
            aria-label="Previous track"
            disabled={currentIndex === 0}
            className="sideButton"
            onClick={previous}
          >
            <IoPlaySkipBack size={28} />
          </button>
          <button
            type="button"
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
            className="playButton"
            onClick={togglePlayback}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button
            type="button"
            aria-label="Next track"
            disabled={currentIndex >= queue.length - 1}
            className="sideButton"
            onClick={next}
          >
            <IoPlaySkipForward size={28} />
          </button>
        </div>

        <div className="time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <input
          className="progressBar"
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={currentTime}
          aria-label="Track progress"
          disabled={!duration}
          style={{
            background: `linear-gradient(to right, #1DB954 ${progress}%, #535353 ${progress}%)`,
          }}
          onChange={(event) => seek(event.target.value)}
        />

        <div className="volumeContainer">
          <span><IoVolumeLow size={20} /></span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            aria-label="Volume"
            style={{
              background: `linear-gradient(to right, #1DB954 ${volumeProgress}%, #535353 ${volumeProgress}%)`,
            }}
            onChange={(event) => setVolume(event.target.value)}
            className="volumeSlider"
          />
          <span><IoVolumeHigh size={20} /></span>
        </div>

        {playbackError && <p className="playbackError" role="alert">{playbackError}</p>}
        {collectionError && <p className="playbackError" role="alert">{collectionError}</p>}

        <div className="player-library-actions">
          <button
            type="button"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="favoriteButton"
            onClick={toggleFavorite}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
          <div className="player-playlist-control">
            <button
              type="button"
              className="player-add-playlist-button"
              aria-label="Add to playlist"
              title="Add to playlist"
              aria-expanded={playlistMenuOpen}
              onClick={openPlaylistMenu}
            >
              <FaList aria-hidden="true" />
            </button>
            {playlistMenuOpen && (
              <div className="player-playlist-menu" aria-label="Choose a playlist">
                {!sessionUser ? (
                  <p>Sign in to save songs to playlists. <Link to="/auth">Sign in</Link></p>
                ) : loadingPlaylists ? (
                  <p role="status">Loading playlists...</p>
                ) : playlists.length ? (
                  playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      type="button"
                      disabled={addingPlaylistId === playlist.id}
                      onClick={() => addToPlaylist(playlist)}
                    >
                      <FaPlus aria-hidden="true" />
                      {addingPlaylistId === playlist.id ? 'Adding...' : playlist.name}
                    </button>
                  ))
                ) : (
                  <p>You don’t have a playlist yet. <Link to="/library?section=playlists">Create one in Library</Link></p>
                )}
                {playlistMessage && <p className="player-playlist-message" role="status">{playlistMessage}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;
