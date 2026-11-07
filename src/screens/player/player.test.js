import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import PlayerBar from '../../components/playerBar/PlayerBar';
import SongCard from '../../components/songCard/songCard';
import { PlayerProvider } from '../../context/PlayerContext';
import Player from './player';

const sampleTrack = {
  id: 31,
  title: 'Continuous Track',
  preview: 'https://example.com/preview.mp3',
  artist: { id: 6, name: 'Test Artist' },
  album: {
    id: 7,
    title: 'Test Album',
    cover_big: 'https://example.com/cover-large.jpg',
    cover_medium: 'https://example.com/cover.jpg',
  },
};

function PlaybackFlow() {
  return (
    <>
      <nav><Link to="/library">Open another section</Link></nav>
      <Routes>
        <Route path="/" element={<SongCard track={sampleTrack} tracks={[sampleTrack]} index={0} />} />
        <Route path="/player" element={<Player />} />
        <Route path="/library" element={<h1>Library section</h1>} />
      </Routes>
      <PlayerBar />
    </>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  jest.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('shows a useful empty state when Player has no selected song', () => {
  render(
    <MemoryRouter initialEntries={['/player']}>
      <PlayerProvider>
        <Routes>
          <Route path="/player" element={<Player />} />
        </Routes>
      </PlayerProvider>
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: 'Choose a song to play' })).toBeInTheDocument();
});

test('keeps the selected song playing when navigating to another section', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <PlayerProvider>
        <PlaybackFlow />
      </PlayerProvider>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('heading', { name: 'Continuous Track' }));
  expect(await screen.findByRole('heading', { name: 'Continuous Track' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Pause preview' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('link', { name: 'Open another section' }));

  expect(screen.getByRole('heading', { name: 'Library section' })).toBeInTheDocument();
  expect(screen.getByRole('complementary', { name: 'Current playback' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Pause preview' })).toBeInTheDocument();
});
