(() => {
'use strict';
const scenarios = {
 family: {
  question:'Мы живём в Убуде с ребёнком 5 лет, без байка. Куда завтра съездить без долгих переездов?',
  answer:'Я бы выбрала спокойный день поблизости: короткую прогулку по рисовым полям утром и кафе с видом на зелень. После обеда — отдых у бассейна. Уточните, готовы ли вы воспользоваться такси, — тогда предложу конкретные точки с короткими переездами.'
 },
 food: {
  question:'Мы сейчас в Сануре. Найди хорошие недорогие рестораны с индонезийской кухней рядом.',
  answer:'В Сануре стоит начать с местных варунгов и кафе с индонезийским меню. Скажите, какая у вас улица или ориентир и комфортный чек на человека. Если мой ИИ-чат умеет искать в интернете, я проверю работающие места, свежие часы и отзывы перед советом.'
 },
 trip: {
  question:'Завтра едем из Убуда в Амед. Что посмотреть по пути, чтобы не делать больших крюков?',
  answer:'Я бы держалась восточного направления и рассмотрела остановку у храма Гоа Лавах или в районе Клунгкунга — в зависимости от дороги. Не стоит добавлять дальние водопады ради галочки. Уточните время выезда и количество часов в пути, и составлю спокойный план.'
 }
};
const scenarioButtons = [...document.querySelectorAll('[data-scenario]')];
function setScenario(which, focus=false) {
 const s=scenarios[which]; if(!s)return;
 document.getElementById('demo-question').textContent=s.question;
 document.getElementById('demo-answer').textContent=s.answer;
 scenarioButtons.forEach(b=>{const active=b.dataset.scenario===which;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;if(active){document.getElementById('scenario-panel').setAttribute('aria-labelledby',b.id);if(focus)b.focus();}});
}
scenarioButtons.forEach((b,i)=>{b.addEventListener('click',()=>setScenario(b.dataset.scenario));b.addEventListener('keydown',e=>{let j=i;if(e.key==='ArrowRight') j=(i+1)%scenarioButtons.length;else if(e.key==='ArrowLeft')j=(i+scenarioButtons.length-1)%scenarioButtons.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=scenarioButtons.length-1;else return;e.preventDefault();setScenario(scenarioButtons[j].dataset.scenario,true);});});
const cards=[...document.querySelectorAll('.gallery-card')], track=document.getElementById('gallery'),status=document.getElementById('gallery-status'),lightbox=document.getElementById('gallery-dialog'),large=document.getElementById('lightbox-image'),largeTitle=document.getElementById('lightbox-title');let selected=0;
const pageIndex=()=>{const x=track.getBoundingClientRect().left;let winner=0,best=1e6;cards.forEach((c,i)=>{const dist=Math.abs(c.getBoundingClientRect().left-x);if(dist<best){best=dist;winner=i;}});return winner;};
const updateStatus=()=>{selected=pageIndex();status.textContent=`${String(selected+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;};
const scrollToIndex=(i)=>{const n=(i+cards.length)%cards.length;cards[n].scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest',inline:'start'});selected=n;status.textContent=`${String(n+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;};
document.querySelector('[data-gallery-prev]').addEventListener('click',()=>scrollToIndex(pageIndex()-1));
document.querySelector('[data-gallery-next]').addEventListener('click',()=>scrollToIndex(pageIndex()+1));
let scrollPending=false;track.addEventListener('scroll',()=>{if(scrollPending)return;scrollPending=true;requestAnimationFrame(()=>{scrollPending=false;updateStatus();});},{passive:true});
function showPage(n){selected=(n+cards.length)%cards.length;const card=cards[selected];const p=card.dataset.page;large.src=`/assets/previews/page-${p}-full.webp`;large.alt=`Страница ${p}: ${card.dataset.label}`;largeTitle.textContent=`${card.dataset.label} · стр. ${p}`;if(!lightbox.open)lightbox.showModal();}
cards.forEach((c,i)=>c.addEventListener('click',()=>{showPage(i);track?.dispatchEvent(new Event('gallery-view'));}));
document.querySelector('[data-lightbox-prev]').addEventListener('click',()=>showPage(selected-1));
document.querySelector('[data-lightbox-next]').addEventListener('click',()=>showPage(selected+1));
document.querySelector('[data-lightbox-close]').addEventListener('click',()=>lightbox.close());
lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close()});
lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();showPage(selected-1)}if(e.key==='ArrowRight'){e.preventDefault();showPage(selected+1)}});
const modal=document.getElementById('checkout-dialog');
let commerceCache=null;
const loadCommerce=async()=>{
  try{
    const response=await fetch('/config/commerce.json',{cache:'no-store'});
    if(response.ok){const config=await response.json();commerceCache=config;return config;}
  }catch(_error){/* Remain in safe preview state when config is unavailable. */}
  return null;
};
const promoBox=document.getElementById('real-promo-clock');
const promoLabel=document.getElementById('real-promo-label');
const promoTime=document.getElementById('real-promo-time');
let promoInterval=null;
function showVerifiedPromotion(cfg){
  if(promoInterval){clearInterval(promoInterval);promoInterval=null;}
  promoBox.hidden=true;
  const promotion=cfg?.promotion;
  // A public, immutable end date is required; never generate/reset personal fake deadlines.
  if(cfg?.mode!=='live'||!cfg?.checkoutUrl||promotion?.enabled!==true||
     typeof promotion?.endsAt!=='string'||typeof promotion?.label!=='string')return;
  const end=Date.parse(promotion.endsAt);
  if(!Number.isFinite(end)||end<=Date.now()||end>Date.now()+366*864e5)return;
  promoLabel.textContent=promotion.label;
  const tick=()=>{
    const remaining=Math.max(0,end-Date.now());
    if(remaining===0){promoBox.hidden=true;if(promoInterval)clearInterval(promoInterval);promoInterval=null;return;}
    const secs=Math.floor(remaining/1000);
    const days=Math.floor(secs/86400);
    const hours=String(Math.floor(secs%86400/3600)).padStart(2,'0');
    const minutes=String(Math.floor(secs%3600/60)).padStart(2,'0');
    const seconds=String(secs%60).padStart(2,'0');
    promoTime.textContent=(days>0?days+' дн. ':'')+hours+':'+minutes+':'+seconds;
    promoBox.hidden=false;
  };
  tick();
  promoInterval=setInterval(tick,1000);
}
loadCommerce().then(showVerifiedPromotion);
document.querySelectorAll('.checkout-trigger').forEach(btn=>btn.addEventListener('click',async()=>{
  const cfg=await loadCommerce();
  if(cfg?.mode==='live' && typeof cfg?.checkoutUrl==='string'){
    try{
      const checkout=new URL(cfg.checkoutUrl);
      if(checkout.protocol==='https:'&&checkout.hostname&&!checkout.username&&!checkout.password){
        window.location.assign(checkout.href);
        return;
      }
    }catch(_error){/* Invalid checkout URL; keep safe preview. */}
  }
  modal.showModal();
}));
document.querySelector('[data-checkout-close]').addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
// Analytics events are emitted only on actual user actions. A checkout intent never means a sale.
function emitAnalytics(name,extra={}){window.dispatchEvent(new CustomEvent('balisha:analytics',{detail:{name,...extra}}));if(typeof window.balishaTrack==='function')window.balishaTrack(name,extra);}
document.querySelectorAll('[data-track]').forEach(el=>el.addEventListener('click',()=>emitAnalytics(el.dataset.track)));
cards.forEach(c=>c.addEventListener('click',()=>emitAnalytics('gallery_open',{page:c.dataset.page})));
})();
