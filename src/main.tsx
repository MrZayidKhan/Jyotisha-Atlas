import ChartCompanion from './ChartCompanion';
import { assetUrl } from './assetUrl';
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence } from 'motion/react';
import { calculate, signs, type Birth, type Chart } from './engine';
import { sources, meanings, houses, groundedAnswer } from './knowledge';
import './style.css';
import './refinements.css';
import './home.css';
import './navigation.css';
import BirthForm from './BirthForm';
import ChartReading from './ChartReading';
import { advancedAnswer } from './jyotisha';
import HomeHero from './HomeHero';
import BeginnerGuide from './BeginnerGuide';
const Observatory = lazy(() => import('./Observatory'));
class ObservatoryBoundary extends React.Component<React.PropsWithChildren<{done:()=>void}>,{failed:boolean}>{
    state={failed:false};
    static getDerivedStateFromError(){return {failed:true};}
    render(){return this.state.failed?<div className="observatory" role="dialog" aria-label="3D tour unavailable">
        <div className="observatory-loading"><h2>The 3D tour couldn’t start.</h2><p>Your birth chart is ready.</p>
        <button onClick={this.props.done}>Open chart &amp; report ↗</button></div>
    </div>:this.props.children;}
}
const dateText = (c: Chart) => `${c.birth.date} · ${c.birth.unknown ? 'Time unknown' : c.birth.time} · ${c.birth.place}`;
function Source({ id = 'brihat' }: {
    id?: string;
}) { const s = sources.find(s => s.id === id)!; return <a className="source" href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>; }
function Zodiac({ chart, selected, onSelect }: {
    chart: Chart;
    selected: string;
    onSelect: (key: string) => void;
}) { return <div className="zodiac-wrap" data-chart-help="wheel"><svg viewBox="0 0 500 500" className="zodiac" aria-label="Interactive sidereal Rashi chart"><circle cx="250" cy="250" r="226" fill="none" stroke="#756449"/><circle cx="250" cy="250" r="181" fill="none" stroke="#756449"/><circle cx="250" cy="250" r="100" fill="none" stroke="#363747"/>{signs.map((s, i) => { const angle = (i * 30 - 90) * Math.PI / 180, x = 250 + Math.cos(angle) * 226, y = 250 + Math.sin(angle) * 226, a = (i * 30 - 75) * Math.PI / 180; return <g key={s} data-chart-help={`sign:${i}`}><line x1="250" y1="250" x2={x} y2={y} stroke="#756449" opacity=".32"/><text x={250 + Math.cos(a) * 204} y={250 + Math.sin(a) * 204} fill="#b9a684" fontSize="9" textAnchor="middle" dominantBaseline="middle">{s.split(' · ')[1].toUpperCase()}</text></g>; })}<circle cx="250" cy="250" r="52" fill="#0c1020"/><text x="250" y="245" textAnchor="middle" fill="#cbaa73" fontSize="11">BIRTH SKY</text><text x="250" y="264" textAnchor="middle" fill="#87818f" fontSize="8">GEOCENTRIC</text>{chart.placements.map((p, i) => { const a = (p.longitude - 90) * Math.PI / 180, r = 113 + (i % 3) * 23, x = 250 + Math.cos(a) * r, y = 250 + Math.sin(a) * r; return <g key={p.key} role="button" tabIndex={0} aria-label={`${p.name} in ${signs[p.sign]}`} onClick={() => onSelect(p.key)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onSelect(p.key);
} }} className="graha-point" data-chart-help={`planet:${p.key}`}><circle cx={x} cy={y} r="13" fill={selected === p.key ? '#d7bb88' : '#20253c'} stroke="#cbaa73"/><text x={x} y={y + 3} textAnchor="middle" fill={selected === p.key ? '#151521' : '#f3eddf'} fontSize="8">{p.name.slice(0, 2)}</text></g>; })}</svg><p className="form-help">Select a graha to explore its position. Radial spacing separates labels; angle shows sidereal longitude.</p></div>; }
function Chat({ chart }: {
    chart: Chart | null;
}) {
    const [messages, setMessages] = useState<{
        role: string;
        text: string;
    }[]>([]);
    const [question, setQuestion] = useState('');
    const [busy, setBusy] = useState(false);
    async function ask(text: string) {
        if (!text.trim() || busy) return;
        const history = [...messages, { role: 'user', text }];
        setMessages(history);
        setQuestion('');
        setBusy(true);
        const query = text.trim().toLowerCase().replace(/[?.!]+$/, '');
        const lookup = /^where is (?:my )?([a-z]+)$/.exec(query)?.[1];
        const placement = chart?.placements.find(p => lookup === p.key || lookup === p.name.toLowerCase());
        const prepared = placement ? groundedAnswer(placement.key, chart)
            : /^(?:what is )?(?:my )?current (?:dasha|mahadasha|antardasha)$/.test(query)
                ? advancedAnswer(query, chart) : null;
        const fallback = 'That question is beyond the part of the sky I can read right now. Try asking about a specific planet, house, or dasha.';
        const local = advancedAnswer(text, chart) ?? groundedAnswer(text, chart);
        let response = prepared ?? (/^The available source collection/.test(local) ? fallback : local);
        try {
            if (!prepared && chart && import.meta.env.BASE_URL === '/') {
                const r = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ birth: { ...chart.birth, name: '', place: 'Birth location' }, question: text, history: messages.slice(-8) }),
                });
                if (!r.ok) throw Error('Chat unavailable');
                const result = await r.json();
                if (typeof result.answer === 'string' && !/^The available source collection/.test(result.answer)) {
                    response = result.mode === 'source-guide'
                        ? `The signal from AI faded. Here’s what the chart guide can tell you.\n\n${result.answer}`
                        : result.answer;
                }
            }
        } catch {
            if (!/^The available source collection/.test(local)) {
                response = `The signal from AI faded. Here’s what the chart guide can tell you.\n\n${local}`;
            }
        } finally {
            setMessages([...history, { role: 'assistant', text: response }]);
            setBusy(false);
        }
    }
    return <section id="ask" className="chat-section wrap"><div><p className="eyebrow">Ask the atlas</p><h2>Stay curious.</h2><p className="section-copy">Follow a placement. Unpack a word. Ask what the sources can—and cannot—tell you.</p><p className="form-help">{import.meta.env.BASE_URL === '/' ? 'For questions that need AI, Atlas shares your question, recent chat, and calculated chart facts with the AI service.' : <>This edition uses the built-in chart guide. For AI analysis, open <a href="https://jyotisha-atlas.docilelamp1025.chatgpt.site">the AI-enabled Atlas</a>.</>}</p></div><div className="chat-panel"><div className="chat-log" role="log" aria-live="polite">{messages.length === 0 ? <div className="chat-welcome"><span>J / A</span><h3>What would you like to understand?</h3><p>Try a question to begin.</p><div className="chips">{['Summarize my chart', 'Explain my rising sign', 'What is my current dasha?'].map(q => <button onClick={() => ask(q)} key={q}>{q} ↗</button>)}</div></div> : messages.map((m, i) => <div className={`message ${m.role}`} key={i}><span>{m.role === 'user' ? 'YOU' : 'ATLAS'}</span><p>{m.text}</p></div>)}{busy && <p className="form-help">Reading the sky and tracing your chart…</p>}</div><form className="chat-input" onSubmit={e => { e.preventDefault(); ask(question); }}><input aria-label="Question about your chart" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask about your chart…" maxLength={600} required/><button disabled={busy} aria-label="Send question">↗</button></form></div></section>;
}
function Results({ chart, replay, openHorizon }: {
    chart: Chart;
    replay: () => void;
    openHorizon: () => void;
}) { const [selected, setSelected] = useState('moon'); const p = chart.placements.find(p => p.key === selected)!; return <section id="chart" className="results wrap"><div className="section-top"><div data-chart-help="methods"><p className="eyebrow">Your personal atlas</p><h2>{chart.birth.name ? `${chart.birth.name}’s` : 'Your'} birth sky.</h2><p className="section-copy">{dateText(chart)}</p></div><div className="result-actions"><button className="outline-button" data-chart-help="observatory" data-help-only onClick={replay}>Open 3D observatory ↗</button><button className="outline-button" data-chart-help="horizon" data-help-only onClick={openHorizon}>Birthplace horizon ↗</button><button className="button" data-chart-help="report" data-help-only onClick={() => window.print()}>Save report / PDF ↓</button></div></div><nav className="report-nav" aria-label="Jump to report section"><a href="#placements">Placements</a>{!chart.uncertain&&<><a href="#reading">Reading</a><a href="#dasha-timeline">Dasha timeline</a></>}<a href="#ask">Ask Atlas</a></nav><div className="precision-note">{chart.uncertain ? 'Time unknown: positions use local noon. Daily ranges are shown; houses, Lagna and readings are withheld.' : <><span data-chart-help="sidereal">Lahiri sidereal convention</span> · <span data-chart-help="houses">whole-sign houses</span> · <span data-chart-help="nodes">mean lunar nodes</span>.</>} <span data-chart-help="sidereal">Ayanamsa {chart.ayanamsa.toFixed(4)}°</span>. Boundary-sensitive factors need specialist ephemeris verification.</div><div className="summary-strip"><div data-chart-help="lagna"><span>LAGNA / RISING</span><strong>{chart.lagna === null ? 'Time required' : signs[Math.floor(chart.lagna / 30)].split(' · ')[0]}</strong></div><div data-chart-help="nakshatra"><span>{chart.uncertain ? 'NOON REFERENCE' : 'MOON NAKSHATRA'}</span><strong>{chart.nakshatra}</strong></div><div data-chart-help="pada"><span>PADA</span><strong>{chart.pada} / 4{chart.uncertain ? ' · provisional' : ''}</strong></div><div data-chart-help="sidereal"><span>FRAME</span><strong>Sidereal</strong></div></div><div className="chart-grid"><Zodiac chart={chart} selected={selected} onSelect={setSelected}/><aside className="placement-panel" data-chart-help={`planet:${p.key}`} key={selected}><p className="eyebrow">A closer reading</p>{!['rahu', 'ketu'].includes(p.key) && <img src={p.key==='moon'?assetUrl('assets/moon-nearside-480.webp'):assetUrl(`assets/${p.key}.jpg`)} alt={p.name} loading="lazy" decoding="async"/>}<h3>{p.name}</h3><p className="placement-degree">{p.degree.toFixed(2)}° <span>{signs[p.sign]}</span></p><p>{p.house ? `Bhava ${p.house} · ${houses[p.house - 1]}` : 'Houses unavailable without birth time'}{p.retrograde ? ' · Retrograde' : ''}</p><p>Traditional associations: {meanings[p.key]}. This is an introductory symbol, not a personal prediction.</p><Source /><p className="form-help">{['rahu', 'ketu'].includes(p.key) ? 'A calculated lunar node, not a physical planet.' : 'NASA imagery is illustrative; appearance is not reconstructed for your birth moment.'}</p></aside></div><div id="placements" data-chart-help="placements" className="placements-table"><table><caption>Calculated graha placements{chart.uncertain ? ' · local-noon reference' : ''}</caption><thead><tr><th>Graha</th><th>Rashi</th><th>Degree</th><th>Bhava</th><th>Motion / day range</th></tr></thead><tbody>{chart.placements.map(p => <tr key={p.key} data-chart-help={`planet:${p.key}`} onClick={() => setSelected(p.key)}><td><button className="table-select" data-chart-help={`planet:${p.key}`} onClick={() => setSelected(p.key)}>{p.name} ↗</button></td><td data-chart-help={`sign:${p.sign}`}>{signs[p.sign]}</td><td data-chart-help={`degree:${p.key}`}>{p.degree.toFixed(3)}°</td><td data-chart-help={`house:${p.key}`}>{p.house ?? '—'}</td><td data-chart-help={`motion:${p.key}`}>{p.range ? `${p.range[0].toFixed(2)}° → ${p.range[1].toFixed(2)}° longitude` : p.retrograde ? 'Retrograde' : 'Direct'}</td></tr>)}</tbody></table></div><ChartReading chart={chart}/><ChartCompanion key={`${chart.utc}:${chart.birth.lat}:${chart.birth.lon}`} chart={chart}/><details className="method-note" data-chart-help="methods"><summary data-chart-help="methods">Calculation details, limitations & sources</summary><p>{chart.method}. UTC reference: {chart.utc}. Tropical positions are calculated by Astronomy Engine. Sidereal longitudes use a Lahiri anchor with IAU 2006 precession and the nutation of date. The ascendant uses apparent sidereal time and true obliquity. Rahu uses a mean-node polynomial; Ketu is opposite. Nakshatras are equal sidereal divisions, houses are whole-sign.</p><p>Supported years: 1900–2100; latitude ±66°. Small differences can change a sign or Nakshatra at a boundary. With unknown time, noon is explicitly a reference, not the actual birth moment.</p>{sources.map(s => <p key={s.id}><Source id={s.id}/><br />{s.note}</p>)}</details></section>; }
type Page = 'home' | 'birth-details' | 'chart' | 'ask' | 'guide';
function currentPage(): Page {
    switch (window.location.hash) {
        case '#birth-details': return 'birth-details';
        case '#chart':
        case '#placements':
        case '#reading':
        case '#dasha-timeline': return 'chart';
        case '#ask': return 'ask';
        case '#library':
        case '#guide': return 'guide';
        default: return 'home';
    }
}
function App() {
    const [chart, setChart] = useState<Chart | null>(null);
    const [journey, setJourney] = useState(false);
    const [startHorizon,setStartHorizon]=useState(false);
    const [revision,setRevision]=useState(0);
    const [focusReport,setFocusReport]=useState(false);
    const [page,setPage]=useState(currentPage);
    useEffect(()=>{
        const update=()=>{
            setPage(currentPage());
            const anchor=window.location.hash.slice(1);
            requestAnimationFrame(()=>{
                if(['placements','reading','dasha-timeline','library'].includes(anchor)){
                    document.getElementById(anchor)?.scrollIntoView();
                }else{
                    window.scrollTo(0,0);
                }
            });
        };
        window.addEventListener('hashchange',update);
        return()=>window.removeEventListener('hashchange',update);
    },[]);
    const finish=useCallback(()=>{setJourney(false);setFocusReport(true)},[]);
    function create(birth:Birth,show3D:boolean){
        const next=calculate(birth);
        setChart(next);setRevision(v=>v+1);setStartHorizon(false);setPage('chart');setJourney(show3D);setFocusReport(!show3D);
        window.location.hash='chart';
    }
    const previewSample=()=>create({name:'Sample chart',date:'2000-01-01',time:'12:00',place:'Greenwich · sample',lat:51.48,lon:0,offset:0,unknown:false},true);
    const focusChart=useCallback(()=>{
        if(!focusReport||journey||document.querySelector('.observatory'))return;
        const el=document.getElementById('chart');
        if(el){el.tabIndex=-1;el.focus({preventScroll:true});el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
        setFocusReport(false);
    },[focusReport,journey,page]);
    useEffect(()=>{const frame=requestAnimationFrame(focusChart);return()=>cancelAnimationFrame(frame)},[focusChart]);
    useEffect(()=>{
        let originallyOpen=false;
        const prepare=()=>{const details=document.querySelector<HTMLDetailsElement>('.method-note');if(details){originallyOpen=details.open;details.open=true}const footer=document.querySelector('.print-footer');if(footer&&chart)footer.textContent=`Jyotisha Atlas · ${chart.birth.name||'Private report'} · ${dateText(chart)} · Latitude ${chart.birth.lat}°, longitude ${chart.birth.lon}° · UTC offset ${chart.birth.offset} hours · UTC reference ${chart.utc}. Traditional interpretations are not scientifically verified predictions. ${chart.method}.`;};
        const restore=()=>{const details=document.querySelector<HTMLDetailsElement>('.method-note');if(details)details.open=originallyOpen};
        window.addEventListener('beforeprint',prepare);window.addEventListener('afterprint',restore);
        return()=>{window.removeEventListener('beforeprint',prepare);window.removeEventListener('afterprint',restore)};
    },[chart]);
    return <>
      <div className="ambient"/>
      <header className="nav wrap atlas-nav"><a className="wordmark" href="#top"><span>JA</span>Jyotisha Atlas</a><nav aria-label="Primary navigation">{chart&&<a href="#chart" aria-current={page==='chart'?'page':undefined}>My chart</a>}{chart&&<a href="#ask" aria-current={page==='ask'?'page':undefined}>Ask Atlas</a>}<a href="#guide" aria-current={page==='guide'?'page':undefined}>Beginner guide</a></nav><a className="nav-cta" href="#birth-details" aria-current={page==='birth-details'?'page':undefined}>{chart?'Edit details':'Create chart'}</a></header>
      <main id="top" className={`atlas-page page-${page}`}>
        {page==='home'&&<HomeHero preview={previewSample}/>}
        <div hidden={page!=='birth-details'}>
            <section id="birth-details" className="birth-section wrap"><div className="form-intro"><h1>Your birth chart</h1><p>Enter your local birth time and choose a city. Atlas fills in the coordinates and finds the time zone for that date.</p><a className="source" href="#guide">How to read the chart</a></div><BirthForm onCreate={create}/></section>
        </div>
        {chart&&<div className="report-holder" hidden={page!=='chart'||journey}><Results key={revision} chart={chart}
            replay={()=>{setStartHorizon(false);setJourney(true)}} openHorizon={()=>{setStartHorizon(true);setJourney(true)}}/></div>}
        {chart&&<div hidden={page!=='ask'}><Chat key={revision} chart={chart}/></div>}
        {!chart&&(page==='chart'||page==='ask')&&<section className="atlas-empty wrap"><h1>Start with a chart</h1><p>Create a chart to see your placements and ask Atlas about them.</p><a className="button" href="#birth-details">Create chart</a></section>}
        {page==='guide'&&<BeginnerGuide/>}
      </main>
      <footer className="wrap"><a className="wordmark" href="#top"><span>JA</span>Jyotisha Atlas</a><p>An IKS learning project.</p><div className="footer-links"><a href="#guide">Beginner guide</a><a href={assetUrl('ATTRIBUTION.md')}>Sources &amp; credits</a></div></footer>
      <AnimatePresence onExitComplete={()=>requestAnimationFrame(focusChart)}>{journey&&chart&&<ObservatoryBoundary done={finish}>
        <Suspense fallback={<div className="observatory"><div className="observatory-loading"><p role="status">Opening your observatory…</p><button onClick={finish}>Open chart &amp; report ↗</button></div></div>}><Observatory chart={chart} done={finish} startHorizon={startHorizon}/></Suspense>
      </ObservatoryBoundary>}</AnimatePresence>
      <div className="print-footer">Jyotisha Atlas · Educational report. Traditional interpretations are not scientifically verified. Approximate sidereal calculation; consult calculation details above.</div>
    </>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
