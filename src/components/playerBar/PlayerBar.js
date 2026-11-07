import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPause, FaPlay } from 'react-icons/fa';
import { IoPlaySkipBack, IoPlaySkipForward } from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import './playerBar.css';

function formatTime(time) {
  if (!Number.isFinite(time) || time <= 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function PlayerBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { track, queue, currentIndex, isPlaying, currentTime, duration, togglePlayback, next, previous, seek } = usePlayer();

  if (!track || location.pathname === '/player') return null;

  return (
    <aside className="persistent-player-bar" aria-label="Current playback">
      <button className="persistent-track" type="button" onClick={() => navigate('/player')}>
        <img src={track.album?.cover_small || track.album?.cover_medium} alt="" />
        <span>
          <strong>{track.title || 'Untitled track'}</strong>
          <span>{track.artist?.name || 'Unknown artist'}</span>
        </span>
      </button>

      <div className="persistent-controls">
        <button type="button" aria-label="Previous track" onClick={previous} disabled={currentIndex === 0}>
          <IoPlaySkipBack aria-hidden="true" />
        </button>
        <button
          className="persistent-play-button"
          type="button"
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          onClick={togglePlayback}
        >
          {isPlaying ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
        </button>
        <button type="button" aria-label="Next track" onClick={next} disabled={currentIndex >= queue.length - 1}>
          <IoPlaySkipForward aria-hidden="true" />
        </button>
      </div>

      <div className="persistent-progress">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={currentTime}
          aria-label="Track progress"
          disabled={!duration}
          onChange={(event) => seek(event.target.value)}
        />
        <span>{formatTime(duration)}</span>
      </div>
    </aside>
  );
}

export default PlayerBar;
