import {build} from 'esbuild';
await build({entryPoints:['node_modules/@supabase/supabase-js/dist/index.mjs'],outfile:'public/vendor/supabase.js',bundle:true,format:'esm',platform:'browser',minify:true});
