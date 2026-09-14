// DOM UI stays independent of Three.js. Photo previews are local, never uploaded.
export function createTravelUI({ destinations, onSelect, onClose }) {
  const panel=document.createElement('aside');
  panel.className='album-panel';panel.hidden=true;panel.inert=true;
  panel.setAttribute('aria-labelledby','album-title');
  panel.innerHTML=`<div class="album-top"><span>ALONG THE WAY · 沿途</span><button class="round-button" data-close aria-label="关闭相册，返回地球">×</button></div>
    <h2 id="album-title" tabindex="-1"></h2><p class="album-coordinate"></p><div class="city-tabs" aria-label="选择城市"></div>
    <hr class="album-rule"><div class="album-meta"><span>旅行相册</span><span data-count></span></div>
    <div class="photo-grid"></div><div class="album-empty"></div>
    <div class="album-footer"><button class="preview-button" data-preview>选择本机照片预览</button>
    <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden>
    <p class="album-notice">仅在当前页面预览，不会上传或保存。最多 10 张。</p><p class="album-notice" role="status" data-status></p></div>`;
  document.body.append(panel);
  const viewer=document.createElement('dialog');viewer.className='photo-viewer';
  viewer.setAttribute('aria-label','照片大图');
  viewer.innerHTML=`<div class="viewer-top"><span data-position></span><button class="round-button" data-close aria-label="关闭大图">×</button></div>
    <div class="viewer-image-wrap"><img class="viewer-image" alt=""><p hidden>这张照片暂时无法加载，请稍后重试。</p></div>
    <div class="viewer-footer"><button data-prev aria-label="上一张">←</button><p class="viewer-caption"></p><button data-next aria-label="下一张">→</button></div>`;
  document.body.append(viewer);
  const title=panel.querySelector('h2'),grid=panel.querySelector('.photo-grid'),empty=panel.querySelector('.album-empty');
  const tabs=panel.querySelector('.city-tabs'),input=panel.querySelector('input'),status=panel.querySelector('[data-status]');
  let active=null,city='',manifest=null,loadError=false,photos=[],photoIndex=0,lastCard=null;
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
      return [{src,thumbnail:imageURL(entry.thumbnail)||src,caption:String(entry.caption||`${city} · ${i+1}`)}];
    });
  }
  function render() {
    if(!active)return;
    photos=getPhotos();grid.replaceChildren();empty.replaceChildren();status.textContent='';
    panel.querySelector('[data-count]').textContent=`${String(photos.length).padStart(2,'0')} 张`;
    tabs.replaceChildren();tabs.hidden=active.cities.length<2;
    for(const name of active.cities) {
      const button=document.createElement('button');button.textContent=name;button.setAttribute('aria-pressed',String(city===name));
      button.onclick=()=>{city=name;render();tabs.querySelector('[aria-pressed="true"]').focus();};tabs.append(button);
    }
    grid.hidden=photos.length===0;empty.hidden=photos.length>0;
    photos.forEach((photo,index)=>{
      const button=document.createElement('button');button.className='photo-card';button.setAttribute('aria-label',`查看照片：${photo.caption}`);
      const img=document.createElement('img');img.src=photo.thumbnail;img.alt=photo.caption;img.loading='lazy';img.decoding='async';
      const caption=document.createElement('span');caption.textContent=photo.caption;
      img.onerror=()=>{img.hidden=true;caption.textContent=`照片 ${index+1} 暂时无法加载`;caption.className='photo-error';};
      button.append(img,caption);button.onclick=()=>{lastCard=button;photoIndex=index;renderViewer();viewer.showModal();};grid.append(button);
    });
    if(!photos.length) {
      const frames=document.createElement('div');frames.className='empty-frames';frames.setAttribute('aria-hidden','true');
      const heading=document.createElement('h3'),copy=document.createElement('p');
      const hasLocal=localAlbums.has(key());
      heading.textContent=loadError&&!hasLocal?'相册暂时无法加载':manifest===null&&!hasLocal?'正在打开相册…':'风景，慢慢收藏';
      copy.textContent=loadError&&!hasLocal?'照片清单读取失败，可以重试。':`还没有添加${city}的照片。`;
      empty.append(frames,heading,copy);
      if(loadError&&!hasLocal){const retry=document.createElement('button');retry.className='preview-button';retry.textContent='重新加载';retry.onclick=loadAlbums;empty.append(retry);}
    }
  }
  function renderViewer() {
    const photo=photos[photoIndex];if(!photo)return;
    const img=viewer.querySelector('img'),error=viewer.querySelector('.viewer-image-wrap p');
    img.hidden=false;error.hidden=true;img.alt=photo.caption;
    img.onerror=()=>{img.hidden=true;error.hidden=false;};img.src=photo.src;
    viewer.querySelector('[data-position]').textContent=`${city} · ${photoIndex+1} / ${photos.length}`;
    viewer.querySelector('.viewer-caption').textContent=photo.caption;
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
    if(!chosen.length){status.textContent='请选择 JPEG、PNG、WebP 或 AVIF 图片，每张不超过 25MB。';return;}
    for(const photo of localAlbums.get(key())||[])URL.revokeObjectURL(photo.src);
    localAlbums.set(key(),chosen.map(file=>{const src=URL.createObjectURL(file);return {src,thumbnail:src,caption:file.name.replace(/\.[^.]+$/,'')};}));
    render();status.textContent=`已预览 ${chosen.length} 张照片，刷新页面后会清除。${all.length!==chosen.length?'部分文件因格式、大小或数量限制未加入。':''}`;
  });
  const menu=document.createElement('div');menu.className='place-menu';menu.hidden=true;menu.id='place-menu';
  const menuTitle=document.createElement('p');menuTitle.textContent='去过的地方';menu.append(menuTitle);
  const placesButton=document.querySelector('[data-places]');placesButton.setAttribute('aria-controls',menu.id);placesButton.setAttribute('aria-expanded','false');
  function hideMenu(){menu.hidden=true;placesButton.setAttribute('aria-expanded','false');}
  for(const destination of destinations.filter(place=>place.visited)) {
    const button=document.createElement('button');button.textContent=destination.name;button.onclick=()=>{hideMenu();onSelect(destination.id);};menu.append(button);
  }
  document.body.append(menu);
  placesButton.onclick=()=>{menu.hidden=!menu.hidden;placesButton.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)menu.querySelector('button').focus();};
  document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target)&&!placesButton.contains(event.target))hideMenu();});
  document.querySelector('[data-explore]').onclick=event=>{event.preventDefault();hideMenu();onClose();};
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||viewer.open)return;
    if(!menu.hidden){hideMenu();placesButton.focus();return;}
    if(active){event.preventDefault();onClose();}
  });
  loadAlbums();
  return {
    prepare(place){if(viewer.open)viewer.close();active=place;city=place.cities[0];title.textContent=place.name;
      panel.querySelector('.album-coordinate').textContent=`${Math.abs(place.lat).toFixed(2)}° ${place.lat<0?'S':'N'}  /  ${Math.abs(place.lon).toFixed(2)}° ${place.lon<0?'W':'E'}`;
      panel.hidden=false;panel.inert=true;panel.classList.remove('is-open');render();panel.scrollTop=0;},
    show(){if(!active)return;panel.inert=false;panel.classList.add('is-open');panel.querySelector('[data-close]').focus({preventScroll:true});},
    close(){if(viewer.open)viewer.close();active=null;panel.inert=true;panel.classList.remove('is-open');},
    isModalOpen:()=>viewer.open,
    viewport(){return matchMedia('(max-width:760px)').matches?{left:0,top:90,width:innerWidth,height:Math.max(80,innerHeight*.54-90)}:
      {left:0,top:98,width:innerWidth-panel.offsetWidth-44,height:Math.max(80,innerHeight-120)};}
  };
}
