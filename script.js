(() => {
  'use strict';
  const root = document.documentElement;
  const defaults = structuredClone(window.AJAY_NXT_DEFAULT_CONTENT || {});
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const iconPaths = {
    code:'<path d="M8 9l-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
    motion:'<path d="M5 4h14v16H5zM9 4v16M15 4v16M5 9h4M15 9h4M5 15h4M15 15h4"/>',
    growth:'<path d="M4 18l6-6 4 4 6-8M15 8h5v5"/>',
    web:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    photo:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M4 17l5-4 3 2 3-4 5 6"/>',
    app:'<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M10 6h4M11 18h2"/>',
    seo:'<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20M8 11l2-2 2 2 3-4"/>',
    social:'<circle cx="7" cy="12" r="3"/><circle cx="17" cy="6" r="3"/><circle cx="17" cy="18" r="3"/><path d="M9.5 10.5l5-3M9.5 13.5l5 3"/>',
    automation:'<path d="M8 4h8l1 4 3 2v4l-3 2-1 4H8l-1-4-3-2v-4l3-2z"/><circle cx="12" cy="12" r="3"/>',
    instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
    linkedin:'<path d="M5 9v10M5 5v.01M10 19V9h4v2c1-2 5-3 5 3v5M3 9h4"/>',
    facebook:'<path d="M14 8h4V4h-4c-3 0-5 2-5 5v3H6v4h3v5h4v-5h4l1-4h-5V9c0-.6.4-1 1-1z"/>',
    threads:'<path d="M16.5 8.5c-1-2-3-3-5.5-3-4 0-7 3-7 7s3 7 7 7c4 0 7-2 7-5 0-2-1.5-3.5-4-3.5-3 0-5 1.5-5 3.5 0 1.5 1.2 2.5 3 2.5 3 0 5-2 5-5 0-4-2-7-6-7"/>',
    whatsapp:'<path d="M20 11.5a8 8 0 01-11.8 7L4 20l1.5-4A8 8 0 1120 11.5z"/><path d="M9 8c.5 3 2 4.5 5 5"/>',
    email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/>',
    phone:'<path d="M7 3l3 4-2 2c1 3 3 5 6 6l2-2 4 3-1 4c-8 1-15-6-16-16z"/>',
    youtube:'<path d="M21 12s0-4-1-5-3-1-8-1-5 0-8 1c-1 1-1 5-1 5s0 4 1 5c3 1 8 1 8 1s5 0 8-1c1-1 1-5 1-5z"/><path d="M10 9l5 3-5 3z"/>'
  };
  const svgIcon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || iconPaths.web}</svg>`;
  document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = svgIcon(el.dataset.icon));

  const palettes = [
    {id:'ember',accent:'#d9ff49',accent2:'#f97316',rgb:'217 255 73'},
    {id:'azure',accent:'#74c8ff',accent2:'#7c3aed',rgb:'116 200 255'},
    {id:'gold',accent:'#f0c66d',accent2:'#a16207',rgb:'240 198 109'},
    {id:'emerald',accent:'#72e6ae',accent2:'#0f766e',rgb:'114 230 174'},
    {id:'coral',accent:'#ff9975',accent2:'#e11d48',rgb:'255 153 117'},
    {id:'violet',accent:'#c7a7ff',accent2:'#6366f1',rgb:'199 167 255'},
    {id:'ice',accent:'#c7f4ff',accent2:'#0284c7',rgb:'199 244 255'}
  ];
  const fonts = {cormorant:'"Cormorant Garamond",serif',italiana:'"Italiana",serif',forum:'"Forum",serif',marcellus:'"Marcellus",serif',playfair:'"Playfair Display",serif',bodoni:'"Bodoni Moda",serif',baskerville:'"Libre Baskerville",serif'};
  let paletteTimer = 0;
  const applyAppearance = (content) => {
    const appearance = content.appearance || {};
    const selectedFont = fonts[appearance.headingFont] || fonts.cormorant;
    root.style.setProperty('--display', selectedFont);
    const start = Math.max(0, palettes.findIndex(p => p.id === appearance.paletteStart));
    let index = start;
    const apply = () => { const p=palettes[index]; root.dataset.palette=p.id; root.style.setProperty('--accent',p.accent); root.style.setProperty('--accent2',p.accent2); root.style.setProperty('--accent-rgb',p.rgb); document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#08090b'); };
    apply();
    clearInterval(paletteTimer);
    if (content.settings?.paletteRotationEnabled !== false) {
      const delay = Math.max(180000, Number(content.settings?.paletteDelayMs || 180000));
      paletteTimer = setInterval(() => { if (document.hidden) return; index=(index+1)%palettes.length; apply(); }, delay);
    }
    root.dataset.motion = appearance.motionLevel || 'subtle';
  };

  const deepMerge = (base, extra) => {
    Object.entries(extra || {}).forEach(([key,value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) base[key]=deepMerge(base[key] && typeof base[key]==='object' ? base[key] : {}, value);
      else if (value !== undefined) base[key]=structuredClone(value);
    });
    return base;
  };
  const mergeById = (base=[], remote=[]) => {
    const map = new Map(base.map(item => [String(item.id), structuredClone(item)]));
    remote.forEach(item => { if (!item?.id) return; map.set(String(item.id), deepMerge(map.get(String(item.id)) || {}, item)); });
    return [...map.values()];
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = value => { const raw=String(value||'').trim(); if(!raw)return ''; try { const u=new URL(raw,location.href); return ['http:','https:','mailto:','tel:','file:'].includes(u.protocol)?u.href:''; } catch{return '';} };
  const hostName = value => { try { return new URL(value).hostname.replace(/^www\./,''); } catch { return ''; } };
  const hueFor = value => [...String(value||'')].reduce((sum,char)=>sum+char.charCodeAt(0),0)%360;
  const initialsFor = value => String(value||'AN').split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  const atPath = (obj,path) => path.split('.').reduce((v,k)=>v?.[k],obj);
  let content = structuredClone(defaults);
  let reviews=[]; let reviewIndex=0;

  const inferCategory = item => String(item.category || item.label || item.tags?.[0] || 'Other').replace(/demo|website|business|concept|luxury/gi,' ').trim().replace(/\s+/g,' ') || 'Other';
  const inferStyleCount = item => { const text=[item.summary,...(item.tags||[])].join(' '); const m=text.match(/\b(\d{1,2})\s*(?:visual\s*)?(?:styles?|concepts?|directions?)/i); return Number(item.styleCount || (m&&m[1]) || 1); };
  const isClient = item => item.type === 'client' || ['diamond-restaurants','wedding-shedding-client'].includes(item.id) || /client|real project/i.test(item.label||'');
  const normalizeSites = source => (source.websites||[]).filter(i=>i&&i.published!==false&&i.title&&i.url).map((item,index)=>({...item,id:String(item.id||`site-${index}`),url:safeUrl(item.url),image:safeUrl(item.image),tags:Array.isArray(item.tags)?item.tags.slice(0,7):[],category:inferCategory(item),styleCount:inferStyleCount(item),type:isClient(item)?'client':'demo',priority:Number(item.priority||index+1)}));

  function renderClients(sites){
    const grid=document.querySelector('[data-client-grid]'); if(!grid)return;
    const items=sites.filter(i=>i.type==='client').sort((a,b)=>a.priority-b.priority);
    document.querySelector('[data-client-count]')?.replaceChildren(document.createTextNode(String(items.length)));
    grid.innerHTML=items.map((item,index)=>`<article class="project-card ${index?'secondary':''} reveal"><a class="project-visual" href="${esc(item.url)}" target="_blank" rel="noreferrer" data-track="project_live_click"><img src="${esc(item.image)}" alt="${esc(item.imageAlt||item.title+' website preview')}" loading="${index?'lazy':'eager'}" decoding="async"/></a><div class="project-content"><div class="project-top"><span class="project-badge">${esc(item.label||'Client project')}</span><span class="project-year">${esc(item.year||'Live')}</span></div><h3>${esc(item.title)}</h3><p>${esc(item.summary||'')}</p><div class="project-tags">${item.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="project-actions"><a class="button primary" href="${esc(item.url)}" target="_blank" rel="noreferrer" data-track="project_live_click">Open live project ↗</a>${item.caseStudy?`<button class="button quiet" type="button" data-case-study="${esc(item.caseStudy)}">Case study ↗</button>`:''}</div></div></article>`).join('');
    observeReveals();
  }
  function renderDemos(sites){
    const grid=document.querySelector('[data-demo-grid]'), filters=document.querySelector('[data-demo-filters]'); if(!grid||!filters)return;
    const items=sites.filter(i=>i.type==='demo').sort((a,b)=>a.priority-b.priority);
    document.querySelector('[data-demo-count]')?.replaceChildren(document.createTextNode(String(items.length)));
    const cats=['All',...new Set(items.map(i=>i.category))];
    filters.innerHTML=cats.map((c,i)=>`<button type="button" class="${i===0?'is-active':''}" data-demo-filter="${esc(c)}">${esc(c)}</button>`).join('');
    grid.innerHTML=items.map((item,index)=>{
      const host=hostName(item.url);
      const hue=hueFor(item.id||item.title);
      const visual=item.image
        ? `<figure class="demo-cover has-image"><img src="${esc(item.image)}" alt="${esc(item.imageAlt||item.title+' demo preview')}" loading="lazy" decoding="async"/><div class="demo-browser-bar"><i></i><i></i><i></i><span>${esc(host)}</span></div></figure>`
        : `<figure class="demo-cover is-graphic" role="img" aria-label="${esc(item.imageAlt||item.title+' website demo')}" style="--cover-hue:${hue}"><div class="demo-browser-bar"><i></i><i></i><i></i><span>${esc(host)}</span></div><div class="demo-cover-lines" aria-hidden="true"><b></b><b></b><b></b></div><strong>${esc(initialsFor(item.title))}</strong><small>${esc(item.label||item.category)}</small></figure>`;
      return `<article class="demo-card reveal" data-demo-category="${esc(item.category)}">${visual}<div class="demo-card-body"><div class="demo-meta"><span>${String(index+1).padStart(2,'0')} · ${esc(item.category)}</span><b>Live demo</b></div><h3>${esc(item.title)}</h3><p>${esc(item.summary||'')}</p><div class="project-tags">${item.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><a class="text-link" href="${esc(item.url)}" target="_blank" rel="noreferrer" data-track="project_live_click">Open live website ↗</a></div></article>`;
    }).join('');
    filters.addEventListener('click',event=>{ const btn=event.target.closest('[data-demo-filter]'); if(!btn)return; filters.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',b===btn)); grid.querySelectorAll('.demo-card').forEach(card=>card.hidden=btn.dataset.demoFilter!=='All'&&card.dataset.demoCategory!==btn.dataset.demoFilter); });
    observeReveals();
  }
  function renderFilms(){
    const grid=document.querySelector('[data-film-grid]'); if(!grid)return;
    const films=(window.AJAY_NXT_CONFIG?.videoSlides||[]).slice(0,8);
    grid.innerHTML=films.map((film,index)=>`<article class="film-card reveal"><img src="${esc(film.poster||'')}" alt="${esc(film.title||'Video project')} poster" loading="lazy" decoding="async"/><button type="button" data-film-index="${index}"><span class="play">▶</span><small>${esc(film.category||'Film')}</small><h3>${esc(film.title||'Selected film')}</h3></button></article>`).join('');
    grid.addEventListener('click',event=>{const btn=event.target.closest('[data-film-index]');if(!btn)return;openFilm(films[Number(btn.dataset.filmIndex)]);}); observeReveals();
  }
  function openFilm(film){
    const dialog=document.querySelector('[data-media-dialog]'),stage=dialog?.querySelector('[data-media-stage]');if(!dialog||!stage||!film)return;
    stage.replaceChildren();
    if(film.localUrl){const video=document.createElement('video');video.src=film.localUrl;video.controls=true;video.autoplay=true;video.playsInline=true;stage.append(video);} else if(film.driveId){const frame=document.createElement('iframe');frame.src=`https://drive.google.com/file/d/${encodeURIComponent(film.driveId)}/preview`;frame.allow='autoplay; fullscreen';frame.allowFullscreen=true;frame.title=film.title||'Video';stage.append(frame);}
    dialog.showModal();
  }
  function renderSocial(source){
    const grid=document.querySelector('[data-social-grid]');if(!grid)return;
    const entries=[['instagram','Instagram','Reels, websites and visual work'],['linkedin','LinkedIn','Professional work and project thinking'],['threads','Threads','Short ideas and studio updates'],['facebook','Facebook','Business updates and community'],['whatsapp','WhatsApp','Direct project conversation'],['email','Email','Detailed briefs and proposals'],['youtube','YouTube','Films and longer visual work']];
    grid.innerHTML=entries.map(([key,label,desc])=>{const url=safeUrl(source.social?.[key]);if(!url)return'';return`<a class="social-card reveal" href="${esc(url)}" ${/^https?:/.test(url)?'target="_blank" rel="noreferrer"':''} data-track="social_${key}_click"><header>${svgIcon(key)}<i>↗</i></header><div><b>${label}</b><span>${desc}</span></div></a>`}).join(''); observeReveals();
  }
  function showReview(index,animate=false){
    if(!reviews.length)return; reviewIndex=(index+reviews.length)%reviews.length; const r=reviews[reviewIndex];
    const card=document.querySelector('[data-review-card]'); if(!card)return;
    const map={'review.quote':r.quote,'review.name':r.name,'review.company':r.company,'review.rating':r.rating||'5.0','review.proofLabel':r.proofLabel||'View project'};
    Object.entries(map).forEach(([path,value])=>{const el=card.querySelector(`[data-content="${path}"]`);if(el)el.textContent=value||'';});
    const link=card.querySelector('[data-content-link="review.proofUrl"]');const href=safeUrl(r.proofUrl);if(link){link.hidden=!href;if(href)link.href=href;}
    const counter=card.querySelector('[data-review-counter]');if(counter)counter.textContent=`${String(reviewIndex+1).padStart(2,'0')} / ${String(reviews.length).padStart(2,'0')}`;
    const controls=card.querySelector('[data-review-controls]');if(controls)controls.hidden=reviews.length<2;
    if(animate&&!reduceMotion)card.animate([{opacity:.4,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:320,easing:'ease-out'});
  }
  function applyContent(remote={}){
    content=deepMerge(structuredClone(defaults),remote);
    content.websites=mergeById(defaults.websites||[],remote.websites||[]);
    content.projects=deepMerge(structuredClone(defaults.projects||{}),remote.projects||{});
    content.social=deepMerge(structuredClone(defaults.social||{}),remote.social||{});
    document.querySelectorAll('[data-content]').forEach(el=>{const v=atPath(content,el.dataset.content);if(typeof v==='string'&&v.trim())el.textContent=v;});
    document.querySelectorAll('[data-content-link]').forEach(el=>{const v=safeUrl(atPath(content,el.dataset.contentLink));if(v)el.href=v;});
    const sites=normalizeSites(content);renderClients(sites);renderDemos(sites);renderSocial(content);applyAppearance(content);
    reviews=(Array.isArray(content.reviews)&&content.reviews.length?content.reviews:[content.review]).filter(r=>r&&r.published!==false&&r.quote&&r.name);showReview(0);
    window.AJAY_NXT_SITE_CONTENT=content;
  }

  const header=document.querySelector('[data-header]');const menu=document.querySelector('[data-menu-toggle]');const nav=document.querySelector('[data-nav]');
  const updateHeader=()=>header?.classList.toggle('is-scrolled',scrollY>20);updateHeader();addEventListener('scroll',updateHeader,{passive:true});
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('is-open',!open);});nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu?.setAttribute('aria-expanded','false');nav?.classList.remove('is-open');}));
  document.querySelector('[data-year]').textContent=String(new Date().getFullYear());
  document.querySelector('[data-media-close]')?.addEventListener('click',()=>{const d=document.querySelector('[data-media-dialog]');d?.close();d?.querySelector('[data-media-stage]')?.replaceChildren();});
  document.querySelector('[data-media-dialog]')?.addEventListener('click',e=>{if(e.target===e.currentTarget){e.currentTarget.close();e.currentTarget.querySelector('[data-media-stage]')?.replaceChildren();}});
  document.querySelector('[data-review-prev]')?.addEventListener('click',()=>showReview(reviewIndex-1,true));document.querySelector('[data-review-next]')?.addEventListener('click',()=>showReview(reviewIndex+1,true));
  const caseDialog=document.querySelector('[data-case-dialog]');
  document.addEventListener('click',event=>{const btn=event.target.closest('[data-case-study]');if(!btn)return;const item=content.projects?.[btn.dataset.caseStudy];if(!item||!caseDialog)return;['eyebrow','title','summary','challenge','solution','result'].forEach(k=>{const el=caseDialog.querySelector(`[data-case-${k}]`);if(el)el.textContent=item[k]||'';});const tags=caseDialog.querySelector('[data-case-services]');if(tags)tags.innerHTML=(item.services||[]).map(t=>`<span>${esc(t)}</span>`).join('');const link=caseDialog.querySelector('[data-case-live]');const href=safeUrl(item.url);if(link){link.hidden=!href;if(href)link.href=href;}caseDialog.showModal();});
  document.querySelector('[data-case-close]')?.addEventListener('click',()=>caseDialog?.close());caseDialog?.addEventListener('click',e=>{if(e.target===caseDialog)caseDialog.close();});

  async function track(name){try{await window.AJAY_NXT_FIREBASE?.track?.(name);}catch{}}
  document.addEventListener('click',event=>{const el=event.target.closest('[data-track]');if(el)track(el.dataset.track);});
  document.querySelector('[data-booking-form]')?.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget,status=form.querySelector('[data-form-status]'),button=form.querySelector('button[type="submit"]');const data=Object.fromEntries(new FormData(form));data.budgetInr=data.budget||'';
    status.className='form-status full';status.textContent='Sending your enquiry…';button.disabled=true;
    try{const api=window.AJAY_NXT_FIREBASE;if(api?.configured){await api.saveEnquiry(data);status.textContent='Enquiry saved. I will contact you shortly.';status.classList.add('is-success');form.reset();}else{throw new Error('Firebase is not available');}}
    catch(error){const msg=`Hi Ajay, I am ${data.name}. I need ${data.service}. Budget: ${data.budget||'not decided'}. Timeline: ${data.timeline}. Details: ${data.details}`;status.innerHTML=`Could not save online. <a href="https://wa.me/919929562585?text=${encodeURIComponent(msg)}" target="_blank" rel="noreferrer">Send the same enquiry on WhatsApp ↗</a>`;status.classList.add('is-error');}
    finally{button.disabled=false;}
  });
  function observeReveals(){const els=document.querySelectorAll('.reveal:not(.is-visible)');if(reduceMotion||!('IntersectionObserver'in window)){els.forEach(e=>e.classList.add('is-visible'));return;}const ob=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('is-visible');ob.unobserve(x.target);}}),{threshold:.08,rootMargin:'0px 0px -35px'});els.forEach(e=>ob.observe(e));}
  renderFilms();applyContent(window.AJAY_NXT_REMOTE_CONTENT||{});observeReveals();
  addEventListener('ajaynxt:content-ready',event=>applyContent(event.detail||{}));
})();
