import React, { useEffect, useState } from 'react';
import { FaFrown, FaMusic, FaSearch, FaTimes } from 'react-icons/fa';
import deezer from '../../api/deezer';
import SongCard from '../../components/songCard/songCard';
import './feed.css';

function Feed() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const query = debouncedSearch.trim();

    if (!query) {
      setTracks([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let isCurrentRequest = true;

    const fetchSongs = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await deezer.get('/search', {
          params: { q: query },
          signal: controller.signal,
        });

        if (isCurrentRequest) {
          setTracks(response.data?.data || []);
        }
      } catch (requestError) {
        if (isCurrentRequest && requestError.code !== 'ERR_CANCELED') {
          setError('Music search is unavailable right now. Please try again.');
        }
      } finally {
        if (isCurrentRequest) setLoading(false);
      }
    };

    fetchSongs();

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [debouncedSearch]);

  const isWaitingForSearch = search.trim() !== debouncedSearch;
  const isSearching = loading || isWaitingForSearch;
  const showResults = tracks.length > 0 && !error;

  return (
    <main className="feed-body">
      <form className="search-bar" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="visually-hidden" htmlFor="music-search">
          Search songs or artists
        </label>
        <FaSearch className="search-icon" aria-hidden="true" />
        <input
          id="music-search"
          type="search"
          placeholder="Search songs or artists..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          autoComplete="off"
        />
        {search && (
          <button
            className="clear-search"
            type="button"
            aria-label="Clear search"
            onClick={() => setSearch('')}
          >
            <FaTimes aria-hidden="true" />
          </button>
        )}
      </form>

      {isSearching && (
        <div className="search-status" role="status" aria-live="polite">
          <span className="loader" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span>
          </span>
          <span>Searching music...</span>
        </div>
      )}

      {error ? (
        <div className="emptySearch" role="alert">
          <FaFrown className="musicIcon" aria-hidden="true" />
          <h2>Search couldn’t load</h2>
          <p>{error}</p>
        </div>
      ) : !search.trim() ? (
        <div className="emptySearch">
          <FaMusic className="musicIcon" aria-hidden="true" />
          <h2>Discover Music</h2>
          <p>Search for your favorite songs or artists to start listening.</p>
        </div>
      ) : !isSearching && tracks.length === 0 ? (
        <div className="emptySearch">
          <FaFrown className="musicIcon" aria-hidden="true" />
          <h2>No Songs Found</h2>
          <p>Try searching for another song or artist.</p>
        </div>
      ) : showResults ? (
        <div className="songContainer" aria-label="Search results">
          {tracks.map((track, index) => (
            <SongCard key={track.id} track={track} tracks={tracks} index={index} />
          ))}
        </div>
      ) : null}
    </main>
  );
}

export default Feed;
