// During rollout only, older databases receive an activity field on the wire.
// The application document itself never contains activity.
export const missingActivityRPC=error=>['PGRST202','42883'].includes(error?.code);
export function createActivityStore({rpc,getHome}){
 let homeId=null,legacy=[],mode='unknown',last=[];
 function reset(){homeId=null;legacy=[];last=[];mode='unknown';}
 function ingest(document){const id=getHome()?.id;if(id!==homeId){reset();homeId=id;}legacy=Array.isArray(document?.activity)?structuredClone(document.activity):[];}
 async function save(document,entries,revision){
  if(entries.length>100)throw Error('一次變更超過 100 筆操作紀錄，請分批處理');
  const target=getHome()?.id;let result;
  try{result=await rpc('family_save',{expected_revision:revision,new_document:document,new_activity:entries});mode='table';legacy=[];}
  catch(error){if(!missingActivityRPC(error))throw error;if(getHome()?.id!==target)throw Error('家庭或登入狀態已改變，請重試');
   const merged=new Map(legacy.map(e=>[e.id,e]));for(const e of entries)merged.set(e.id,e);
   result=await rpc('family_save',{expected_revision:revision,new_document:{...document,activity:[...merged.values()]}});
   legacy=[...merged.values()];mode='legacy';
  }
  last=structuredClone(entries);return result;
 }
 async function list({before_at=null,before_id=null,max_rows=50,area_filter=null,member_filter=null}={}){
  try{
   const result=await rpc('family_activity_list',{before_at,before_id,max_rows,area_filter,member_filter});
   if(!Array.isArray(result))throw Error('操作紀錄回傳格式不正確');mode='table';
   return {entries:result.map(r=>r.entry),cursor:result.length?{before_at:result.at(-1).at,before_id:result.at(-1).id}:null,more:result.length===max_rows};
  }catch(error){if(!missingActivityRPC(error))throw error;mode='legacy';
   const rows=legacy.filter(e=>(!area_filter||e.area===area_filter)&&(!member_filter||e.userId===member_filter)&&(!before_at||e.at<before_at||(before_id&&e.at===before_at&&e.id<before_id))).sort((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id)).slice(0,max_rows);
   return {entries:structuredClone(rows),cursor:rows.length?{before_at:rows.at(-1).at,before_id:rows.at(-1).id}:null,more:rows.length===max_rows};
  }
 }
 async function get(id){try{const entry=await rpc('family_activity_get',{activity_id:id});mode='table';return entry;}catch(error){if(!missingActivityRPC(error))throw error;return structuredClone(legacy.find(e=>e.id===id)||last.find(e=>e.id===id)||null);}}
 // Scan newest pages through the target time, independently of current UI filters.
 async function newer(entry){const results=[];let cursor={};for(;;){const page=await list({...cursor,max_rows:100});results.push(...page.entries.filter(e=>Date.parse(e.at)>=Date.parse(entry.at)&&e.groupId!==entry.groupId));if(!page.more||!page.cursor||page.entries.some(e=>Date.parse(e.at)<Date.parse(entry.at)))return results;cursor=page.cursor;}}
 return {ingest,save,list,get,newer,last:()=>last,mode:()=>mode,reset};
}
