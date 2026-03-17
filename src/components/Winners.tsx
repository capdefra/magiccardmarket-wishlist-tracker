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
  type: 'good' | 'bad';
  cards: { stats: CardStats; delta: number }[];
}

export function Winners({ data, onSelectCard }: Props) {
  const activeCardNames = useMemo(() => getActiveCardNames(data), [data]);

  const metrics = useMemo((): WinnerMetric[] => {
    const activeStats = Object.entries(data.cards)
      .filter(([name, card]) => activeCardNames.includes(name) && card.prices.length >= 2)
      .map(([name, card]) => calculateCardStats(name, card, true));

    if (activeStats.length === 0) return [];

    const result: WinnerMetric[] = [];

    // === WINNERS (good — prices dropping) ===

    // Vs last import (previous entry) — drops
    const dropsVsLast = activeStats
      .filter((s) => s.priceDiff !== null && s.priceDiff < 0)
      .map((s) => ({ stats: s, delta: s.priceDiff! }))
      .sort((a, b) => a.delta - b.delta);

    if (dropsVsLast.length > 0) {
      result.push({
        label: 'Biggest Drops vs Last Import',
        description: 'Cards that dropped the most since previous check',
        type: 'good',
        cards: dropsVsLast.slice(0, 5),
      });
    }

    // At all-time low
    const atAllTimeLow = activeStats
      .filter((s) => s.latestTotal <= s.minTotal && s.entries >= 2)
      .map((s) => ({ stats: s, delta: -(s.maxTotal - s.latestTotal) }))
      .sort((a, b) => a.delta - b.delta);

    if (atAllTimeLow.length > 0) {
      result.push({
        label: 'At All-Time Low',
        description: 'Cards currently at their lowest recorded price',
        type: 'good',
        cards: atAllTimeLow.slice(0, 5),
      });
    }

    // === LOSERS (bad — prices rising) ===

    // Vs last import — spikes
    const spikesVsLast = activeStats
      .filter((s) => s.priceDiff !== null && s.priceDiff > 0)
      .map((s) => ({ stats: s, delta: s.priceDiff! }))
      .sort((a, b) => b.delta - a.delta);

    if (spikesVsLast.length > 0) {
      result.push({
        label: 'Biggest Spikes vs Last Import',
        description: 'Cards that rose the most since previous check — buy before they climb further',
        type: 'bad',
        cards: spikesVsLast.slice(0, 5),
      });
    }

    // Above average
    const aboveAverage = activeStats
      .map((s) => ({ stats: s, delta: s.latestTotal - s.avgTotal }))
      .filter((s) => s.delta > 0)
      .sort((a, b) => b.delta - a.delta);

    if (aboveAverage.length > 0) {
      result.push({
        label: 'Above Average Price',
        description: 'Cards currently priced above their historical average — consider waiting',
        type: 'bad',
        cards: aboveAverage.slice(0, 5),
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
          <div key={metric.label} className={`winner-section ${metric.type}`}>
            <h3>{metric.label}</h3>
            <p className="winner-desc">{metric.description}</p>
            <div className="winner-cards">
              {metric.cards.map(({ stats, delta }) => (
                <div
                  key={stats.name}
                  className="winner-card clickable"
                  onClick={() => onSelectCard(stats.name)}
                >
                  <div className="winner-card-name">{stats.name}</div>
                  <div className="winner-card-prices">
                    <span className="winner-current">€{stats.latestTotal.toFixed(2)}</span>
                    <span className={delta < 0 ? 'winner-saving price-down' : 'winner-saving price-up'}>
                      {delta < 0 ? '-' : '+'}€{Math.abs(delta).toFixed(2)}
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
