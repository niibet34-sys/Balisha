(() => {
  'use strict';
  const toggle=document.querySelector('.menu-toggle');
  const mobile=document.getElementById('mobile-menu');
  if(toggle && mobile){toggle.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!expanded));toggle.setAttribute('aria-label',expanded?'Открыть меню':'Закрыть меню');mobile.hidden=expanded;});}
  const results=document.getElementById('search-results');
  if(!results)return;
  const input=document.querySelector('.search-page-form input[name=q]');
  const query=new URLSearchParams(location.search).get('q')||'';
  if(input)input.value=query;
  // Explainable full-text matching; not a remote language model and never generates new facts.
  const stop=new Set('я мне мне о на для в во и или по про что как какой какая какие где когда можно ли нужно хочу найти узнать это а с со за от до у есть лучше бали острове остров на'.split(' '));
  const synonyms={байк:'скутер',снять:'аренд',аренда:'аренд',снятьбайк:'скутер',скутер:'байк',жить:'район',остановиться:'район',дожди:'погод',дождь:'погод',феврале:'феврал',деньги:'оплат',платить:'оплат',симка:'интернет',связь:'интернет',неделю:'маршрут',аэропорт:'трансфер',прилетел:'аэропорт',виза:'въезд'};
  const norm=(s)=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const root=(t)=>t.length>5?t.replace(/(иями|ях|ами|ого|его|ому|ему|иться|аться|ий|ая|ое|ые|ов|ев|ам|ям|ах|ях|ом|ем|ая|ую|ой|ей|ие|ия|ии|ть|ти|ки|ка|ке|ку|ки|о|а|ы|и|е|у|ю)$/u,''):t;
  const words=s=>norm(s).split(/\s+/).filter(w=>w&&!stop.has(w)).map(root);
  const score=(article,q,terms)=>{if(!terms.length)return 0;const title=norm(article.title),answer=norm(article.answer),desc=norm(article.description),keywords=norm((article.keywords||[]).join(' ')),headings=norm((article.heading||[]).join(' ')),faqs=norm((article.faqs||[]).map(f=>f.q+' '+f.a).join(' '));let points=0;
    for(const word of terms){const alt=synonyms[word],arr=[word,alt,alt&&root(alt)].filter(Boolean);const has=hay=>arr.some(x=>hay.includes(x));if(has(title))points+=7;if(has(keywords))points+=5;if(has(answer))points+=4;if(has(desc))points+=2;if(has(headings))points+=2;if(has(faqs))points+=2;}
    if(title.includes(q))points+=18;if(keywords.includes(q))points+=12;
    return points;
  };
  const escape=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const show=(items,q)=>{const terms=words(q);const clean=norm(q);if(!clean){return;}const scored=items.map(a=>({...a,_score:score(a,clean,terms)})).filter(a=>a._score>0).sort((a,b)=>b._score-a._score).slice(0,12);
    if(!scored.length){results.innerHTML=`<div class="search-empty"><div class="mini-eyebrow">ПОКА НЕТ ТОЧНОГО ОТВЕТА</div><h2>Ничего не нашли.</h2><p>Попробуйте короче: «погода», «байк», «районы», «виза». База знаний пополняется.</p><a class="text-cta" href="/temy/">Открыть все темы ↗</a></div>`;return;}
    const top=scored[0];const direct=top._score>=5?`<div class="direct-answer"><span>КРАТКИЙ ОТВЕТ ИЗ BALISHA</span><h2>${escape(top.title)}</h2><p>${escape(top.answer)}</p><a href="${escape(top.path)}">Читать подробный ответ ↗</a></div>`:'';
    results.innerHTML=`<div class="search-summary">По запросу «${escape(q)}» найдено материалов: ${scored.length}</div>${direct}<div class="mini-eyebrow" style="margin:0 0 12px">МАТЕРИАЛЫ ПО ТЕМЕ</div><div class="results-list">${scored.map(a=>`<a class="result-row" href="${escape(a.path)}"><span>${escape(a.category)}</span><h3>${escape(a.title)}</h3><p>${escape(a.description)}</p></a>`).join('')}</div>`;
  };
  if(query.trim()){results.innerHTML='<div class="search-empty"><p>Ищем материалы…</p></div>';fetch('/search-index.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(items=>show(items,query)).catch(()=>{results.innerHTML='<div class="search-empty"><h2>Поиск временно недоступен</h2><p>Попробуйте открыть <a href="/temy/"><u>темы сайта</u></a>.</p></div>';});}
})();
