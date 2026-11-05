import {build} from 'esbuild';
import {cp,copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
await mkdir('public/vendor',{recursive:true});
await Promise.all([
 build({entryPoints:['node_modules/@supabase/supabase-js/dist/index.mjs'],outfile:'public/vendor/supabase.js',bundle:true,format:'esm',platform:'browser',minify:true}),
 build({entryPoints:['node_modules/leaflet/dist/leaflet-src.esm.js'],outfile:'public/vendor/leaflet.js',bundle:true,format:'esm',platform:'browser',minify:true}),
 build({entryPoints:['node_modules/topojson-client/src/index.js'],outfile:'public/vendor/topojson.js',bundle:true,format:'esm',platform:'browser',minify:true}),
 copyFile('node_modules/taiwan-atlas/towns-10t.json','public/vendor/towns-10t.json'),
 copyFile('node_modules/leaflet/dist/leaflet.css','public/vendor/leaflet.css'),
 cp('node_modules/leaflet/dist/images','public/vendor/images',{recursive:true}),
 ...['leaflet','topojson-client','taiwan-atlas'].map(name=>copyFile('node_modules/'+name+'/LICENSE','public/vendor/'+name+'.LICENSE'))
]);

const topology=JSON.parse(await readFile('node_modules/taiwan-atlas/towns-10t.json','utf8'));
await writeFile('public/vendor/taiwan-topology.js','export default '+JSON.stringify(topology)+';\n');
