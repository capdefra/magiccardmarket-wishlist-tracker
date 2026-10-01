import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';
import { parseCSV } from '../src/utils/csv.ts';
import { parsePrice } from '../src/utils/parsePrice.ts';

type ParsePrice = (text: string | null | undefined) => number;

function loadExtensionParsePrice(): ParsePrice {
  const source = readFileSync(new URL('../extension/parsePrice.js', import.meta.url), 'utf8');
  const sandbox: { parsePrice?: ParsePrice } = {};
  runInContext(source, createContext(sandbox));
  if (typeof sandbox.parsePrice !== 'function') {
    throw new Error('extension/parsePrice.js did not define parsePrice');
  }
  return sandbox.parsePrice;
}

const cases: Array<[string, number]> = [
  ['5.490,00 €', 5490],
  ['16,23 €', 16.23],
  ['1.234,56', 1234.56],
  ['0,50 €', 0.5],
  ['42,00', 42],
  ['9,99€', 9.99],
  ['  16,23 €  ', 16.23],
  ['€ 1.234,56', 1234.56],
  ['5.490,00\u00a0€', 5490],
  ['16.23', 16.23],
  ['2.41', 2.41],
  ['5490.00', 5490],
  ['10.00', 10],
  // Old extension output: thousands dot kept, comma turned into a second dot.
  ['5.490.00', 5490],
  ['1.234.567,89 €', 1234567.89],
  ['1,234.56', 1234.56],
];

for (const [label, parse] of [
  ['app', parsePrice],
  ['extension', loadExtensionParsePrice()],
] as const) {
  test(`${label} parsePrice handles European thousands and smaller amounts`, () => {
    for (const [input, expected] of cases) {
      assert.strictEqual(parse(input), expected, `${label}: ${JSON.stringify(input)}`);
    }
    assert.ok(Number.isNaN(parse('')));
    assert.ok(Number.isNaN(parse('€')));
    assert.ok(Number.isNaN(parse(null)));
  });
}

test('CSV import stores European prices as numbers', () => {
  const rows = parseCSV(
    [
      'CardName,Price,Delivery,Date',
      '"Black Lotus","5.490,00 €","1,50 €","2026-03-16"',
      '"Peregrine Drake","16,23 €","0,50 €","2026-03-16"',
      '"Mox Diamond","1.234,56","0,00","2026-03-16"',
      '"Snapcaster Mage","16.23","2.41","2026-03-16"',
      '"Legacy Lotus","5.490.00","0.00","2026-03-16"',
    ].join('\n'),
  );

  assert.deepStrictEqual(
    rows.map((row) => [row.cardName, row.price, row.delivery]),
    [
      ['Black Lotus', 5490, 1.5],
      ['Peregrine Drake', 16.23, 0.5],
      ['Mox Diamond', 1234.56, 0],
      ['Snapcaster Mage', 16.23, 2.41],
      ['Legacy Lotus', 5490, 0],
    ],
  );
});
