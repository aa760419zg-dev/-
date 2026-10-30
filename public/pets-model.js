import {petMedicalCategory} from './ledger-model.js';
export const petCollections=['petProfiles','petWeights','petMedications','petDoses','petVisits','petPreventives'];
export function hydratePets(data){
 for(const k of petCollections)if(!Array.isArray(data[k]))data[k]=[];
 // 舊寵物飲食紀錄依名字建立固定 ID，兩支手機會得到相同對應。
 for(const old of data.pets){if(!old.pet)continue;let p=data.petProfiles.find(p=>p.name===old.pet);if(!p){p={id:'legacy-'+encodeURIComponent(old.pet),name:old.pet,date:old.date||'',species:'',breed:''};data.petProfiles.push(p);}if(!old.petId)old.petId=p.id;if(old.kind==='體重'&&!old.weightImported){const match=String(old.amount||'').trim().match(/^(\d+(?:\.\d{1,2})?)\s*(?:kg|公斤)?$/i);if(match&&Number(match[1])>0&&!data.petWeights.some(x=>x.id==='legacy-weight-'+old.id))data.petWeights.push({id:'legacy-weight-'+old.id,petId:old.petId,date:old.date,weight:match[1],note:old.note||''});old.weightImported=true;}}
 return data;
}
export function medicationSlotNames(plan){const count=plan.mode==='每幾天一次'?1:Number(plan.times||1);if(!Number.isInteger(count)||count<1||count>24)return [];const defaults=count===1?['早上']:count===2?['早上','晚上']:count===3?['早上','中午','晚上']:Array.from({length:count},(_,i)=>'第 '+(i+1)+' 次');return defaults.map((name,i)=>typeof plan.slotNames?.[i]==='string'&&plan.slotNames[i].trim()?plan.slotNames[i].trim():name);}
export function doseSlotName(data,dose){return dose.slotName||medicationSlotNames(data.petMedications?.find(p=>p.id===dose.planId)||{times:Math.max(1,Number(dose.index)||1)})[Number(dose.index)-1]||'用藥';}
export function medicationSlots(data,date,petId){
 const result=[];
 for(const plan of data.petMedications){
  if(plan.stopped||(petId&&plan.petId!==petId)||date<plan.start||(plan.end&&date>plan.end))continue;
  const interval=plan.mode==='每幾天一次'?Number(plan.everyDays):1;
  const elapsed=Math.round((new Date(date+'T00:00:00Z')-new Date(plan.start+'T00:00:00Z'))/86400000);
  if(!Number.isInteger(interval)||interval<1||elapsed%interval!==0)continue;
  const count=plan.mode==='每天幾次'?Number(plan.times):1;
  if(!Number.isInteger(count)||count<1||count>24)continue;
  for(let i=1;i<=count;i++){const id=plan.id+':'+date+':'+i;result.push({id,plan,index:i,name:medicationSlotNames(plan)[i-1],done:data.petDoses.find(d=>d.id===id)});}
 }
 return result;
}
export function preventiveAlerts(data,date){
 return pendingPreventives(data).filter(x=>{const days=(new Date(x.next+'T00:00:00Z')-new Date(date+'T00:00:00Z'))/86400000;return Number.isFinite(days)&&days<=7;}).sort((a,b)=>a.next.localeCompare(b.next));
}
export function recordDose(data,slotId,date,actor){
 const slot=medicationSlots(data,date).find(x=>x.id===slotId);
 if(!slot)throw Error('這次用藥不在今日排程內，請重新確認');
 if(slot.done)throw Error('已由 '+(data.members?.find(m=>m.userId===slot.done.userId)?.name||'未知成員')+' 標記餵藥');
 data.petDoses.push({id:slot.id,petId:slot.plan.petId,planId:slot.plan.id,date,index:slot.index,slotName:slot.name,drug:slot.plan.drug,dose:slot.plan.dose,by:actor.name,userId:actor.id,at:actor.at});
}
export function saveVisit(data,visit){
 const index=data.petVisits.findIndex(x=>x.id===visit.id);if(index<0)data.petVisits.push(visit);else data.petVisits[index]=visit;
 const linked='pet-visit-'+visit.id,existing=data.money.findIndex(x=>x.id===linked);
 if(visit.syncMoney&&Number(visit.cost)>0){const pet=data.petProfiles.find(x=>x.id===visit.petId);const classification=petMedicalCategory(data);const money={id:linked,date:visit.date,kind:'支出',amount:visit.cost,title:(pet?.name||'寵物')+'就診 · '+visit.hospital,category:classification?.root.name||'寵物醫療',...(classification?{categoryId:classification.root.id,subcategoryId:classification.sub?.id||null,subcategory:classification.sub?.name||''}:{}),account:visit.source==='個人支付'?visit.personUserId||'':'共同帳戶',source:visit.source||'共同帳戶',person:visit.person,personUserId:visit.personUserId,note:visit.reason,visitId:visit.id};if(existing<0)data.money.push(money);else data.money[existing]=money;}
 else if(existing>=0)data.money.splice(existing,1);
}

// Only the latest administration for the same pet/item owns the next reminder.
export function pendingPreventives(data){return (data.petPreventives||[]).filter((x,i,all)=>x.next&&x.reminderStatus!=='cancelled'&&!all.some((y,j)=>y.petId===x.petId&&y.item.trim()===x.item.trim()&&(y.date>x.date||(y.date===x.date&&j>i))));}
export function pendingVisits(data){return (data.petVisits||[]).filter(x=>(x.next||x.nextVisit||x.followUp)&&!['completed','cancelled'].includes(x.followUpStatus)&&!(data.petVisits||[]).some(y=>y.followUpOf===x.id));}
