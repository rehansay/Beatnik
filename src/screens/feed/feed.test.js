import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import backend from '../../api/backend';
import { PlayerProvider } from '../../context/PlayerContext';
import Feed from './feed';

jest.mock('../../api/backend', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const sampleTrack = {
  id: 10,
  title: 'Test Track',
  preview: 'https://example.com/preview.mp3',
  artist: { id: 3, name: 'Test Artist' },
  album: { id: 4, title: 'Test Album', cover_medium: 'https://example.com/cover.jpg' },
};

function renderFeed() {
  return render(
    <MemoryRouter>
      <PlayerProvider>
        <Feed />
      </PlayerProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  backend.get.mockReset();
  window.localStorage.clear();
});

test('shows the discover state before a search', () => {
  renderFeed();

  expect(screen.getByRole('heading', { name: 'Discover Music' })).toBeInTheDocument();
  expect(backend.get).not.toHaveBeenCalled();
});

test('searches through the backend and renders matching songs', async () => {
  backend.get.mockResolvedValue({ data: { data: [sampleTrack] } });
  renderFeed();

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search songs or artists' }), {
    target: { value: 'Test Artist' },
  });

  expect(await screen.findByRole('heading', { name: 'Test Track' })).toBeInTheDocument();
  expect(backend.get).toHaveBeenCalledWith('/api/search', expect.objectContaining({
    params: { q: 'Test Artist' },
  }));
});

test('shows an error state when the backend search fails', async () => {
  backend.get.mockRejectedValue(new Error('API unavailable'));
  renderFeed();

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search songs or artists' }), {
    target: { value: 'Test Artist' },
  });

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Music search is unavailable right now. Please try again.'
  );
});
