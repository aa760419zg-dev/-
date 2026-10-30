import {icon} from './icons.js';
// Purely decorative; called only after the existing save operation succeeds.
export function completionFeedback(doc,kind,rect){
 const win=doc.defaultView;if(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return null;
 const mark=doc.createElement('span');mark.className='completion-feedback feedback-'+(kind==='dose'?'dose':'chore');mark.setAttribute('aria-hidden','true');mark.innerHTML=icon(kind==='dose'?'pets':'check');mark.style.left=(rect.left+rect.width/2)+'px';mark.style.top=(rect.top+rect.height/2)+'px';doc.body.append(mark);
 const timer=win.setTimeout(()=>mark.remove(),450);mark.addEventListener('animationend',()=>{win.clearTimeout(timer);mark.remove();},{once:true});return mark;
}
