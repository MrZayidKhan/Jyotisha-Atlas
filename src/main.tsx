import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { calculate, signs, type Birth, type Chart } from './engine';
import { library, sources, meanings, houses, readings, groundedAnswer } from './knowledge';
import './style.css';
import './refinements.css';
import './home.css';
import BirthForm from './BirthForm';
import HomeHero from './HomeHero';
import KnowledgeLibrary from './KnowledgeLibrary';
const Observatory = lazy(() => import('./Observatory'));
const dateText = (c: Chart) => `${c.birth.date} · ${c.birth.unknown ? 'Time unknown' : c.birth.time} · ${c.birth.place}`;
function Source({ id = 'brihat' }: {
    id?: string;
}) { const s = sources.find(s => s.id === id)!; return <a className="source" href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>; }
function Zodiac({ chart, selected, onSelect }: {
    chart: Chart;
    selected: string;
    onSelect: (key: string) => void;
}) { return <div className="zodiac-wrap"><svg viewBox="0 0 500 500" className="zodiac" aria-label="Interactive sidereal Rashi chart"><circle cx="250" cy="250" r="226" fill="none" stroke="#756449"/><circle cx="250" cy="250" r="181" fill="none" stroke="#756449"/><circle cx="250" cy="250" r="100" fill="none" stroke="#363747"/>{signs.map((s, i) => { const angle = (i * 30 - 90) * Math.PI / 180, x = 250 + Math.cos(angle) * 226, y = 250 + Math.sin(angle) * 226, a = (i * 30 - 75) * Math.PI / 180; return <g key={s}><line x1="250" y1="250" x2={x} y2={y} stroke="#756449" opacity=".32"/><text x={250 + Math.cos(a) * 204} y={250 + Math.sin(a) * 204} fill="#b9a684" fontSize="9" textAnchor="middle" dominantBaseline="middle">{s.split(' · ')[1].toUpperCase()}</text></g>; })}<circle cx="250" cy="250" r="52" fill="#0c1020"/><text x="250" y="245" textAnchor="middle" fill="#cbaa73" fontSize="11">BIRTH SKY</text><text x="250" y="264" textAnchor="middle" fill="#87818f" fontSize="8">GEOCENTRIC</text>{chart.placements.map((p, i) => { const a = (p.longitude - 90) * Math.PI / 180, r = 113 + (i % 3) * 23, x = 250 + Math.cos(a) * r, y = 250 + Math.sin(a) * r; return <g key={p.key} role="button" tabIndex={0} aria-label={`${p.name} in ${signs[p.sign]}`} onClick={() => onSelect(p.key)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onSelect(p.key);
} }} className="graha-point"><circle cx={x} cy={y} r="13" fill={selected === p.key ? '#d7bb88' : '#20253c'} stroke="#cbaa73"/><text x={x} y={y + 3} textAnchor="middle" fill={selected === p.key ? '#151521' : '#f3eddf'} fontSize="8">{p.name.slice(0, 2)}</text></g>; })}</svg><p className="form-help">Select a graha to explore its position. Radial spacing separates labels; angle shows sidereal longitude.</p></div>; }
function Chat({ chart }: {
    chart: Chart | null;
}) {
    const [messages, setMessages] = useState<{
        role: string;
        text: string;
    }[]>([]);
    const [question, setQuestion] = useState('');
    const [busy, setBusy] = useState(false);
    const [online, setOnline] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(false);
    useEffect(() => { if(!['localhost','127.0.0.1'].includes(location.hostname))return;fetch('/api/health').then(r => r.ok ? r.json() : null).then(d => setAiEnabled(!!d?.llm_configured)).catch(() => { }); }, []);
    async function ask(text: string) { if (!text.trim() || busy)
        return; const history = [...messages, { role: 'user', text }]; setMessages(history); setQuestion(''); setBusy(true); let response = groundedAnswer(text, chart); if (/\bit\b|that planet|tell me more|what about/.test(text.toLowerCase())) {
        const prior = [...messages].reverse().find(m => m.role === 'user');
        if (prior)
            response = groundedAnswer(`${prior.text} ${text}`, chart);
    } if (online && chart) {
        try {
            const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ birth: chart.birth, question: text, history: messages.slice(-8) }) });
            if (!r.ok)
                throw Error();
            const d = await r.json();
            response = d.answer;
        }
        catch {
            response += '\n\nThe AI connection is unavailable; this answer comes from the local source guide.';
        }
    } setMessages([...history, { role: 'assistant', text: response }]); setBusy(false); }
    return <section id="ask" className="chat-section wrap"><div><p className="eyebrow">Ask the atlas</p><h2>Stay curious.</h2><p className="section-copy">Follow a placement. Unpack a word. Ask what the sources can—and cannot—tell you.</p><div className="chat-mode">{aiEnabled ? <label><input type="checkbox" checked={online} onChange={e => setOnline(e.target.checked)}/> Use connected AI retrieval</label> : 'Source guide · works without an API key'}</div><p className="form-help">{online ? 'Your question, recent conversation and chart facts will be sent to the configured LLM. It selects from verified answer cards.' : 'Local answers use the curated library and your calculated chart. Free-form AI awaits server configuration.'}</p></div><div className="chat-panel"><div className="chat-log" role="log" aria-live="polite">{messages.length === 0 ? <div className="chat-welcome"><span>J / A</span><h3>What would you like to understand?</h3><p>Try a question to begin.</p><div className="chips">{['Where is Chandra?', 'Explain Lagna', 'What are Bhavas?'].map(q => <button onClick={() => ask(q)} key={q}>{q} ↗</button>)}</div></div> : messages.map((m, i) => <div className={`message ${m.role}`} key={i}><span>{m.role === 'user' ? 'YOU' : 'ATLAS'}</span><p>{m.text}</p></div>)}{busy && <p className="form-help">Finding a supported answer…</p>}</div><form className="chat-input" onSubmit={e => { e.preventDefault(); ask(question); }}><input aria-label="Question about your chart" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask about your chart…" maxLength={600} required/><button disabled={busy} aria-label="Send question">↗</button></form></div></section>;
}
function Results({ chart, replay }: {
    chart: Chart;
    replay: () => void;
}) { const [selected, setSelected] = useState('moon'); const p = chart.placements.find(p => p.key === selected)!; return <section id="chart" className="results wrap"><div className="section-top"><div><p className="eyebrow">Your personal atlas</p><h2>{chart.birth.name ? `${chart.birth.name}’s` : 'Your'} birth sky.</h2><p className="section-copy">{dateText(chart)}</p></div><div className="result-actions"><button className="outline-button" onClick={replay}>Open 3D observatory ↗</button><button className="button" onClick={() => window.print()}>Save report / PDF ↓</button></div></div><div className="precision-note">{chart.uncertain ? 'Time unknown: positions use local noon. Daily ranges are shown; houses, Lagna and readings are withheld.' : 'Approximate Lahiri sidereal · whole-sign houses · mean lunar nodes.'} Ayanamsa {chart.ayanamsa.toFixed(4)}°. Boundary-sensitive factors need specialist ephemeris verification.</div><div className="summary-strip"><div><span>LAGNA / RISING</span><strong>{chart.lagna === null ? 'Time required' : signs[Math.floor(chart.lagna / 30)].split(' · ')[0]}</strong></div><div><span>{chart.uncertain ? 'NOON REFERENCE' : 'MOON NAKSHATRA'}</span><strong>{chart.nakshatra}</strong></div><div><span>PADA</span><strong>{chart.pada} / 4{chart.uncertain ? ' · provisional' : ''}</strong></div><div><span>FRAME</span><strong>Sidereal</strong></div></div><div className="chart-grid"><Zodiac chart={chart} selected={selected} onSelect={setSelected}/><aside className="placement-panel" key={selected}><p className="eyebrow">A closer reading</p>{!['rahu', 'ketu'].includes(p.key) && <img src={`/assets/${p.key}.jpg`} alt={p.name}/>}<h3>{p.name}</h3><p className="placement-degree">{p.degree.toFixed(2)}° <span>{signs[p.sign]}</span></p><p>{p.house ? `Bhava ${p.house} · ${houses[p.house - 1]}` : 'Houses unavailable without birth time'}{p.retrograde ? ' · Retrograde' : ''}</p><p>Traditional associations: {meanings[p.key]}. This is an introductory symbol, not a personal prediction.</p><Source /><p className="form-help">{['rahu', 'ketu'].includes(p.key) ? 'A calculated lunar node, not a physical planet.' : 'NASA imagery is illustrative; appearance is not reconstructed for your birth moment.'}</p></aside></div><div className="placements-table"><table><caption>Calculated graha placements{chart.uncertain ? ' · local-noon reference' : ''}</caption><thead><tr><th>Graha</th><th>Rashi</th><th>Degree</th><th>Bhava</th><th>Motion / day range</th></tr></thead><tbody>{chart.placements.map(p => <tr key={p.key} onClick={() => setSelected(p.key)}><td><button className="table-select" onClick={() => setSelected(p.key)}>{p.name} ↗</button></td><td>{signs[p.sign]}</td><td>{p.degree.toFixed(3)}°</td><td>{p.house ?? '—'}</td><td>{p.range ? `${p.range[0].toFixed(2)}° → ${p.range[1].toFixed(2)}° longitude` : p.retrograde ? 'Retrograde' : 'Direct'}</td></tr>)}</tbody></table></div>{!chart.uncertain && <div className="readings"><p className="eyebrow">Traditional interpretations</p><h2>Symbols, with room for reflection.</h2><p className="section-copy">These brief readings explain traditional significations. They do not establish personality, predict events, or replace your own judgment.</p><div className="reading-grid">{readings(chart).map((r, i) => <motion.article key={r.topic} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .12 }}><span className="reading-number">0{i + 1}</span><h3>{r.topic}</h3><ul>{r.factors.map(p => <li key={p.key}><b>{p.name} · {signs[p.sign].split(' · ')[0]}{p.house ? ` · Bhava ${p.house}` : ''}</b><br />{meanings[p.key]}.</li>)}</ul><p>{r.prompt}</p><Source /></motion.article>)}</div></div>}<details className="method-note"><summary>Calculation details, limitations & sources</summary><p>{chart.method}. UTC reference: {chart.utc}. Tropical positions are calculated by Astronomy Engine. Sidereal longitudes use a linear Lahiri approximation around J2000; this is not a full Swiss Ephemeris Lahiri implementation. The ascendant uses local sidereal time and mean obliquity. Rahu uses a mean-node polynomial; Ketu is opposite. Nakshatras are equal sidereal divisions, houses are whole-sign.</p><p>Supported years: 1900–2100; latitude ±66°. Small differences can change a sign or Nakshatra at a boundary. With unknown time, noon is explicitly a reference, not the actual birth moment.</p>{sources.map(s => <p key={s.id}><Source id={s.id}/><br />{s.note}</p>)}</details></section>; }
function App() {
    const [chart, setChart] = useState<Chart | null>(null);
    const [journey, setJourney] = useState(false);
    const previewSample=()=>{setChart(calculate({name:'Sample chart',date:'2000-01-01',time:'12:00',place:'Greenwich · sample',lat:51.48,lon:0,offset:0,unknown:false}));setJourney(true)};
    const finish = useCallback(() => { setJourney(false); setTimeout(() => {const el=document.getElementById('chart');if(el){el.tabIndex=-1;el.focus({preventScroll:true});el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}},100); }, []);
    useEffect(()=>{
        let originallyOpen=false;
        const prepare=()=>{const details=document.querySelector<HTMLDetailsElement>('.method-note');if(details){originallyOpen=details.open;details.open=true}const footer=document.querySelector('.print-footer');if(footer&&chart)footer.textContent=`Jyotisha Atlas · ${chart.birth.name||'Private report'} · ${dateText(chart)} · Latitude ${chart.birth.lat}°, longitude ${chart.birth.lon}° · UTC offset ${chart.birth.offset} hours · UTC reference ${chart.utc}. Traditional interpretations are not scientifically verified predictions. ${chart.method}.`;};
        const restore=()=>{const details=document.querySelector<HTMLDetailsElement>('.method-note');if(details)details.open=originallyOpen};
        window.addEventListener('beforeprint',prepare);window.addEventListener('afterprint',restore);
        return()=>{window.removeEventListener('beforeprint',prepare);window.removeEventListener('afterprint',restore)};
    },[chart]);
    return <>
      <div className="ambient"/>
      <header className="nav wrap"><a className="wordmark" href="#top"><span>JA</span>Jyotisha Atlas</a><nav aria-label="Primary navigation"><a href="#library">Discover</a><a href="#ask">Ask Atlas</a></nav><a className="nav-cta" href="#birth-details">Create your atlas <span>↗</span></a></header>
      <main id="top">
        <HomeHero preview={previewSample}/>
        <section className="home-intro wrap"><p>A sky you can move through.<br/><span>A tradition you can understand.</span></p><div><span>01 · Your moment</span><i>→</i><span>02 · Your sky</span><i>→</i><span>03 · Your perspective</span></div></section>
        <section id="birth-details" className="birth-section wrap"><div className="form-intro"><p className="eyebrow">Make it personal</p><h2>Start with<br/><em>your moment.</em></h2><p>Just a few details open your personal observatory. We’ll take care of the coordinates.</p><div className="form-aside-note"><span>01 / 03</span><p>Enter your details.<br/>Watch your sky unfold.</p></div></div><BirthForm onCreate={birth=>{setChart(calculate(birth));setJourney(true)}}/></section>
        {chart&&!journey&&<Results key={'results-'+chart.utc+'-'+chart.birth.name} chart={chart} replay={()=>setJourney(true)}/>}
        <Chat key={'chat-'+(chart?.utc??'empty')} chart={chart}/>
        <KnowledgeLibrary/>
        <section className="ethics wrap"><div><p className="eyebrow">Curiosity, with perspective</p><h2>Keep your wonder.<br/><em>Keep your agency.</em></h2></div><p>Jyotisha is a cultural tradition. Explore its symbols as ideas for reflection, with sources and uncertainty in view. Astrological interpretations are not scientifically verified predictions.</p></section>
      </main>
      <footer className="wrap"><a className="wordmark" href="#top"><span>JA</span>Jyotisha Atlas</a><p>A contemporary observatory for an ancient tradition.<br/>An IKS learning project.</p><a href="/ATTRIBUTION.md">Sources & credits ↗</a></footer>
      <AnimatePresence>{journey&&chart&&<Suspense fallback={<div className="observatory"><div className="observatory-loading">Opening your 3D observatory…</div></div>}><Observatory chart={chart} done={finish}/></Suspense>}</AnimatePresence>
      <div className="print-footer">Jyotisha Atlas · Educational report. Traditional interpretations are not scientifically verified. Approximate sidereal calculation; consult calculation details above.</div>
    </>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
