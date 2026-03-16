import { useState } from 'react';
import { parseCSV, rowsToPriceMap, ParsedRow } from '../utils/csv';
import { PriceEntry } from '../types';

interface Props {
  onImport: (prices: Record<string, PriceEntry[]>) => void;
}

export function PasteImport({ onImport }: Props) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [error, setError] = useState('');

  const handleParse = () => {
    setError('');
    const rows = parseCSV(text);
    if (rows.length === 0) {
      setError('No valid rows found. Expected format: CardName,Price,Delivery,Date');
      setPreview(null);
      return;
    }
    setPreview(rows);
  };

  const handleSave = () => {
    if (!preview) return;
    const priceMap = rowsToPriceMap(preview);
    onImport(priceMap);
    setText('');
    setPreview(null);
  };

  const hasDelivery = preview ? preview.some((r) => r.delivery > 0) : false;

  return (
    <div className="paste-import">
      <h2>Import Prices</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Paste CSV from Chrome extension...\nCardName,Price,Delivery,Date\n"Peregrine Drake","16.23","2.41","2026-03-16"'}
        rows={8}
      />
      <div className="paste-actions">
        <button onClick={handleParse} disabled={!text.trim()}>
          Parse
        </button>
        {preview && (
          <button onClick={handleSave} className="btn-primary">
            Save {preview.length} entries
          </button>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {preview && (
        <div className="preview-table">
          <table>
            <thead>
              <tr>
                <th>Card</th>
                <th>Price</th>
                {hasDelivery && <th>Delivery</th>}
                {hasDelivery && <th>Total</th>}
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  <td>{row.cardName}</td>
                  <td>€{row.price.toFixed(2)}</td>
                  {hasDelivery && <td>€{row.delivery.toFixed(2)}</td>}
                  {hasDelivery && <td>€{(row.price + row.delivery).toFixed(2)}</td>}
                  <td>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
