import { useEffect, useRef, useState } from 'react';
import { localAiUrl } from './localAi';
import type { Chart } from './engine';
import { chartHelp, guideTopics } from './chartHelp';
import { personalReading, yogaCandidates } from './jyotisha';
import './chart-companion.css';

export default function ChartCompanion({ chart }: { chart: Chart }) {
  const [active, setActive] = useState(false);
  const [topic, setTopic] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
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

  async function explain(key: string) {
    const detail = chartHelp(chart, key);
    if (!detail) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setTopic(key);
    setAnswer(detail.text);
    setBusy(false);
    setBusy(true);
    try {
      const response = await fetch(localAiUrl('/api/explain'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
        body: JSON.stringify({ section: key, birth: { ...chart.birth, name: '', place: 'Birth location' } }),
      });
      if (!response.ok) return;
      const result = await response.json();
      if (!controller.signal.aborted && typeof result.answer === 'string' && result.answer.trim()) setAnswer(result.answer);
    } catch {
      // The built-in explanation is already visible.
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
      if (key) void explain(key);
    }
    root.classList.add('chart-help-active');
    root.addEventListener('click', select);
    root.addEventListener('keydown', select);
    return () => {
      root.classList.remove('chart-help-active');
      root.removeEventListener('click', select);
      root.removeEventListener('keydown', select);
    };
  }, [active, chart]);

  return <aside ref={widget} className="chart-companion" aria-label="Pip the chart companion">
    {active && <span ref={star} className="chart-companion-follower" aria-hidden="true"><Star /></span>}
    <div className="chart-companion-bubble">
      {active ? <>
        <strong>{topic ? chartHelp(chart, topic)?.title : 'Pick a glowing detail'}</strong>
        <p aria-live="polite">{answer || 'Try Sidereal, a dot on the wheel, or a specific reading card. I’ll explain what you’re seeing and how Atlas got there.'}</p>
        {busy && <small role="status">Reading your chart…</small>}
        {!topic && <small>With the local server running, AI can expand this explanation using calculated chart details.</small>}
        <label className="chart-companion-picker">Explain another detail
          <select value={availableTopics.includes(topic) ? topic : ''} onChange={event => void explain(event.target.value)}>
            <option value="" disabled>Choose a chart detail</option>
            {availableTopics.map(key => <option key={key} value={key}>{chartHelp(chart, key)?.title}</option>)}
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
