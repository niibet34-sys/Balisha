import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

test('2026 PDF preview media unpack in Pages output with high-res Retina cover', async () => {
  const root = new URL('../dist/', import.meta.url);
  const cover = await stat(new URL('assets/previews/cover-1260.webp', root));
  assert.ok(cover.size > 200000, 'Retina cover must not be tiny');
  const medium = await stat(new URL('assets/previews/cover-900.webp', root));
  assert.ok(medium.size > 100000);
  const pdf = await readFile(new URL('samples/balisha-preview.pdf', root));
  assert.equal(pdf.toString('ascii', 0, 4), '%PDF');
  assert.ok(pdf.byteLength > 100000);
  const page = await stat(new URL('assets/previews/page-478-full.webp', root));
  assert.ok(page.size > 30000);
});
test('home references real 2026 gallery pages and responsive cover', async () => {
  const h = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
  assert.match(h, /cover-1260\.webp/);
  assert.match(h, /srcset=/);
  assert.match(h, /page-478-thumb\.webp/);
  assert.match(h, /page-342-thumb\.webp/);
  assert.doesNotMatch(h, /ПРЕЖНЯЯ ОБЛОЖКА|архивный фрагмент/);
});
