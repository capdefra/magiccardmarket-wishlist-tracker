import { useMemo } from 'react';
import { CardData } from '../types';
import { calculateCardStats } from '../utils/stats';
import { PriceChart } from './PriceChart';

interface Props {
  name: string;
  card: CardData;
  onBack: () => void;
}

export function CardDetail({ name, card, onBack }: Props) {
  const stats = useMemo(() => calculateCardStats(name, card), [name, card]);
  const chartData = useMemo(
    () => card.prices.map((p) => ({ date: p.date, value: p.price + p.delivery })),
    [card]
  );

  const hasDelivery = card.prices.some((p) => p.delivery > 0);

  return (
    <div className="card-detail">
      <button onClick={onBack} className="btn-back">&larr; Back</button>
      <h2>{name}</h2>
      <div className="stats-grid">
        <div className="stat">
          <span className="stat-label">Latest Total</span>
          <span className="stat-value">€{stats.latestTotal.toFixed(2)}</span>
        </div>
        {hasDelivery && (
          <div className="stat">
            <span className="stat-label">Price + Delivery</span>
            <span className="stat-value stat-breakdown">
              €{stats.latestPrice.toFixed(2)} + €{stats.latestDelivery.toFixed(2)}
            </span>
          </div>
        )}
        <div className="stat">
          <span className="stat-label">Min</span>
          <span className="stat-value price-min">€{stats.minTotal.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Max</span>
          <span className="stat-value price-max">€{stats.maxTotal.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Average</span>
          <span className="stat-value">€{stats.avgTotal.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Entries</span>
          <span className="stat-value">{stats.entries}</span>
        </div>
        {stats.priceChange !== null && (
          <div className="stat">
            <span className="stat-label">Last Change</span>
            <span className={`stat-value ${stats.priceChange < 0 ? 'price-down' : stats.priceChange > 0 ? 'price-up' : ''}`}>
              {stats.priceChange >= 0 ? '+' : ''}{stats.priceChange.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <PriceChart data={chartData} title="Total Cost History (Price + Delivery)" />
      <div className="price-history-table">
        <h3>All Entries</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Price</th>
              {hasDelivery && <th>Delivery</th>}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {[...card.prices].reverse().map((p, i) => (
              <tr key={i}>
                <td>{p.date}</td>
                <td>€{p.price.toFixed(2)}</td>
                {hasDelivery && <td>€{p.delivery.toFixed(2)}</td>}
                <td>€{(p.price + p.delivery).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
