import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createPetManager} from '../public/pet-manager.js';
import {hydratePets} from '../public/pets-model.js';
import {empty} from '../public/model.js';
const tick=()=>new Promise(r=>setTimeout(r,15));
test('多寵物頁、體重精度、每日用藥、就診同步與照片上傳流程',async()=>{
 const dom=new JSDOM('<main id="view"></main>',{url:'http://localhost/'}),w=dom.window,doc=w.document;
 try{
 w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 let data=hydratePets(empty()),manager,saved=0,uploadCount=0;const home={id:'home1',owner:true};
 const render=()=>{doc.querySelector('#view').innerHTML=manager.page();};
 manager=createPetManager({document:doc,getData:()=>data,getHome:()=>home,getSession:()=>({user:{id:'user1'}}),mutate:async fn=>{fn();saved++;render();return true;},refresh:async()=>{},render,openLegacy:()=>{},today:()=>'2026-10-28',toast:()=>{},client:{storage:{from:()=>({upload:async()=>{uploadCount++;return{};},remove:async()=>({}),createSignedUrl:async()=>({data:{signedUrl:'https://example.com/photo.jpg'}})})}}});render();
 const q=s=>doc.querySelector(s),click=async s=>{q(s).click();await tick();},fill=(n,v)=>{q(`[name="${n}"]`).value=v;},submit=async()=>{q('#pet-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();};
 await click('[data-pet-action="new-profile"]');fill('name','小橘');fill('species','貓');fill('breed','米克斯');fill('chip','123456789');await submit();assert.equal(data.petProfiles.length,1);assert.match(q('#view').textContent,/小橘/);
 const pet=data.petProfiles[0];await click('[data-pet-action="tab"][data-pet-id="weight"]');await click('[data-pet-action="new-weight"]');fill('weight','4.123');await submit();assert.equal(data.petWeights.length,0);assert.match(q('#pet-error').textContent,/兩位/);fill('weight','4.25');await submit();assert.equal(data.petWeights[0].petId,pet.id);assert.ok(q('svg'));assert.match(q('#view').textContent,/4.25 kg/);
 await click('[data-pet-action="tab"][data-pet-id="medication"]');await click('[data-pet-action="new-medication"]');fill('drug','藥 A');fill('dose','1 顆');fill('times','2');await submit();assert.equal(data.petMedications.length,1);await click('[data-pet-action="dose"]');assert.equal(data.petDoses.length,1);assert.equal(data.petDoses[0].by,'阿嘎');assert.equal(data.petDoses[0].userId,'user1');assert.equal(q('#view').querySelectorAll('[data-pet-action="dose"]').length,1);
 // 已有餵藥紀錄的計畫不可改變劑量。
 await click('[data-pet-action="edit-medication"]');fill('dose','2 顆');await submit();assert.match(q('#pet-error').textContent,/停用後新增/);assert.equal(data.petMedications[0].dose,'1 顆');await click('.pet-close');
 await click('[data-pet-action="tab"][data-pet-id="visit"]');await click('[data-pet-action="new-visit"]');fill('hospital','動物醫院');fill('reason','例行檢查');fill('cost','500');q('[name="syncMoney"]').checked=true;await submit();assert.equal(data.money.length,1);assert.equal(data.money[0].amount,'500');await click('[data-pet-action="edit-visit"]');fill('cost','600');await submit();assert.equal(data.money.length,1);assert.equal(data.money[0].amount,'600');
 await click('[data-pet-action="tab"][data-pet-id="preventive"]');await click('[data-pet-action="new-preventive"]');fill('item','預防針');fill('next','2026-11-03');await submit();assert.match(manager.home(),/預防針/);
 // 使用模擬影像解碼與儲存服務檢查上傳、路徑及資料持久化；不替代真實 Storage 驗證。
 w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.Image=class{set src(v){this.width=100;this.height=100;setTimeout(()=>this.onload(),0);}};w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},drawImage(){}});w.HTMLCanvasElement.prototype.toBlob=function(fn){fn(new w.Blob(['photo'],{type:'image/jpeg'}));};
 await click('[data-pet-action="edit-profile"]');Object.defineProperty(q('[name="uploads"]'),'files',{value:[new w.File(['photo'],'pet.jpg',{type:'image/jpeg'})]});await submit();assert.equal(uploadCount,1);assert.ok(data.petProfiles[0].photo.startsWith('home1/'));assert.ok(!data.petProfiles[0].photo.includes('data:'));assert.ok(saved>5);
 await click('[data-pet-action="new-profile"]');fill('name','小白');fill('species','狗');await submit();assert.equal(data.petProfiles.length,2);await click('[data-pet-action="tab"][data-pet-id="weight"]');assert.match(q('#view').textContent,/還沒有體重/);assert.doesNotMatch(q('#view').textContent,/4.25 kg/);
 }finally{w.close();}
});
