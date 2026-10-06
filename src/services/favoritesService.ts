const FAVORITES_KEY = 'village_directory_favorites_v1';

export function getFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading favorites from localStorage:', err);
    return [];
  }
}

export function isFavorite(id: string): boolean {
  const list = getFavoriteIds();
  return list.includes(id);
}

export function toggleFavorite(id: string): boolean {
  try {
    const list = getFavoriteIds();
    const index = list.indexOf(id);
    let updated: string[];
    let status = false;

    if (index >= 0) {
      updated = list.filter((item) => item !== id);
      status = false;
    } else {
      updated = [...list, id];
      status = true;
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('favorites-updated'));
    return status;
  } catch (err) {
    console.error('Error updating favorites in localStorage:', err);
    return false;
  }
}
