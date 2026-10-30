const localDay=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function formatDate(value,reference=localDay()){
 if(!value)return '';const text=String(value),date=new Date(text+'T00:00:00Z'),now=new Date(reference+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==text||!Number.isFinite(now.getTime()))return text;
 const days=Math.round((date-now)/86400000);if(days===0)return '今天';if(days===-1)return '昨天';if(days===1)return '明天';
 const day=(date.getUTCMonth()+1)+'/'+date.getUTCDate();return date.getUTCFullYear()===now.getUTCFullYear()?day+'（'+['日','一','二','三','四','五','六'][date.getUTCDay()]+'）':date.getUTCFullYear()+'/'+day;
}
export function formatDateTime(value){const date=new Date(value);if(!Number.isFinite(date.getTime()))return String(value||'');return formatDate(localDay(date))+' '+String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');}
export function formatDatesInText(value,reference){return String(value??'').replace(/\b\d{4}-\d{2}-\d{2}\b/g,date=>formatDate(date,reference));}
