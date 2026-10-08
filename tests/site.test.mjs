import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
const root = new URL('../site/', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
test('homepage has branding, search, and a guide link', async () => {
  const html = await read('index.html');
  assert.match(html, /Balisha\.ru/);
  assert.match(html, /\/poisk\//);
  assert.match(html, /\/putevoditel\//);
});
test('site has ten articles and six categories', async () => {
  const articles = await readdir(new URL('stati/', root), { withFileTypes:true });
  const topics = await readdir(new URL('temy/', root), { withFileTypes:true });
  assert.ok(articles.filter(d=>d.isDirectory()).length >= 10);
  assert.ok(topics.filter(d=>d.isDirectory()).length >= 6);
});
test('sitemap references article URLs', async () => {
  const sitemap = await read('sitemap.xml');
  assert.match(sitemap, /https:\/\/balisha\.ru\/stati\//);
  assert.match(sitemap, /<urlset/);
});
test('news is not indexed before articles are published', async () => {
  assert.match(await read('novosti/index.html'), /noindex,follow/);
});
test('search has a locally stored answer index', async () => {
  const index = JSON.parse(await read('search-index.json'));
  assert.ok(index.length >= 10);
  assert.ok(index.every(a=>a.title && a.path && a.answer));
});
