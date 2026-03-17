import { useMemo, useState, useEffect } from 'react';
import { CardData } from '../types';
import { calculateCardStats } from '../utils/stats';
import { PriceChart } from './PriceChart';

interface ScryfallCard {
  name: string;
  set_name: string;
  type_line: string;
  mana_cost: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  rarity: string;
  image_uris?: { normal: string };
  card_faces?: { image_uris?: { normal: string } }[];
}

function formatMana(mana: string): string {
  return mana.replace(/\{([^}]+)\}/g, (_, s) => s);
}

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

  const [scryfall, setScryfall] = useState<ScryfallCard | null>(null);
  const [scryfallLoading, setScryfallLoading] = useState(true);

  useEffect(() => {
    setScryfallLoading(true);
    setScryfall(null);

    // Strip set/edition info in parentheses for cleaner search
    const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();

    fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => setScryfall(data))
      .catch(() => setScryfall(null))
      .finally(() => setScryfallLoading(false));
  }, [name]);

  const imageUrl = scryfall?.image_uris?.normal
    ?? scryfall?.card_faces?.[0]?.image_uris?.normal;

  return (
    <div className="card-detail">
      <button onClick={onBack} className="btn-back">&larr; Back</button>

      <div className="card-detail-header">
        <div className="card-image-col">
          {scryfallLoading && <div className="card-image-placeholder">Loading...</div>}
          {!scryfallLoading && imageUrl && (
            <img src={imageUrl} alt={name} className="card-image" />
          )}
          {!scryfallLoading && !imageUrl && (
            <div className="card-image-placeholder">No image</div>
          )}
        </div>
        <div className="card-info-col">
          <h2>{name}</h2>
          {scryfall && (
            <div className="card-info">
              <div className="card-info-row">
                <span className="card-info-label">Type</span>
                <span>{scryfall.type_line}</span>
              </div>
              {scryfall.mana_cost && (
                <div className="card-info-row">
                  <span className="card-info-label">Mana</span>
                  <span>{formatMana(scryfall.mana_cost)}</span>
                </div>
              )}
              {scryfall.oracle_text && (
                <div className="card-info-row oracle">
                  <span className="card-info-label">Text</span>
                  <span className="oracle-text">{scryfall.oracle_text}</span>
                </div>
              )}
              {scryfall.power && scryfall.toughness && (
                <div className="card-info-row">
                  <span className="card-info-label">P/T</span>
                  <span>{scryfall.power}/{scryfall.toughness}</span>
                </div>
              )}
              <div className="card-info-row">
                <span className="card-info-label">Rarity</span>
                <span className={`rarity-${scryfall.rarity}`}>{scryfall.rarity}</span>
              </div>
            </div>
          )}

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
        </div>
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
