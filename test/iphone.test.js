import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
test('iPhone 圖示尺寸、manifest、狀態列與輸入字體設定',async()=>{
 for(const [name,size]of [['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]){const png=await readFile(new URL('../public/'+name,import.meta.url));assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);assert.equal(png[25],2,'PNG 必須是無透明度的 RGB');
 const chunks=[];for(let offset=8;offset<png.length;){const length=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8);if(type==='IDAT')chunks.push(png.subarray(offset+8,offset+8+length));offset+=length+12;}
 const scan=inflateSync(Buffer.concat(chunks)),pixels=Buffer.alloc(size*size*3);let offset=0;
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<size;y++){const filter=scan[offset++];for(let x=0;x<size*3;x++){const i=y*size*3+x,left=x>=3?pixels[i-3]:0,up=y?pixels[i-size*3]:0,upperLeft=y&&x>=3?pixels[i-size*3-3]:0,predictor=[0,left,up,Math.floor((left+up)/2),paeth(left,up,upperLeft)][filter];assert.notEqual(predictor,undefined);pixels[i]=(scan[offset++]+predictor)&255;}}
 for(const [x,y]of [[0,0],[size-1,0],[0,size-1],[size-1,size-1]])assert.deepEqual([...pixels.subarray((y*size+x)*3,(y*size+x)*3+3)],[49,92,76]);}
 const manifest=JSON.parse(await readFile(new URL('../public/manifest.webmanifest',import.meta.url)));assert.ok(manifest.icons.some(i=>i.sizes==='192x192'&&i.type==='image/png'));assert.ok(manifest.icons.some(i=>i.sizes==='512x512'&&i.type==='image/png'));
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');assert.match(html,/apple-touch-icon" href="\/apple-touch-icon.png/);assert.match(html,/apple-mobile-web-app-status-bar-style" content="default/);
 const css=await readFile(new URL('../public/style.css',import.meta.url),'utf8');assert.match(css,/input,select,textarea\{font-size:16px!important/);
});
