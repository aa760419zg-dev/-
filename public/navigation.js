// A single route boundary for all dialogs, including nested ledger sheets.
export function createNavigationGuard({document:doc=globalThis.document,isBusy=()=>false,onDiscard=()=>{},onBlocked=()=>{}}={}){
 const win=doc.defaultView,baselines=new WeakMap();let accepted=win.location.hash;
 const forms=dialog=>[...dialog.querySelectorAll('form')];
 function signature(dialog){return JSON.stringify({fields:[...dialog.querySelectorAll('input,select,textarea')].map((e,i)=>[e.id||e.name||i,e.type==='checkbox'||e.type==='radio'?e.checked:e.value,e.files?[...e.files].map(f=>[f.name,f.size,f.lastModified]):null]),choices:[...dialog.querySelectorAll('[data-ledger-kind].selected,[data-ledger-account].selected,#ledger-category-label,#ledger-repeat-open')].map(e=>[e.dataset.ledgerKind||e.dataset.ledgerAccount||e.id,e.textContent])});}
 function markClean(dialog){baselines.set(dialog,{forms:forms(dialog),signature:signature(dialog)});}
 const proto=win.HTMLDialogElement.prototype,show=proto.showModal;
 proto.showModal=function(...args){const result=show.apply(this,args);markClean(this);return result;};
 for(const dialog of doc.querySelectorAll('dialog[open]'))markClean(dialog);
 const observer=new win.MutationObserver(()=>{for(const dialog of doc.querySelectorAll('dialog[open]')){const state=baselines.get(dialog),current=forms(dialog);if(!state||state.forms.length!==current.length||state.forms.some((f,i)=>f!==current[i]))markClean(dialog);}});
 observer.observe(doc.body,{subtree:true,childList:true});
 function hasUnsaved(){return [...doc.querySelectorAll('dialog[open]')].some(dialog=>{const state=baselines.get(dialog);return state&&state.signature!==signature(dialog);});}
 function closeAll(){onDiscard();for(const dialog of doc.querySelectorAll('dialog[open]'))dialog.close();}
 function canLeave(){if(isBusy()){onBlocked();return false;}if(hasUnsaved()&&!win.confirm('還沒儲存，確定要離開嗎？'))return false;closeAll();return true;}
 function checkRoute(){if(win.location.hash===accepted)return true;if(!canLeave()){win.history.replaceState(null,'',accepted||win.location.pathname+win.location.search);return false;}accepted=win.location.hash;return true;}
 const onClick=e=>{const link=e.target.closest('a[href^="#"]');if(!link)return;if(!canLeave()){e.preventDefault();e.stopImmediatePropagation();}};doc.addEventListener('click',onClick,true);
 const onHash=e=>{if(e.newURL&&new URL(e.newURL).hash!==win.location.hash){e.stopImmediatePropagation();return;}if(!checkRoute())e.stopImmediatePropagation();};win.addEventListener('hashchange',onHash);
 return {checkRoute,hasUnsaved,closeAll,markClean,acceptCurrent:()=>{accepted=win.location.hash;},dispose(){observer.disconnect();doc.removeEventListener('click',onClick,true);win.removeEventListener('hashchange',onHash);proto.showModal=show;}};
}
