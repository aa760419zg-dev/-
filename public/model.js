export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function balance(data){return Number(data.opening||0)+data.money.reduce((sum,x)=>sum+(x.kind==='存入'?Number(x.amount):x.source==='共同帳戶'?-Number(x.amount):0),0);}
export function expense(data,month){return data.money.filter(x=>x.kind==='支出'&&x.date.startsWith(month)).reduce((s,x)=>s+Number(x.amount),0);}
export const empty=()=>({version:1,opening:0,threshold:3000,money:[],events:[],pets:[],chores:[],health:[]});
export function validData(d){return d&&d.version===1&&Number.isFinite(d.opening)&&Number.isFinite(d.threshold)&&['money','events','pets','chores','health'].every(k=>Array.isArray(d[k])&&d[k].every(x=>x&&typeof x==='object'&&typeof x.id==='string'&&typeof x.date==='string'));}
