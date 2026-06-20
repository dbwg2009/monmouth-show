import { SectionTitle } from './ui.tsx';
import { LEARNING_TRACK } from './planContent.ts';

export function LearningTrack() {
  return (
    <div className="page">
      <SectionTitle>Learning track</SectionTitle>
      <p className="page-sub">Live-sound skills to build before show day. Ordered — work through them roughly in sequence on a real desk.</p>

      <div className="callout-note amber">
        <strong>Your honest position (calibrated):</strong> theatre tech 4/5, live-sound mixing 0/5 today → realistically 3/5 by show day with focused practice. A 7-piece band (Vipers) is the hard part of the day; everything else is choirs and self-sufficient bands. If you nail one thing, make it a confident, feedback-free vocal mix for a busy stage. You have ~8 weeks — enough, if you start the learning track in July.
      </div>

      {LEARNING_TRACK.map((item) => (
        <div key={item.n} className="learn-item">
          <div className="learn-head"><span className="learn-num">{item.n}.</span> {item.title}</div>
          <div className="learn-note">{item.note}</div>
        </div>
      ))}
    </div>
  );
}
