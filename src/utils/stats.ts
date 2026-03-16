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
): { date: string; total: number }[] {
  const relevantCards = Object.fromEntries(
    Object.entries(cards).filter(([name]) => activeCardNames.includes(name))
  );

  const dateSet = new Set<string>();
  for (const card of Object.values(relevantCards)) {
    for (const p of card.prices) {
      dateSet.add(p.date);
    }
  }

  const dates = Array.from(dateSet).sort();
  const cardNames = Object.keys(relevantCards);

  return dates.map((date) => {
    let total = 0;
    for (const name of cardNames) {
      const card = relevantCards[name];
      const pricesUpToDate = card.prices.filter((p) => p.date <= date);
      if (pricesUpToDate.length > 0) {
        const entry = pricesUpToDate[pricesUpToDate.length - 1];
        total += entryTotal(entry);
      }
    }
    return { date, total: Math.round(total * 100) / 100 };
  });
}
