import { useMemo } from 'react';
import { TrackerData } from '../types';
import { calculatePriceIndex, calculateCurrentTotal, getActiveCardNames } from '../utils/stats';
import { PriceChart } from './PriceChart';

interface Props {
  data: TrackerData;
}

export function SummaryChart({ data }: Props) {
  const activeCardNames = useMemo(() => getActiveCardNames(data), [data]);
  const indexData = useMemo(
    () => calculatePriceIndex(data.cards, activeCardNames),
    [data, activeCardNames]
  );
  const chartData = useMemo(
    () => indexData.map((d) => ({ date: d.date, value: d.index })),
    [indexData]
  );
  const currentTotal = useMemo(
    () => calculateCurrentTotal(data.cards, activeCardNames),
    [data, activeCardNames]
  );

  if (indexData.length === 0) return null;

  const latest = indexData[indexData.length - 1];

  return (
    <div className="summary-chart">
      <div className="summary-header">
        <h2>Wishlist Price Index</h2>
        <div className="summary-stats">
          <span className="summary-total">€{currentTotal.toFixed(2)}</span>
          <span className={latest.index < 0 ? 'price-down' : latest.index > 0 ? 'price-up' : ''}>
            {latest.index >= 0 ? '+' : ''}{latest.index.toFixed(1)}%
          </span>
          <span className="summary-card-count">{activeCardNames.length} cards</span>
        </div>
      </div>
      <PriceChart data={chartData} title="Avg. Price Change From First Tracked" height={250} format="percent" />
    </div>
  );
}
