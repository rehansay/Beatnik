import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import backend from '../api/backend';
import {
  FAVORITES_KEY,
  RECENTLY_PLAYED_KEY,
  addRecentlyPlayedTrack,
  readTrackList,
  removeFavoriteTrack,
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
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => readTrackList(RECENTLY_PLAYED_KEY));
  const [sessionUser, setSessionUser] = useState(null);
  const [databaseReady, setDatabaseReady] = useState(false);

  const track = queue[currentIndex] || null;
  const isFavorite = Boolean(track) && favorites.some(
    (savedTrack) => String(savedTrack.id) === String(track.id)
  );

  const refreshSession = useCallback(async () => {
    const { data: user } = await backend.get('/auth/me');
    setSessionUser(user);
    const [favoritesResponse, recentResponse] = await Promise.all([
      backend.get('/api/me/favorites'),
      backend.get('/api/me/recently-played'),
    ]);
    setFavorites(favoritesResponse.data?.data || []);
    setRecentlyPlayed(recentResponse.data?.data || []);
    setDatabaseReady(true);
    setCollectionError('');
    return user;
  }, []);

  useEffect(() => {
    let isActive = true;
    refreshSession().catch((requestError) => {
      if (!isActive) return;
      if (requestError.response?.status === 401) {
        setSessionUser(null);
        setDatabaseReady(false);
      } else {
        setCollectionError('Could not load your saved collection from the database.');
      }
    });
    return () => { isActive = false; };
  }, [refreshSession]);

  useEffect(() => {
    if (databaseReady) return undefined;
    const unsubscribeFavorites = subscribeToTrackList(FAVORITES_KEY, setFavorites);
    const unsubscribeRecent = subscribeToTrackList(RECENTLY_PLAYED_KEY, setRecentlyPlayed);
    return () => {
      unsubscribeFavorites();
      unsubscribeRecent();
    };
  }, [databaseReady]);

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
          if (sessionUser) {
            if (!databaseReady) {
              setCollectionError('Could not save this track to your database history.');
              return;
            }
            backend.post('/api/me/recently-played', selectedTrack)
              .then((response) => {
                setRecentlyPlayed(response.data?.data || []);
                setCollectionError('');
              })
              .catch(() => setCollectionError('Could not save this track to your listening history.'));
          } else {
            const result = addRecentlyPlayedTrack(selectedTrack);
            setCollectionError(result.success ? '' : 'Could not save this track to your listening history.');
          }
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

  const toggleFavorite = async () => {
    if (!track) return;
    if (sessionUser) {
      if (!databaseReady) {
        setCollectionError('Your database collection is not available right now.');
        return;
      }
      try {
        const response = isFavorite
          ? await backend.delete(`/api/me/favorites/${encodeURIComponent(track.provider || 'deezer')}/${encodeURIComponent(track.id)}`)
          : await backend.post('/api/me/favorites', track);
        setFavorites(response.data?.data || []);
        setCollectionError('');
      } catch {
        setCollectionError('Could not update Favorites. Please try again.');
      }
      return;
    }

    const result = toggleFavoriteTrack(track);
    setFavorites(result.tracks);
    setCollectionError(
      result.success ? '' : 'Could not update Favorites. Check your browser storage settings.'
    );
  };

  const removeFavorite = async (id, provider = 'deezer') => {
    if (sessionUser) {
      if (!databaseReady) {
        setCollectionError('Your database collection is not available right now.');
        return false;
      }
      try {
        const response = await backend.delete(
          `/api/me/favorites/${encodeURIComponent(provider)}/${encodeURIComponent(id)}`
        );
        setFavorites(response.data?.data || []);
        setCollectionError('');
        return true;
      } catch {
        setCollectionError('Could not update Favorites. Please try again.');
        return false;
      }
    }
    const result = removeFavoriteTrack(id);
    setFavorites(result.tracks);
    setCollectionError(result.success ? '' : 'Could not update Favorites. Check your browser storage settings.');
    return result.success;
  };

  const logout = async () => {
    await backend.post('/auth/logout');
    setSessionUser(null);
    setDatabaseReady(false);
    setFavorites(readTrackList(FAVORITES_KEY));
    setRecentlyPlayed(readTrackList(RECENTLY_PLAYED_KEY));
    setCollectionError('');
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
    favorites,
    recentlyPlayed,
    sessionUser,
    refreshSession,
    logout,
    selectQueue,
    togglePlayback,
    next,
    previous,
    seek,
    setVolume,
    toggleFavorite,
    removeFavorite,
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
