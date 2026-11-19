import { calculate, type Birth } from './engine';
import { groundedAnswer } from './knowledge';
import { advancedAnswer, personalReading } from './jyotisha';

interface Env {
 ASSETS: {fetch(request:Request):Promise<Response>};
 GEMINI_API_KEY?: string;
 GEMINI_MODEL?: string;
}

const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
function parseBirth(data:unknown):Birth {
 if(!data||typeof data!=='object')throw Error('Birth data required');
 const b=data as Partial<Birth>;
 if(typeof b.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||
  !Number.isFinite(Date.parse(b.date))||new Date(b.date).toISOString().slice(0,10)!==b.date||
  typeof b.unknown!=='boolean'||typeof b.time!=='string'||(!b.unknown&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time))||
  typeof b.lat!=='number'||typeof b.lon!=='number'||typeof b.offset!=='number')
  throw Error('Invalid birth data');
 return {name:'',place:'Birth location',date:b.date,time:b.time,unknown:b.unknown,lat:b.lat,lon:b.lon,offset:b.offset};
}

async function body(request:Request){
 if(!request.body)throw Error('JSON required');
 const reader=request.body.getReader();
 const decoder=new TextDecoder();
 let size=0,result='';
 while(true){
  const {value,done}=await reader.read();
  if(done)break;
  size+=value.byteLength;
  if(size>65536){await reader.cancel();throw Error('Request too large')}
  result+=decoder.decode(value,{stream:true});
 }
 return JSON.parse(result+decoder.decode()) as {birth?:unknown;question?:unknown;history?:unknown};
}

export default {
 async fetch(request:Request,env:Env):Promise<Response>{
  const route=new URL(request.url).pathname;
  if(!route.startsWith('/api/'))return env.ASSETS.fetch(request);
  if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Cross-site requests are not accepted.'},403);
  const configured=Boolean(env.GEMINI_API_KEY?.trim());
  if(route==='/api/health'&&request.method==='GET')return json({ok:true,llm_configured:configured});
  if(route!=='/api/chat')return json({error:'Unknown endpoint.'},404);
  if(request.method!=='POST')return json({error:'Use POST.'},405);
  if(!request.headers.get('oai-authenticated-user-id'))return json({error:'Sign in to use chat.'},401);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Send JSON.'},415);
  try{
   const data=await body(request);
   if(typeof data.question!=='string'||!data.question.trim()||data.question.length>600)throw Error('Invalid question');
   const chart=calculate(parseBirth(data.birth));
   const question=data.question.trim();
   const baseline=advancedAnswer(question,chart)??groundedAnswer(question,chart);
   if(!configured)return json({answer:baseline,mode:'source-guide'});
   const cards=[
    {topic:'Direct source answer',text:baseline},
    ...['dasha','yoga','jaimini'].map(topic=>({topic,text:advancedAnswer(topic,chart)})).filter(card=>card.text),
    ...personalReading(chart).map(r=>({topic:r.title,text:`${r.evidence} ${r.synthesis} Reflection: ${r.practice}`})),
    ...chart.placements.map(p=>({topic:p.name,text:groundedAnswer(p.key,chart)})),
   ];
   const history=Array.isArray(data.history)?data.history.slice(-8).flatMap(message=>
    message&&(message.role==='user'||message.role==='assistant')&&typeof message.text==='string'
     ?[{role:message.role,text:message.text.slice(0,2400)}]:[]):[];
   try{
    const model=env.GEMINI_MODEL?.trim()||'gemini-3.5-flash-lite';
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
     method:'POST',
     headers:{'x-goog-api-key':env.GEMINI_API_KEY!.trim(),'Content-Type':'application/json'},
     signal:AbortSignal.timeout(15000),
     body:JSON.stringify({
      systemInstruction:{parts:[{text:'Answer the latest question directly in plain English as a Jyotisha chart interpreter. Base personal interpretations on the supplied calculated chart evidence. A whole-chart summary should synthesize several distinct placements into a few short themes. For a follow-up, use both sides of the conversation and simplify the previous answer if asked. Define any Sanskrit term in everyday words. Treat interpretations as traditional and reflective. Never invent placements, dates, citations or guarantees. If a needed fact is missing, explain what is missing. Keep the answer concise in short paragraphs, with no Markdown formatting.'}]},
      contents:[{role:'user',parts:[{text:JSON.stringify({question,history,cards})}]}],
      generationConfig:{maxOutputTokens:2048},
     }),
    });
    if(!response.ok)throw Error('Provider unavailable');
    const output=await response.json() as {candidates?:{content?:{parts?:{thought?:boolean;text?:string}[]}}[]};
    const payload=output.candidates?.[0]?.content?.parts?.filter(part=>!part.thought).map(part=>part.text??'').join('');
    const answer=payload?.trim();
    if(!answer)throw Error('No Gemini answer');
    return json({answer,mode:'ai-analysis'});
   }catch{
    return json({answer:baseline,mode:'source-guide'});
   }
  }catch{
   return json({error:'Check the birth details and question.'},422);
  }
 },
};
