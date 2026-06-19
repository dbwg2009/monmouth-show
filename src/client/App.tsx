import { useState } from 'react';
import type { Viewer } from '../types.ts';
import { Timeline } from './Timeline.tsx';
import { Acts } from './Acts.tsx';
import { Tasks } from './Tasks.tsx';

type Tab = 'timeline' | 'acts' | 'tasks';

const VIEWERS: { name: Viewer; emoji: string; role: string; color: string }[] = [
  { name: 'Dan',   emoji: '🎛️', role: 'Sound & MC',      color: '#0369a1' },
  { name: 'Jacob', emoji: '🪑', role: 'Stage & Setup',    color: '#7e22ce' },
  { name: 'Steph', emoji: '📋', role: 'Liaison & Comms',  color: '#9d174d' },
];

function ViewerPicker({ onSelect }: { onSelect: (v: Viewer) => void }) {
  return (
    <div className="viewer-screen">
      <div className="viewer-logo">
        <div className="logo-icon">🎵</div>
        <h1>ShowRunner</h1>
        <p>Monmouthshire Show · 16 August 2026</p>
      </div>

      <div className="viewer-cards">
        <h2>Who are you?</h2>
        {VIEWERS.map(v => (
          <button
            key={v.name}
            className="viewer-card"
            onClick={() => {
              localStorage.setItem('showrunner_viewer', v.name);
              onSelect(v.name);
            }}
          >
            <div
              className="viewer-avatar"
              style={{ background: v.color + '18', fontSize: 24 }}
            >
              {v.emoji}
            </div>
            <div className="viewer-info">
              <strong>{v.name}</strong>
              <span>{v.role}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function IconTimeline() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8"  y1="23" x2="16" y2="23" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

export function App() {
  const stored = localStorage.getItem('showrunner_viewer') as Viewer | null;
  const [viewer, setViewer] = useState<Viewer | null>(
    stored === 'Dan' || stored === 'Jacob' || stored === 'Steph' ? stored : null
  );
  const [tab, setTab] = useState<Tab>('timeline');

  if (!viewer) return <ViewerPicker onSelect={setViewer} />;

  const viewerMeta = VIEWERS.find(v => v.name === viewer)!;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          <h1>ShowRunner</h1>
          <span>Monmouthshire Show · 16 Aug</span>
        </div>
        <button
          className="viewer-badge"
          onClick={() => {
            localStorage.removeItem('showrunner_viewer');
            setViewer(null);
          }}
          title="Switch viewer"
        >
          <span>{viewerMeta.emoji}</span>
          <span>{viewer}</span>
        </button>
      </header>

      <main className="app-main">
        {tab === 'timeline' && <Timeline />}
        {tab === 'acts'     && <Acts />}
        {tab === 'tasks'    && <Tasks viewer={viewer} />}
      </main>

      <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
        <button
          className={`nav-btn ${tab === 'timeline' ? 'active' : ''}`}
          onClick={() => setTab('timeline')}
          aria-current={tab === 'timeline' ? 'page' : undefined}
        >
          <IconTimeline />
          Timeline
        </button>
        <button
          className={`nav-btn ${tab === 'acts' ? 'active' : ''}`}
          onClick={() => setTab('acts')}
          aria-current={tab === 'acts' ? 'page' : undefined}
        >
          <IconMic />
          Acts
        </button>
        <button
          className={`nav-btn ${tab === 'tasks' ? 'active' : ''}`}
          onClick={() => setTab('tasks')}
          aria-current={tab === 'tasks' ? 'page' : undefined}
        >
          <IconCheck />
          Tasks
        </button>
      </nav>
    </div>
  );
}
