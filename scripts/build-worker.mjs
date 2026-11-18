import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { build } from 'vite';

await build({
 configFile:false,
 publicDir:false,
 build:{
  outDir:'dist/server',
  emptyOutDir:true,
  lib:{entry:'src/worker.ts',formats:['es'],fileName:()=> 'index.js'},
 },
});

await mkdir('dist/.openai',{recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await writeFile('dist/server/wrangler.json',JSON.stringify({
 name:'jyotisha-atlas',main:'index.js',compatibility_date:'2026-11-18',
 assets:{directory:'../client',binding:'ASSETS',run_worker_first:['/api/*']},
},null,2)+'\n');
