import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaExclamationCircle, FaExternalLinkAlt, FaMusic, FaPlay } from 'react-icons/fa';
import backend from '../../api/backend';
import { usePlayer } from '../../context/PlayerContext';
import './trending.css';

const normalize = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

function Trending() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [loadingTrackId, setLoadingTrackId] = useState(null);
  const navigate = useNavigate();
  const { selectQueue } = usePlayer();

  useEffect(() => {
    const controller = new AbortController();

    const loadTrending = async () => {
      try {
        const response = await backend.get('/api/trending', {
          params: { country: 'us', limit: 50 },
          signal: controller.signal,
        });
        setTracks(response.data?.data || []);
      } catch (requestError) {
        if (requestError.code !== 'ERR_CANCELED') {
          setError('Could not load the chart. Make sure the FastAPI server is running.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadTrending();
    return () => controller.abort();
  }, []);

  const openPreview = async (chartTrack) => {
    setLoadingTrackId(chartTrack.id);
    setPreviewError('');

    try {
      const response = await backend.get('/api/search', {
        params: { q: `${chartTrack.artistName} ${chartTrack.name}` },
      });
      const candidates = response.data?.data || [];
      const title = normalize(chartTrack.name);
      const artist = normalize(chartTrack.artistName);
      const playableTrack = candidates.find((candidate) =>
        normalize(candidate.title) === title && normalize(candidate.artist?.name) === artist
      );

      if (!playableTrack) {
        setPreviewError(`No Deezer preview was found for “${chartTrack.name}”.`);
        return;
      }

      selectQueue([playableTrack], 0);
      navigate('/player');
    } catch (requestError) {
      setPreviewError('Could not find a preview for this song. Please try again.');
    } finally {
      setLoadingTrackId(null);
    }
  };

  return (
    <main className="trending-page">
      <header className="trending-header">
        <div>
          <p className="trending-eyebrow"><FaChartLine aria-hidden="true" /> MUSIC CHART</p>
          <h1>Trending Songs</h1>
          <p className="trending-subtitle">The current Apple Music Top Songs chart in the United States.</p>
        </div>
        <span className="chart-region">US · TOP 50</span>
      </header>

      {previewError && <p className="preview-error" role="alert">{previewError}</p>}

      {loading ? (
        <div className="trending-message" role="status" aria-live="polite">
          <FaMusic className="trending-message-icon pulse" aria-hidden="true" />
          <p>Loading the chart...</p>
        </div>
      ) : error ? (
        <div className="trending-message" role="alert">
          <FaExclamationCircle className="trending-message-icon" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="trending-message">
          <FaMusic className="trending-message-icon" aria-hidden="true" />
          <p>The chart returned no tracks. Please try again later.</p>
        </div>
      ) : (
        <ol className="trending-list" aria-label="Apple Music Top Songs chart">
          {tracks.map((track) => (
            <li className="trending-row" key={track.id}>
              <span className="trending-rank">{track.rank}</span>
              <img
                className="trending-cover"
                src={track.artworkUrl100}
                alt={`${track.name} album artwork`}
                loading="lazy"
              />
              <div className="trending-track-info">
                <h2 title={track.name}>{track.name}</h2>
                <p title={track.artistName}>{track.artistName}</p>
              </div>
              <div className="trending-actions">
                <button
                  className="trending-play"
                  type="button"
                  onClick={() => openPreview(track)}
                  disabled={loadingTrackId === track.id}
                  aria-label={`Open player preview for ${track.name} by ${track.artistName}`}
                >
                  <FaPlay aria-hidden="true" />
                  <span>{loadingTrackId === track.id ? 'Loading' : 'Preview'}</span>
                </button>
                <a
                  className="apple-music-link"
                  href={track.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${track.name} on Apple Music`}
                >
                  <FaExternalLinkAlt aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

export default Trending;
