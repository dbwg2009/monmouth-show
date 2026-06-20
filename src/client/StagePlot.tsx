import { SectionTitle } from './ui.tsx';
import { PLOT_ROWS } from './planContent.ts';

export function StagePlot() {
  return (
    <div className="page">
      <SectionTitle>Stage plot</SectionTitle>
      <p className="page-sub">Input-list template — the Vipers' version is the critical one. Pre-filled with a typical 7-piece layout to adapt from Tony's reply.</p>

      <div className="callout-note urgent">
        <strong>The one thing that unblocks everything:</strong> until you know what desk and kit BSB are bringing — and whether it's digital or analogue — you can't finalise the input list, answer the Vipers, or plan your practice. Get BSB's details from Steph, then send the BSB email (in Emails). Everything technical hangs off it.
      </div>

      <div className="plot-scroll">
        <table className="plot-table">
          <thead>
            <tr>
              <th>Ch</th><th>Source</th><th>Input type</th><th>Mic / DI</th>
              <th>Stand</th><th>Phantom?</th><th>Monitor</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {PLOT_ROWS.map((r, i) => (
              <tr key={i}>
                <td>{r.ch}</td><td>{r.source}</td><td>{r.type}</td><td>{r.mic}</td>
                <td>{r.stand}</td><td>{r.phantom}</td><td>{r.monitor}</td><td>{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted-sm" style={{ marginTop: 10 }}>
        Confirm every row against the band's actual reply — don't assume. Mark what BSB supply vs what the band bring. Keep a master version that's the superset, and a per-act subset.
      </p>
    </div>
  );
}
