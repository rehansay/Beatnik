import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRegHeart } from 'react-icons/fa';
import { usePlayer } from '../../context/PlayerContext';
import SongList from '../../components/SongList';
import './favorite.css';

function Favorites() {
  const navigate = useNavigate();
  const { favorites, selectQueue, removeFavorite, collectionError } = usePlayer();

  const playFavorite = (index) => {
    selectQueue(favorites, index);
    navigate('/player');
  };

  if (favorites.length === 0) {
    return (
      <main className="emptyFavorites">
        {collectionError && <p className="favorite-storage-error" role="alert">{collectionError}</p>}
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
      {collectionError && <p className="favorite-storage-error" role="alert">{collectionError}</p>}
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
