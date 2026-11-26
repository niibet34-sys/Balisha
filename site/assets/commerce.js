const rub=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0});
export const formatPrice=n=>rub.format(n).replace(/[\u00a0\u202f]/g,' ')+' ₽';
export function formatCountdown(ms){
  const s=Math.max(0,Math.ceil(ms/1000)),d=Math.floor(s/86400);
  const hh=String(Math.floor(s/3600)).padStart(2,'0'),mm=String(Math.floor(s%3600/60)).padStart(2,'0'),ss=String(s%60).padStart(2,'0');
  return hh+':'+mm+':'+ss;
}
const priceOk=n=>Number.isFinite(n)&&n>0;
function safeCheckout(s){
  try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
function deadline(s){return typeof s==='string'&&/(?:Z|[+-]\d{2}:\d{2})$/.test(s)?Date.parse(s):NaN;}
export function offerState(cfg,now=Date.now()){
  const fallback={phase:'unavailable',price:2999,nextPrice:null,end:null,remaining:0,url:null,preview:true};
  if(!cfg)return fallback;
  const base=priceOk(cfg.price)?cfg.price:2999;
  const regular=priceOk(cfg.regularPrice)?cfg.regularPrice:base;
  if(cfg.mode==='preview'){
    const end=deadline(cfg.priceSchedule?.endsAt);
    if(cfg.priceSchedule?.enabled===true&&Number.isFinite(end)&&priceOk(cfg.priceSchedule?.startPrice)&&priceOk(cfg.priceSchedule?.afterPrice)){
      const active=now<end;
      return {phase:active?'scheduled-price':'scheduled-ended',price:active?cfg.priceSchedule.startPrice:cfg.priceSchedule.afterPrice,nextPrice:active?cfg.priceSchedule.afterPrice:null,end,remaining:Math.max(0,end-now),url:null,preview:true};
    }
    return {...fallback,phase:'preview',price:base};
  }
  if(cfg.mode!=='live')return fallback;
  const standardUrl=safeCheckout(cfg.checkoutUrl);
  if(cfg.promotion?.enabled===true){
    const end=deadline(cfg.promotion.endsAt),promoUrl=safeCheckout(cfg.promotion.checkoutUrl);
    if(!Number.isFinite(end)||!priceOk(cfg.promotion.price)||!standardUrl||!promoUrl)return {...fallback,price:base};
    const active=now<end;
    return {phase:active?'live-promo':'live-ended',price:active?cfg.promotion.price:regular,nextPrice:active?regular:null,end,remaining:Math.max(0,end-now),url:active?promoUrl:standardUrl,preview:false};
  }
  return standardUrl?{phase:'live-standard',price:base,nextPrice:null,end:null,remaining:0,url:standardUrl,preview:false}:{...fallback,price:base};
}
