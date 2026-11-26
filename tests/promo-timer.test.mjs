import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {offerState,formatCountdown} from '../site/assets/commerce.js';
const cfg=JSON.parse(await readFile(new URL('../site/config/commerce.json',import.meta.url),'utf8'));
const html=await readFile(new URL('../site/index.html',import.meta.url),'utf8');
test('demo is labeled, placed directly under the header, and is synchronized in two locations',()=>{
  assert.ok(html.indexOf('class="offer-strip"')<html.indexOf('class="hero shell"'));
  assert.equal((html.match(/data-offer-countdown hidden/g)||[]).length,2);
  assert.match(html,/Демонстрация цен и таймера, не действующая акция/);
});
test('demo ticks with a fixed end, switches to 5490, never opens checkout',()=>{
  const end=Date.parse(cfg.demo.endsAt),a=offerState(cfg,end-1001),b=offerState(cfg,end-1),c=offerState(cfg,end);
  assert.equal(a.price,2990);assert.equal(b.remaining,1);assert.equal(c.price,5490);assert.equal(c.phase,'demo-ended');assert.equal(offerState(cfg,end+5*864e5).price,5490);
  for(const s of [a,b,c])assert.equal(s.url,null);
  assert.equal(formatCountdown(1001),'00:00:02');
});
test('live promotion uses a real shared deadline and separate phase checkout URLs, or fails closed',()=>{
  const live={...cfg,mode:'live',checkoutUrl:'https://example.org/standard',promotion:{enabled:true,price:2990,endsAt:'2027-01-01T00:00:00+03:00',checkoutUrl:'https://example.org/promo'}};
  const end=Date.parse(live.promotion.endsAt);
  assert.equal(offerState(live,end-1).price,2990);
  assert.equal(offerState(live,end-1).url,live.promotion.checkoutUrl);
  assert.equal(offerState(live,end).price,5490);
  assert.equal(offerState(live,end).url,live.checkoutUrl);
  assert.equal(offerState(live,end+864e5).phase,'live-ended');
  assert.equal(offerState({...live,checkoutUrl:null},end-1).url,null);
  assert.equal(offerState({...live,promotion:{...live.promotion,endsAt:null}},end-1).url,null);
});
