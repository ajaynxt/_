(() => {
  'use strict';
  const root = document.documentElement;
  const defaults = window.AJAY_NXT_DEFAULT_CONTENT || {};
  const media = window.AJAY_NXT_MEDIA || { videos: [], photos: [] };
  let content = structuredClone(defaults);
  let paletteTimer = 0;
  let fontTimer = 0;
  let currentHue = 82;

  const COLOR_INTERVAL_MS = 2000;
  const HUE_STEP = 5.625;
  const startingHues = {
    lime:82, gold:40, azure:210, coral:12, violet:266, emerald:152, rose:336, ice:194, ember:24
  };
  const fonts = {
    cormorant:'"Cormorant Garamond",serif', italiana:'"Italiana",serif', forum:'"Forum",serif', marcellus:'"Marcellus",serif', playfair:'"Playfair Display",serif', bodoni:'"Bodoni Moda",serif', baskerville:'"Libre Baskerville",serif'
  };
  const fontKeys = Object.keys(fonts);
  const previewColors = ['#c9ff38','#e9bd72','#77b9ff','#ff8d72','#bda3ff','#64dca4','#ffa7c5'];

  const esc = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const deepMerge = (base, extra) => { if (!extra || typeof extra !== 'object') return base; for (const [key,val] of Object.entries(extra)) { if (val && typeof val === 'object' && !Array.isArray(val) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) deepMerge(base[key], val); else base[key] = val; } return base; };
  const safeUrl = (value='') => { const raw=String(value).trim(); if(!raw) return ''; if(/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw; return ''; };
  const host = (url='') => { try { return new URL(url).host.replace(/^www\./,''); } catch { return url; } };
  const getPath = (obj,path) => path.split('.').reduce((v,k)=>v?.[k],obj);
  const mergeById = (base=[], remote=[]) => { const map=new Map(base.map(item=>[String(item.id),structuredClone(item)])); remote.forEach(item=>{ if(!item?.id)return; map.set(String(item.id),deepMerge(map.get(String(item.id))||{},structuredClone(item))); }); return [...map.values()]; };
  const excludedWebsite = item => /collaboration/i.test(String(item?.type||'')) || /collaboration/i.test(String(item?.label||'')) || String(item?.id||'') === 'wedding-shedding-client';

  function icon(name){
    const paths={instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none"/>',linkedin:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a3 3 0 0 1 6 0v4M12 10v7"/>',threads:'<path d="M16.5 8.5c-.7-2-2.2-3-4.5-3-3.4 0-5.5 2.5-5.5 6.5s2.2 6.5 5.7 6.5c3.2 0 5.3-1.7 5.3-4.2 0-2.3-1.8-3.7-4.6-3.7-2.2 0-3.7 1-3.7 2.5 0 1.3 1.1 2.2 2.8 2.2 3.3 0 5.5-2.6 5.5-6.4 0-3.5-2.1-5.9-5.6-5.9"/>',facebook:'<path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v5h4v-5h3l1-4h-4V9c0-.6.4-1 1-1Z"/>',whatsapp:'<path d="M20 11.5A8 8 0 0 1 8.2 18.6L4 20l1.4-4A8 8 0 1 1 20 11.5Z"/><path d="M9 8.5c.4 2.7 2 4.3 4.7 4.9"/>',email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',phone:'<path d="M7 3h3l1 5-2 1c1 3 3 5 6 6l1-2 5 1v3c0 2-2 4-4 4C9 21 3 15 3 7c0-2 2-4 4-4Z"/>'};
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||''}</svg>`;
  }

  function applySpectrum(hue){
    currentHue=((Number(hue)||0)%360+360)%360;
    root.style.setProperty('--accent',`hsl(${currentHue} 84% 69%)`);
    root.style.setProperty('--accent-ink',`hsl(${currentHue} 72% 34%)`);
    root.style.setProperty('--accent-soft',`hsl(${currentHue} 84% 62% / .16)`);
  }

  function applyAppearance(){
    clearInterval(paletteTimer); clearInterval(fontTimer);
    const startFont = fontKeys.includes(content.appearance?.headingFont) ? content.appearance.headingFont : 'cormorant';
    let fontIndex = fontKeys.indexOf(startFont);
    root.style.setProperty('--display',fonts[startFont]);
    const paletteName = content.appearance?.paletteStart || 'lime';
    applySpectrum(startingHues[paletteName] ?? startingHues.lime);
    const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(content.settings?.paletteRotationEnabled!==false && !reduceMotion){
      paletteTimer=setInterval(()=>applySpectrum(currentHue+HUE_STEP),COLOR_INTERVAL_MS);
    }
    if(content.settings?.headingRotationEnabled!==false && !reduceMotion){ fontTimer=setInterval(()=>{root.classList.add('font-shifting');setTimeout(()=>{fontIndex=(fontIndex+1)%fontKeys.length;root.style.setProperty('--display',fonts[fontKeys[fontIndex]]);root.classList.remove('font-shifting');},900);},60000); }
  }

  function bindCopy(){ document.querySelectorAll('[data-copy]').forEach(node=>{const value=getPath(content,node.dataset.copy);if(value)node.textContent=value;}); }

  function previewMarkup(item,index){
    const accent=item.previewAccent||previewColors[index%previewColors.length];
    const bg=item.previewBg||['#17171b','#131a23','#1c1614','#151620','#161a17'][index%5];
    return `<div class="site-preview" style="--preview-accent:${esc(accent)};--preview-bg:${esc(bg)}" aria-hidden="true"><div class="site-preview-bar"><i></i><i></i><i></i></div><div class="site-preview-stage"><small>${esc(item.label||item.category||'Website')}</small><h4>${esc(item.previewTitle||item.title)}</h4><b>Explore</b><div class="site-preview-lines"><i></i><i></i></div><span class="site-preview-art"></span></div></div>`;
  }

  function renderWebsites(){
    const track=document.querySelector('[data-slider="websites"]'); if(!track)return;
    const sites=(content.websites||[]).filter(item=>item&&item.published!==false&&!excludedWebsite(item)&&item.title&&safeUrl(item.url)).map((item,index)=>({...item,type:item.type==='client'?'client':'demo',priority:Number(item.priority||index+1),url:safeUrl(item.url)})).sort((a,b)=>a.type===b.type?a.priority-b.priority:a.type==='client'?-1:1);
    const clientCount=sites.filter(item=>item.type==='client').length;
    document.querySelector('[data-client-count]')?.replaceChildren(document.createTextNode(String(clientCount)));
    document.querySelector('[data-website-count]')?.replaceChildren(document.createTextNode(`${sites.length}+`));
    track.innerHTML=sites.map((item,index)=>{
      const image=String(item.image||'').trim();
      return `<article class="slider-card website-card"><a class="card-image${image?' pending-image':''}" href="${esc(item.url)}" target="_blank" rel="noreferrer">${previewMarkup(item,index)}${image?`<img src="${esc(image)}" alt="${esc(item.imageAlt||`${item.title} website preview`)}" loading="lazy" decoding="async" />`:''}<span class="card-domain">${esc(host(item.url))}</span></a><div class="card-body"><div class="card-top"><span>${String(index+1).padStart(2,'0')} · ${esc(item.category||'Website')}</span><b>${item.type==='client'?'Real client':'Live demo'}</b></div><h3 data-display>${esc(item.title)}</h3><p>${esc(item.summary||'')}</p><a class="card-link" href="${esc(item.url)}" target="_blank" rel="noreferrer"><span>Open live website</span><b>↗</b></a></div></article>`;
    }).join('');
    track.querySelectorAll('.pending-image img').forEach(img=>{const box=img.closest('.card-image');const loaded=()=>box?.classList.add('has-image');img.addEventListener('load',loaded,{once:true});img.addEventListener('error',()=>img.remove(),{once:true});if(img.complete&&img.naturalWidth)loaded();});
    setupSlider('websites');
  }

  function renderVideos(){
    const track=document.querySelector('[data-slider="videos"]');if(!track)return;
    document.querySelector('[data-video-count]')?.replaceChildren(document.createTextNode(String(media.videos.length)));
    track.innerHTML=media.videos.map((item,index)=>`<article class="slider-card media-card"><div class="card-image has-image"><img src="${esc(item.poster)}" alt="${esc(item.title)} poster" loading="lazy" decoding="async" /></div><button type="button" data-video-index="${index}" aria-label="Play ${esc(item.title)}"><span class="play">▶</span><small>${String(index+1).padStart(2,'0')} · ${esc(item.duration||'')} · ${esc(item.category||'Video')}</small><h3 data-display>${esc(item.title)}</h3></button></article>`).join('');
    track.querySelectorAll('[data-video-index]').forEach(button=>button.addEventListener('click',()=>openVideo(Number(button.dataset.videoIndex))));setupSlider('videos');
  }

  function renderPhotos(){
    const track=document.querySelector('[data-slider="photos"]');if(!track)return;
    track.innerHTML=media.photos.map((item,index)=>`<article class="slider-card photo-card"><div class="card-image has-image"><img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy" decoding="async" /></div><div class="photo-caption"><small>${String(index+1).padStart(2,'0')} · ${esc(item.label)}</small><h3 data-display>${esc(item.title)}</h3></div></article>`).join('');setupSlider('photos');
  }

  function setupSlider(name){
    const track=document.querySelector(`[data-slider="${name}"]`),prev=document.querySelector(`[data-slide-prev="${name}"]`),next=document.querySelector(`[data-slide-next="${name}"]`),count=document.querySelector(`[data-slide-count="${name}"]`);if(!track)return;
    const cards=[...track.children],step=()=>((cards[0]?.getBoundingClientRect().width)||320)+16,update=()=>{const current=Math.min(cards.length,Math.max(1,Math.round(track.scrollLeft/step())+1));if(count)count.textContent=`${String(current).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;};
    prev?.addEventListener('click',()=>track.scrollBy({left:-step(),behavior:'smooth'}));next?.addEventListener('click',()=>track.scrollBy({left:step(),behavior:'smooth'}));track.addEventListener('scroll',()=>requestAnimationFrame(update),{passive:true});update();
  }

  function renderSocial(){
    const row=document.querySelector('[data-social-row]');if(!row)return;
    const entries=[['instagram','Instagram'],['linkedin','LinkedIn'],['threads','Threads'],['facebook','Facebook'],['whatsapp','WhatsApp'],['email','Email'],['phone','Call']];
    row.innerHTML=entries.map(([key,label])=>{const url=safeUrl(content.social?.[key]);if(!url)return'';return`<a class="social-chip" href="${esc(url)}" ${/^https?:/.test(url)?'target="_blank" rel="noreferrer"':''}>${icon(key)}<span>${label}</span></a>`;}).join('');
  }

  function openVideo(index){
    const item=media.videos[index],dialog=document.querySelector('[data-video-dialog]'),stage=document.querySelector('[data-video-stage]');if(!item||!dialog||!stage)return;stage.replaceChildren();
    if(item.localUrl){const video=document.createElement('video');video.src=item.localUrl;video.controls=true;video.autoplay=true;video.playsInline=true;stage.append(video);}else if(item.driveId){const frame=document.createElement('iframe');frame.src=`https://drive.google.com/file/d/${encodeURIComponent(item.driveId)}/preview`;frame.allow='autoplay; fullscreen';frame.allowFullscreen=true;frame.title=item.title;stage.append(frame);}dialog.showModal();
  }

  function setupVideoDialog(){const dialog=document.querySelector('[data-video-dialog]');document.querySelector('[data-video-close]')?.addEventListener('click',()=>dialog?.close());dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});dialog?.addEventListener('close',()=>document.querySelector('[data-video-stage]')?.replaceChildren());}
  function setupTheme(){let stored=null;try{stored=localStorage.getItem('ajaynxt-theme');}catch{}const theme=stored||root.dataset.theme||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');const apply=value=>{root.dataset.theme=value;applySpectrum(currentHue);document.querySelector('[data-theme-icon]')?.replaceChildren(document.createTextNode(value==='dark'?'☾':'☀'));document.querySelector('meta[name="theme-color"]')?.setAttribute('content',value==='dark'?'#09090a':'#f3f0e9');};apply(theme);document.querySelector('[data-theme-toggle]')?.addEventListener('click',()=>{const next=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('ajaynxt-theme',next);}catch{}apply(next);});}
  function setupMenu(){const button=document.querySelector('[data-menu-button]'),nav=document.querySelector('[data-mobile-nav]');button?.addEventListener('click',()=>{const open=nav?.classList.toggle('is-open');button.setAttribute('aria-expanded',String(Boolean(open)));});nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('is-open');button?.setAttribute('aria-expanded','false');}));}
  function setupForm(){const form=document.querySelector('[data-enquiry-form]'),status=document.querySelector('[data-form-status]');form?.addEventListener('submit',async event=>{event.preventDefault();const values=Object.fromEntries(new FormData(form)),button=form.querySelector('button[type="submit"]');button.disabled=true;status.textContent='Sending enquiry…';try{if(window.AJAY_NXT_FIREBASE?.configured){await window.AJAY_NXT_FIREBASE.saveEnquiry({...values,timeline:'',budget:''});status.textContent='Enquiry saved. I will contact you shortly.';form.reset();}else{const wa=safeUrl(content.social?.whatsapp)||'https://wa.me/919929562585';const text=`AJAY NXT project enquiry\nName: ${values.name}\nPhone: ${values.phone}\nEmail: ${values.email||'-'}\nService: ${values.service}\nDetails: ${values.details}`;location.href=`${wa}${wa.includes('?')?'&':'?'}text=${encodeURIComponent(text)}`;status.textContent='Opening WhatsApp…';}}catch(error){status.textContent=error?.message||'Could not send. Please use WhatsApp.';}finally{button.disabled=false;}});}

  function renderAll(){applyAppearance();bindCopy();renderWebsites();renderVideos();renderPhotos();renderSocial();document.querySelector('[data-year]')?.replaceChildren(document.createTextNode(String(new Date().getFullYear())));}
  setupTheme();setupMenu();setupVideoDialog();setupForm();renderAll();
  window.addEventListener('ajaynxt:content-ready',event=>{const remote=event.detail||{};content=deepMerge(structuredClone(defaults),remote);content.websites=mergeById(defaults.websites||[],remote.websites||[]).filter(item=>!excludedWebsite(item)).map(item=>{const base=(defaults.websites||[]).find(x=>String(x.id)===String(item.id));return item.image?item:{...item,image:base?.image||''};});content.social=deepMerge(structuredClone(defaults.social||{}),remote.social||{});if(remote.settings?.designVersion!==5)content.settings=structuredClone(defaults.settings);renderAll();});
})();
