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

export function calculatePriceIndex(
  cards: Record<string, CardData>,
  activeCardNames: string[]
): { date: string; index: number; cardCount: number }[] {
  const relevantCards = Object.entries(cards).filter(([name]) =>
    activeCardNames.includes(name)
  );

  if (relevantCards.length === 0) return [];

  // For each card, baseline = its first entry total
  const baselines = new Map<string, number>();
  for (const [name, card] of relevantCards) {
    if (card.prices.length > 0) {
      baselines.set(name, entryTotal(card.prices[0]));
    }
  }

  // Collect all unique dates
  const allDates = new Set<string>();
  for (const [, card] of relevantCards) {
    for (const p of card.prices) {
      allDates.add(p.date);
    }
  }
  const sortedDates = Array.from(allDates).sort();

  return sortedDates.map((date) => {
    let totalPctChange = 0;
    let cardCount = 0;

    for (const [name, card] of relevantCards) {
      const entry = card.prices.find((p) => p.date === date);
      const baseline = baselines.get(name);
      if (entry && baseline && baseline > 0) {
        totalPctChange += ((entryTotal(entry) - baseline) / baseline) * 100;
        cardCount++;
      }
    }

    const index = cardCount > 0 ? Math.round((totalPctChange / cardCount) * 100) / 100 : 0;
    return { date, index, cardCount };
  }).filter((d) => d.cardCount > 0);
}

export function calculateCurrentTotal(
  cards: Record<string, CardData>,
  activeCardNames: string[]
): number {
  let total = 0;
  for (const [name, card] of Object.entries(cards)) {
    if (activeCardNames.includes(name) && card.prices.length > 0) {
      total += entryTotal(card.prices[card.prices.length - 1]);
    }
  }
  return Math.round(total * 100) / 100;
}
