import { t, getLanguage } from './i18n.js?v=local-photos';

const storageKey = album => `pocket-atlas-visit:${album}`;
export const validVisitMonth = month => typeof month === 'string' && (month === '' || /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(month));
export function formatVisitMonth(month, language) {
  return language === 'zh' ? month.replace('-', ' / ') : new Intl.DateTimeFormat('en', {year:'numeric',month:'short',timeZone:'UTC'}).format(new Date(month+'-01T00:00:00Z'));
}
export function readVisitDates(storage, album) {
  const raw = storage.getItem(storageKey(album));
  if (!raw) return { month: '' };
  const saved = JSON.parse(raw);
  // Preserve compatibility with the earlier arrival/departure format.
  const month = saved?.month ?? (typeof saved?.start === 'string' ? saved.start.slice(0,7) : null);
  if (!validVisitMonth(month)) throw new Error('Invalid saved month');
  return { month };
}
export function saveVisitDates(storage, album, { month }) {
  if (!validVisitMonth(month)) throw new Error('Invalid visit month');
  storage.setItem(storageKey(album), JSON.stringify({ month }));
}
export function createVisitDates(container) {
  const details=document.createElement('details');
  details.className='visit-dates';
  details.innerHTML='<summary><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M6 2v4m8-4v4M3 8h14"/></svg><span></span></summary><div class="visit-editor"><div class="visit-picker-heading"></div><div class="visit-year-bar"><button type="button" data-prev>‹</button><select data-year></select><button type="button" data-next>›</button></div><div class="visit-month-grid"></div><div class="visit-picker-footer"><button type="button" data-clear></button></div><p class="album-notice" role="status"></p></div>';
  container.append(details);
  const editor=details.querySelector('.visit-editor');
  const summary=details.querySelector('summary'), year=details.querySelector('[data-year]'), grid=details.querySelector('.visit-month-grid');
  const previous=details.querySelector('[data-prev]'), next=details.querySelector('[data-next]'), clear=details.querySelector('[data-clear]'), status=details.querySelector('[role="status"]');
  let album=null,saved='',draft='',viewYear=new Date().getFullYear(),message=null;
  // Portal keeps the picker clear of the mobile sheet's clipped scrolling area.
  document.body.append(editor);editor.hidden=true;
  const contains=target=>details.contains(target)||editor.contains(target);
  function positionEditor() {
    if(!details.open)return;
    const rect=summary.getBoundingClientRect(),height=editor.offsetHeight,width=editor.offsetWidth;
    const below=rect.bottom+8,above=rect.top-height-8;
    editor.style.left=Math.max(12,Math.min(innerWidth-width-12,rect.right-width))+'px';
    editor.style.top=Math.max(12,Math.min(innerHeight-height-12,below+height<=innerHeight-12?below:above))+'px';
  }
  window.addEventListener('resize',positionEditor);
  document.addEventListener('scroll',positionEditor,true);
  const locale=()=>getLanguage()==='zh'?'zh-CN':'en';
  const valueFor=m=>String(viewYear).padStart(4,'0')+'-'+String(m).padStart(2,'0');
  for(let m=1;m<=12;m++){
    const button=document.createElement('button');button.type='button';button.dataset.month=String(m);
    button.onclick=()=>{draft=valueFor(m);message=null;update();};grid.append(button);
  }
  function update() {
    const caption=saved?formatVisitMonth(saved,getLanguage()):t('addVisitMonth');
    summary.querySelector('span').textContent=caption;summary.setAttribute('aria-label',t('visitDates')+': '+caption);
    editor.hidden=!details.open;
    editor.querySelector('.visit-picker-heading').textContent=t('visitDates');
    previous.setAttribute('aria-label',t('previousYear'));next.setAttribute('aria-label',t('nextYear'));
    previous.disabled=viewYear<=1;next.disabled=viewYear>=9999;
    year.setAttribute('aria-label',t('visitYear'));
    const min=Math.min(1900,viewYear),max=Math.max(new Date().getFullYear()+1,viewYear);
    if(!year.options.length||!Array.from(year.options).some(option=>Number(option.value)===viewYear)){
      year.replaceChildren();for(let y=max;y>=min;y--)year.add(new Option(String(y),String(y)));
    }
    year.value=String(viewYear);
    for(const button of grid.children){
      const m=Number(button.dataset.month);
      button.textContent=new Intl.DateTimeFormat(locale(),{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2000,m-1,1)));
      button.setAttribute('aria-pressed',String(draft===valueFor(m)));
      button.setAttribute('aria-label',String(viewYear)+' '+button.textContent);
    }
    clear.textContent=t('clearVisitMonth');clear.disabled=!draft;
    status.textContent=message?t(message):'';
    positionEditor();
  }
  function commit() {
    if(draft!==saved){
      try {saveVisitDates(localStorage,album,{month:draft});saved=draft;message=null;}
      catch {message='visitSaveError';update();return false;}
    }
    details.open=false;update();return true;
  }
  summary.onclick=event=>{
    event.preventDefault();
    if(details.open){commit();return;}
    draft=saved;viewYear=saved?Number(saved.slice(0,4)):new Date().getFullYear();message=null;details.open=true;update();
  };
  year.onchange=()=>{viewYear=Number(year.value);update();};
  previous.onclick=()=>{viewYear--;update();};next.onclick=()=>{viewYear++;update();};
  clear.onclick=()=>{draft='';message=null;update();};
  // Commit before an outside click can switch city, close the album or open a photo.
  document.addEventListener('pointerdown',event=>{
    if(!details.open||contains(event.target))return;
    if(!commit()){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  const onKeyDown=event=>{
    if(event.key==='Escape'&&details.open){event.preventDefault();event.stopPropagation();draft=saved;message=null;details.open=false;update();summary.focus();}
  };
  const onFocusOut=event=>{if(details.open&&event.relatedTarget&&!contains(event.relatedTarget))commit();};
  for(const element of [details,editor]){element.addEventListener('keydown',onKeyDown);element.addEventListener('focusout',onFocusOut);}
  return {
    render(nextAlbum) {
      if(album!==nextAlbum){
        if(album&&details.open)commit();
        album=nextAlbum;saved='';message=null;details.open=false;
        try {saved=readVisitDates(localStorage,album).month;}catch {message='visitLoadError';details.open=true;}
        draft=saved;viewYear=saved?Number(saved.slice(0,4)):new Date().getFullYear();
      }
      update();
    },
    reset(){if(details.open)commit();details.open=false;editor.hidden=true;album=null;}
  };
}
