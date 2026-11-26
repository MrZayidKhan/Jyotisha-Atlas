import { useMemo, useState } from 'react';
import { localAiUrl } from './localAi';
import type { Chart } from './engine';
import { currentPeriods, jaimini, jaiminiAspects, jaiminiIndicators, parashara, periodPractice, personalReading, vimshottari, yogaCandidates } from './jyotisha';
import './results-views.css';

const dateLabel=(value:number)=>new Date(value).toISOString().slice(0,10);
const titleCase=(value:string)=>value[0].toUpperCase()+value.slice(1);
export default function ChartReading({chart}:{chart:Chart}){
 if(chart.uncertain)return null;
 return <KnownTimeReading key={`${chart.utc}:${chart.birth.lat}:${chart.birth.lon}`} chart={chart}/>;
}
function KnownTimeReading({chart}:{chart:Chart}){
 const [school,setSchool]=useState('parashari');
 const [reading,setReading]=useState('');
 const [readingStatus,setReadingStatus]=useState<'idle'|'loading'|'error'>('idle');
 const {periods,major,minor,yogas,practice,aspects,reflection,karakas}=useMemo(()=>{
  const {major,minor}=currentPeriods(chart);
  return {periods:vimshottari(chart),major,minor,yogas:yogaCandidates(chart),practice:periodPractice(chart),
   aspects:jaiminiAspects(chart),reflection:personalReading(chart),karakas:jaiminiIndicators(chart)};
 },[chart]);
 const [active,setActive]=useState(Math.max(0,periods.findIndex(p=>p.start===major?.start)));
 async function generateReading(){
  if(readingStatus==='loading')return;
  setReadingStatus('loading');
  try{
   const response=await fetch(localAiUrl('/api/reading'),{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...chart.birth,name:'',place:'Birth location'}),
    signal:AbortSignal.timeout(65000),
   });
   if(!response.ok)throw Error('Reading unavailable');
   const result=await response.json();
   if(typeof result.answer!=='string'||!result.answer.trim())throw Error('Empty reading');
   setReading(result.answer);
   setReadingStatus('idle');
  }catch{
   setReadingStatus('error');
  }
 }
 return <div id="reading" className="readings advanced-reading">
  <p className="eyebrow">Traditional interpretation</p>
  <h2>Chart interpretation</h2>
  <p className="section-copy">Explore what your placements traditionally suggest about personality, relationships, work, and growth. Treat these as themes for reflection.</p>
  <section className="reading-feature" data-chart-help="reading" aria-label="How to read your chart">
   <h3>What each part means</h3>
   <p><strong>Rising sign</strong> describes your approach to life. <strong>The Moon and its nakshatra</strong> describe emotional habits through the Moon’s sign and lunar mansion.</p>
   <p><strong>Planets</strong> represent drives such as initiative or care. Their <strong>signs</strong> describe how those drives are expressed, and their <strong>houses</strong> show the areas of life they’re associated with.</p>
   <p><strong>Yogas</strong> are patterns formed by multiple placements. <strong>Dashas</strong> are traditional timing periods used to explore which themes may come into focus.</p>
  </section>
  <section className="reading-feature" data-chart-help="ai" aria-label="AI personal reading">
   <h3>Personal reading with AI</h3>
   <p>Generate a plain-English overview of your personality, life themes, and current period. This shares calculated chart evidence with the AI service.</p>
   {!import.meta.env.DEV&&<p className="form-help">Start the local Atlas server on this computer. If your browser asks for local network access, allow it to connect.</p>}
   {!reading&&<button className="outline-button" disabled={readingStatus==='loading'} onClick={generateReading}>
    {readingStatus==='error'?'Try again':'Generate my reading'}
   </button>}
   {readingStatus==='loading'&&<p role="status">Tracing the patterns in your sky…</p>}
   {readingStatus==='error'&&<p role="status">The AI signal faded. Check that the local API is running, or explore the chart reading below.</p>}
   {reading&&<div aria-live="polite">{reading.split(/\n\s*\n/).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>}
  </section>
  <div className="result-actions school-switch" aria-label="Jyotisha approach">
   <button className="outline-button" data-chart-help="parashari" aria-pressed={school==='parashari'} onClick={()=>setSchool('parashari')}>Parashari</button>
   <button className="outline-button" data-chart-help="jaimini" aria-pressed={school==='jaimini'} onClick={()=>setSchool('jaimini')}>Jaimini</button>
  </div>
  {school==='parashari'?<>
   <div className="reading-grid">{reflection.map((r,index)=><article key={r.title} data-chart-help={`theme:${index}`}>
    <h3>{r.title}</h3><p>{r.synthesis}</p>
    <details><summary data-chart-help={`theme:${index}`}>Chart evidence and reflection</summary><p>{r.evidence}</p><p>{r.practice}</p></details>
   </article>)}</div>
   <details className="reading-feature">
    <summary data-chart-help="yogas">Yoga candidates {yogas.length>0&&`(${yogas.length})`}</summary>
    <p className="form-help">Checks Gaja Kesari, Budha Aditya, Chandra Mangala and the five Pancha Mahapurusha patterns. These are structural matches. Strength, aspects and cancellation rules require further judgment.</p>
    {yogas.length?<ul>{yogas.map((y,index)=><li key={y.name} data-chart-help={`yoga:${index}`}><strong>{y.name}</strong><p>{y.evidence} {y.theme}</p></li>)}</ul>:<p>No matches among these checks.</p>}
   </details>
  </>:<div className="reading-feature">
   <h3>Jaimini Chara Karakas</h3>
   <p>In this seven-graha convention, the planet furthest through its sign becomes Atmakaraka, traditionally the principal significator of the self. Its Navamsa sign is shown as an additional interpretive reference.</p>
   <div className="placements-table" data-chart-help="jaimini"><table><caption>Ranked by degrees traveled within sign</caption><thead><tr><th>Role</th><th>Graha</th><th>Degree</th><th>Navamsa</th></tr></thead>
    <tbody>{karakas.map((k,index)=><tr key={k.role} data-chart-help={`karaka:${index}`}><td>{k.role}</td><td>{k.planet}</td><td>{k.degree.toFixed(3)}°</td><td>{k.navamsa}</td></tr>)}</tbody></table></div>
   {aspects&&<p><strong>Rashi Drishti from Lagna.</strong> Your rising sign {aspects.rising} connects with {aspects.signs.join(', ')} under Jaimini sign aspects. {aspects.planets.length?`Classical grahas in those signs: ${aspects.planets.join(', ')}.`:'Those signs have no classical grahas in this chart.'}</p>}
   <a className="source" href={jaimini} target="_blank" rel="noreferrer">Jaimini Sutras</a>
  </div>}
  <div id="dasha-timeline" className="reading-feature" data-chart-help="timing">
   <h3>Vimshottari timeline</h3>
   <p>{major&&minor?`Current period: ${titleCase(major.lord)} Mahadasha · ${titleCase(minor.lord)} Antardasha.`:'Choose a major period to see its subperiods.'}</p>
   <label className="period-picker">Mahadasha <select value={active} onChange={e=>setActive(Number(e.target.value))}>{periods.map((p,i)=><option value={i} key={p.start}>{titleCase(p.lord)} · {dateLabel(p.start)} to {dateLabel(p.end)}{p.start===major?.start?' · current':''}</option>)}</select></label>
   <div className="placements-table"><table><caption>Antardashas · UTC dates</caption><thead><tr><th>Lord</th><th>From</th><th>Until</th></tr></thead><tbody>
    {periods[active]?.sub.map((p,index)=><tr key={p.start} data-chart-help={`period:${active}:${index}`} data-current={p.start===minor?.start}><td>{titleCase(p.lord)}{p.start===minor?.start?' · current':''}</td><td>{dateLabel(p.start)}</td><td>{dateLabel(p.end)}</td></tr>)}
   </tbody></table></div>
   <p className="form-help">The Moon’s progress through its birth Nakshatra sets the starting balance. Dates use a 365.25-day year. Other conventions can give different dates.</p>
   <a className="source" href={parashara} target="_blank" rel="noreferrer">Brihat Parashara Hora Shastra</a>
  </div>
  <details className="reading-feature" data-chart-help="practices"><summary data-chart-help="practices">Remedies and traditional practices</summary>
   {practice&&<p><strong>For your current period · {practice.name}</strong> ({practice.placement}). {practice.suggestion}</p>}
   <p>Jyotisha traditions discuss mantra, dana (giving) and seva (service). If you want to engage with them, consider a prayer or quiet recitation from your own tradition, volunteering, or giving within your means. The reflection practices above connect to specific chart themes.</p>
   <p className="form-help">These are optional cultural practices. Chart placements cannot establish that a remedy will change an outcome.</p>
  </details>
 </div>;
}
