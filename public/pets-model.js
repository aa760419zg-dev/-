export const petCollections=['petProfiles','petWeights','petMedications','petDoses','petVisits','petPreventives'];
export function hydratePets(data){
 for(const k of petCollections)if(!Array.isArray(data[k]))data[k]=[];
 // 舊寵物飲食紀錄依名字建立固定 ID，兩支手機會得到相同對應。
 for(const old of data.pets){if(!old.pet)continue;let p=data.petProfiles.find(p=>p.name===old.pet);if(!p){p={id:'legacy-'+encodeURIComponent(old.pet),name:old.pet,date:old.date||'',species:'',breed:''};data.petProfiles.push(p);}if(!old.petId)old.petId=p.id;if(old.kind==='體重'&&!old.weightImported){const match=String(old.amount||'').trim().match(/^(\d+(?:\.\d{1,2})?)\s*(?:kg|公斤)?$/i);if(match&&Number(match[1])>0&&!data.petWeights.some(x=>x.id==='legacy-weight-'+old.id))data.petWeights.push({id:'legacy-weight-'+old.id,petId:old.petId,date:old.date,weight:match[1],note:old.note||''});old.weightImported=true;}}
 return data;
}
export function medicationSlots(data,date,petId){
 const result=[];
 for(const plan of data.petMedications){
  if(plan.stopped||(petId&&plan.petId!==petId)||date<plan.start||(plan.end&&date>plan.end))continue;
  const interval=plan.mode==='每幾天一次'?Number(plan.everyDays):1;
  const elapsed=Math.round((new Date(date+'T00:00:00Z')-new Date(plan.start+'T00:00:00Z'))/86400000);
  if(!Number.isInteger(interval)||interval<1||elapsed%interval!==0)continue;
  const count=plan.mode==='每天幾次'?Number(plan.times):1;
  if(!Number.isInteger(count)||count<1||count>24)continue;
  for(let i=1;i<=count;i++){const id=plan.id+':'+date+':'+i;result.push({id,plan,index:i,done:data.petDoses.find(d=>d.id===id)});}
 }
 return result;
}
export function preventiveAlerts(data,date){
 return data.petPreventives.filter(x=>{const days=(new Date(x.next+'T00:00:00Z')-new Date(date+'T00:00:00Z'))/86400000;return Number.isFinite(days)&&days<=7&&!data.petPreventives.some(y=>y.petId===x.petId&&y.item===x.item&&y.date>x.date);}).sort((a,b)=>a.next.localeCompare(b.next));
}
export function recordDose(data,slotId,date,actor){
 const slot=medicationSlots(data,date).find(x=>x.id===slotId);
 if(!slot)throw Error('這次用藥不在今日排程內，請重新確認');
 if(slot.done)throw Error('這次已經有人標記餵藥，請勿重複餵食');
 data.petDoses.push({id:slot.id,petId:slot.plan.petId,planId:slot.plan.id,date,index:slot.index,drug:slot.plan.drug,dose:slot.plan.dose,by:actor.name,userId:actor.id,at:actor.at});
}
export function saveVisit(data,visit){
 const index=data.petVisits.findIndex(x=>x.id===visit.id);if(index<0)data.petVisits.push(visit);else data.petVisits[index]=visit;
 const linked='pet-visit-'+visit.id,existing=data.money.findIndex(x=>x.id===linked);
 if(visit.syncMoney&&Number(visit.cost)>0){const pet=data.petProfiles.find(x=>x.id===visit.petId);const money={id:linked,date:visit.date,kind:'支出',amount:visit.cost,title:(pet?.name||'寵物')+'就診 · '+visit.hospital,category:'寵物醫療',source:visit.source||'共同帳戶',person:visit.person,note:visit.reason,visitId:visit.id};if(existing<0)data.money.push(money);else data.money[existing]=money;}
 else if(existing>=0)data.money.splice(existing,1);
}
