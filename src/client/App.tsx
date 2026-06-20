import { useState } from 'react';
import type { Viewer } from '../types.ts';
import { useStore } from './store.tsx';
import { Icon } from './ui.tsx';
import { Home } from './Home.tsx';
import { RunningOrder } from './RunningOrder.tsx';
import { Acts } from './Acts.tsx';
import { Contacts } from './Contacts.tsx';
import { Tasks } from './Tasks.tsx';
import { Chase } from './Chase.tsx';
import { Walkaround } from './Walkaround.tsx';
import { SiteMap } from './SiteMap.tsx';
import { Scratchpad } from './Scratchpad.tsx';
import { Emails } from './Emails.tsx';
import { LearningTrack } from './LearningTrack.tsx';
import { StagePlot } from './StagePlot.tsx';
import { Settings } from './Settings.tsx';

type Tab = 'home' | 'running' | 'acts' | 'contacts'
  | 'tasks' | 'chase' | 'walkaround' | 'sitemap' | 'scratchpad' | 'emails'
  | 'learning' | 'stageplot' | 'settings';

const VIEWERS: { name: Viewer; role: string; initials: string }[] = [
  { name: 'Dan',   role: 'Tech Manager',         initials: 'D' },
  { name: 'Jacob', role: 'Stage Manager',        initials: 'J' },
  { name: 'Steph', role: 'Show Chair & Liaison', initials: 'S' },
];

const PRIMARY: { id: Tab; label: string; icon: string }[] = [
  { id: 'home',     label: 'Today',   icon: 'home' },
  { id: 'running',  label: 'Order',   icon: 'music' },
  { id: 'acts',     label: 'Acts',    icon: 'mic' },
  { id: 'contacts', label: 'Contacts', icon: 'users' },
];

const MORE: { id: Tab; label: string; icon: string; hint: string; danOnly?: boolean }[] = [
  { id: 'chase',      label: 'Chase list',     icon: 'list',  hint: 'Outstanding info to collect' },
  { id: 'tasks',      label: 'Tasks',          icon: 'check', hint: 'Shared to-do checklist' },
  { id: 'walkaround', label: 'Walk-around',    icon: 'note',  hint: 'Site walk notes with BSB' },
  { id: 'sitemap',    label: 'Site map',       icon: 'map',   hint: 'Band Stand & key locations' },
  { id: 'scratchpad', label: 'Scratchpad',     icon: 'edit',  hint: 'Shared notes' },
  { id: 'emails',     label: 'Emails',         icon: 'mail',  hint: 'Synced act email threads' },
  { id: 'learning',   label: 'Learning track', icon: 'graduation', hint: 'Live-sound skills to build', danOnly: true },
  { id: 'stageplot',  label: 'Stage plot',     icon: 'sliders',    hint: 'Input-list template',        danOnly: true },
  { id: 'settings',   label: 'Settings',       icon: 'settings', hint: 'Sync, export, account' },
];

function ViewerPicker({ onPick }: { onPick: (v: Viewer) => void }) {
  return (
    <div className="picker">
      <div className="picker-badge"><Icon name="music" size={30} /></div>
      <h1 className="picker-title">Band Stand</h1>
      <p className="picker-sub">Monmouthshire Show · Sunday 16 August 2026</p>
      <div className="picker-q">Who are you?</div>
      <div className="picker-cards">
        {VIEWERS.map((v) => (
          <button key={v.name} className="picker-card" onClick={() => onPick(v.name)}>
            <span className="picker-avatar">{v.initials}</span>
            <span className="picker-info">
              <strong>{v.name}</strong>
              <span>{v.role}</span>
            </span>
            <Icon name="chevron" size={18} className="picker-go" />
          </button>
        ))}
      </div>
    </div>
  );
}

function SyncDot() {
  const { online, pending } = useStore();
  const state = !online ? 'offline' : pending > 0 ? 'pending' : 'ok';
  const label = state === 'offline' ? 'Offline' : state === 'pending' ? `Syncing ${pending}` : 'Synced';
  return (
    <span className={`sync-dot sync-${state}`} title={label}>
      {state === 'offline' ? <Icon name="wifiOff" size={15} /> : <span className="dot" />}
      <span className="sync-label">{label}</span>
    </span>
  );
}

export function App() {
  const { viewer, setViewer } = useStore();
  const [tab, setTab] = useState<Tab>('home');
  const [moreOpen, setMoreOpen] = useState(false);

  if (!viewer) return <ViewerPicker onPick={(v) => setViewer(v)} />;

  const me = VIEWERS.find((v) => v.name === viewer);
  if (!me) return <ViewerPicker onPick={(v) => setViewer(v)} />;
  const moreItems = MORE.filter((m) => !m.danOnly || viewer === 'Dan');
  const inMore = moreItems.some((m) => m.id === tab);

  const go = (t: Tab) => { setTab(t); setMoreOpen(false); };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-l">
          <div className="topbar-mark"><Icon name="music" size={18} /></div>
          <div className="topbar-title">
            <strong>Band Stand</strong>
            <span>Monmouthshire Show · 16 Aug</span>
          </div>
        </div>
        <div className="topbar-r">
          <SyncDot />
          <button className="me-badge" onClick={() => go('settings')} title="You — tap for settings">
            <span className="me-avatar">{me.initials}</span>
          </button>
        </div>
      </header>

      <main className="content">
        {tab === 'home'       && <Home goTo={go} />}
        {tab === 'running'    && <RunningOrder />}
        {tab === 'acts'       && <Acts />}
        {tab === 'contacts'   && <Contacts />}
        {tab === 'tasks'      && <Tasks />}
        {tab === 'chase'      && <Chase />}
        {tab === 'walkaround' && <Walkaround />}
        {tab === 'sitemap'    && <SiteMap />}
        {tab === 'scratchpad' && <Scratchpad />}
        {tab === 'emails'     && <Emails />}
        {tab === 'learning'   && <LearningTrack />}
        {tab === 'stageplot'  && <StagePlot />}
        {tab === 'settings'   && <Settings />}
      </main>

      {moreOpen && (
        <div className="sheet-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-grid">
              {moreItems.map((m) => (
                <button key={m.id} className={`sheet-item ${tab === m.id ? 'active' : ''}`} onClick={() => go(m.id)}>
                  <span className="sheet-ico"><Icon name={m.icon} size={20} /></span>
                  <span className="sheet-text"><strong>{m.label}</strong><span>{m.hint}</span></span>
                  <Icon name="chevron" size={16} className="sheet-go" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="tabbar">
        {PRIMARY.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => go(t.id)}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </button>
        ))}
        <button className={`tab ${inMore || moreOpen ? 'active' : ''}`} onClick={() => setMoreOpen((v) => !v)}>
          <Icon name="more" size={22} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
