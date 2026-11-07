import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  FAVORITES_KEY,
  addRecentlyPlayedTrack,
  readTrackList,
  subscribeToTrackList,
  toggleFavoriteTrack,
} from '../utils/trackStorage';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [playbackError, setPlaybackError] = useState('');
  const [collectionError, setCollectionError] = useState('');
  const [favorites, setFavorites] = useState(() => readTrackList(FAVORITES_KEY));

  const track = queue[currentIndex] || null;
  const isFavorite = Boolean(track) && favorites.some(
    (savedTrack) => String(savedTrack.id) === String(track.id)
  );

  useEffect(() => subscribeToTrackList(FAVORITES_KEY, setFavorites), []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const startPlayback = (selectedTrack) => {
    const audio = audioRef.current;
    if (!audio || !selectedTrack) return;
    if (!selectedTrack.preview) {
      setIsPlaying(false);
      setPlaybackError('A preview is not available for this song.');
      return;
    }

    setPlaybackError('');
    const playRequest = audio.play();
    if (playRequest && typeof playRequest.then === 'function') {
      playRequest
        .then(() => {
          setIsPlaying(true);
          const result = addRecentlyPlayedTrack(selectedTrack);
          setCollectionError(
            result.success ? '' : 'Could not save this track to your listening history.'
          );
        })
        .catch(() => {
          setIsPlaying(false);
          setPlaybackError('Could not start this preview. Please try again.');
        });
    } else {
      setIsPlaying(true);
    }
  };

  const loadTrack = (selectedTrack, autoplay) => {
    const audio = audioRef.current;
    setCurrentTime(0);
    setDuration(0);
    setPlaybackError('');
    setCollectionError('');
    setIsPlaying(false);

    if (!audio) return;
    audio.pause();
    if (!selectedTrack?.preview) {
      audio.removeAttribute('src');
      audio.load();
      if (autoplay) setPlaybackError('A preview is not available for this song.');
      return;
    }

    audio.src = selectedTrack.preview;
    audio.load();
    if (autoplay) startPlayback(selectedTrack);
  };

  const selectQueue = (tracks, index = 0) => {
    const nextQueue = Array.isArray(tracks)
      ? tracks.filter((item) => item && item.id != null)
      : [];
    if (!nextQueue.length) return;

    const safeIndex = Math.min(Math.max(Number(index) || 0, 0), nextQueue.length - 1);
    setQueue(nextQueue);
    setCurrentIndex(safeIndex);
    loadTrack(nextQueue[safeIndex], true);
  };

  const goToIndex = (index, autoplay = isPlaying) => {
    if (index < 0 || index >= queue.length || index === currentIndex) return;
    setCurrentIndex(index);
    loadTrack(queue[index], autoplay);
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!track || !audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    startPlayback(track);
  };

  const next = () => goToIndex(currentIndex + 1);
  const previous = () => goToIndex(currentIndex - 1);

  const seek = (time) => {
    const nextTime = Number(time);
    if (!audioRef.current || !Number.isFinite(nextTime)) return;
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const setVolume = (nextVolume) => {
    const boundedVolume = Math.min(Math.max(Number(nextVolume) || 0, 0), 1);
    setVolumeState(boundedVolume);
    if (audioRef.current) audioRef.current.volume = boundedVolume;
  };

  const toggleFavorite = () => {
    if (!track) return;
    const result = toggleFavoriteTrack(track);
    setFavorites(result.tracks);
    setCollectionError(
      result.success ? '' : 'Could not update Favorites. Check your browser storage settings.'
    );
  };

  const value = {
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
    selectQueue,
    togglePlayback,
    next,
    previous,
    seek,
    setVolume,
    toggleFavorite,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0);
          }
        }}
        onEnded={() => {
          if (currentIndex < queue.length - 1) {
            goToIndex(currentIndex + 1, true);
          } else {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }}
        onError={() => {
          if (track?.preview) {
            setIsPlaying(false);
            setPlaybackError('This preview could not be loaded. Try another track.');
          }
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error('usePlayer must be used inside PlayerProvider.');
  return player;
}
