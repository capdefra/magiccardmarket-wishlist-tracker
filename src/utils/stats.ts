import { CardData, CardStats, TrackerData } from '../types';

function entryTotal(entry: { price: number; delivery: number }): number {
  return entry.price + entry.delivery;
}

export function getLatestGlobalDate(cards: Record<string, CardData>): string {
  let latest = '';
  for (const card of Object.values(cards)) {
    for (const p of card.prices) {
      if (p.date > latest) latest = p.date;
    }
  }
  return latest;
}

export function getActiveCardNames(data: TrackerData): string[] {
  const latestDate = getLatestGlobalDate(data.cards);
  if (!latestDate) return [];
  return Object.entries(data.cards)
    .filter(([, card]) => card.prices.some((p) => p.date === latestDate))
    .map(([name]) => name);
}

export function calculateCardStats(
  name: string,
  card: CardData,
  active: boolean = true
): CardStats {
  const prices = card.prices;
  const totals = prices.map((p) => entryTotal(p));
  const latest = prices[prices.length - 1];
  const latestTot = entryTotal(latest);
  const previous = prices.length >= 2 ? prices[prices.length - 2] : null;
  const previousTot = previous ? entryTotal(previous) : null;

  return {
    name,
    latestTotal: latestTot,
    latestPrice: latest.price,
    latestDelivery: latest.delivery,
    latestDate: latest.date,
    minTotal: Math.min(...totals),
    maxTotal: Math.max(...totals),
    avgTotal: totals.reduce((a, b) => a + b, 0) / totals.length,
    priceChange: previousTot
      ? ((latestTot - previousTot) / previousTot) * 100
      : null,
    priceDiff: previousTot !== null ? latestTot - previousTot : null,
    entries: prices.length,
    active,
  };
}

export function calculateTotalCostByDate(
  cards: Record<string, CardData>,
  activeCardNames: string[]
): { date: string; total: number; cardCount: number }[] {
  const relevantCards = Object.fromEntries(
    Object.entries(cards).filter(([name]) => activeCardNames.includes(name))
  );

  // Find dates where ALL active cards have an entry (consistent comparison)
  const dateCountMap = new Map<string, number>();
  for (const card of Object.values(relevantCards)) {
    for (const p of card.prices) {
      dateCountMap.set(p.date, (dateCountMap.get(p.date) || 0) + 1);
    }
  }

  const totalCards = Object.keys(relevantCards).length;
  // Only include dates where all active cards have data
  const completeDates = Array.from(dateCountMap.entries())
    .filter(([, count]) => count === totalCards)
    .map(([date]) => date)
    .sort();

  return completeDates.map((date) => {
    let total = 0;
    let cardCount = 0;
    for (const card of Object.values(relevantCards)) {
      const entry = card.prices.find((p) => p.date === date);
      if (entry) {
        total += entryTotal(entry);
        cardCount++;
      }
    }
    return { date, total: Math.round(total * 100) / 100, cardCount };
  });
}
