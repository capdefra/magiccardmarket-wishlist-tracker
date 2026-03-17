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

    // Remove all existing entries for dates present in the new data, then add new ones
    const newDates = new Set(entries.map((e) => e.date));
    merged.cards[cardName].prices = merged.cards[cardName].prices.filter(
      (p) => !newDates.has(p.date)
    );
    merged.cards[cardName].prices.push(...entries);

    // Sort by date
    merged.cards[cardName].prices.sort((a, b) => a.date.localeCompare(b.date));
  }

  return merged;
}

export function deduplicateData(data: TrackerData): { data: TrackerData; removed: number } {
  let removed = 0;
  const deduped: TrackerData = { cards: {} };

  for (const [cardName, card] of Object.entries(data.cards)) {
    const seen = new Map<string, PriceEntry>();
    for (const entry of card.prices) {
      // Keep last entry per date
      if (seen.has(entry.date)) {
        removed++;
      }
      seen.set(entry.date, entry);
    }
    const prices = Array.from(seen.values()).sort((a, b) => a.date.localeCompare(b.date));
    deduped.cards[cardName] = { prices };
  }

  return { data: deduped, removed };
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
