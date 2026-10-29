export function activityRPC(logs,name,args={}){
 if(name==='family_activity_get')return structuredClone(logs.find(e=>e.id===args.activity_id)||null);
 if(name==='family_activity_list')return structuredClone(logs.filter(e=>(!args.area_filter||e.area===args.area_filter)&&(!args.member_filter||e.userId===args.member_filter)&&(!args.before_at||Date.parse(e.at)<Date.parse(args.before_at)||(args.before_id&&Date.parse(e.at)===Date.parse(args.before_at)&&e.id<args.before_id))).sort((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id)).slice(0,args.max_rows||50).map(entry=>({id:entry.id,at:entry.at,entry})));
}
export function remember(logs,entries=[]){for(const entry of entries)if(!logs.some(e=>e.id===entry.id))logs.push(structuredClone(entry));}
