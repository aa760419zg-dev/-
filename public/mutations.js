export function isRevisionConflict(error){return error?.code==='REVISION_CONFLICT'||/資料已更新|revision conflict/i.test(error?.message||'');}
// fn 必須只透過最新文件與穩定 ID 操作；初次嘗試之外最多重試三次。
export async function retryMutation({getData,setData,getHome,loadHome,save,fn,maxRetries=3}){
 const homeId=getHome()?.id;if(!homeId)throw Error('請先登入並加入家庭');
 for(let attempt=0;;attempt++){
  if(getHome()?.id!==homeId)throw Error('家庭或登入狀態已改變，請重試');
  const before=structuredClone(getData());
  try{fn();if(JSON.stringify(before)===JSON.stringify(getData()))return;await save();return;}catch(error){
   setData(before);
   if(!isRevisionConflict(error))throw error;
   // 即使已用盡重試，也更新 revision，讓下一次操作不會一直失敗。
   await loadHome();
   if(attempt>=maxRetries)throw Error('資料正在頻繁更新，已同步最新版本，請稍後再試');
  }
 }
}
