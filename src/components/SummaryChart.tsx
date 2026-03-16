import { useMemo } from 'react';
import { TrackerData } from '../types';
import { calculateTotalCostByDate, getActiveCardNames } from '../utils/stats';
import { PriceChart } from './PriceChart';

interface Props {
  data: TrackerData;
}

export function SummaryChart({ data }: Props) {
  const activeCardNames = useMemo(() => getActiveCardNames(data), [data]);
  const totals = useMemo(
    () => calculateTotalCostByDate(data.cards, activeCardNames),
    [data, activeCardNames]
  );
  const chartData = useMemo(
    () => totals.map((t) => ({ date: t.date, value: t.total })),
    [totals]
  );

  if (totals.length === 0) return null;

  const latest = totals[totals.length - 1];
  const first = totals[0];
  const change = totals.length >= 2
    ? ((latest.total - first.total) / first.total) * 100
    : null;

  return (
    <div className="summary-chart">
      <div className="summary-header">
        <h2>Total Wishlist Cost</h2>
        <div className="summary-stats">
          <span className="summary-total">€{latest.total.toFixed(2)}</span>
          {change !== null && (
            <span className={change < 0 ? 'price-down' : change > 0 ? 'price-up' : ''}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <PriceChart data={chartData} title="Total Cost Over Time" height={250} />
    </div>
  );
}
