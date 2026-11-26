import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
const root=new URL('../site/',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');

test('approved character images exist as optimized web assets',async()=>{
  const images=['balisha-avatar.webp','balisha-portrait.webp','balisha-travel.webp'];
  for(const img of images){
    const file=await stat(new URL('assets/characters/'+img,root));
    assert.ok(file.size>10000 && file.size<250000, img+' should be optimized');
  }
});

test('home uses Balisha illustrations, shows 2990 rubles without fake urgency',async()=>{
  const h=await read('index.html');
  assert.match(h,/Balisha\.ru/);
  assert.match(h,/Grand\+Hotel/);
  assert.match(h,/assets\/characters\/balisha-portrait\.webp/);
  assert.match(h,/assets\/characters\/balisha-travel\.webp/);
  assert.match(h,/assets\/characters\/balisha-avatar\.webp/);
  assert.match(h,/2 990 ₽/);
  assert.match(h,/5 490 ₽/);
  assert.match(h,/Демонстрация цен и таймера, не действующая акция/);
  assert.doesNotMatch(h,/только сегодня|цена завтра|скидка 70%/i);
  assert.equal((h.match(/<h1\b/g)||[]).length,1);
});

test('no fabricated personalized deadline, genuine offers require checkout and end date',async()=>{
  const cfg=JSON.parse(await read('config/commerce.json'));
  const js=await read('assets/landing.js');
  assert.equal(cfg.mode,'preview');
  assert.equal(cfg.price,2990);
  assert.equal(cfg.currency,'RUB');
  assert.equal(cfg.provider,'lava.top');
  assert.equal(cfg.promotion.enabled,false);
  assert.equal(cfg.checkoutUrl,null);
  assert.match(js,/showVerifiedPromotion/);
  assert.match(js,/offerState/);
  assert.doesNotMatch(js,/localStorage|sessionStorage|purchase_complete/);
});
