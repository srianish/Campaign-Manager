// localStorage persistence that never crashes the app.

import { STORAGE_KEY } from '../data/constants.js';

function hasValidShape(data) {
  return (
    Array.isArray(data) &&
    data.every(
      (c) =>
        c &&
        c.type === 'campaign' &&
        Array.isArray(c.adSets) &&
        c.adSets.every((a) => a && a.type === 'adset' && Array.isArray(a.ads))
    )
  );
}

/** Returns { campaigns, warning }. campaigns is null when nothing usable is stored. */
export function loadCampaigns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { campaigns: null, warning: '' };
    const parsed = JSON.parse(raw);
    if (hasValidShape(parsed)) return { campaigns: parsed, warning: '' };
    return { campaigns: null, warning: 'Saved data was unreadable, so sample data was loaded instead.' };
  } catch {
    // Corrupted JSON, blocked storage (private mode) or no localStorage at all.
    return { campaigns: null, warning: '' };
  }
}

/** Returns false when saving fails (storage full or blocked). */
export function saveCampaigns(campaigns) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    return true;
  } catch {
    return false;
  }
}
