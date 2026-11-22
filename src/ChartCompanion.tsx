import { useEffect, useRef, useState } from 'react';
import type { Chart } from './engine';
import './chart-companion.css';

const topics = {
  overview: ['Chart overview', 'The rising sign shows the chart’s starting point. The Moon’s lunar mansion describes a traditional emotional theme. A pada is one of four parts of that mansion.'],
  wheel: ['Chart wheel', 'Each slice is a sign. The markers show where the planets and lunar nodes were calculated at your birth. Select a marker to inspect its placement.'],
  placements: ['Planet placements', 'Each row shows a planet or lunar node, which sign it occupies, and how far it has traveled through that sign. A house connects the placement to a traditional area of life.'],
  reading: ['Chart interpretation', 'This section connects several placements into traditional themes like personality, work, and relationships. Open the evidence under a theme to see which placements it uses.'],
  timing: ['Dasha timeline', 'A dasha is a traditional timing period associated with a planet. A major period contains shorter subperiods. The timeline shows when each period starts and ends.'],
} as const;
type Topic = keyof typeof topics;

export default function ChartCompanion({ chart }: { chart: Chart }) {
  const [active, setActive] = useState(false);
  const [topic, setTopic] = useState<Topic>();
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const star = useRef<HTMLSpanElement>(null);
  const widget = useRef<HTMLElement>(null);
  const request = useRef<AbortController | null>(null);
  const availableTopics = (Object.keys(topics) as Topic[]).filter(key => !chart.uncertain || (key !== 'reading' && key !== 'timing'));

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

  async function explain(key: Topic) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setTopic(key);
    setAnswer(topics[key][1]);
    setBusy(false);
    if (!import.meta.env.DEV) return;
    setBusy(true);
    try {
      const response = await fetch('/api/explain', {
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
      if (!(event.target instanceof Element) || event.target.closest('a, button, input, label, select, summary, [role="button"]')) return;
      const key = event.target.closest<HTMLElement>('[data-chart-help]')?.dataset.chartHelp;
      if (key && Object.hasOwn(topics, key)) void explain(key as Topic);
    }
    root.classList.add('chart-help-active');
    root.addEventListener('click', select);
    return () => {
      root.classList.remove('chart-help-active');
      root.removeEventListener('click', select);
    };
  }, [active, chart]);

  return <aside ref={widget} className="chart-companion" aria-label="Pip the chart companion">
    {active && <span ref={star} className="chart-companion-follower" aria-hidden="true"><Star /></span>}
    <div className="chart-companion-bubble">
      {active ? <>
        <strong>{topic ? topics[topic][0] : 'Pick a glowing section'}</strong>
        <p aria-live="polite">{answer || 'I’ll explain what it means in a few sentences.'}</p>
        {busy && <small role="status">Reading your chart…</small>}
        {import.meta.env.DEV && !topic && <small>AI explanations use calculated chart details.</small>}
        <div className="chart-companion-topics">{availableTopics.map(key =>
          <button key={key} type="button" aria-pressed={topic === key} onClick={() => void explain(key)}>{topics[key][0]}</button>
        )}</div>
      </> : <p>Chart jargon? Tap me for a little starlight.</p>}
    </div>
    <button type="button" className="chart-companion-toggle" aria-pressed={active} aria-label={active ? 'Turn off chart companion' : 'Turn on chart companion'} onClick={() => setActive(value => !value)}><Star /><span>{active ? 'Stop guide' : 'Ask Pip'}</span></button>
  </aside>;
}

function Star() {
  return <span className="chart-companion-star" aria-hidden="true"><span /></span>;
}
