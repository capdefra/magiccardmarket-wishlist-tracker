/**
 * Parse a Cardmarket price into a number.
 *
 * Cardmarket uses European formatting: "." is the thousands separator and ","
 * is the decimal separator, so `5.490,00 €` is 5490. Amounts without a
 * thousands separator (`16,23 €`, `0,50 €`) stay small values.
 *
 * Already-normalized dot-decimal strings (`16.23`, `5490.00`) are accepted so
 * existing CSV rows still import. The old broken extension output `5.490.00`
 * (thousands dots left in, comma swapped for a second dot) is recovered as 5490.
 */
export function parsePrice(text: string | null | undefined): number {
  if (text == null) return NaN;
  let s = String(text).replace(/€/g, '').replace(/eur/gi, '').replace(/\s+/g, '');
  if (!s) return NaN;

  const token = s.match(/-?\d[\d.,]*/);
  if (!token) return NaN;
  s = token[0];

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // 5.490,00
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56
      s = s.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    const parts = s.split(',');
    if (parts.length > 2 && parts.slice(1).every((part) => part.length === 3)) {
      s = parts.join('');
    } else if (parts.length > 2) {
      const last = parts[parts.length - 1];
      s = parts.slice(0, -1).join('') + '.' + last;
    } else {
      // 16,23
      s = s.replace(',', '.');
    }
  } else if (lastDot !== -1) {
    const parts = s.split('.');
    const groups = parts.slice(1);
    // A dot is a thousands separator only when every group after it is exactly
    // three digits (`5.490`, `1.234.567`). Two-digit fractions (`16.23`) stay decimal.
    if (groups.length > 0 && groups.every((part) => part.length === 3)) {
      s = parts.join('');
    } else if (parts.length > 2) {
      // 5.490.00 — legacy broken output
      const last = parts[parts.length - 1];
      s = parts.slice(0, -1).join('') + '.' + last;
    }
  }

  const value = Number(s);
  return Number.isFinite(value) ? value : NaN;
}
