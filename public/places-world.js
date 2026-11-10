import {overseasCountry,sameOverseasCountry,overseasCityKey,overseasFootprint} from './places-overseas.js';
import {isTaiwan} from './place-geometry.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const extras=[{code:'HK',label:'香港',center:[114.17,22.31]},{code:'MO',label:'澳門',center:[113.55,22.2]},{code:'SG',label:'新加坡',center:[103.82,1.35]}];
const common=['TW','JP','KR','HK','MO','SG','CN','TH','VN','MY','ID','PH','IN','AU','US','CA','GB','FR','IT','NZ'];
const validPoint=p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180;
export function worldCountryRows(data,geometry){
 const footprint=overseasFootprint(data),rows=geometry.features.map(feature=>({code:feature.properties.code,name:overseasCountry(feature.properties.label),english:feature.properties.name,feature,center:geometry.geoCentroid(feature)}));
 for(const extra of extras)if(!rows.some(r=>r.code===extra.code))rows.push({...extra,name:extra.label});
 for(const row of rows)row.countries=[];
 const unmatched=[];
 for(const country of footprint.countries){const places=data.places.filter(p=>country.placeIds.includes(p.id)&&validPoint(p));let row=rows.find(r=>[r.name,r.english,r.code].some(name=>name&&sameOverseasCountry(name,country.name)));
 // Unknown local spellings can still be located by their saved coordinates. Do not alter stored names.
 if(!row&&places.length){const sample=places[0];row=rows.find(r=>r.feature&&r.code!=='TW'&&geometry.geoContains(r.feature,[sample.lng,sample.lat]));}
 if(!row){unmatched.push(country);continue;}row.countries.push(country);
 }
 return {rows:rows.map(row=>({...row,selectName:row.countries[0]?.name||row.name,state:row.countries.some(c=>c.state==='unlocked')?'unlocked':row.countries.some(c=>c.state==='half')?'half':row.countries.length?'wish':'empty',cities:row.countries.reduce((n,c)=>n+c.unlockedCities,0),count:row.countries.reduce((n,c)=>n+c.placeIds.length,0)})),unmatched};
}
export function worldCityRows(data,country,visiblePlaces=data.places){
 const footprint=overseasFootprint(data),row=footprint.countries.find(c=>sameOverseasCountry(c.name,country));
 if(!row)return [];
 const visible=new Set(visiblePlaces.map(p=>p.id));
 return row.cities.map(city=>{const places=data.places.filter(p=>city.placeIds.includes(p.id)&&visible.has(p.id)&&validPoint(p));if(!places.length)return null;return {...city,count:places.length,center:[places.reduce((n,p)=>n+p.lng,0)/places.length,places.reduce((n,p)=>n+p.lat,0)/places.length]};}).filter(Boolean);
}
export function worldProjection(geometry,{view='asia',country='',width=760,height=430,rows=[]}={}){
 const selected=rows.find(r=>sameOverseasCountry(r.selectName,country)||sameOverseasCountry(r.name,country));
 if(country&&selected){
  const projection=geometry.geoMercator().clipExtent([[8,8],[width-8,height-8]]);
  if(selected.feature)projection.rotate([-selected.center[0],0]).fitExtent([[35,35],[width-35,height-35]],selected.feature);
  else projection.center(selected.center).scale(Math.min(width,height)*7).translate([width/2,height/2]);
  return projection;
 }
 if(view==='world')return geometry.geoNaturalEarth1().fitExtent([[12,35],[width-12,height-30]],{type:'Sphere'});
 // The default includes East/Southeast Asia, India and the nearby Pacific.
 const projection=geometry.geoMercator().center([110,23]).scale(Math.min(width/1.85,height/1.5)).translate([width/2,height/2]);
 return projection.clipExtent([[6,6],[width-6,height-6]]);
}
function placeLabels(candidates,width,height){
 const placed=[],boxes=[];
 for(const item of candidates){const w=Math.max(44,[...item.label].length*13+18),h=25;
  for(const [dx,dy]of [[0,0],[0,-28],[0,28],[42,0],[-42,0],[42,-28],[-42,28],[0,56],[0,-56],[64,40],[-64,40],[64,-40],[-64,-40],[0,84],[0,-84]]){
   const x=Math.max(w/2+4,Math.min(width-w/2-4,item.point[0]+dx)),y=Math.max(18,Math.min(height-18,item.point[1]+dy)),box=[x-w/2-3,y-h/2-3,x+w/2+3,y+h/2+3];
   if(boxes.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]))continue;
   boxes.push(box);placed.push({...item,x,y,w,h});break;
  }
 }
 return placed;
}
export function renderWorldAtlas(data,geometry,visiblePlaces,{view='asia',country='',city='',width=760}={}){
 width=Math.max(280,Math.min(900,width));const height=width<500?330:440,{rows,unmatched}=worldCountryRows(data,geometry),selected=rows.find(r=>sameOverseasCountry(r.selectName,country)||sameOverseasCountry(r.name,country)),projection=worldProjection(geometry,{view,country,width,height,rows}),path=geometry.geoPath(projection),visible=new Set(visiblePlaces.map(p=>p.id));
 const countryCandidates=rows.map(r=>({...r,visibleCount:r.countries.reduce((n,c)=>n+c.placeIds.filter(id=>visible.has(id)).length,0)})).filter(r=>r.code==='TW'||r.countries.some(c=>c.placeIds.some(id=>visible.has(id)))||!country&&common.includes(r.code)),cities=country?worldCityRows(data,country,visiblePlaces):[];
 const onScreen=point=>point&&point.every(Number.isFinite)&&point[0]>12&&point[0]<width-12&&point[1]>20&&point[1]<height-20;
 const candidates=country?cities.map(c=>({label:c.name+' · '+c.count,point:projection(c.center),attrs:`data-world-city="${esc(c.id)}"`,state:c.state,active:c.id===city})):countryCandidates.sort((a,b)=>Number(b.code==='TW')-Number(a.code==='TW')||Number(b.count>0)-Number(a.count>0)).map(r=>({label:r.name+(r.visibleCount?' · '+r.visibleCount:''),point:projection(r.center),attrs:r.code==='TW'?'data-world-taiwan':`data-world-country="${esc(r.selectName)}"`,state:r.state}));
 const shownCandidates=candidates.filter(c=>onScreen(c.point)),labels=placeLabels(shownCandidates,width,height);
 const countries=rows.filter(r=>r.feature).map(r=>{const d=path(r.feature);return d?`<path class="world-land world-${r.state}${selected===r?' selected':''}" d="${d}" ${r.code==='TW'?'data-world-taiwan':`data-world-country="${esc(r.selectName)}"`} role="button" tabindex="0" aria-label="${esc(r.name)}${r.count?'，收藏 '+r.count+' 個地方':''}"><title>${esc(r.name)}${r.count?'・收藏 '+r.count+' 個地方':''}</title></path>`:'';}).join('');
 const unlabelled=shownCandidates.filter(c=>!labels.some(label=>label.attrs===c.attrs)).map(c=>`<g class="world-label world-${c.state}" ${c.attrs} role="button" tabindex="0" aria-label="${esc(c.label)}"><title>${esc(c.label)}</title><circle class="world-dot" cx="${c.point[0]}" cy="${c.point[1]}" r="5"/></g>`).join('');
 const marks=unlabelled+labels.map(c=>`<g class="world-label world-${c.state}${c.active?' selected':''}" ${c.attrs} role="button" tabindex="0" aria-label="${esc(c.label)}"><path class="world-leader" d="M${c.point[0]},${c.point[1]}L${c.x},${c.y}"/><circle class="world-dot" cx="${c.point[0]}" cy="${c.point[1]}" r="3.5"/><rect x="${c.x-c.w/2}" y="${c.y-12}" width="${c.w}" height="25" rx="12.5"/><text x="${c.x}" y="${c.y+5}" text-anchor="middle">${esc(c.label)}</text></g>`).join('');
 return `<div class="world-atlas ${country?'world-country-view':''}"><div class="world-atlas-heading"><div><small>我們的旅行足跡</small><h2>${esc(country|| (view==='world'?'一起看看世界':'下一站，亞洲'))}</h2></div><span aria-hidden="true" class="world-postmark">♡</span></div><svg class="world-atlas-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="${esc(country|| (view==='world'?'世界':'亞洲'))}插畫地圖"><defs><clipPath id="world-atlas-clip"><rect width="${width}" height="${height}" rx="28"/></clipPath></defs><g clip-path="url(#world-atlas-clip)"><rect class="world-ocean" width="${width}" height="${height}" rx="28"/><g class="world-waves" aria-hidden="true"><path d="M16 45q7 6 14 0t14 0M${width-65} ${height-48}q7 6 14 0t14 0M28 ${height-35}q7 6 14 0t14 0"/><path class="world-route" d="M${width*.15} ${height*.8}Q${width*.4} ${height*.6} ${width*.8} ${height*.24}"/></g>${countries}${marks}</g></svg><div class="world-legend"><span><i class="world-key unlocked"></i>一起去過</span><span><i class="world-key half"></i>一人足跡</span><span><i class="world-key wish"></i>願望清單</span></div><p class="hint world-map-caption">${country?(cities.length?'點城市看收藏地點，也能從下方清單開啟。':'這裡還留著空白，收藏一個想去的地方吧。'):'點國家看城市與收藏地點；數字為收藏地點數。'}</p>${unmatched.length?`<p class="hint">${unmatched.map(c=>esc(c.name)).join('、')}尚未對應地圖輪廓，收藏與造訪仍完整保留在下方清單。</p>`:''}<p class="world-map-credit">世界輪廓：Natural Earth（公有領域）・插畫僅供足跡瀏覽，精確位置請使用地點卡片導航。</p></div>`;
}
