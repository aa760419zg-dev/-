import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createRecordCalendar} from '../public/record-calendar-ui.js';
import {empty,expense,balance} from '../public/model.js';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
test('注音／拼音組字不中斷：保留同一輸入框、組字期間不搜尋、完成後200ms防抖',async()=>{
 const dom=new JSDOM('<main></main>',{url:'http://localhost/'}),w=dom.window,doc=w.document;try{
 const d={...empty(),money:[{id:'m',date:'2026-10-29',kind:'支出',amount:100,title:'罐頭'}]};let ui,renders=0;const render=()=>{renders++;doc.querySelector('main').innerHTML=ui.page();};ui=createRecordCalendar({getData:()=>d,today:()=>'2026-10-29',expense,balance,esc:v=>String(v||''),open(){},render,petManager:{todos:()=>''},document:doc,storage:w.localStorage});render();doc.querySelector('#record-search').click();const input=doc.querySelector('#record-query'),before=renders;input.focus();input.dispatchEvent(new w.CompositionEvent('compositionstart',{bubbles:true}));input.value='ㄍㄨㄢ';input.dispatchEvent(new w.InputEvent('input',{bubbles:true,isComposing:true}));await pause(230);assert.equal(doc.querySelector('#record-query'),input);assert.equal(doc.activeElement,input);assert.equal(doc.querySelector('#record-search-results').textContent,'');assert.equal(renders,before);
 input.value='罐頭';input.dispatchEvent(new w.CompositionEvent('compositionend',{bubbles:true,data:'罐頭'}));input.dispatchEvent(new w.InputEvent('input',{bubbles:true,isComposing:false}));assert.equal(doc.querySelector('[data-record-result]'),null);await pause(230);assert.match(doc.querySelector('#record-search-results').textContent,/罐頭/);assert.equal(doc.querySelector('#record-query'),input);assert.equal(renders,before);
 input.value='不存在';input.dispatchEvent(new w.InputEvent('input',{bubbles:true}));await pause(50);input.value='罐';input.dispatchEvent(new w.InputEvent('input',{bubbles:true}));await pause(230);assert.match(doc.querySelector('#record-search-results').textContent,/罐頭/);assert.equal(renders,before);
 }finally{w.close();}
});
