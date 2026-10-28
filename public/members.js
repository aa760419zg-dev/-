export function ensureMembers(data,roster=[],userId,owner=false){
 if(!Array.isArray(data.members))data.members=[];
 const people=roster.length?roster:userId?[{userId,legacyName:owner?'阿嘎':'糖糖'}]:[];
 for(const person of people){if(!data.members.some(x=>x.userId===person.userId))data.members.push({userId:person.userId,name:person.legacyName,color:person.legacyName==='阿嘎'?'#315c4c':'#b97878'});}
 for(const kind of ['money','events','health'])for(const record of data[kind]){
  if(!record.personUserId){const member=data.members.find(m=>m.name===record.person)||data.members.find(m=>people.some(p=>p.userId===m.userId&&p.legacyName===record.person));if(member)record.personUserId=member.userId;}
 }
 return data;
}
export function renameMember(data,userId,name,color){
 if(!name.trim()||name.trim().length>30||!/^#[0-9a-f]{6}$/i.test(color))throw Error('暱稱須為 1～30 字，顏色須為有效色碼');
 const member=data.members.find(m=>m.userId===userId);if(!member)throw Error('找不到目前成員，請重新登入');
 if(data.members.some(m=>m.userId!==userId&&m.name===name.trim()))throw Error('請使用與另一位成員不同的暱稱');
 const previous=member.name;
 for(const kind of ['money','events','health'])for(const record of data[kind])if(record.personUserId===userId||(!record.personUserId&&record.person===previous)){
  record.personUserId=userId;record.person=name.trim();if(kind==='events'&&record.type==='休假'&&record.title===previous+'休假')record.title=name.trim()+'休假';
 }
 member.name=name.trim();member.color=color;
}
