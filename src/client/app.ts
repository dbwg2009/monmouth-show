// ShowRunner — Phase 4 SPA
// Vanilla TypeScript, no framework, mobile-first, dark theme

import type {
  Viewer, Act, TimelineSlot, Task, EmailThread, EmailMessage,
} from '@/types.ts';

// ── Constants ────────────────────────────────────────────────────────────────

const VIEWER_KEY = 'showrunner_viewer';
const VIEWERS: readonly Viewer[] = ['Dan', 'Jacob', 'Steph'] as const;
type Tab = 'timeline' | 'acts' | 'tasks' | 'emails' | 'settings';

// ── Viewer helpers ───────────────────────────────────────────────────────────

function getViewer(): Viewer | null {
  const raw = localStorage.getItem(VIEWER_KEY);
  return raw && (VIEWERS as readonly string[]).includes(raw) ? (raw as Viewer) : null;
}

function setViewer(v: Viewer): void {
  localStorage.setItem(VIEWER_KEY, v);
}

function clearViewer(): void {
  localStorage.removeItem(VIEWER_KEY);
}

// ── API helpers ──────────────────────────────────────────────────────────────

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { ok: boolean; data: T };
  if (!json.ok) throw new Error('API error');
  return json.data;
}

async function patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return api<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

// ── DOM helpers ──────────────────────────────────────────────────────────────

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  }
  return e;
}

function txt(s: string | null | undefined): string {
  return s ?? '';
}

function showError(container: HTMLElement, msg: string): void {
  const err = el('div', { class: 'inline-error' });
  err.textContent = msg;
  container.prepend(err);
  setTimeout(() => err.remove(), 4000);
}

function spinner(): HTMLElement {
  const d = el('div', { class: 'spinner-wrap' });
  d.innerHTML = '<div class="spinner" aria-label="Loading…"></div>';
  return d;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function isToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).toDateString() === new Date().toDateString();
}

// ── App state ────────────────────────────────────────────────────────────────

let currentViewer: Viewer | null = null;
let currentTab: Tab = 'timeline';
let root: HTMLElement | null = null;
let mainContent: HTMLElement | null = null;
let tabBar: HTMLElement | null = null;

// ── Person-select screen ─────────────────────────────────────────────────────

function renderPersonSelect(): void {
  if (!root) return;
  root.innerHTML = '';
  const screen = el('div', { class: 'person-select' });

  const title = el('h1', { class: 'person-select__title' }, 'ShowRunner');
  const sub = el('p', { class: 'person-select__sub' }, 'Monmouthshire Show · 16 Aug 2026');
  const prompt = el('p', { class: 'person-select__prompt' }, 'Who are you?');
  const buttons = el('div', { class: 'person-select__buttons' });

  for (const v of VIEWERS) {
    const btn = el('button', { class: 'btn btn--person', 'data-viewer': v }, v);
    btn.addEventListener('click', () => {
      setViewer(v);
      currentViewer = v;
      renderApp();
    });
    buttons.appendChild(btn);
  }

  screen.append(title, sub, prompt, buttons);
  root.appendChild(screen);
}

// ── Dashboard shell ──────────────────────────────────────────────────────────

function getAvailableTabs(viewer: Viewer): Tab[] {
  const tabs: Tab[] = ['timeline', 'acts', 'tasks'];
  if (viewer === 'Dan') tabs.push('emails', 'settings');
  return tabs;
}

function tabLabel(tab: Tab): string {
  return { timeline: '⏱ Timeline', acts: '🎸 Acts', tasks: '✅ Tasks', emails: '📧 Emails', settings: '⚙️ Settings' }[tab];
}

function renderApp(): void {
  if (!root || !currentViewer) return;
  root.innerHTML = '';

  const viewer = currentViewer;
  const availTabs = getAvailableTabs(viewer);

  // Topbar
  const topbar = el('header', { class: 'topbar' });
  const titleEl = el('span', { class: 'topbar__title' }, 'ShowRunner');
  const viewerEl = el('span', { class: 'topbar__viewer' }, viewer);
  const switchBtn = el('button', { class: 'topbar__switch' }, 'Switch');
  switchBtn.addEventListener('click', () => {
    clearViewer();
    currentViewer = null;
    renderPersonSelect();
  });
  topbar.append(titleEl, viewerEl, switchBtn);

  // Main content
  mainContent = el('main', { class: 'main-content', id: 'main-content' });

  // Tab bar
  tabBar = el('nav', { class: 'tab-bar', 'aria-label': 'Navigation' });
  for (const tab of availTabs) {
    const btn = el('button', { class: `tab-item${currentTab === tab ? ' tab-item--active' : ''}`, 'data-tab': tab });
    btn.textContent = tabLabel(tab);
    btn.addEventListener('click', () => switchTab(tab));
    tabBar.appendChild(btn);
  }

  root.append(topbar, mainContent, tabBar);

  // Default tab — if current isn't available, reset
  if (!availTabs.includes(currentTab)) currentTab = 'timeline';
  loadTab(currentTab);
}

function switchTab(tab: Tab): void {
  currentTab = tab;
  tabBar?.querySelectorAll('.tab-item').forEach((b) => {
    b.classList.toggle('tab-item--active', (b as HTMLElement).dataset['tab'] === tab);
  });
  loadTab(tab);
}

function loadTab(tab: Tab): void {
  if (!mainContent || !currentViewer) return;
  mainContent.innerHTML = '';
  switch (tab) {
    case 'timeline': renderTimeline(mainContent, currentViewer); break;
    case 'acts':     renderActs(mainContent, currentViewer); break;
    case 'tasks':    renderTasks(mainContent, currentViewer); break;
    case 'emails':   renderEmails(mainContent, currentViewer); break;
    case 'settings': renderSettings(mainContent, currentViewer); break;
  }
}

// ── Timeline tab ─────────────────────────────────────────────────────────────

function renderTimeline(container: HTMLElement, viewer: Viewer): void {
  container.appendChild(el('h2', { class: 'tab-heading' }, 'Timeline'));
  const spin = spinner();
  container.appendChild(spin);

  api<TimelineSlot[]>('/api/timeline').then((slots) => {
    spin.remove();
    const now = new Date();
    const isShowDay = now.toISOString().startsWith('2026-08-16');

    const list = el('div', { class: 'timeline-list' });
    for (const slot of slots) {
      list.appendChild(buildTimelineRow(slot, viewer, isShowDay, now, list));
    }
    container.appendChild(list);
  }).catch(() => {
    spin.remove();
    showError(container, 'Failed to load timeline');
  });
}

function buildTimelineRow(
  slot: TimelineSlot,
  viewer: Viewer,
  isShowDay: boolean,
  now: Date,
  list: HTMLElement,
): HTMLElement {
  const startDt = new Date(`2026-08-16T${slot.startTime}`);
  const endDt   = new Date(`2026-08-16T${slot.endTime}`);
  const isCurrent = isShowDay && now >= startDt && now < endDt;
  const isNext    = isShowDay && !isCurrent && now < startDt;

  const row = el('div', {
    class: `timeline-row${slot.isGap ? ' timeline-row--gap' : ''}${isCurrent ? ' timeline-row--now' : ''}`,
    'data-slot-id': String(slot.id),
  });

  const timeEl = el('span', { class: 'timeline-time' }, `${slot.startTime} – ${slot.endTime}`);
  const nameEl = el('span', { class: 'timeline-name' }, txt(slot.actName));

  const badges = el('span', { class: 'timeline-badges' });
  if (slot.isGap) badges.appendChild(el('span', { class: 'badge badge--gap' }, 'Gap'));
  if (isCurrent) badges.appendChild(el('span', { class: 'badge badge--now' }, '▶ Now'));
  if (isNext)    badges.appendChild(el('span', { class: 'badge badge--next' }, 'Next'));

  const expandBtn = el('button', { class: 'timeline-expand-btn', 'aria-label': 'Edit slot' }, '✏️');

  const header = el('div', { class: 'timeline-row__header' });
  header.append(timeEl, nameEl, badges, expandBtn);
  row.appendChild(header);

  // Inline edit form (hidden by default)
  const form = buildTimelineEditForm(slot, viewer, row, list);
  form.style.display = 'none';
  row.appendChild(form);

  expandBtn.addEventListener('click', () => {
    const open = form.style.display !== 'none';
    form.style.display = open ? 'none' : 'block';
    expandBtn.textContent = open ? '✏️' : '✖';
  });

  return row;
}

function buildTimelineEditForm(
  slot: TimelineSlot,
  viewer: Viewer,
  row: HTMLElement,
  list: HTMLElement,
): HTMLElement {
  const form = el('div', { class: 'inline-form' });

  const startInput  = el('input', { class: 'form-input', type: 'time', value: slot.startTime });
  const endInput    = el('input', { class: 'form-input', type: 'time', value: slot.endTime });
  const nameInput   = el('input', { class: 'form-input', type: 'text', value: txt(slot.actName), placeholder: 'Act name' });

  const gapLabel = el('label', { class: 'form-check' });
  const gapCheck = el('input', { type: 'checkbox' });
  if (slot.isGap) gapCheck.setAttribute('checked', '');
  (gapCheck as HTMLInputElement).checked = slot.isGap;
  gapLabel.append(gapCheck, document.createTextNode(' Is gap'));

  const saveBtn = el('button', { class: 'btn btn--primary btn--sm' }, 'Save');

  form.append(
    el('label', { class: 'form-label' }, 'Start'),
    startInput,
    el('label', { class: 'form-label' }, 'End'),
    endInput,
    el('label', { class: 'form-label' }, 'Name'),
    nameInput,
    gapLabel,
    saveBtn,
  );

  saveBtn.addEventListener('click', async () => {
    saveBtn.setAttribute('disabled', '');
    try {
      await patch(`/api/timeline/${slot.id}`, {
        startTime: (startInput as HTMLInputElement).value,
        endTime:   (endInput as HTMLInputElement).value,
        actName:   (nameInput as HTMLInputElement).value,
        isGap:     (gapCheck as HTMLInputElement).checked,
        updatedBy: viewer,
      });
      // Re-render timeline
      const parent = list.parentElement;
      if (parent) {
        list.remove();
        renderTimeline(parent, viewer);
      }
    } catch {
      showError(form, 'Save failed');
      saveBtn.removeAttribute('disabled');
    }
  });

  return form;
}

// ── Acts tab ─────────────────────────────────────────────────────────────────

function renderActs(container: HTMLElement, viewer: Viewer): void {
  container.appendChild(el('h2', { class: 'tab-heading' }, 'Acts & Tech'));
  const spin = spinner();
  container.appendChild(spin);

  api<Act[]>('/api/acts').then((acts) => {
    spin.remove();
    const list = el('div', { class: 'acts-list' });
    for (const act of acts) {
      list.appendChild(buildActCard(act, viewer, list));
    }
    container.appendChild(list);
  }).catch(() => {
    spin.remove();
    showError(container, 'Failed to load acts');
  });
}

function buildActCard(act: Act, viewer: Viewer, list: HTMLElement): HTMLElement {
  const card = el('div', { class: 'act-card', 'data-act-id': String(act.id) });

  // Header row
  const header = el('div', { class: 'act-card__header' });
  const name   = el('span', { class: 'act-card__name' }, txt(act.name));
  const badge  = el('span', {
    class: `badge ${act.confirmed ? 'badge--confirmed' : 'badge--unconfirmed'}`,
  }, act.confirmed ? 'Confirmed' : 'Unconfirmed');
  const expandBtn = el('button', { class: 'act-expand-btn', 'aria-label': 'Toggle details' }, '▼');
  header.append(name, badge, expandBtn);
  card.appendChild(header);

  // Details panel (hidden by default)
  const details = el('div', { class: 'act-card__details' });
  details.style.display = 'none';
  buildActDetails(act, viewer, details, list);
  card.appendChild(details);

  expandBtn.addEventListener('click', () => {
    const open = details.style.display !== 'none';
    details.style.display = open ? 'none' : 'block';
    expandBtn.textContent = open ? '▼' : '▲';
  });

  return card;
}

function buildActDetails(act: Act, viewer: Viewer, details: HTMLElement, list: HTMLElement): void {
  details.innerHTML = '';

  const rows: [string, string][] = [
    ['Contact', txt(act.contactName)],
    ['Email', txt(act.contactEmail)],
    ['Email 2', txt(act.contactEmail2)],
    ['Phone', txt(act.contactPhone)],
    ['Website', txt(act.websiteUrl)],
    ['PA needed', act.needsPA ? 'Yes' : 'No'],
    ['Mics', String(act.micCount)],
    ['Seats', act.needsSeats ? `Yes — ${txt(act.seatsNotes)}` : 'No'],
    ['Power', txt(act.powerSockets)],
    ['Setup time', `${act.setupMins} min`],
    ['Performers', txt(act.performerCount)],
    ['Fee', act.feePence != null ? `£${(act.feePence / 100).toFixed(2)}` : '—'],
  ];

  const dl = el('dl', { class: 'act-detail-list' });
  for (const [k, v] of rows) {
    if (!v || v === '0' && k === 'Mics') continue;
    const dt = el('dt', {}, k);
    const dd = el('dd', {}, v || '—');
    dl.append(dt, dd);
  }
  details.appendChild(dl);

  // Notes inline editor
  const notesLabel = el('label', { class: 'form-label' }, 'Notes');
  const notesArea  = el('textarea', { class: 'form-input form-input--textarea', placeholder: 'Add notes…' });
  (notesArea as HTMLTextAreaElement).value = txt(act.notes);
  const notesBtn = el('button', { class: 'btn btn--secondary btn--sm' }, 'Save notes');

  notesBtn.addEventListener('click', async () => {
    notesBtn.setAttribute('disabled', '');
    try {
      await patch(`/api/acts/${act.id}`, {
        notes: (notesArea as HTMLTextAreaElement).value,
        updatedBy: viewer,
      });
      notesBtn.textContent = 'Saved ✓';
      setTimeout(() => { notesBtn.textContent = 'Save notes'; }, 2000);
    } catch {
      showError(details, 'Save failed');
    } finally {
      notesBtn.removeAttribute('disabled');
    }
  });

  details.append(notesLabel, notesArea, notesBtn);

  // Confirmed toggle (Dan only)
  if (viewer === 'Dan') {
    const toggleBtn = el('button', {
      class: `btn btn--sm ${act.confirmed ? 'btn--secondary' : 'btn--primary'}`,
    }, act.confirmed ? 'Mark unconfirmed' : 'Mark confirmed');

    toggleBtn.addEventListener('click', async () => {
      toggleBtn.setAttribute('disabled', '');
      try {
        await patch(`/api/acts/${act.id}`, { confirmed: !act.confirmed, updatedBy: viewer });
        // Refresh card by reloading list
        const parent = list.parentElement;
        if (parent) {
          list.remove();
          renderActs(parent, viewer);
        }
      } catch {
        showError(details, 'Save failed');
        toggleBtn.removeAttribute('disabled');
      }
    });

    details.appendChild(toggleBtn);
  }
}

// ── Tasks tab ────────────────────────────────────────────────────────────────

type TaskFilter = 'all' | 'mine' | 'undone';

let taskFilter: TaskFilter = 'all';

function renderTasks(container: HTMLElement, viewer: Viewer): void {
  container.appendChild(el('h2', { class: 'tab-heading' }, 'Tasks'));

  // Filter chips
  const chips = el('div', { class: 'filter-chips' });
  const chipDefs: [TaskFilter, string][] = [['all', 'All'], ['mine', 'Mine'], ['undone', 'Undone']];
  for (const [f, label] of chipDefs) {
    const chip = el('button', { class: `chip${taskFilter === f ? ' chip--active' : ''}`, 'data-filter': f }, label);
    chip.addEventListener('click', () => {
      taskFilter = f;
      chips.querySelectorAll('.chip').forEach((c) => {
        c.classList.toggle('chip--active', (c as HTMLElement).dataset['filter'] === f);
      });
      loadTaskList(container, viewer);
    });
    chips.appendChild(chip);
  }
  container.appendChild(chips);

  // Add task (Dan only)
  if (viewer === 'Dan') {
    const addBtn = el('button', { class: 'btn btn--primary btn--sm tasks-add-btn' }, '+ Add task');
    addBtn.addEventListener('click', () => {
      const existing = container.querySelector('.add-task-form');
      if (existing) { existing.remove(); return; }
      container.appendChild(buildAddTaskForm(viewer, container));
    });
    container.appendChild(addBtn);
  }

  loadTaskList(container, viewer);
}

function loadTaskList(container: HTMLElement, viewer: Viewer): void {
  const existing = container.querySelector('.task-groups');
  if (existing) existing.remove();
  const spin = spinner();
  container.appendChild(spin);

  api<Task[]>('/api/tasks').then((tasks) => {
    spin.remove();

    // Apply filter
    let filtered = tasks;
    if (taskFilter === 'mine') filtered = tasks.filter((t) => t.assignee === viewer);
    if (taskFilter === 'undone') filtered = tasks.filter((t) => !t.done);

    const groups = el('div', { class: 'task-groups' });

    const overdue   = filtered.filter((t) => !t.done && isOverdue(t.dueDate));
    const today     = filtered.filter((t) => !t.done && !isOverdue(t.dueDate) && isToday(t.dueDate));
    const upcoming  = filtered.filter((t) => !t.done && !isOverdue(t.dueDate) && !isToday(t.dueDate));
    const done      = filtered.filter((t) => t.done);

    if (overdue.length)  groups.appendChild(buildTaskGroup('Overdue',  overdue,  viewer, container, 'group--overdue'));
    if (today.length)    groups.appendChild(buildTaskGroup('Today',    today,    viewer, container, ''));
    if (upcoming.length) groups.appendChild(buildTaskGroup('Upcoming', upcoming, viewer, container, ''));
    if (done.length)     groups.appendChild(buildTaskGroup('Done',     done,     viewer, container, 'group--done'));

    if (!filtered.length) {
      const empty = el('p', { class: 'empty-state' }, 'No tasks to show.');
      groups.appendChild(empty);
    }

    container.appendChild(groups);
  }).catch(() => {
    spin.remove();
    showError(container, 'Failed to load tasks');
  });
}

function buildTaskGroup(title: string, tasks: Task[], viewer: Viewer, container: HTMLElement, cls: string): HTMLElement {
  const group = el('div', { class: `task-group ${cls}`.trim() });
  const heading = el('h3', { class: 'task-group__heading' }, title);
  group.appendChild(heading);

  for (const task of tasks) {
    group.appendChild(buildTaskRow(task, viewer, container));
  }
  return group;
}

function buildTaskRow(task: Task, viewer: Viewer, container: HTMLElement): HTMLElement {
  const row = el('div', { class: `task-row${task.done ? ' task-row--done' : ''}` });

  const checkbox = el('input', { type: 'checkbox', class: 'task-checkbox', 'aria-label': `Mark "${task.title}" done` });
  (checkbox as HTMLInputElement).checked = task.done;

  checkbox.addEventListener('change', async () => {
    const checked = (checkbox as HTMLInputElement).checked;
    try {
      await patch(`/api/tasks/${task.id}`, { done: checked, doneBy: checked ? viewer : null, updatedBy: viewer });
      loadTaskList(container, viewer);
    } catch {
      showError(row, 'Save failed');
      (checkbox as HTMLInputElement).checked = !checked;
    }
  });

  const info = el('div', { class: 'task-info' });
  const titleEl = el('span', { class: 'task-title' }, txt(task.title));
  info.appendChild(titleEl);

  const meta = el('div', { class: 'task-meta' });
  if (task.assignee) {
    meta.appendChild(el('span', { class: 'chip chip--sm' }, txt(task.assignee)));
  }
  if (task.dueDate) {
    const dueCls = isOverdue(task.dueDate) && !task.done ? 'task-due task-due--overdue' : 'task-due';
    meta.appendChild(el('span', { class: dueCls }, formatDate(task.dueDate)));
  }
  if (meta.children.length) info.appendChild(meta);

  row.append(checkbox, info);
  return row;
}

function buildAddTaskForm(viewer: Viewer, container: HTMLElement): HTMLElement {
  const form = el('div', { class: 'inline-form add-task-form' });

  const titleInput  = el('input', { class: 'form-input', type: 'text', placeholder: 'Task title' });
  const assignSel   = el('select', { class: 'form-input' });
  const emptyOpt    = el('option', { value: '' }, 'No assignee');
  assignSel.appendChild(emptyOpt);
  for (const v of VIEWERS) {
    const opt = el('option', { value: v }, v);
    assignSel.appendChild(opt);
  }
  const dueInput = el('input', { class: 'form-input', type: 'date' });
  const saveBtn  = el('button', { class: 'btn btn--primary btn--sm' }, 'Add task');
  const cancelBtn = el('button', { class: 'btn btn--secondary btn--sm' }, 'Cancel');

  cancelBtn.addEventListener('click', () => form.remove());

  saveBtn.addEventListener('click', async () => {
    const title = (titleInput as HTMLInputElement).value.trim();
    if (!title) { showError(form, 'Title required'); return; }
    saveBtn.setAttribute('disabled', '');
    try {
      await post('/api/tasks', {
        title,
        assignee: (assignSel as HTMLSelectElement).value || null,
        dueDate:  (dueInput as HTMLInputElement).value || null,
        updatedBy: viewer,
      });
      form.remove();
      loadTaskList(container, viewer);
    } catch {
      showError(form, 'Failed to add task');
      saveBtn.removeAttribute('disabled');
    }
  });

  form.append(
    el('label', { class: 'form-label' }, 'Title'),
    titleInput,
    el('label', { class: 'form-label' }, 'Assignee'),
    assignSel,
    el('label', { class: 'form-label' }, 'Due date'),
    dueInput,
    saveBtn,
    cancelBtn,
  );

  return form;
}

// ── Emails tab ───────────────────────────────────────────────────────────────

function renderEmails(container: HTMLElement, viewer: Viewer): void {
  if (viewer !== 'Dan') {
    container.appendChild(el('p', { class: 'empty-state' }, 'Emails visible to Dan only.'));
    return;
  }

  container.appendChild(el('h2', { class: 'tab-heading' }, 'Emails'));
  const spin = spinner();
  container.appendChild(spin);

  api<EmailThread[]>('/api/emails').then((threads) => {
    spin.remove();
    if (!threads.length) {
      container.appendChild(el('p', { class: 'empty-state' }, 'No emails synced yet — Gmail sync runs every 15 min.'));
      return;
    }

    const sorted = [...threads].sort((a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );

    const list = el('div', { class: 'email-list' });
    for (const thread of sorted) {
      list.appendChild(buildEmailRow(thread, list));
    }
    container.appendChild(list);
  }).catch(() => {
    spin.remove();
    showError(container, 'Failed to load emails');
  });
}

function buildEmailRow(thread: EmailThread, list: HTMLElement): HTMLElement {
  const row = el('div', { class: 'email-row' });

  const header = el('div', { class: 'email-row__header' });
  const subject = el('span', { class: 'email-subject' });
  subject.textContent = txt(thread.subject);
  const time = el('span', { class: 'email-time' }, relativeTime(thread.lastMessageAt));
  header.append(subject, time);

  const participants = el('div', { class: 'email-participants' });
  participants.textContent = txt(thread.participants);

  const snippet = el('div', { class: 'email-snippet' });
  snippet.textContent = txt(thread.snippet);

  row.append(header, participants, snippet);

  // Messages panel
  const messages = el('div', { class: 'email-messages' });
  messages.style.display = 'none';
  row.appendChild(messages);

  row.addEventListener('click', () => {
    const open = messages.style.display !== 'none';
    if (open) {
      messages.style.display = 'none';
      row.classList.remove('email-row--open');
      return;
    }
    messages.style.display = 'block';
    row.classList.add('email-row--open');
    if (messages.children.length) return; // already loaded

    const s = spinner();
    messages.appendChild(s);

    api<{ thread: EmailThread; messages: EmailMessage[] }>(`/api/emails/${thread.id}`)
      .then(({ messages: msgs }) => {
        s.remove();
        for (const msg of msgs) {
          messages.appendChild(buildEmailMessage(msg));
        }
      })
      .catch(() => {
        s.remove();
        showError(messages, 'Failed to load messages');
      });
  });

  return row;
}

function buildEmailMessage(msg: EmailMessage): HTMLElement {
  const wrap = el('div', { class: 'email-message' });

  const meta = el('div', { class: 'email-message__meta' });
  const from = el('span', { class: 'email-from' });
  from.textContent = `From: ${msg.fromAddr}`;
  const date = el('span', { class: 'email-date' }, formatDate(msg.sentAt));
  meta.append(from, date);

  const body = el('div', { class: 'email-body' });

  if (msg.bodyText) {
    body.textContent = msg.bodyText;
  } else if (msg.bodyHtml) {
    // Sandbox iframe for HTML bodies
    const iframe = el('iframe', {
      class: 'email-iframe',
      sandbox: 'allow-same-origin',
      title: 'Email body',
    });
    wrap.append(meta, body);
    // Append first, then set srcdoc (some browsers need element in DOM)
    (iframe as HTMLIFrameElement).srcdoc = msg.bodyHtml;
    body.appendChild(iframe);
    return wrap;
  } else {
    body.textContent = '(No body)';
  }

  wrap.append(meta, body);
  return wrap;
}

// ── Settings tab ─────────────────────────────────────────────────────────────

function renderSettings(container: HTMLElement, viewer: Viewer): void {
  if (viewer !== 'Dan') {
    container.appendChild(el('p', { class: 'empty-state' }, 'Settings visible to Dan only.'));
    return;
  }

  container.appendChild(el('h2', { class: 'tab-heading' }, 'Settings'));
  const spin = spinner();
  container.appendChild(spin);

  api<Record<string, string>>('/api/settings').then((settings) => {
    spin.remove();

    const form = el('div', { class: 'settings-form' });

    // gmail_label
    const labelLabel = el('label', { class: 'form-label', for: 'setting-gmail-label' }, 'Gmail label');
    const labelInput = el('input', {
      class: 'form-input',
      id: 'setting-gmail-label',
      type: 'text',
      value: settings['gmail_label'] ?? '',
      placeholder: 'e.g. ShowRunner',
    });
    const labelBtn = el('button', { class: 'btn btn--secondary btn--sm' }, 'Save');

    labelBtn.addEventListener('click', async () => {
      labelBtn.setAttribute('disabled', '');
      try {
        await patch('/api/settings/gmail_label', { value: (labelInput as HTMLInputElement).value });
        labelBtn.textContent = 'Saved ✓';
        setTimeout(() => { labelBtn.textContent = 'Save'; }, 2000);
      } catch {
        showError(form, 'Save failed');
      } finally {
        labelBtn.removeAttribute('disabled');
      }
    });

    // gmail_contacts — stored as comma-separated, displayed as one-per-line
    const contactsLabel = el('label', { class: 'form-label', for: 'setting-gmail-contacts' }, 'Gmail contacts (one per line)');
    const raw = settings['gmail_contacts'] ?? '';
    const contactsArea = el('textarea', {
      class: 'form-input form-input--textarea',
      id: 'setting-gmail-contacts',
      placeholder: 'email@example.com',
      rows: '5',
    });
    (contactsArea as HTMLTextAreaElement).value = raw.split(',').map((s) => s.trim()).filter(Boolean).join('\n');

    const contactsBtn = el('button', { class: 'btn btn--secondary btn--sm' }, 'Save');

    contactsBtn.addEventListener('click', async () => {
      contactsBtn.setAttribute('disabled', '');
      try {
        const lines = (contactsArea as HTMLTextAreaElement).value
          .split('\n').map((s) => s.trim()).filter(Boolean).join(',');
        await patch('/api/settings/gmail_contacts', { value: lines });
        contactsBtn.textContent = 'Saved ✓';
        setTimeout(() => { contactsBtn.textContent = 'Save'; }, 2000);
      } catch {
        showError(form, 'Save failed');
      } finally {
        contactsBtn.removeAttribute('disabled');
      }
    });

    form.append(
      labelLabel, labelInput, labelBtn,
      el('hr', { class: 'settings-divider' }),
      contactsLabel, contactsArea, contactsBtn,
    );

    container.appendChild(form);

    // Switch user button
    const switchBtn = el('button', { class: 'btn btn--secondary settings-switch-btn' }, 'Switch user');
    switchBtn.addEventListener('click', () => {
      clearViewer();
      currentViewer = null;
      renderPersonSelect();
    });
    container.appendChild(switchBtn);
  }).catch(() => {
    spin.remove();
    showError(container, 'Failed to load settings');
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────

function init(): void {
  root = document.getElementById('app');
  if (!root) return;
  currentViewer = getViewer();
  if (currentViewer) {
    renderApp();
  } else {
    renderPersonSelect();
  }
}

init();
