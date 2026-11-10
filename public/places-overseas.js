import {isTaiwan} from './place-geometry.js';
const clean=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');
const key=value=>clean(value).toLocaleLowerCase();
const aliases=rows=>new Map(rows.flatMap(([name,...values])=>[name,...values].map(value=>[key(value),name])));
const countries=aliases([
 ['日本','Japan','日本国','日本國','JP'],['韓國','南韓','South Korea','Republic of Korea','대한민국','KR'],
 ['香港','Hong Kong','HK'],['澳門','Macao','Macau','MO'],['泰國','Thailand','TH'],['新加坡','Singapore','SG'],
 ['馬來西亞','Malaysia','MY'],['越南','Vietnam','Viet Nam','VN'],['印尼','Indonesia','ID'],['菲律賓','Philippines','PH'],
 ['美國','United States','United States of America','USA','US'],['英國','United Kingdom','UK','GB'],['法國','France','FR'],
 ['德國','Germany','DE'],['義大利','Italy','IT'],['澳洲','Australia','AU'],['紐西蘭','New Zealand','NZ'],['加拿大','Canada','CA']
]);
const cityAliases={
 日本:aliases([['東京','東京都','Tokyo','Tokyo Metropolis','Tōkyō'],['大阪','大阪市','Osaka'],['京都','京都市','Kyoto'],['札幌','札幌市','Sapporo'],['福岡','福岡市','Fukuoka']]),
 韓國:aliases([['首爾','서울','서울특별시','Seoul'],['釜山','부산','부산광역시','Busan']]),
 泰國:aliases([['曼谷','Bangkok','กรุงเทพมหานคร']]),香港:aliases([['香港','Hong Kong']]),澳門:aliases([['澳門','Macau','Macao']])
};
export const overseasCountry=value=>isTaiwan(value)?'台灣':countries.get(key(value))||clean(value);
export const sameOverseasCountry=(a,b)=>key(overseasCountry(a))===key(overseasCountry(b));
export const overseasCity=(country,city)=>{const name=overseasCountry(country),list=Object.hasOwn(cityAliases,name)?cityAliases[name]:null;return list?.get(key(city))||clean(city);};
export const overseasCityKey=place=>JSON.stringify([key(overseasCountry(place.country)),key(overseasCity(place.country,place.city))]);
export function overseasFootprint(data){
 const countryMap=new Map(),cityMap=new Map(),members=data.members||[],visitsByPlace=new Map();
 for(const visit of data.placeVisits||[]){const list=visitsByPlace.get(visit.placeId)||[];list.push(visit);visitsByPlace.set(visit.placeId,list);}
 for(const place of data.places||[]){if(isTaiwan(place.country))continue;const countryName=overseasCountry(place.country),countryId=key(countryName),cityName=overseasCity(place.country,place.city),cityId=overseasCityKey(place);
 let country=countryMap.get(countryId);if(!country){country={id:countryId,name:countryName,cities:[],placeIds:[],visited:0,wishes:0,together:0,latest:'',photo:null};countryMap.set(countryId,country);}
 let city=cityMap.get(cityId);if(!city){city={id:cityId,name:cityName,country:countryName,rawNames:[],placeIds:[],visited:0,wishes:0,together:0,latest:'',photo:null};cityMap.set(cityId,city);country.cities.push(city);}
 const visits=visitsByPlace.get(place.id)||[],count=visits.filter(v=>members.length>=2&&members.every(m=>v.participants.includes(m.userId))).length;
 if(!city.rawNames.includes(place.city))city.rawNames.push(place.city);
 for(const row of [country,city]){row.placeIds.push(place.id);row[visits.length?'visited':'wishes']++;row.together+=count;const latest=[place.createdAt||'',...visits.map(v=>v.date||'')].sort().at(-1)||'';if(latest>row.latest)row.latest=latest;const photo=visits.slice().sort((a,b)=>b.date.localeCompare(a.date)).flatMap(v=>v.photos||[])[0];if(photo&&!row.photo)row.photo=photo;}
 }
 const sort=(a,b)=>b.latest.localeCompare(a.latest)||a.name.localeCompare(b.name,'zh-TW');
 const result=[...countryMap.values()].sort(sort);for(const country of result){country.cities.sort(sort);for(const city of country.cities)city.state=city.together?'unlocked':city.visited?'half':'wish';country.unlockedCities=country.cities.filter(c=>c.state==='unlocked').length;country.state=country.together?'unlocked':country.visited?'half':'wish';}
 return {countries:result,countriesUnlocked:result.filter(c=>c.state==='unlocked').length,citiesUnlocked:[...cityMap.values()].filter(c=>c.state==='unlocked').length};
}
export function newOverseasCities(before,after){const old=new Set(overseasFootprint(before).countries.flatMap(c=>c.cities.filter(c=>c.state==='unlocked').map(c=>c.id)));return overseasFootprint(after).countries.flatMap(c=>c.cities.filter(city=>city.state==='unlocked'&&!old.has(city.id)).map(city=>({country:c.name,city:city.name,district:'',state:'unlocked',count:city.together,key:city.id})));}
export function renameOverseasCity(data,country,source,target){target=clean(target);if(!target||target.length>200||target===source)throw Error('請填入不同的城市名稱（最多 200 字）');const matches=(data.places||[]).filter(p=>!isTaiwan(p.country)&&key(overseasCountry(p.country))===key(overseasCountry(country))&&p.city===source);if(!matches.length)throw Error('這個城市名稱已變更，請重新整理');for(const place of matches)place.city=target;return matches.length;}
