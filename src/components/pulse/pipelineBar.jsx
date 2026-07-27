import { CREW } from './pulseData.js';

/* P · Pipeline — "Where your creators are": every creator sits at the
   furthest stage they've reached. Gapped purple→green segment bar with a
   per-stage caption legend; counts derive from CREW so the bar always
   agrees with the crew table below it. */

const STAGES = [
  { label: 'Invited', on: (n) => `${n} awaiting reply`, off: 'invites go out on approval' },
  { label: 'Accepted', on: (n) => `${n} placing orders now`, off: 'as invites are accepted' },
  { label: 'Order placed', on: (n) => `${n} shipment${n > 1 ? 's' : ''} in transit`, off: 'after orders are placed' },
  { label: 'Order received', on: (n) => `${n} filming now`, off: 'once packages land' },
  { label: 'Draft submitted', on: (n) => `${n} in review with us`, off: 'after filming' },
  { label: 'Content published', on: (n) => `${n} post${n > 1 ? 's' : ''} live`, off: 'after our checks' },
  { label: 'Thanked', on: (n) => `all ${n} thanked 💌`, off: 'after posts go live' },
];

const DAY_KEYS = Object.keys(CREW).map(Number).sort((a, b) => a - b);

/* crew stage 0–5 maps straight onto pipeline 0–5; wrap day = everyone thanked */
const stageOf = (c, day) => (day === 30 ? 6 : c.stage);

function movedThisWeek(day) {
  const i = DAY_KEYS.indexOf(day);
  if (i <= 0) return 0;
  const prevDay = DAY_KEYS[i - 1];
  const prev = {};
  (CREW[prevDay] || []).forEach((c) => { if (!c.mystery) prev[c.name] = stageOf(c, prevDay); });
  return (CREW[day] || []).filter(
    (c) => !c.mystery && (!(c.name in prev) || stageOf(c, day) > prev[c.name]),
  ).length;
}

export default function PipelineBar({ scene }) {
  const rows = CREW[scene.day] || [];
  const named = rows.filter((c) => !c.mystery);
  const casting = rows.length - named.length;
  const ready = scene.day === 3;

  const counts = STAGES.map(() => 0);
  named.forEach((c) => { counts[stageOf(c, scene.day)] += 1; });

  /* one column per stage — block, underline and caption stay aligned */
  const cols = [];
  if (casting) {
    cols.push({ key: 'casting', cls: 'pp-ghost', n: casting, name: 'Casting…', cap: `${casting} being cast now` });
  }
  STAGES.forEach((s, i) => {
    const n = counts[i];
    cols.push({
      key: s.label,
      cls: n ? `pp-s${i}` : 'pp-empty',
      line: n ? `pp-l${i}` : '',
      n,
      name: s.label,
      cap: n ? (ready && i === 0 ? `${n} ready for your review` : s.on(n)) : s.off,
    });
  });
  const moved = movedThisWeek(scene.day);

  return (
    <div className="pp">
      <div className="pp-head">
        <div>
          <h3 className="pp-title">
            {named.length === 0 ? 'Your crew is taking shape' : `Where your ${rows.length} creators are`}
          </h3>
          <p className="pp-sub">Every creator sits at the furthest stage they’ve reached.</p>
        </div>
        {moved > 0 && (
          <span className="pp-moved">{moved} creator{moved > 1 ? 's' : ''} moved forward this week</span>
        )}
      </div>
      <div className="pp-grid" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
        {cols.map((c) => (
          <div key={c.key} className={c.n ? 'pp-col' : 'pp-col pp-col--off'}>
            <div className={`pp-block ${c.cls}`}>{c.n || ''}</div>
            <div className={`pp-leg-line${c.line ? ` ${c.line}` : ''}`} />
            <div className="pp-leg-name">{c.name}</div>
            <div className="pp-leg-cap">{c.cap}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
