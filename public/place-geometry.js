export const normalizeRegion=value=>String(value||'').trim().replaceAll('臺','台');
export const isTaiwan=country=>['台灣','中華民國','Taiwan','TW'].some(x=>normalizeRegion(x).toLowerCase()===normalizeRegion(country).toLowerCase());
function inRing(x,y,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [a,b]=ring[i],[c,d]=ring[j],cross=(x-a)*(d-b)-(y-b)*(c-a);if(Math.abs(cross)<1e-10&&x>=Math.min(a,c)-1e-10&&x<=Math.max(a,c)+1e-10&&y>=Math.min(b,d)-1e-10&&y<=Math.max(b,d)+1e-10)return true;if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;}return inside;}
function inPolygon(x,y,rings){return inRing(x,y,rings[0])&&!rings.slice(1).some(r=>inRing(x,y,r));}
export function createTaiwanDistrictIndex(features){
 const entries=features.map(feature=>{const polygons=feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates:[feature.geometry.coordinates],points=polygons.flat(2);return {feature,polygons,minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))};});
 const cities={};for(const {feature} of entries){const city=normalizeRegion(feature.properties.COUNTYNAME),district=normalizeRegion(feature.properties.TOWNNAME);(cities[city]??=[]).push(district);}for(const districts of Object.values(cities))districts.sort((a,b)=>a.localeCompare(b,'zh-TW'));
 return {features,cities,locateTaiwanDistrict(lat,lng){if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;const entry=entries.find(e=>lng>=e.minX&&lng<=e.maxX&&lat>=e.minY&&lat<=e.maxY&&e.polygons.some(p=>inPolygon(lng,lat,p)));return entry?{country:'台灣',city:normalizeRegion(entry.feature.properties.COUNTYNAME),district:normalizeRegion(entry.feature.properties.TOWNNAME)}:null;}};
}
