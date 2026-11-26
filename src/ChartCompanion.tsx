import { useEffect, useRef, useState } from 'react';
import { localAiUrl } from './localAi';
import type { Chart } from './engine';
import { chartHelp, generalChartHelp, guideTopics } from './chartHelp';
import { personalReading, yogaCandidates } from './jyotisha';
import './chart-companion.css';

export default function ChartCompanion({ chart }: { chart: Chart }) {
  const [active, setActive] = useState(false);
  const [topic, setTopic] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [personal, setPersonal] = useState(false);
  const [passage, setPassage] = useState('');
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const star = useRef<HTMLSpanElement>(null);
  const widget = useRef<HTMLElement>(null);
  const request = useRef<AbortController | null>(null);
  const availableTopics = [
    ...guideTopics.filter(key => !chart.uncertain || !['parashari','yogas','jaimini','timing'].includes(key)),
    ...chart.placements.map(p => `planet:${p.key}`),
    ...personalReading(chart).map((_, index) => `theme:${index}`),
    ...yogaCandidates(chart).map((_, index) => `yoga:${index}`),
  ];

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!active) return;
    function follow(event: PointerEvent) {
      if (event.pointerType !== 'mouse' || !star.current) return;
      star.current.style.transform = `translate3d(${event.clientX + 14}px,${event.clientY + 14}px,0)`;
    }
    function exit(event: KeyboardEvent) {
      if (event.key === 'Escape') setActive(false);
    }
    window.addEventListener('pointermove', follow, { passive: true });
    window.addEventListener('keydown', exit);
    return () => {
      window.removeEventListener('pointermove', follow);
      window.removeEventListener('keydown', exit);
    };
  }, [active]);

  function selectTopic(key: string, excerpt = '') {
    const detail = generalChartHelp(chart, key);
    if (!detail) return;
    request.current?.abort();
    setTopic(key);
    setPassage(excerpt);
    setAnswer(excerpt ? 'This passage draws on chart placements to describe a traditional theme. Choose In my chart to ask which placements support it and what it means in everyday words.' : detail.text);
    setPersonal(false);
    setBusy(false);
    setAiUnavailable(false);
  }

  async function explainInChart() {
    const detail = chartHelp(chart, topic);
    if (!detail || busy) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setAnswer(passage || detail.text);
    setPersonal(true);
    setBusy(true);
    setAiUnavailable(false);
    try {
      const response = await fetch(localAiUrl('/api/explain'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
        body: JSON.stringify({ section: topic, passage: passage || undefined, birth: { ...chart.birth, name: '', place: 'Birth location' } }),
      });
      if (!response.ok) throw Error('AI unavailable');
      const result = await response.json();
      if (typeof result.answer !== 'string' || !result.answer.trim()) throw Error('Empty explanation');
      if (!controller.signal.aborted) setAnswer(result.answer);
    } catch {
      if (!controller.signal.aborted && passage) setAiUnavailable(true);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  useEffect(() => {
    const root = widget.current?.closest('.results');
    if (!active || !root) return;
    function select(event: Event) {
      if (!(event.target instanceof Element) || event.target.closest('a, input, select, label')) return;
      if (event instanceof KeyboardEvent && (!['Enter', ' '].includes(event.key) || !event.target.matches('[role="button"]'))) return;
      const target = event.target.closest('[data-chart-help]');
      const control = event.target.closest('button, summary, [role="button"]');
      if (control && target !== control) return;
      const key = target?.getAttribute('data-chart-help');
      if (!key) return;
      if (target?.hasAttribute('data-help-only')) {
        event.preventDefault();
        event.stopPropagation();
      }
      selectTopic(key, target?.hasAttribute('data-reading-passage') ? target.textContent?.trim().slice(0, 3200) : '');
    }
    root.classList.add('chart-help-active');
    root.addEventListener('click', select, true);
    root.addEventListener('keydown', select);
    return () => {
      root.classList.remove('chart-help-active');
      root.removeEventListener('click', select, true);
      root.removeEventListener('keydown', select);
    };
  }, [active, chart]);

  return <aside ref={widget} className="chart-companion" aria-label="Pip the chart companion">
    {active && <span ref={star} className="chart-companion-follower" aria-hidden="true"><Star /></span>}
    <div className="chart-companion-bubble">
      {active ? <>
        <strong>{passage ? 'Reading passage' : topic ? generalChartHelp(chart, topic)?.title : 'Pick a glowing detail'}</strong>
        <p aria-live="polite">{answer || 'Pick any glowing chart detail to see what it means.'}</p>
        {busy && <small role="status">Reading your chart…</small>}
        {aiUnavailable && <small role="status">Pip couldn’t reach AI. Check the local server and try again.</small>}
        {topic && chartHelp(chart, topic) && <div className="chart-companion-actions">
          <button type="button" onClick={personal && !aiUnavailable ? () => selectTopic(topic, passage) : explainInChart}>{aiUnavailable ? 'Try AI again' : personal ? 'General meaning' : 'In my chart'}</button>
        </div>}
        <label className="chart-companion-picker">Explain another detail
          <select value={availableTopics.includes(topic) ? topic : ''} onChange={event => selectTopic(event.target.value)}>
            <option value="" disabled>Choose a chart detail</option>
            {availableTopics.map(key => <option key={key} value={key}>{generalChartHelp(chart, key)?.title}</option>)}
          </select>
        </label>
      </> : <p>Chart jargon? Tap me for a little starlight.</p>}
    </div>
    <button type="button" className="chart-companion-toggle" aria-pressed={active} aria-label={active ? 'Turn off chart companion' : 'Turn on chart companion'} onClick={() => setActive(value => !value)}><Star /><span>{active ? 'Stop guide' : 'Ask Pip'}</span></button>
  </aside>;
}

function Star() {
  return <span className="chart-companion-star" aria-hidden="true"><span /></span>;
}
