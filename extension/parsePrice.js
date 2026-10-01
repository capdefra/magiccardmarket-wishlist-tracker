// European Cardmarket prices: "." thousands, "," decimal.
// Keep in sync with src/utils/parsePrice.ts (tests compare both).
function parsePrice(text) {
  if (text == null) return NaN;
  let s = String(text).replace(/€/g, "").replace(/eur/gi, "").replace(/\s+/g, "");
  if (!s) return NaN;

  const token = s.match(/-?\d[\d.,]*/);
  if (!token) return NaN;
  s = token[0];

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // 5.490,00
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // 1,234.56
      s = s.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    const parts = s.split(",");
    if (parts.length > 2 && parts.slice(1).every((part) => part.length === 3)) {
      s = parts.join("");
    } else if (parts.length > 2) {
      const last = parts[parts.length - 1];
      s = parts.slice(0, -1).join("") + "." + last;
    } else {
      // 16,23
      s = s.replace(",", ".");
    }
  } else if (lastDot !== -1) {
    const parts = s.split(".");
    const groups = parts.slice(1);
    // Thousands only when every group after the dot is exactly three digits
    // (`5.490`). Two-digit fractions (`16.23`) stay decimal.
    if (groups.length > 0 && groups.every((part) => part.length === 3)) {
      s = parts.join("");
    } else if (parts.length > 2) {
      // 5.490.00 — legacy broken output
      const last = parts[parts.length - 1];
      s = parts.slice(0, -1).join("") + "." + last;
    }
  }

  const value = Number(s);
  return Number.isFinite(value) ? value : NaN;
}
