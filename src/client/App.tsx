import { useState } from 'react';
import type { Viewer } from '../types.ts';
import { Timeline } from './Timeline.tsx';
import { Acts } from './Acts.tsx';
import { Tasks } from './Tasks.tsx';
import { Emails } from './Emails.tsx';
import { Info } from './Info.tsx';
import { TechSheet } from './TechSheet.tsx';
import { SettingsTab } from './SettingsTab.tsx';

type Tab = 'timeline' | 'acts' | 'tasks' | 'emails' | 'info' | 'tech' | 'settings';
type NavTab = 'timeline' | 'acts' | 'tasks' | 'emails' | 'more';

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
          <button key={v.name} className="viewer-card" onClick={() => {
            localStorage.setItem('showrunner_viewer', v.name);
            onSelect(v.name);
          }}>
            <div className="viewer-avatar" style={{ background: v.color + '18', fontSize: 24 }}>{v.emoji}</div>
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

// ── Icons ──────────────────────────────────────────────────────────────────────

function IcoTimeline() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IcoMic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
function IcoMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IcoMore() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IcoInfo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
function IcoTech() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
    </svg>
  );
}
function IcoSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function tabToNav(tab: Tab): NavTab {
  if (tab === 'info' || tab === 'tech' || tab === 'settings') return 'more';
  return tab as NavTab;
}

export function App() {
  const stored = localStorage.getItem('showrunner_viewer') as Viewer | null;
  const [viewer, setViewer] = useState<Viewer | null>(
    stored === 'Dan' || stored === 'Jacob' || stored === 'Steph' ? stored : null
  );
  const [tab, setTab] = useState<Tab>('timeline');
  const [moreOpen, setMoreOpen] = useState(false);

  if (!viewer) return <ViewerPicker onSelect={setViewer} />;

  const viewerMeta = VIEWERS.find(v => v.name === viewer)!;
  const activeNav = tabToNav(tab);

  function goTab(t: Tab) {
    setTab(t);
    setMoreOpen(false);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          <h1>ShowRunner</h1>
          <span>Monmouthshire Show · 16 Aug</span>
        </div>
        <button className="viewer-badge" onClick={() => { localStorage.removeItem('showrunner_viewer'); setViewer(null); }} title="Switch viewer">
          <span>{viewerMeta.emoji}</span>
          <span>{viewer}</span>
        </button>
      </header>

      <main className="app-main">
        {tab === 'timeline' && <Timeline viewer={viewer} />}
        {tab === 'acts'     && <Acts viewer={viewer} />}
        {tab === 'tasks'    && <Tasks viewer={viewer} />}
        {tab === 'emails'   && <Emails />}
        {tab === 'info'     && <Info />}
        {tab === 'tech'     && <TechSheet />}
        {tab === 'settings' && <SettingsTab />}
      </main>

      {/* More sheet backdrop */}
      {moreOpen && (
        <div className="more-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="more-sheet" onClick={e => e.stopPropagation()}>
            <div className="more-sheet-handle" />
            <MoreItem icon={<IcoInfo />} label="Show Info & Notes" active={tab === 'info'} onClick={() => goTab('info')} />
            <MoreItem icon={<IcoTech />} label="Tech Sheet" active={tab === 'tech'} onClick={() => goTab('tech')} />
            <MoreItem icon={<IcoSettings />} label="Settings" active={tab === 'settings'} onClick={() => goTab('settings')} />
          </div>
        </div>
      )}

      <nav className="bottom-nav" role="navigation">
        <NavBtn icon={<IcoTimeline />} label="Timeline" active={activeNav === 'timeline'} onClick={() => { setMoreOpen(false); setTab('timeline'); }} />
        <NavBtn icon={<IcoMic />}      label="Acts"     active={activeNav === 'acts'}     onClick={() => { setMoreOpen(false); setTab('acts'); }} />
        <NavBtn icon={<IcoCheck />}    label="Tasks"    active={activeNav === 'tasks'}    onClick={() => { setMoreOpen(false); setTab('tasks'); }} />
        <NavBtn icon={<IcoMail />}     label="Emails"   active={activeNav === 'emails'}   onClick={() => { setMoreOpen(false); setTab('emails'); }} />
        <NavBtn icon={<IcoMore />}     label="More"     active={activeNav === 'more' || moreOpen} onClick={() => setMoreOpen(v => !v)} />
      </nav>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`nav-btn ${active ? 'active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}>
      {icon}{label}
    </button>
  );
}

function MoreItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`more-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="more-item-icon">{icon}</span>
      <span className="more-item-label">{label}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 14, height: 14, opacity: 0.35, marginLeft: 'auto' }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}
