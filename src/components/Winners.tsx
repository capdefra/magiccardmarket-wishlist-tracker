import { useMemo } from 'react';
import { TrackerData, CardStats } from '../types';
import { calculateCardStats, getActiveCardNames } from '../utils/stats';

interface Props {
  data: TrackerData;
  onSelectCard: (name: string) => void;
}

interface WinnerMetric {
  label: string;
  description: string;
  cards: { stats: CardStats; saving: number }[];
}

export function Winners({ data, onSelectCard }: Props) {
  const activeCardNames = useMemo(() => getActiveCardNames(data), [data]);

  const metrics = useMemo((): WinnerMetric[] => {
    const activeStats = Object.entries(data.cards)
      .filter(([name, card]) => activeCardNames.includes(name) && card.prices.length >= 2)
      .map(([name, card]) => calculateCardStats(name, card, true));

    if (activeStats.length === 0) return [];

    // Vs last import (previous entry) — using total (price + delivery)
    const vsLastImport = activeStats
      .filter((s) => s.priceDiff !== null)
      .map((s) => ({ stats: s, saving: -(s.priceDiff!) }))
      .sort((a, b) => b.saving - a.saving);

    // Vs all-time high
    const vsAllTimeHigh = activeStats
      .map((s) => ({ stats: s, saving: s.maxTotal - s.latestTotal }))
      .filter((s) => s.saving > 0)
      .sort((a, b) => b.saving - a.saving);

    // Vs average (below average = good time to buy)
    const vsBelowAverage = activeStats
      .map((s) => ({ stats: s, saving: s.avgTotal - s.latestTotal }))
      .filter((s) => s.saving > 0)
      .sort((a, b) => b.saving - a.saving);

    // At all-time low
    const atAllTimeLow = activeStats
      .filter((s) => s.latestTotal <= s.minTotal && s.entries >= 2)
      .map((s) => ({ stats: s, saving: s.maxTotal - s.latestTotal }))
      .sort((a, b) => b.saving - a.saving);

    const result: WinnerMetric[] = [];

    if (vsLastImport.filter((c) => c.saving > 0).length > 0) {
      result.push({
        label: 'Biggest Drops vs Last Import',
        description: 'Cards that dropped the most since previous check',
        cards: vsLastImport.filter((c) => c.saving > 0).slice(0, 5),
      });
    }

    if (vsBelowAverage.length > 0) {
      result.push({
        label: 'Below Average Price',
        description: 'Cards currently priced below their historical average',
        cards: vsBelowAverage.slice(0, 5),
      });
    }

    if (vsAllTimeHigh.length > 0) {
      result.push({
        label: 'Biggest Drop from Peak',
        description: 'Cards furthest below their all-time high',
        cards: vsAllTimeHigh.slice(0, 5),
      });
    }

    if (atAllTimeLow.length > 0) {
      result.push({
        label: 'At All-Time Low',
        description: 'Cards currently at their lowest recorded price',
        cards: atAllTimeLow.slice(0, 5),
      });
    }

    return result;
  }, [data, activeCardNames]);

  if (metrics.length === 0) {
    return (
      <div className="winners empty">
        <p>Import prices on at least two different days to see savings metrics.</p>
      </div>
    );
  }

  return (
    <div className="winners">
      <h2>Best Time to Buy</h2>
      <div className="winners-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="winner-section">
            <h3>{metric.label}</h3>
            <p className="winner-desc">{metric.description}</p>
            <div className="winner-cards">
              {metric.cards.map(({ stats, saving }) => (
                <div
                  key={stats.name}
                  className="winner-card clickable"
                  onClick={() => onSelectCard(stats.name)}
                >
                  <div className="winner-card-name">{stats.name}</div>
                  <div className="winner-card-prices">
                    <span className="winner-current">€{stats.latestTotal.toFixed(2)}</span>
                    <span className="winner-saving price-down">
                      -€{saving.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
