import { useMemo, useState } from 'react';
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
 const {periods,major,minor,yogas,practice,aspects,reflection,karakas}=useMemo(()=>{
  const {major,minor}=currentPeriods(chart);
  return {periods:vimshottari(chart),major,minor,yogas:yogaCandidates(chart),practice:periodPractice(chart),
   aspects:jaiminiAspects(chart),reflection:personalReading(chart),karakas:jaiminiIndicators(chart)};
 },[chart]);
 const [active,setActive]=useState(Math.max(0,periods.findIndex(p=>p.start===major?.start)));
 return <div id="reading" className="readings advanced-reading">
  <p className="eyebrow">Traditional interpretation</p>
  <h2>Chart interpretation</h2>
  <p className="section-copy">Choose an approach to explore the traditional meanings of your placements.</p>
  <div className="result-actions school-switch" aria-label="Jyotisha approach">
   <button className="outline-button" aria-pressed={school==='parashari'} onClick={()=>setSchool('parashari')}>Parashari</button>
   <button className="outline-button" aria-pressed={school==='jaimini'} onClick={()=>setSchool('jaimini')}>Jaimini</button>
  </div>
  {school==='parashari'?<>
   <div className="reading-grid">{reflection.map(r=><article key={r.title}>
    <h3>{r.title}</h3><p>{r.synthesis}</p>
    <details><summary>Chart evidence and reflection</summary><p>{r.evidence}</p><p>{r.practice}</p></details>
   </article>)}</div>
   <details className="reading-feature">
    <summary>Yoga candidates {yogas.length>0&&`(${yogas.length})`}</summary>
    <p className="form-help">Checks Gaja Kesari, Budha Aditya, Chandra Mangala and the five Pancha Mahapurusha patterns. These are structural matches. Strength, aspects and cancellation rules require further judgment.</p>
    {yogas.length?<ul>{yogas.map(y=><li key={y.name}><strong>{y.name}</strong><p>{y.evidence} {y.theme}</p></li>)}</ul>:<p>No matches among these checks.</p>}
   </details>
  </>:<div className="reading-feature">
   <h3>Jaimini Chara Karakas</h3>
   <p>In this seven-graha convention, the planet furthest through its sign becomes Atmakaraka, traditionally the principal significator of the self. Its Navamsa sign is shown as an additional interpretive reference.</p>
   <div className="placements-table"><table><caption>Ranked by degrees traveled within sign</caption><thead><tr><th>Role</th><th>Graha</th><th>Degree</th><th>Navamsa</th></tr></thead>
    <tbody>{karakas.map(k=><tr key={k.role}><td>{k.role}</td><td>{k.planet}</td><td>{k.degree.toFixed(3)}°</td><td>{k.navamsa}</td></tr>)}</tbody></table></div>
   {aspects&&<p><strong>Rashi Drishti from Lagna.</strong> Your rising sign {aspects.rising} connects with {aspects.signs.join(', ')} under Jaimini sign aspects. {aspects.planets.length?`Classical grahas in those signs: ${aspects.planets.join(', ')}.`:'Those signs have no classical grahas in this chart.'}</p>}
   <a className="source" href={jaimini} target="_blank" rel="noreferrer">Jaimini Sutras</a>
  </div>}
  <div id="dasha-timeline" className="reading-feature">
   <h3>Vimshottari timeline</h3>
   <p>{major&&minor?`Current period: ${titleCase(major.lord)} Mahadasha · ${titleCase(minor.lord)} Antardasha.`:'Choose a major period to see its subperiods.'}</p>
   <label className="period-picker">Mahadasha <select value={active} onChange={e=>setActive(Number(e.target.value))}>{periods.map((p,i)=><option value={i} key={p.start}>{titleCase(p.lord)} · {dateLabel(p.start)} to {dateLabel(p.end)}{p.start===major?.start?' · current':''}</option>)}</select></label>
   <div className="placements-table"><table><caption>Antardashas · UTC dates</caption><thead><tr><th>Lord</th><th>From</th><th>Until</th></tr></thead><tbody>
    {periods[active]?.sub.map(p=><tr key={p.start} data-current={p.start===minor?.start}><td>{titleCase(p.lord)}{p.start===minor?.start?' · current':''}</td><td>{dateLabel(p.start)}</td><td>{dateLabel(p.end)}</td></tr>)}
   </tbody></table></div>
   <p className="form-help">The Moon’s progress through its birth Nakshatra sets the starting balance. Dates use a 365.25-day year. Other conventions can give different dates.</p>
   <a className="source" href={parashara} target="_blank" rel="noreferrer">Brihat Parashara Hora Shastra</a>
  </div>
  <details className="reading-feature"><summary>Remedies and traditional practices</summary>
   {practice&&<p><strong>For your current period · {practice.name}</strong> ({practice.placement}). {practice.suggestion}</p>}
   <p>Jyotisha traditions discuss mantra, dana (giving) and seva (service). If you want to engage with them, consider a prayer or quiet recitation from your own tradition, volunteering, or giving within your means. The reflection practices above connect to specific chart themes.</p>
   <p className="form-help">These are optional cultural practices. Chart placements cannot establish that a remedy will change an outcome.</p>
  </details>
 </div>;
}
