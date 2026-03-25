# Cardmarket Wishlist Price Tracker

A web app to track Magic: The Gathering card prices over time from Cardmarket's Shopping Wizard. Visualizes price trends, identifies buying opportunities, and syncs data across devices via GitHub Gist.

**Live site**: [https://capdefra.github.io/magiccardmarket-wishlist-tracker/](https://capdefra.github.io/magiccardmarket-wishlist-tracker/)

## How It Works

1. Use the [Card Scraper to Clipboard](https://github.com/capdefra/mcm-wishlist-tracker) Chrome extension on Cardmarket's Shopping Wizard results page
2. Paste the CSV into this app's Import view
3. Repeat periodically to build a price history
4. The dashboard shows trends, buying signals, and total cost over time

## Features

- **Price Index Chart** — Weighted aggregate % change of your entire wishlist over time (expensive cards have more influence than cheap ones)
- **Winners & Losers** — Cards with the biggest drops, at all-time lows, biggest spikes, or above average price
- **Card Detail** — Per-card price history chart, stats (min/max/avg), and Scryfall metadata (image, type, oracle text)
- **Sortable Card Table** — Sort by name, price, % change, euro change, min/max/avg; filter by search; separate Wishlist vs Purchased views
- **GitHub Gist Sync** — Cross-device sync using a private Gist as a free JSON store
- **Data Management** — Export/import JSON, clipboard copy, manual JSON editor, deduplication

## Tech Stack

| Tech | Purpose |
|------|---------|
| React + TypeScript | UI framework |
| Vite | Build tool |
| Chart.js + react-chartjs-2 | Price charts |
| Scryfall API | Card metadata and images |
| GitHub Gist API | Cross-device data sync |
| GitHub Pages | Hosting |

## Project Structure

```
src/
├── App.tsx                    # Main app, view routing (dashboard/detail/import/sync/guide)
├── App.css                    # Dark theme styling
├── types.ts                   # PriceEntry, CardData, TrackerData, CardStats
├── components/
│   ├── SummaryChart.tsx       # Wishlist Price Index chart (weighted % change over time)
│   ├── Winners.tsx            # Biggest drops, all-time lows, spikes, above-average
│   ├── CardList.tsx           # Sortable/searchable card table with Wishlist/Purchased tabs
│   ├── CardDetail.tsx         # Single card view with Scryfall data and price history
│   ├── PriceChart.tsx         # Reusable Chart.js line chart (supports € and % formats)
│   ├── PasteImport.tsx        # CSV paste → preview → save workflow
│   ├── DataSync.tsx           # Gist sync, export/import, JSON editor, danger zone
│   └── GetStarted.tsx         # Onboarding guide
├── hooks/
│   └── useCardData.ts         # Central data hook: localStorage + Gist sync + CRUD
└── utils/
    ├── csv.ts                 # CSV parsing (with/without delivery column)
    ├── gist.ts                # GitHub Gist API: ensure/load/save/validate
    ├── stats.ts               # Card stats, price index (value-weighted), active card detection
    └── storage.ts             # localStorage persistence, merge, dedup, export/import
```

## Data Model

```typescript
interface TrackerData {
  cards: Record<string, CardData>;  // key = card name
}

interface CardData {
  prices: PriceEntry[];
}

interface PriceEntry {
  price: number;      // card price in EUR
  delivery: number;   // shipping cost share per card
  date: string;       // YYYY-MM-DD
}
```

## Price Index Calculation

The main chart shows **value-weighted** percentage change from the first tracked date:

1. For each date, sum the total cost (price + delivery) of all active cards
2. Compare against the baseline (first date's total)
3. Result: `(currentTotal - baselineTotal) / baselineTotal`

This means a 10% increase on a 100 EUR card has more impact than a 10% increase on a 1 EUR card.

## GitHub Gist Sync

Cross-device data sync without a backend. See [gist-sync-guide.md](./gist-sync-guide.md) for a reusable implementation guide.

**How it works**:
- User provides a GitHub PAT with `gist` scope
- App auto-creates/finds a private Gist named `cardmarket-tracker-data.json`
- On load: pulls remote data, merges with local, pushes merged result
- On change: debounced save (1.5s) to avoid rate limits
- localStorage is always the primary store; Gist is the sync layer

## Development

```bash
npm install
npm run dev       # Vite dev server at localhost:5173
npm run build     # Production build to dist/
```

## Deployment

Automatic via GitHub Actions on push to `main`. The workflow (`.github/workflows/deploy.yml`) runs `npm ci && npm run build` and deploys the `dist/` folder to GitHub Pages.
