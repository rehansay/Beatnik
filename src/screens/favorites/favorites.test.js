import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PlayerProvider } from '../../context/PlayerContext';
import Favorites from './favorites';

const savedTrack = {
  id: 21,
  title: 'Saved Track',
  preview: 'https://example.com/preview.mp3',
  artist: { id: 2, name: 'Saved Artist' },
  album: { id: 5, title: 'Saved Album', cover_medium: 'https://example.com/cover.jpg' },
};

beforeEach(() => {
  window.localStorage.clear();
});

test('loads saved favorites and removes them from persistent storage', () => {
  window.localStorage.setItem('favorites', JSON.stringify([savedTrack]));

  render(
    <MemoryRouter>
      <PlayerProvider>
        <Favorites />
      </PlayerProvider>
    </MemoryRouter>
  );

  expect(screen.getByRole('button', { name: 'Play Saved Track by Saved Artist' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove Saved Track from Favorites' }));

  expect(screen.getByRole('heading', { name: 'No favorite songs yet' })).toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem('favorites'))).toEqual([]);
});
