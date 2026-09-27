import { t, placeName, onLanguageChange } from './i18n.js?v=touch-exploration';
import { canBrowsePlace } from './destination-policy.js';

export const usesTouchExploration = (pointerType, touchOnly) => pointerType === 'touch' || pointerType === 'pen' || touchOnly;
export function tapAction({ touch, sameTarget, browsable, visited }) {
  if (!sameTarget || !visited) return 'dismiss';
  return touch ? 'preview' : browsable ? 'open' : 'dismiss';
}
export function placePreview(bounds, width, height, viewportWidth, viewportHeight, top=88) {
  const edge=12,gap=-2;
  const clamp=(value,min,max)=>Math.max(min,Math.min(Math.max(min,max),value));
  return {
    x:clamp((bounds.left+bounds.right-width)/2,edge,viewportWidth-width-edge),
    y:clamp(bounds.bottom+gap,top,viewportHeight-height-edge)
  };
}
export function createTouchPreview({ onOpen }) {
  const card=document.createElement('div');card.className='touch-preview';card.hidden=true;
  card.innerHTML='<span class="touch-preview-name"></span><button type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="15" height="15" rx="3"/><path d="M15 2H6a4 4 0 0 0-4 4v9M5 16l4-4 4 4 3-3 4 4"/><circle cx="15.5" cy="9.5" r="1.2"/></svg></button>';
  const hint=document.createElement('p');hint.className='touch-discovery-hint';hint.hidden=true;hint.setAttribute('role','status');
  document.body.append(card,hint);
  let place=null;
  function translate(){
    if(place){card.querySelector('span').textContent=placeName(place.name);card.querySelector('button').setAttribute('aria-label',t('explorePhotos'));}
    hint.textContent=t('touchDiscover');
  }
  card.querySelector('button').onclick=()=>{if(place&&canBrowsePlace(place))onOpen(place.id);};
  onLanguageChange(translate);translate();
  return {
    show(next){place=next;translate();card.querySelector('button').hidden=!canBrowsePlace(place);card.style.visibility='hidden';card.hidden=false;},
    hide(){place=null;card.hidden=true;},
    position(bounds){
      const width=card.offsetWidth,height=card.offsetHeight;
      const top=document.querySelector('header').getBoundingClientRect().bottom+10;
      const position=placePreview(bounds,width,height,innerWidth,innerHeight,top);
      card.style.left=position.x+'px';card.style.top=position.y+'px';
      card.style.visibility='visible';
    },
    contains(target){return card.contains(target);},
    hint(show){hint.hidden=!show;}
  };
}
