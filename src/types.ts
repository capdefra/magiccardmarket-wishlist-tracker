export interface PriceEntry {
  price: number;
  delivery: number;
  date: string; // YYYY-MM-DD
}

export interface CardData {
  prices: PriceEntry[];
}

export interface TrackerData {
  cards: Record<string, CardData>;
}

export interface CardStats {
  name: string;
  latestTotal: number; // price + delivery
  latestPrice: number;
  latestDelivery: number;
  latestDate: string;
  minTotal: number;
  maxTotal: number;
  avgTotal: number;
  priceChange: number | null; // % change from previous entry (on total)
  priceDiff: number | null; // absolute diff from previous entry (on total)
  entries: number;
  active: boolean;
}
