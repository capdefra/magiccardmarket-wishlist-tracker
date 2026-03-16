import { PriceEntry } from '../types';

export interface ParsedRow {
  cardName: string;
  price: number;
  delivery: number;
  date: string;
}

export function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n');
  const rows: ParsedRow[] = [];

  // Detect format from header or first data line
  let hasDelivery = false;
  const firstLine = lines[0]?.trim().toLowerCase() || '';
  if (firstLine.startsWith('cardname,')) {
    hasDelivery = firstLine.includes('delivery');
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip header line
    if (trimmed.toLowerCase().startsWith('cardname,')) continue;

    const fields = parseCSVLine(trimmed);

    if (hasDelivery) {
      if (fields.length < 4) continue;
      const cardName = fields[0];
      const price = parseFloat(fields[1]);
      const delivery = parseFloat(fields[2]);
      const date = fields[3];
      if (!cardName || isNaN(price) || isNaN(delivery) || !isValidDate(date)) continue;
      rows.push({ cardName, price, delivery, date });
    } else {
      // Legacy format without delivery
      if (fields.length < 3) continue;
      const cardName = fields[0];
      const price = parseFloat(fields[1]);
      const date = fields[2];
      if (!cardName || isNaN(price) || !isValidDate(date)) continue;
      rows.push({ cardName, price, delivery: 0, date });
    }
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function rowsToPriceMap(rows: ParsedRow[]): Record<string, PriceEntry[]> {
  const map: Record<string, PriceEntry[]> = {};
  for (const row of rows) {
    if (!map[row.cardName]) {
      map[row.cardName] = [];
    }
    map[row.cardName].push({ price: row.price, delivery: row.delivery, date: row.date });
  }
  return map;
}
