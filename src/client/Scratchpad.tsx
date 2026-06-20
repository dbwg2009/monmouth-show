import { useEffect, useRef, useState } from 'react';
import { useStore } from './store.tsx';
import { SectionTitle } from './ui.tsx';

export function Scratchpad() {
  const { db, setSetting } = useStore();
  const remote = db.settings.scratchpad ?? '';
  const [text, setText] = useState(remote);
  const [saved, setSaved] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  const focused = useRef(false);

  // Clear any pending debounce timer on unmount so it can't fire stale updates.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Pull in remote updates from sync when the user isn't actively typing.
  useEffect(() => {
    if (!focused.current && remote !== text) setText(remote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote]);

  function onChange(v: string) {
    setText(v);
    setSaved(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { setSetting('scratchpad', v); setSaved(true); }, 600);
  }

  return (
    <div className="page">
      <SectionTitle>Scratchpad</SectionTitle>
      <p className="page-sub">A shared notepad for all three of you. {saved ? <span className="saved-tag">saved</span> : <span className="saving-tag">saving…</span>}</p>
      <textarea
        className="scratchpad"
        value={text}
        placeholder="Jot anything here — it syncs to Dan, Jacob and Steph."
        onFocus={() => { focused.current = true; }}
        onBlur={() => { focused.current = false; window.clearTimeout(timer.current); setSetting('scratchpad', text); setSaved(true); }}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
