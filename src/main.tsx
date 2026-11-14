import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { calculate, signs, type Birth, type Chart } from './engine';
import { library, sources, meanings, houses, readings, groundedAnswer } from './knowledge';
import './style.css';
import './refinements.css';
const SpaceScene = lazy(() => import('./SpaceScene'));
const cities = [{ name: 'Bhopal, India', lat: 23.2599, lon: 77.4126, offset: 5.5 }, { name: 'Mumbai, India', lat: 19.076, lon: 72.8777, offset: 5.5 }, { name: 'Delhi, India', lat: 28.6139, lon: 77.209, offset: 5.5 }, { name: 'Bengaluru, India', lat: 12.9716, lon: 77.5946, offset: 5.5 }, { name: 'Kolkata, India', lat: 22.5726, lon: 88.3639, offset: 5.5 }, { name: 'Chennai, India', lat: 13.0827, lon: 80.2707, offset: 5.5 }, { name: 'Hyderabad, India', lat: 17.385, lon: 78.4867, offset: 5.5 }, { name: 'Pune, India', lat: 18.5204, lon: 73.8567, offset: 5.5 }];
const dateText = (c: Chart) => `${c.birth.date} · ${c.birth.unknown ? 'Time unknown' : c.birth.time} · ${c.birth.place}`;
function Source({ id = 'brihat' }: {
    id?: string;
}) { const s = sources.find(s => s.id === id)!; return <a className="source" href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>; }
function Cinematic({ chart, done }: {
    chart: Chart;
    done: () => void;
}) {
    const [phase, setPhase] = useState(0);
    const [fallback, setFallback] = useState(false);
    const reduced = useReducedMotion();
    const unavailable = useCallback(() => setFallback(true), []);
    useEffect(() => { if (reduced) {
        done();
        return;
    } const timers = [setTimeout(() => setPhase(1), 2300), setTimeout(() => setPhase(2), 5100), setTimeout(done, 8500)]; const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { timers.forEach(clearTimeout); document.body.style.overflow = old; }; }, [done, reduced]);
    useEffect(() => {
        const background = [...document.querySelectorAll<HTMLElement>('main,header,footer')];
        background.forEach(el=>el.inert=true);
        const f = (e: KeyboardEvent) => { if(e.key==='Escape')done();if(e.key==='Tab'){e.preventDefault();document.querySelector<HTMLButtonElement>('.cinematic button')?.focus();} };
        window.addEventListener('keydown', f);
        return ()=>{background.forEach(el=>el.inert=false);window.removeEventListener('keydown',f)};
    }, [done]);
    return <motion.div className="cinematic" role="dialog" aria-modal="true" aria-label="Revealing your birth sky" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="galaxy-backdrop"/><div className="cinematic-nav"><span className="wordmark">JA / THE BIRTH SKY</span><button autoFocus className="outline-button" onClick={done}>Skip to my chart →</button></div><Suspense fallback={<div className="scene-loading">Opening the observatory…</div>}>{!fallback && <SpaceScene chart={chart} onUnavailable={unavailable}/>}</Suspense>{fallback && <div className="fallback-planets">{chart.placements.slice(0, 7).map(p => <img key={p.key} src={`/assets/${p.key}.jpg`} alt={p.name}/>)}</div>}<div className="cinematic-caption" aria-live="polite"><p className="eyebrow">0{phase + 1} / 03 · {chart.birth.date}</p><AnimatePresence mode="wait"><motion.h2 key={phase} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>{['Returning to your moment.', 'Tracing the planetary longitudes.', 'Your sky. A new perspective.'][phase]}</motion.h2></AnimatePresence><p>{phase === 0 ? dateText(chart) : phase === 1 ? 'Calculated from your birth details. Viewed from Earth.' : 'The chart is ready. Let’s read it with care.'}</p><div className="cinematic-progress"><motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 8.5, ease: 'linear' }}/></div><small>Artistic camera journey · sidereal longitude alignment · distances and sizes are illustrative<br />Backdrop: NASA multiwavelength image PIA12348 · unrelated to the birth date</small></div></motion.div>;
}
function BirthForm({ onCreate }: {
    onCreate: (b: Birth) => void;
}) {
    const [place, setPlace] = useState('');
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    const [offset, setOffset] = useState('');
    const [unknown, setUnknown] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const matches = place.length > 1 && !lat ? cities.filter(c => c.name.toLowerCase().includes(place.toLowerCase())) : [];
    return <form className="birth-form" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setError(''); if (!confirmed) {
        setError('Confirm the coordinates and historical UTC offset for your birth date.');
        return;
    } if (!lat || !lon || !offset) {
        setError('Enter coordinates and the UTC offset. Use 0 explicitly for Greenwich or the equator.');
        return;
    } setBusy(true); try {
        await new Promise(r => setTimeout(r, 60));
        onCreate({ name: String(f.get('name') || ''), date: String(f.get('date')), time: String(f.get('time') || ''), place, lat: Number(lat), lon: Number(lon), offset: Number(offset), unknown });
    }
    catch (err) {
        setError((err as Error).message);
    }
    finally {
        setBusy(false);
    } }}>
 <label>Name <small>optional</small><input name="name" maxLength={80} placeholder="What should we call you?"/></label><div className="input-row"><label>Date of birth<input type="date" name="date" min="1900-01-01" max={new Date().toISOString().slice(0, 10)} required/></label><label>Time of birth<input type="time" name="time" required={!unknown} disabled={unknown}/></label></div><label className="check"><input type="checkbox" checked={unknown} onChange={e => setUnknown(e.target.checked)}/><span>I don’t know my birth time</span></label>{unknown && <p className="form-help">We’ll use a labeled local-noon reference with a daily Moon range. Lagna, houses and personalized readings are withheld.</p>}
 <label>Birthplace<input name="place" required value={place} placeholder="Search Indian cities, or enter any place" onChange={e => { setPlace(e.target.value); setConfirmed(false); setLat(''); setLon(''); setOffset(''); }} autoComplete="off"/></label>{matches.length > 0 && <div className="city-results">{matches.map(c => <button type="button" key={c.name} onClick={() => { setPlace(c.name); setLat(String(c.lat)); setLon(String(c.lon)); setOffset(String(c.offset)); setConfirmed(false); }}>{c.name} <span>Use coordinates ↗</span></button>)}</div>}
 <details className="location-detail" open={!!place}><summary>Coordinates & time zone at birth</summary><p className="form-help">City lookup covers eight Indian cities. For other places, enter coordinates manually. Confirm the UTC offset on the birth date, including any historical daylight saving.</p><div className="input-row triple"><label>Latitude °<input type="number" step="any" min="-66" max="66" required value={lat} onChange={e => { setLat(e.target.value); setConfirmed(false); }} placeholder="23.2599"/></label><label>Longitude °<input type="number" step="any" min="-180" max="180" required value={lon} onChange={e => { setLon(e.target.value); setConfirmed(false); }} placeholder="77.4126"/></label><label>UTC offset hours<input type="number" step="0.25" min="-14" max="14" required value={offset} onChange={e => { setOffset(e.target.value); setConfirmed(false); }} placeholder="5.5"/></label></div><label className="check"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/><span>I confirm these coordinates and the UTC offset at birth.</span></label></details><p role="alert" className="form-error">{error}</p><button disabled={busy} className="button">{busy ? 'Calculating…' : 'Reveal my birth sky'} <b>↗</b></button><p className="form-help">Birth details stay on this page. Nothing is saved to an account.</p></form>;
}
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
function Library() { const [query, setQuery] = useState(''); const [category, setCategory] = useState('All'); const entries = library.filter(e => (category === 'All' || e.category === category) && `${e.title} ${e.text}`.toLowerCase().includes(query.toLowerCase())); return <section id="library" className="knowledge-section wrap"><div className="section-top"><div><p className="eyebrow">The knowledge library</p><h2>A language of the sky.</h2></div><input className="search" aria-label="Search library" placeholder="Search a concept…" value={query} onChange={e => setQuery(e.target.value)}/></div><div className="chips filters">{['All', ...new Set(library.map(e => e.category))].map(c => <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c}>{c}</button>)}</div><div className="knowledge-grid">{entries.map(e => <details key={e.title}><summary><span>{e.category}</span>{e.title}<b>+</b></summary><p>{e.text}</p><Source id={e.source}/></details>)}</div>{entries.length === 0 && <p role="status">No matching concepts. Try a shorter search.</p>}</section>; }
function Results({ chart, replay }: {
    chart: Chart;
    replay: () => void;
}) { const [selected, setSelected] = useState('moon'); const p = chart.placements.find(p => p.key === selected)!; return <section id="chart" className="results wrap"><div className="section-top"><div><p className="eyebrow">Your personal atlas</p><h2>{chart.birth.name ? `${chart.birth.name}’s` : 'Your'} birth sky.</h2><p className="section-copy">{dateText(chart)}</p></div><div className="result-actions"><button className="outline-button" onClick={replay}>Replay journey ↗</button><button className="button" onClick={() => window.print()}>Save report / PDF ↓</button></div></div><div className="precision-note">{chart.uncertain ? 'Time unknown: positions use local noon. Daily ranges are shown; houses, Lagna and readings are withheld.' : 'Approximate Lahiri sidereal · whole-sign houses · mean lunar nodes.'} Ayanamsa {chart.ayanamsa.toFixed(4)}°. Boundary-sensitive factors need specialist ephemeris verification.</div><div className="summary-strip"><div><span>LAGNA / RISING</span><strong>{chart.lagna === null ? 'Time required' : signs[Math.floor(chart.lagna / 30)].split(' · ')[0]}</strong></div><div><span>{chart.uncertain ? 'NOON REFERENCE' : 'MOON NAKSHATRA'}</span><strong>{chart.nakshatra}</strong></div><div><span>PADA</span><strong>{chart.pada} / 4{chart.uncertain ? ' · provisional' : ''}</strong></div><div><span>FRAME</span><strong>Sidereal</strong></div></div><div className="chart-grid"><Zodiac chart={chart} selected={selected} onSelect={setSelected}/><aside className="placement-panel" key={selected}><p className="eyebrow">A closer reading</p>{!['rahu', 'ketu'].includes(p.key) && <img src={`/assets/${p.key}.jpg`} alt={p.name}/>}<h3>{p.name}</h3><p className="placement-degree">{p.degree.toFixed(2)}° <span>{signs[p.sign]}</span></p><p>{p.house ? `Bhava ${p.house} · ${houses[p.house - 1]}` : 'Houses unavailable without birth time'}{p.retrograde ? ' · Retrograde' : ''}</p><p>Traditional associations: {meanings[p.key]}. This is an introductory symbol, not a personal prediction.</p><Source /><p className="form-help">{['rahu', 'ketu'].includes(p.key) ? 'A calculated lunar node, not a physical planet.' : 'NASA imagery is illustrative; appearance is not reconstructed for your birth moment.'}</p></aside></div><div className="placements-table"><table><caption>Calculated graha placements{chart.uncertain ? ' · local-noon reference' : ''}</caption><thead><tr><th>Graha</th><th>Rashi</th><th>Degree</th><th>Bhava</th><th>Motion / day range</th></tr></thead><tbody>{chart.placements.map(p => <tr key={p.key} onClick={() => setSelected(p.key)}><td><button className="table-select" onClick={() => setSelected(p.key)}>{p.name} ↗</button></td><td>{signs[p.sign]}</td><td>{p.degree.toFixed(3)}°</td><td>{p.house ?? '—'}</td><td>{p.range ? `${p.range[0].toFixed(2)}° → ${p.range[1].toFixed(2)}° longitude` : p.retrograde ? 'Retrograde' : 'Direct'}</td></tr>)}</tbody></table></div>{!chart.uncertain && <div className="readings"><p className="eyebrow">Traditional interpretations</p><h2>Symbols, with room for reflection.</h2><p className="section-copy">These brief readings explain traditional significations. They do not establish personality, predict events, or replace your own judgment.</p><div className="reading-grid">{readings(chart).map((r, i) => <motion.article key={r.topic} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .12 }}><span className="reading-number">0{i + 1}</span><h3>{r.topic}</h3><ul>{r.factors.map(p => <li key={p.key}><b>{p.name} · {signs[p.sign].split(' · ')[0]}{p.house ? ` · Bhava ${p.house}` : ''}</b><br />{meanings[p.key]}.</li>)}</ul><p>{r.prompt}</p><Source /></motion.article>)}</div></div>}<details className="method-note"><summary>Calculation details, limitations & sources</summary><p>{chart.method}. UTC reference: {chart.utc}. Tropical positions are calculated by Astronomy Engine. Sidereal longitudes use a linear Lahiri approximation around J2000; this is not a full Swiss Ephemeris Lahiri implementation. The ascendant uses local sidereal time and mean obliquity. Rahu uses a mean-node polynomial; Ketu is opposite. Nakshatras are equal sidereal divisions, houses are whole-sign.</p><p>Supported years: 1900–2100; latitude ±66°. Small differences can change a sign or Nakshatra at a boundary. With unknown time, noon is explicitly a reference, not the actual birth moment.</p>{sources.map(s => <p key={s.id}><Source id={s.id}/><br />{s.note}</p>)}</details></section>; }
function App() {
    const [chart, setChart] = useState<Chart | null>(null);
    const [journey, setJourney] = useState(false);
    const finish = useCallback(() => { setJourney(false); setTimeout(() => {const el=document.getElementById('chart');if(el){el.tabIndex=-1;el.focus({preventScroll:true});el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}},100); }, []);
    useEffect(()=>{
        let originallyOpen=false;
        const prepare=()=>{const details=document.querySelector<HTMLDetailsElement>('.method-note');if(details){originallyOpen=details.open;details.open=true}const footer=document.querySelector('.print-footer');if(footer&&chart)footer.textContent=`Jyotisha Atlas · ${chart.birth.name||'Private report'} · ${dateText(chart)} · Latitude ${chart.birth.lat}°, longitude ${chart.birth.lon}° · UTC offset ${chart.birth.offset} hours · UTC reference ${chart.utc}. Traditional interpretations are not scientifically verified predictions. ${chart.method}.`;};
        const restore=()=>{const details=document.querySelector<HTMLDetailsElement>('.method-note');if(details)details.open=originallyOpen};
        window.addEventListener('beforeprint',prepare);window.addEventListener('afterprint',restore);
        return()=>{window.removeEventListener('beforeprint',prepare);window.removeEventListener('afterprint',restore)};
    },[chart]);
    return <><div className="ambient"/><header className="nav wrap"><a className="wordmark" href="#top"><span>JA</span> Jyotisha Atlas</a><nav><a href="#birth-details">Your birth sky</a><a href="#library">Library</a><a href="#ask">Ask Atlas</a></nav><a className="nav-cta" href="#birth-details">Enter the observatory ↗</a></header><main id="top"><section className="hero wrap"><div className="hero-copy"><p className="eyebrow"><span />An Indian astral observatory</p><h1>Your moment.<br /><em>Written in sky.</em></h1><p className="lede">Travel back to your first sky. Explore its planetary patterns, then discover the ideas and traditions that give them meaning.</p><div className="hero-actions"><a className="button" href="#birth-details">Find your birth sky <b>↗</b></a><a className="text-link" href="#library">Explore the tradition ↓</a></div><div className="hero-foot"><span>CALCULATED SKY</span><span className="line"/><span>TRADITIONAL PERSPECTIVES</span></div></div><div className="sky-stage"><div className="orbital orbital-one"/><div className="orbital orbital-two"/><img className="moon real-moon" src="/assets/moon.jpg" alt="NASA lunar image"/><p className="stage-label label-top">CHANDRA<br />THE LUNAR WORLD</p><p className="stage-label label-bottom">A MOMENT IN THE COSMOS</p></div></section><section className="journey-teaser wrap"><span>01 / ENTER YOUR MOMENT</span><span>02 / WATCH THE SKY ALIGN</span><span>03 / EXPLORE YOUR ATLAS</span></section><section id="birth-details" className="birth-section wrap"><div className="form-intro"><p className="eyebrow"><span />The beginning of your atlas</p><h2>Every sky starts<br />with a moment.</h2><p>Date, time, and place let us calculate the planetary longitudes for your birth. Then the observatory opens.</p><div className="form-quote">“An invitation to understand,<br />not a promise of destiny.”</div><p className="note">APPROXIMATE LAHIRI · WHOLE-SIGN BHAVAS</p></div><BirthForm onCreate={b => { const c = calculate(b); setChart(c); setJourney(true); }}/></section>{chart && !journey && <Results key={`results-${chart.utc}-${chart.birth.name}`} chart={chart} replay={() => setJourney(true)}/>}<Chat key={`chat-${chart?.utc ?? 'empty'}`} chart={chart}/><Library /><section className="ethics wrap"><p className="eyebrow">A thoughtful relationship with tradition</p><h2>Read with curiosity.<br /><em>Keep your agency.</em></h2><p>Jyotisha is a historical and cultural tradition. Its symbolic interpretations are not scientifically verified predictions. This atlas makes calculation methods, source limits, and uncertainty visible so you can explore thoughtfully.</p></section></main><footer className="wrap"><a className="wordmark" href="#top"><span>JA</span> Jyotisha Atlas</a><p>An IKS learning project. Birth details remain in memory and clear on refresh. Optional AI sends only the disclosed question, conversation and answer cards.</p><a href="/ATTRIBUTION.md">Sources & credits ↗</a></footer><AnimatePresence>{journey && chart && <Cinematic chart={chart} done={finish}/>}</AnimatePresence><div className="print-footer">Jyotisha Atlas · Educational report. Traditional interpretations are not scientifically verified. Approximate sidereal calculation; consult calculation details above.</div></>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
