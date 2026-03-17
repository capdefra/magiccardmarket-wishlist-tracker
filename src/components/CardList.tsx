import { useState, useMemo } from 'react';
import { TrackerData } from '../types';
import { calculateCardStats, getActiveCardNames } from '../utils/stats';

type SortKey = 'name' | 'latestTotal' | 'priceChange' | 'minTotal' | 'maxTotal' | 'avgTotal';
type SortDir = 'asc' | 'desc';

interface Props {
  data: TrackerData;
  onSelectCard: (name: string) => void;
  onDeleteCard: (name: string) => void;
}

export function CardList({ data, onSelectCard, onDeleteCard }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('priceChange');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showPurchased, setShowPurchased] = useState(false);

  const activeCardNames = useMemo(() => getActiveCardNames(data), [data]);

  const stats = useMemo(() => {
    return Object.entries(data.cards)
      .filter(([, card]) => card.prices.length > 0)
      .map(([name, card]) =>
        calculateCardStats(name, card, activeCardNames.includes(name))
      );
  }, [data, activeCardNames]);

  const activeStats = useMemo(() => stats.filter((s) => s.active), [stats]);
  const purchasedStats = useMemo(() => stats.filter((s) => !s.active), [stats]);

  const displayStats = showPurchased ? purchasedStats : activeStats;

  const filtered = useMemo(() => {
    let result = displayStats;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [displayStats, search, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const totalCost = useMemo(() => {
    return activeStats.reduce((sum, s) => sum + s.latestTotal, 0);
  }, [activeStats]);

  if (Object.keys(data.cards).length === 0) {
    return (
      <div className="card-list empty">
        <p>No cards tracked yet. Paste some CSV data above to get started.</p>
      </div>
    );
  }

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className="card-list">
      <div className="card-list-header">
        <h2>
          {showPurchased ? `Purchased (${purchasedStats.length})` : `Wishlist (${activeStats.length})`}
        </h2>
        <div className="total-cost">{!showPurchased && `Total: €${totalCost.toFixed(2)}`}</div>
      </div>
      <div className="card-list-controls">
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        {purchasedStats.length > 0 && (
          <button
            className={`btn-toggle ${showPurchased ? 'active' : ''}`}
            onClick={() => setShowPurchased(!showPurchased)}
          >
            {showPurchased ? 'Show Wishlist' : `Purchased (${purchasedStats.length})`}
          </button>
        )}
      </div>
      <div className="table-wrapper">
        {showPurchased ? (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>Card{sortIndicator('name')}</th>
                <th onClick={() => handleSort('latestTotal')}>Purchased At{sortIndicator('latestTotal')}</th>
                <th onClick={() => handleSort('avgTotal')}>Avg{sortIndicator('avgTotal')}</th>
                <th>Saved</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const saved = s.avgTotal - s.latestTotal;
                return (
                  <tr key={s.name} onClick={() => onSelectCard(s.name)} className="clickable">
                    <td className="card-name">{s.name}</td>
                    <td>€{s.latestTotal.toFixed(2)}</td>
                    <td>€{s.avgTotal.toFixed(2)}</td>
                    <td className={saved > 0 ? 'price-down' : saved < 0 ? 'price-up' : ''}>
                      {saved >= 0 ? '-' : '+'}€{Math.abs(saved).toFixed(2)}
                    </td>
                    <td>
                      <button
                        className="btn-small btn-danger"
                        onClick={(e) => { e.stopPropagation(); onDeleteCard(s.name); }}
                      >×</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="no-data">No purchased cards yet.</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>Card{sortIndicator('name')}</th>
                <th onClick={() => handleSort('latestTotal')}>Total{sortIndicator('latestTotal')}</th>
                <th onClick={() => handleSort('minTotal')}>Min{sortIndicator('minTotal')}</th>
                <th onClick={() => handleSort('maxTotal')}>Max{sortIndicator('maxTotal')}</th>
                <th onClick={() => handleSort('avgTotal')}>Avg{sortIndicator('avgTotal')}</th>
                <th onClick={() => handleSort('priceChange')}>Change{sortIndicator('priceChange')}</th>
                <th>#</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.name} onClick={() => onSelectCard(s.name)} className="clickable">
                  <td className="card-name">{s.name}</td>
                  <td>€{s.latestTotal.toFixed(2)}</td>
                  <td className="price-min">€{s.minTotal.toFixed(2)}</td>
                  <td className="price-max">€{s.maxTotal.toFixed(2)}</td>
                  <td>€{s.avgTotal.toFixed(2)}</td>
                  <td className={priceChangeClass(s.priceChange)}>
                    {formatPriceChange(s.priceChange)}
                  </td>
                  <td>{s.entries}</td>
                  <td>
                    <button
                      className="btn-small btn-danger"
                      onClick={(e) => { e.stopPropagation(); onDeleteCard(s.name); }}
                    >×</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="no-data">No cards match your search.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatPriceChange(change: number | null): string {
  if (change === null) return '-';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function priceChangeClass(change: number | null): string {
  if (change === null) return '';
  if (change < 0) return 'price-down';
  if (change > 0) return 'price-up';
  return '';
}
