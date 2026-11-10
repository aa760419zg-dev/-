// Bundled locally by scripts/build.js; no map tiles or third-party requests.
import topology from 'world-atlas/countries-110m.json' with {type:'json'};
import {feature} from 'topojson-client';
import countries from 'i18n-iso-countries';
export {geoMercator,geoNaturalEarth1,geoPath,geoCentroid,geoContains} from 'd3-geo';
const names=new Intl.DisplayNames(['zh-Hant-TW'],{type:'region'});
export const features=feature(topology,topology.objects.countries).features.filter(f=>f.id!=='010').map(f=>{
 const code=countries.numericToAlpha2(f.id)||(f.properties.name==='Kosovo'?'XK':'');
 return {...f,properties:{...f.properties,code,label:code?names.of(code):f.properties.name}};
});
