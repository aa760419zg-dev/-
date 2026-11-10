// Drafts stay in this browser, isolated by household and signed-in member.
export function createPlaceDraftStore({storage,getScope}){const memory=new Map();const key=kind=>'places-draft:'+getScope()+':'+kind;return {
 read(kind){const k=key(kind);let raw=memory.get(k);try{raw=storage()?.getItem(k)||raw;}catch{}try{const saved=JSON.parse(raw||'null');return saved?.version===1&&saved.kind===kind&&saved.value&&typeof saved.value==='object'&&!Array.isArray(saved.value)?structuredClone(saved.value):null;}catch{return null;}},
 write(kind,value){const k=key(kind);try{const raw=JSON.stringify({version:1,kind,value});if(raw.length>100000)return;memory.set(k,raw);try{storage()?.setItem(k,raw);}catch{}}catch{}},
 clear(kind){const k=key(kind);memory.delete(k);try{storage()?.removeItem(k);}catch{}}
};}
