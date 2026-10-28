import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('iPhone 圖示尺寸、manifest、狀態列與輸入字體設定',async()=>{
 for(const [name,size]of [['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]){const png=await readFile(new URL('../public/'+name,import.meta.url));assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);}
 const manifest=JSON.parse(await readFile(new URL('../public/manifest.webmanifest',import.meta.url)));assert.ok(manifest.icons.some(i=>i.sizes==='192x192'&&i.type==='image/png'));assert.ok(manifest.icons.some(i=>i.sizes==='512x512'&&i.type==='image/png'));
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');assert.match(html,/apple-touch-icon" href="\/apple-touch-icon.png/);assert.match(html,/apple-mobile-web-app-status-bar-style" content="default/);
 const css=await readFile(new URL('../public/style.css',import.meta.url),'utf8');assert.match(css,/input,select,textarea\{font-size:16px!important/);
});
