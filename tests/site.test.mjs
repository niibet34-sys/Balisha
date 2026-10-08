import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { onRequest } from '../functions/_middleware.js';
const root = new URL('../site/', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const main = () => read('index.html');

test('homepage sells Balisha guide and explicitly includes bonus prompt', async () => {
  const html = await main();
  assert.match(html, /Balisha\.ru/);
  assert.match(html, /ПУТЕВОДИТЕЛЬ ПО БАЛИ/);
  assert.match(html, /ИИ-эксперт/);
  assert.match(html, /id="buy"/);
  assert.match(html, /PDF/);
});

test('homepage hides knowledge categories and news from navigation', async () => {
  const html = await main();
  assert.doesNotMatch(html, /href="\/(temy|stati|poisk|novosti)\/?"/);
  assert.match(html, /href="#contents"/);
});

test('staged articles and topics are preserved for future publication', async () => {
  const articles = await readdir(new URL('stati/', root), { withFileTypes: true });
  const topics = await readdir(new URL('temy/', root), { withFileTypes: true });
  assert.ok(articles.filter(d => d.isDirectory()).length >= 10);
  assert.ok(topics.filter(d => d.isDirectory()).length >= 6);
});

test('only the product homepage is in the current sitemap', async () => {
  const sitemap = await read('sitemap.xml');
  assert.match(sitemap, /https:\/\/balisha\.ru\/<\/loc>/);
  assert.doesNotMatch(sitemap, /\/stati\//);
  assert.doesNotMatch(sitemap, /\/temy\//);
});

test('checkout is transparent and unavailable until secure provider is configured', async () => {
  const html = await main();
  const js = await read('assets/landing.js');
  assert.match(html, /Продажи скоро откроются/);
  assert.match(html, /платёжные данные не запрашиваются/);
  assert.match(js, /checkout-dialog/);
  assert.match(js, /showModal/);
});

test('draft pages send noindex on production, and preview domain stays noindex', async () => {
  const next = async () => new Response('ok', { headers: { 'content-type': 'text/html' }});
  const draft = await onRequest({request: new Request('https://balisha.ru/stati/primer/'), next});
  assert.equal(draft.headers.get('x-robots-tag'), 'noindex, follow');
  const production = await onRequest({request: new Request('https://balisha.ru/'), next});
  assert.equal(production.headers.get('x-robots-tag'), null);
  const preview = await onRequest({request: new Request('https://balisha.pages.dev/'), next});
  assert.equal(preview.headers.get('x-robots-tag'), 'noindex, nofollow');
  const oldProduct = await onRequest({request: new Request('https://balisha.ru/putevoditel/'), next});
  assert.equal(oldProduct.status, 301);
  assert.equal(oldProduct.headers.get('location'), 'https://balisha.ru/');
});
