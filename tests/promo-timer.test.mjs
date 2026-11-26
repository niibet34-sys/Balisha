import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {offerState,formatCountdown} from '../site/assets/commerce.js';
import {onRequest} from '../functions/_middleware.js';
const cfg=JSON.parse(await readFile(new URL('../site/config/commerce.json',import.meta.url),'utf8'));
const html=await readFile(new URL('../site/index.html',import.meta.url),'utf8');
test('clean offer above the fold and two synchronized countdowns',()=>{
 assert.ok(html.indexOf('class="offer-strip"')<html.indexOf('class="hero shell"'));
 assert.equal((html.match(/data-offer-countdown hidden/g)||[]).length,2);
 assert.doesNotMatch(html,/Демонстрация цен|Демо: затем|Предпросмотр · продажи/);
});
test('public price schedule counts down and switches the displayed price, while payment stays unavailable',()=>{
 const end=Date.parse(cfg.priceSchedule.endsAt);
 const a=offerState(cfg,end-1001),b=offerState(cfg,end);
 assert.equal(a.price,2999);assert.equal(a.nextPrice,5490);assert.equal(a.remaining,1001);
 assert.equal(b.price,5490);assert.equal(b.remaining,0);
 assert.equal(offerState(cfg,end+5*864e5).price,5490);
 assert.equal(a.url,null);assert.equal(b.url,null);
 assert.match(html,/Оплата пока недоступна/);
 assert.equal(formatCountdown(1001),'00:00:02');assert.equal(formatCountdown(90061000),'25:01:01');
});
test('real promotion switches price and checkout without resetting',()=>{
 const live={...cfg,mode:'live',checkoutUrl:'https://example.org/standard',promotion:{enabled:true,price:2999,endsAt:'2027-01-01T00:00:00+03:00',checkoutUrl:'https://example.org/promo'}};
 const end=Date.parse(live.promotion.endsAt);
 assert.equal(offerState(live,end-1).price,2999);assert.equal(offerState(live,end-1).url,live.promotion.checkoutUrl);
 assert.equal(offerState(live,end).price,5490);assert.equal(offerState(live,end).url,live.checkoutUrl);
 assert.equal(offerState({...live,checkoutUrl:null},end-1).url,null);
 assert.equal(offerState({...live,promotion:{...live.promotion,endsAt:null}},end-1).url,null);
});
test('design review URL stays out of search',async()=>{
 const response=await onRequest({request:new Request('https://balisha.ru/?offer-layout=1'),next:async()=>new Response('ok')});
 assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
});
