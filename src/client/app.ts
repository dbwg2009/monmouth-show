// ShowRunner — Phase 1 placeholder
// Full SPA implemented in Phase 4.

const VIEWER_KEY = 'showrunner_viewer';
type Viewer = 'Dan' | 'Jacob' | 'Steph';
const VIEWERS: readonly Viewer[] = ['Dan', 'Jacob', 'Steph'] as const;

function getViewer(): Viewer | null {
  const raw = localStorage.getItem(VIEWER_KEY);
  return raw && (VIEWERS as readonly string[]).includes(raw) ? (raw as Viewer) : null;
}

function setViewer(v: Viewer) {
  localStorage.setItem(VIEWER_KEY, v);
}

function renderPersonSelect(root: HTMLElement) {
  root.innerHTML = `
    <div class="person-select">
      <h1 class="person-select__title">ShowRunner</h1>
      <p class="person-select__sub">Monmouthshire Show · Band Stand · 16 Aug 2026</p>
      <p class="person-select__prompt">Who are you?</p>
      <div class="person-select__buttons">
        <button class="btn btn--person" data-viewer="Dan">Dan</button>
        <button class="btn btn--person" data-viewer="Jacob">Jacob</button>
        <button class="btn btn--person" data-viewer="Steph">Steph</button>
      </div>
    </div>
  `;
  root.querySelectorAll('[data-viewer]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const viewer = (btn as HTMLButtonElement).dataset['viewer'] as Viewer;
      setViewer(viewer);
      renderDashboard(root, viewer);
    });
  });
}

function renderDashboard(root: HTMLElement, viewer: Viewer) {
  root.innerHTML = `
    <div class="dashboard">
      <header class="topbar">
        <span class="topbar__title">ShowRunner</span>
        <span class="topbar__viewer">${viewer}</span>
        <button class="topbar__switch" id="switchViewer">Switch</button>
      </header>
      <main class="main-content">
        <p style="padding:1.5rem;color:#666">
          Dashboard coming in Phase 4.<br>
          API health: <span id="health">checking…</span>
        </p>
      </main>
    </div>
  `;
  document.getElementById('switchViewer')?.addEventListener('click', () => {
    localStorage.removeItem(VIEWER_KEY);
    renderPersonSelect(root);
  });

  fetch('/api/health')
    .then((r) => r.json())
    .then((d: { ok: boolean; version?: string }) => {
      const el = document.getElementById('health');
      if (el) el.textContent = d.ok ? `✓ v${d.version ?? '?'}` : '✗ error';
    })
    .catch(() => {
      const el = document.getElementById('health');
      if (el) el.textContent = '✗ unreachable';
    });
}

function init() {
  const root = document.getElementById('app');
  if (!root) return;
  const viewer = getViewer();
  if (viewer) {
    renderDashboard(root, viewer);
  } else {
    renderPersonSelect(root);
  }
}

init();
