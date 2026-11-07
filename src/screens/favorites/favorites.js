import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRegHeart } from 'react-icons/fa';
import { usePlayer } from '../../context/PlayerContext';
import SongList from '../../components/SongList';
import {
  FAVORITES_KEY,
  readTrackList,
  removeFavoriteTrack,
  subscribeToTrackList,
} from '../../utils/trackStorage';
import './favorite.css';

function Favorites() {
  const [favorites, setFavorites] = useState(() => readTrackList(FAVORITES_KEY));
  const [storageError, setStorageError] = useState('');
  const navigate = useNavigate();
  const { selectQueue } = usePlayer();

  useEffect(() => subscribeToTrackList(FAVORITES_KEY, setFavorites), []);

  const playFavorite = (index) => {
    selectQueue(favorites, index);
    navigate('/player');
  };

  const removeFavorite = (id) => {
    const result = removeFavoriteTrack(id);
    if (!result.success) {
      setStorageError('Could not update Favorites. Check your browser storage settings.');
      return;
    }

    setStorageError('');
    setFavorites(result.tracks);
  };

  if (favorites.length === 0) {
    return (
      <main className="emptyFavorites">
        {storageError && <p className="favorite-storage-error" role="alert">{storageError}</p>}
        <FaRegHeart className="emptyIcon" aria-hidden="true" />
        <h2>No favorite songs yet</h2>
        <p>Explore music and tap the heart on a song to save it here.</p>
        <button className="feedButton" type="button" onClick={() => navigate('/')}>
          Explore music
        </button>
      </main>
    );
  }

  return (
    <main className="favoritesPage">
      {storageError && <p className="favorite-storage-error" role="alert">{storageError}</p>}
      <SongList
        title="Favorites"
        songs={favorites}
        onSongClick={playFavorite}
        onRemove={removeFavorite}
      />
    </main>
  );
}

export default Favorites;
