import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';

const origin='https://atlas.example';
const env={ASSETS:{fetch:async()=>new Response('asset')}};
const ask=(data,headers={})=>new Request(origin+'/api/chat',{
 method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data),
});
const auth={'oai-authenticated-user-id':'test-owner'};
const data={
 birth:{date:'2000-01-01',time:'12:00',lat:51.48,lon:0,offset:0,unknown:false},
 question:'What is my current dasha?',
};

test('worker serves assets, reports provider availability and protects chat',async()=>{
 assert.equal(await (await worker.fetch(new Request(origin),env)).text(),'asset');
 assert.deepEqual(await (await worker.fetch(new Request(origin+'/api/health'),env)).json(),{ok:true,llm_configured:false});
 assert.equal((await worker.fetch(ask(data),env)).status,401);
 assert.equal((await worker.fetch(ask(data,{...auth,'sec-fetch-site':'cross-site'}),env)).status,403);
});

test('signed-in chat recalculates facts and falls back without credentials',async()=>{
 const response=await worker.fetch(ask(data,auth),env);
 const result=await response.json();
 assert.equal(result.mode,'source-guide');
 assert.match(result.answer,/Mahadasha/);
 assert.equal((await worker.fetch(ask({...data,birth:{...data.birth,date:'2000-02-30'}},auth),env)).status,422);
});

test('connected chat uses provider-selected evidence without sending birth identifiers',async t=>{
 const fake=t.mock.method(globalThis,'fetch',async (url,request)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');
  const input=JSON.parse(request.body);
  assert.equal(input.store,false);
  assert.doesNotMatch(input.input,/Private Name|Private Place/);
  const cards=JSON.parse(input.input).cards;
  assert.ok(cards.some(card=>card.topic==='Jupiter'||card.topic==='Guru'));
  return Response.json({output:[{content:[{type:'output_text',text:'{"index":0}'}]}]});
 });
 const request=ask({...data,birth:{...data.birth,name:'Private Name',place:'Private Place'}},auth);
 const result=await (await worker.fetch(request,{...env,OPENAI_API_KEY:'test',OPENAI_MODEL:'test'})).json();
 assert.equal(fake.mock.callCount(),1);
 assert.equal(result.mode,'ai-retrieval');
 assert.match(result.answer,/Mahadasha/);
});
