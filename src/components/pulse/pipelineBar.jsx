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
  const needs = STAGES.map(() => 0);
  named.forEach((c) => {
    const s = stageOf(c, scene.day);
    counts[s] += 1;
    if (c.action) needs[s] += 1;
  });
  if (ready) needs[0] = counts[0]; // the whole shortlist waits on the brand

  /* one column per stage — stop, underline and caption stay aligned.
     Color = who has the ball: purple in motion with us, amber waiting on
     you (whole stage, or a badge when it's just some), green = posts are
     real, hollow node = not reached yet. */
  const cols = [];
  if (casting) {
    cols.push({ key: 'casting', cls: 'pp-ghost', n: casting, name: 'Casting…', cap: `${casting} being cast now`, badge: 0 });
  }
  STAGES.forEach((s, i) => {
    const n = counts[i];
    const allYou = n > 0 && needs[i] === n;
    cols.push({
      key: s.label,
      cls: !n ? '' : allYou ? 'pp-amber' : `pp-s${i}`,
      line: !n ? '' : allYou ? 'pp-lamber' : `pp-l${i}`,
      n,
      badge: allYou ? 0 : needs[i],
      name: s.label,
      cap: n ? (allYou ? `${n} ready for your review` : s.on(n)) : s.off,
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
          <span className="pp-moved">↑ {moved} creator{moved > 1 ? 's' : ''} moved forward this week</span>
        )}
      </div>
      <div className="pp-flow">
        <div className="pp-track" />
        <div className="pp-grid" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
          {cols.map((c) => (
            <div key={c.key} className={c.n ? 'pp-col' : 'pp-col pp-col--off'}>
              <div className={`pp-stop${c.cls ? ` ${c.cls}` : ''}`}>
                {c.n ? c.n : <i className="pp-node" />}
                {c.badge > 0 && <span className="pp-badge">{c.badge}</span>}
              </div>
              <div className={`pp-leg-line${c.line ? ` ${c.line}` : ''}`} />
              <div className="pp-leg-name">{c.name}</div>
              <div className="pp-leg-cap">{c.cap}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
