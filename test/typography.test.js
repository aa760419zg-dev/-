import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../public/style.css',import.meta.url),'utf8');
test('全站字級使用變數：無小於12px字級，輸入16px，大標題與大金額保持既有尺寸',()=>{
 const sizes=new Map([...css.matchAll(/(--text-[\w-]+)\s*:\s*(\d+)px/g)].map(m=>[m[1],Number(m[2])]));
 assert.equal(sizes.get('--text-xs'),12);assert.equal(sizes.get('--text-sm'),13);assert.equal(sizes.get('--text-md'),15);assert.equal(sizes.get('--text-lg'),17);assert.equal(sizes.get('--text-input'),16);
 for(const m of css.matchAll(/font-size\s*:\s*([^;}]+)/g)){const variable=m[1].match(/^var\((--text-[\w-]+)\)(?:!important)?$/);assert.ok(variable,'字級必須使用變數：'+m[0]);assert.ok(sizes.has(variable[1]),'變數必須定義');assert.ok(sizes.get(variable[1])>=12,'字級不得小於12px');}
 assert.equal(sizes.get('--text-size-29'),29);assert.equal(sizes.get('--text-size-34'),34);
 assert.match(css,/input,select,textarea\{font-size:var\(--text-input\)!important\}/);
});
test('次要文字與導覽文字在一般卡片、米白、提醒及選取背景上達4.5:1',()=>{
 const colors=new Map([...css.matchAll(/(--[\w-]+):#([0-9a-f]{6})(?=[;}])/gi)].map(m=>[m[1],m[2]]));
 const lum=hex=>{const c=hex.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
 for(const text of ['--text','--muted','--nav-muted'])for(const bg of ['--surface','--page-bg','--accent-soft','--selected-bg']){const a=lum(colors.get(text)),b=lum(colors.get(bg));assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,text+' / '+bg);}
});
