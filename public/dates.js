const parts=date=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(date)).map(p=>[p.type,p.value]));
export function taipeiDate(date=new Date()){const p=parts(date);return p.year+'-'+p.month+'-'+p.day;}
export function taipeiTime(date=new Date()){const p=parts(date);return p.hour+':'+p.minute;}
const localDay=taipeiDate;
export function formatDate(value,reference=localDay()){
 if(!value)return '';const text=String(value),date=new Date(text+'T00:00:00Z'),now=new Date(reference+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==text||!Number.isFinite(now.getTime()))return text;
 const days=Math.round((date-now)/86400000);if(days===0)return '今天';if(days===-1)return '昨天';if(days===1)return '明天';
 const day=(date.getUTCMonth()+1)+'/'+date.getUTCDate();return date.getUTCFullYear()===now.getUTCFullYear()?day+'（'+['日','一','二','三','四','五','六'][date.getUTCDay()]+'）':date.getUTCFullYear()+'/'+day;
}
export function formatDateTime(value){const date=new Date(value);if(!Number.isFinite(date.getTime()))return String(value||'');return formatDate(localDay(date))+' '+taipeiTime(date);}
export function formatDatesInText(value,reference){return String(value??'').replace(/\b\d{4}-\d{2}-\d{2}\b/g,date=>formatDate(date,reference));}
