import {calculate} from '../src/engine.ts';
import {groundedAnswer,library} from '../src/knowledge.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
try{const request=JSON.parse(input);const chart=calculate(request.birth);if(request.action==='candidates'){const candidates=[...chart.placements.map(p=>({id:p.key,text:groundedAnswer(p.name,chart)})),...library.filter(e=>e.category==='Foundations').map(e=>({id:e.title,text:groundedAnswer(e.title,chart)}))];process.stdout.write(JSON.stringify({chart,candidates}))}else process.stdout.write(JSON.stringify(chart))}catch(e){process.stderr.write(e.message);process.exitCode=1}
