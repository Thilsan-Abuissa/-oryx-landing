/* =============================================================
   products.json  ->  assets/js/products-data.js

   products.json is the source of truth; the page fetches it. But a
   browser refuses to fetch a file:// URL (CORS), so opening
   products.html straight off the disk would show nothing. This writes
   the same array out as a plain script the page can fall back to.

   Run after editing products.json:
       node tools/build-products-data.mjs
   ============================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const products = JSON.parse(readFileSync(join(root, 'products.json'), 'utf8'));

const out = join(root, 'assets/js/products-data.js');
writeFileSync(out,
  '/* GENERATED FILE — do not edit.\n' +
  '   Source: products.json. Rebuild: node tools/build-products-data.mjs\n' +
  '   Only used when the page is opened over file://, where fetch is blocked. */\n' +
  'window.PRODUCTS = ' + JSON.stringify(products, null, 2) + ';\n',
  'utf8');

console.log(products.length + ' products -> assets/js/products-data.js');
