import React from 'react';
import { Link } from 'react-router-dom';
import './player.css';
import { FaPlay, FaPause, FaHeart, FaRegHeart } from 'react-icons/fa';
import {
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoVolumeLow,
  IoVolumeHigh,
} from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';

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
  } = usePlayer();

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

        <div className="favoriteContainer">
          <button
            type="button"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="favoriteButton"
            onClick={toggleFavorite}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Player;
