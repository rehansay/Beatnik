export const FAVORITES_KEY = 'favorites';
export const RECENTLY_PLAYED_KEY = 'recentlyPlayed';

const sameTrack = (first, second) => String(first?.id) === String(second?.id);

export function readTrackList(key) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(stored)
      ? stored.filter((track) => track && typeof track === 'object' && track.id != null)
      : [];
  } catch {
    return [];
  }
}

export function writeTrackList(key, tracks) {
  try {
    window.localStorage.setItem(key, JSON.stringify(tracks));
    window.dispatchEvent(new CustomEvent('beatnik:track-storage-change', { detail: { key } }));
    return true;
  } catch {
    return false;
  }
}

export function subscribeToTrackList(key, callback) {
  const updateFromLocalChange = (event) => {
    if (event.detail?.key === key) callback(readTrackList(key));
  };
  const updateFromOtherTab = (event) => {
    if (event.key === key || event.key === null) callback(readTrackList(key));
  };

  window.addEventListener('beatnik:track-storage-change', updateFromLocalChange);
  window.addEventListener('storage', updateFromOtherTab);

  return () => {
    window.removeEventListener('beatnik:track-storage-change', updateFromLocalChange);
    window.removeEventListener('storage', updateFromOtherTab);
  };
}

export function toggleFavoriteTrack(track) {
  const current = readTrackList(FAVORITES_KEY);
  const wasFavorite = current.some((savedTrack) => sameTrack(savedTrack, track));
  const updated = wasFavorite
    ? current.filter((savedTrack) => !sameTrack(savedTrack, track))
    : [...current, track];
  const success = writeTrackList(FAVORITES_KEY, updated);

  return {
    success,
    isFavorite: success ? !wasFavorite : wasFavorite,
    tracks: success ? updated : current,
  };
}

export function removeFavoriteTrack(id) {
  const current = readTrackList(FAVORITES_KEY);
  const updated = current.filter((track) => String(track.id) !== String(id));
  const success = writeTrackList(FAVORITES_KEY, updated);
  return { success, tracks: success ? updated : current };
}

export function addRecentlyPlayedTrack(track, limit = 10) {
  const current = readTrackList(RECENTLY_PLAYED_KEY);
  const updated = [track, ...current.filter((savedTrack) => !sameTrack(savedTrack, track))]
    .slice(0, limit);
  const success = writeTrackList(RECENTLY_PLAYED_KEY, updated);
  return { success, tracks: success ? updated : current };
}
