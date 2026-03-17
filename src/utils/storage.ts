import { TrackerData, PriceEntry } from '../types';

const STORAGE_KEY = 'cardmarket-wishlist-tracker';

export function loadData(): TrackerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { cards: {} };
    return JSON.parse(raw) as TrackerData;
  } catch {
    return { cards: {} };
  }
}

export function saveData(data: TrackerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function mergeNewPrices(
  existing: TrackerData,
  newPrices: Record<string, PriceEntry[]>
): TrackerData {
  const merged: TrackerData = {
    cards: { ...existing.cards },
  };

  for (const [cardName, entries] of Object.entries(newPrices)) {
    if (!merged.cards[cardName]) {
      merged.cards[cardName] = { prices: [] };
    }

    const existingPrices = merged.cards[cardName].prices;
    for (const entry of entries) {
      // One entry per card per day — replace existing entry for the same date
      const existingIdx = existingPrices.findIndex((p) => p.date === entry.date);
      if (existingIdx !== -1) {
        existingPrices[existingIdx] = entry;
      } else {
        existingPrices.push(entry);
      }
    }

    // Sort by date
    merged.cards[cardName].prices.sort((a, b) => a.date.localeCompare(b.date));
  }

  return merged;
}

export function exportToJSON(data: TrackerData): string {
  return JSON.stringify(data, null, 2);
}

export function importFromJSON(json: string): TrackerData {
  const parsed = JSON.parse(json);
  if (!parsed.cards || typeof parsed.cards !== 'object') {
    throw new Error('Invalid data format: missing "cards" object');
  }
  return parsed as TrackerData;
}

export function downloadJSON(data: TrackerData, filename?: string): void {
  const json = exportToJSON(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `cardmarket-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
