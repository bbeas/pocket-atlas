// DOM UI stays independent of Three.js. Photo previews are local, never uploaded.
import { t, placeName, localizedContent, translatePage, onLanguageChange } from './i18n.js?v=pocket-atlas';
export function createTravelUI({ destinations, onSelect, onClose }) {
  const panel=document.createElement('aside');
  panel.className='album-panel';panel.hidden=true;panel.inert=true;
  panel.setAttribute('aria-labelledby','album-title');
  panel.innerHTML=`<div class="album-top"><span>POCKET ATLAS</span><button class="round-button" data-close data-i18n-label="closeAlbum">×</button></div>
    <h2 id="album-title" tabindex="-1"></h2><p class="album-coordinate"></p><div class="city-tabs" data-i18n-label="chooseCity"></div>
    <hr class="album-rule"><div class="album-meta"><span data-i18n="album"></span><span data-count></span></div>
    <div class="photo-grid"></div><div class="album-empty"></div>
    <div class="album-footer"><button class="preview-button" data-preview data-i18n="preview"></button>
    <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden>
    <p class="album-notice" data-i18n="previewNotice"></p><p class="album-notice" role="status" data-status></p></div>`;
  document.body.append(panel);
  const viewer=document.createElement('dialog');viewer.className='photo-viewer';
  viewer.dataset.i18nLabel='photoViewer';
  viewer.innerHTML=`<div class="viewer-top"><span data-position></span><button class="round-button" data-close data-i18n-label="closePhoto">×</button></div>
    <div class="viewer-image-wrap"><img class="viewer-image" alt=""><p hidden data-i18n="photoError"></p></div>
    <div class="viewer-footer"><button data-prev data-i18n-label="previous">←</button><p class="viewer-caption"></p><button data-next data-i18n-label="next">→</button></div>`;
  document.body.append(viewer);
  const title=panel.querySelector('h2'),grid=panel.querySelector('.photo-grid'),empty=panel.querySelector('.album-empty');
  const tabs=panel.querySelector('.city-tabs'),input=panel.querySelector('input'),status=panel.querySelector('[data-status]');
  let active=null,city='',manifest=null,loadError=false,photos=[],photoIndex=0,lastCard=null,statusMessage=null;
  const captionFor=(photo,index)=>localizedContent(photo.caption)||`${placeName(city)} · ${index+1}`;
  const localAlbums=new Map();
  const key=()=>`${active.id}/${city}`;
  async function loadAlbums() {
    loadError=false;
    try {
      const response=await fetch(new URL('./albums.json',import.meta.url));
      if(!response.ok)throw new Error('Album request failed');
      const data=await response.json();
      if(!data || typeof data!=='object' || Array.isArray(data))throw new Error('Invalid album data');
      manifest=data;
    } catch { loadError=true; }
    if(active)render();
  }
  function imageURL(value) {
    if(typeof value!=='string'||!value.trim())return null;
    try { const url=new URL(value,import.meta.url);return ['https:','http:'].includes(url.protocol)?url.href:null; }
    catch { return null; }
  }
  function getPhotos() {
    if(localAlbums.has(key()))return localAlbums.get(key());
    const entries=manifest?.[active.id]?.cities?.[city];
    if(!Array.isArray(entries))return [];
    return entries.slice(0,10).flatMap((entry,i)=>{
      if(!entry || typeof entry!=='object')return [];
      const src=imageURL(entry.src);if(!src)return [];
      return [{src,thumbnail:imageURL(entry.thumbnail)||src,caption:entry.caption}];
    });
  }
  function render() {
    if(!active)return;
    photos=getPhotos();grid.replaceChildren();empty.replaceChildren();
    title.textContent=placeName(active.name);
    status.textContent=statusMessage?t(statusMessage.key,statusMessage)+(statusMessage.skipped?' '+t('skippedFiles'):''):'';
    panel.querySelector('[data-count]').textContent=t(photos.length===1?'countOne':'count',{count:String(photos.length).padStart(2,'0')});
    tabs.replaceChildren();tabs.hidden=active.cities.length<2;
    for(const name of active.cities) {
      const button=document.createElement('button');button.textContent=placeName(name);button.setAttribute('aria-pressed',String(city===name));
      button.onclick=()=>{city=name;statusMessage=null;render();tabs.querySelector('[aria-pressed="true"]').focus();};tabs.append(button);
    }
    grid.hidden=photos.length===0;empty.hidden=photos.length>0;
    photos.forEach((photo,index)=>{
      const description=captionFor(photo,index);
      const button=document.createElement('button');button.className='photo-card';button.setAttribute('aria-label',t('viewPhoto',{caption:description}));
      const img=document.createElement('img');img.src=photo.thumbnail;img.alt=description;img.loading='lazy';img.decoding='async';
      const caption=document.createElement('span');caption.textContent=description;
      img.onerror=()=>{img.hidden=true;caption.textContent=t('thumbnailError',{number:index+1});caption.className='photo-error';};
      button.append(img,caption);button.onclick=()=>{lastCard=button;photoIndex=index;renderViewer();viewer.showModal();};grid.append(button);
    });
    if(!photos.length) {
      const frames=document.createElement('div');frames.className='empty-frames';frames.setAttribute('aria-hidden','true');
      const heading=document.createElement('h3'),copy=document.createElement('p');
      const hasLocal=localAlbums.has(key());
      heading.textContent=t(loadError&&!hasLocal?'albumError':manifest===null&&!hasLocal?'loading':'emptyTitle');
      copy.textContent=t(loadError&&!hasLocal?'albumErrorCopy':manifest===null&&!hasLocal?'loadingCopy':'emptyCopy',{city:placeName(city)});
      empty.append(frames,heading,copy);
      if(loadError&&!hasLocal){const retry=document.createElement('button');retry.className='preview-button';retry.textContent=t('retry');retry.onclick=loadAlbums;empty.append(retry);}
    }
  }
  function renderViewer() {
    const photo=photos[photoIndex];if(!photo)return;
    const img=viewer.querySelector('img'),error=viewer.querySelector('.viewer-image-wrap p');
    img.hidden=false;error.hidden=true;img.alt=captionFor(photo,photoIndex);
    img.onerror=()=>{img.hidden=true;error.hidden=false;};img.src=photo.src;
    viewer.querySelector('[data-position]').textContent=`${placeName(city)} · ${photoIndex+1} / ${photos.length}`;
    viewer.querySelector('.viewer-caption').textContent=captionFor(photo,photoIndex);
    viewer.querySelector('[data-prev]').disabled=photoIndex===0;
    viewer.querySelector('[data-next]').disabled=photoIndex===photos.length-1;
  }
  function step(direction){photoIndex=Math.max(0,Math.min(photos.length-1,photoIndex+direction));renderViewer();}
  viewer.querySelector('[data-close]').onclick=()=>viewer.close();
  viewer.querySelector('[data-prev]').onclick=()=>step(-1);viewer.querySelector('[data-next]').onclick=()=>step(1);
  viewer.addEventListener('click',event=>{if(event.target!==viewer)return;const r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close();});
  viewer.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();event.stopPropagation();step(event.key==='ArrowLeft'?-1:1);}});
  viewer.addEventListener('close',()=>{viewer.querySelector('img').removeAttribute('src');if(lastCard?.isConnected)lastCard.focus();});
  panel.querySelector('[data-close]').onclick=onClose;
  panel.querySelector('[data-preview]').onclick=()=>input.click();
  input.addEventListener('change',()=>{
    if(!active)return;
    const supported=new Set(['image/jpeg','image/png','image/webp','image/avif']);
    const all=[...input.files],valid=all.filter(file=>supported.has(file.type)&&file.size<=25*1024*1024),chosen=valid.slice(0,10);
    input.value='';
    if(!chosen.length){statusMessage={key:'invalidFiles'};status.textContent=t('invalidFiles');return;}
    for(const photo of localAlbums.get(key())||[])URL.revokeObjectURL(photo.src);
    localAlbums.set(key(),chosen.map(file=>{const src=URL.createObjectURL(file);return {src,thumbnail:src,caption:file.name.replace(/\.[^.]+$/,'')};}));
    statusMessage={key:'previewReady',count:chosen.length,skipped:all.length!==chosen.length};render();
  });
  const menu=document.createElement('div');menu.className='place-menu';menu.hidden=true;menu.id='place-menu';
  const menuTitle=document.createElement('p');menuTitle.className='place-menu-title';menuTitle.dataset.i18n='travelIndex';menu.append(menuTitle);
  const menuSubtitle=document.createElement('p');menuSubtitle.className='place-menu-subtitle';menuSubtitle.dataset.i18n='chooseDestination';menu.append(menuSubtitle);
  const placesButton=document.querySelector('[data-places]');placesButton.setAttribute('aria-controls',menu.id);placesButton.setAttribute('aria-expanded','false');
  function hideMenu(){menu.hidden=true;placesButton.setAttribute('aria-expanded','false');}
  const menuLabels=[];
  for(const destination of destinations.filter(place=>place.visited)) {
    const button=document.createElement('button');
    const number=document.createElement('span');number.className='place-number';number.setAttribute('aria-hidden','true');number.textContent=String(menuLabels.length+1).padStart(2,'0');
    const label=document.createElement('span');label.textContent=placeName(destination.name);
    const arrow=document.createElement('span');arrow.className='place-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';
    button.append(number,label,arrow);button.onclick=()=>{hideMenu();placesButton.focus({preventScroll:true});onSelect(destination.id);};menu.append(button);
    menuLabels.push({button,label,id:destination.id,name:destination.name});
  }
  function updateMenuSelection(){menuLabels.forEach(({button,id})=>{if(active?.id===id)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});}
  document.body.append(menu);
  placesButton.onclick=()=>{menu.hidden=!menu.hidden;placesButton.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)menu.querySelector('button').focus();};
  document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target)&&!placesButton.contains(event.target))hideMenu();});
  menu.addEventListener('keydown',event=>{
    const index=menuLabels.findIndex(({button})=>button===document.activeElement);
    if(index<0)return;
    const last=menuLabels.length-1;
    const next={ArrowDown:(index+1)%(last+1),ArrowUp:(index+last)%(last+1),Home:0,End:last}[event.key];
    if(next!==undefined){event.preventDefault();event.stopPropagation();menuLabels[next].button.focus();}
  });
  menu.addEventListener('focusout',event=>{if(event.relatedTarget&&!menu.contains(event.relatedTarget)&&event.relatedTarget!==placesButton)hideMenu();});
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||viewer.open)return;
    if(!menu.hidden){hideMenu();placesButton.focus();return;}
    if(active){event.preventDefault();onClose();}
  });
  translatePage();
  onLanguageChange(()=>{
    menuLabels.forEach(({label,name})=>{label.textContent=placeName(name);});
    if(active) {
      const scrollTop=panel.scrollTop;
      render();panel.scrollTop=scrollTop;
      if(viewer.open){lastCard=grid.children[photoIndex];renderViewer();}
    }
  });
  loadAlbums();
  return {
    prepare(place){if(viewer.open)viewer.close();active=place;city=place.cities[0];statusMessage=null;title.textContent=placeName(place.name);
      updateMenuSelection();
      panel.querySelector('.album-coordinate').textContent=`${Math.abs(place.lat).toFixed(2)}° ${place.lat<0?'S':'N'}  /  ${Math.abs(place.lon).toFixed(2)}° ${place.lon<0?'W':'E'}`;
      panel.hidden=false;panel.inert=true;panel.classList.remove('is-open');render();panel.scrollTop=0;},
    show(){if(!active)return;panel.inert=false;panel.classList.add('is-open');panel.querySelector('[data-close]').focus({preventScroll:true});},
    close(){if(viewer.open)viewer.close();active=null;updateMenuSelection();panel.inert=true;panel.classList.remove('is-open');},
    isModalOpen:()=>viewer.open,
    viewport(){return matchMedia('(max-width:760px)').matches?{left:0,top:90,width:innerWidth,height:Math.max(80,innerHeight*.54-90)}:
      {left:0,top:98,width:innerWidth-panel.offsetWidth-44,height:Math.max(80,innerHeight-120)};}
  };
}
