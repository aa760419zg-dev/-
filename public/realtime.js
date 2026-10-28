export function createHomeSync({client,getHome,isBlocked,load,render,onError=()=>{}}){
 let channel=null,homeId=null,pending=0,force=false,running=false,epoch=0,ready=false,outgoing=0;
 async function flush(){
  if(running||isBlocked()||!getHome()||(!force&&pending<=getHome().revision))return;
  running=true;const current=epoch;force=false;pending=0;
  try{const applied=await load();if(current===epoch&&applied!==false)render();}catch(error){if(current===epoch){force=true;onError(error);}}
  finally{running=false;}
  if(current===epoch&&!force&&pending>getHome()?.revision&&!isBlocked())await flush();
 }
 function request(revision){if(revision===undefined)force=true;else if(Number.isInteger(revision)&&revision>getHome()?.revision)pending=Math.max(pending,revision);return flush();}
 function connect(){const id=getHome()?.id||null;if(id===homeId)return;epoch++;if(channel)client.removeChannel(channel);channel=null;ready=false;homeId=id;pending=0;force=false;outgoing=0;
  if(!id||!client.channel)return;
  channel=client.channel('home:'+id,{config:{broadcast:{self:false}}}).on('broadcast',{event:'revision'},({payload})=>{if(Number.isInteger(payload?.revision))return request(payload.revision);});
  channel.subscribe(status=>{ready=status==='SUBSCRIBED';if(ready){if(outgoing)void notify(outgoing);request();}});
 }
 async function notify(revision){outgoing=Math.max(outgoing,revision);if(!channel||!ready)return;const sent=outgoing;try{const status=await channel.send({type:'broadcast',event:'revision',payload:{revision:sent}});if((status==='ok'||status===undefined)&&outgoing===sent)outgoing=0;}catch{/* 通知失敗不影響已完成的存檔，輪詢補償。 */}}
 function disconnect(){epoch++;if(channel)client.removeChannel(channel);channel=null;homeId=null;ready=false;pending=0;force=false;outgoing=0;}
 return {connect,notify,request,flush,disconnect};
}
