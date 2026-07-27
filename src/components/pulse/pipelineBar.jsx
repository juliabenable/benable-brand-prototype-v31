import { CREW, PCT, FCAST } from './pulseData.js';

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
export const stageOf = (c, day) => (day === 30 ? 6 : c.stage);

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

/* Q · Filter bar — designer mock steal (Jul 27): "% through" progress band
   whose filled portion splits into stage segments (hatched grey = the road
   ahead), stage chips that FILTER the crew table, dark hover tooltips with
   names + "% reached this stage or beyond", amber needs-you badges. */
export function PipelineFilterBar({ scene, filter, onFilter }) {
  const rows = CREW[scene.day] || [];
  const named = rows.filter((c) => !c.mystery);
  const casting = rows.length - named.length;
  const ready = scene.day === 3;
  const total = rows.length || 1;

  const counts = STAGES.map(() => 0);
  const needs = STAGES.map(() => 0);
  const who = STAGES.map(() => []);
  named.forEach((c) => {
    const s = stageOf(c, scene.day);
    counts[s] += 1;
    who[s].push(c.handle || c.name);
    if (c.action) needs[s] += 1;
  });
  if (ready) needs[0] = counts[0];

  const pct = parseInt(PCT[scene.day], 10);
  const reached = (i) => named.filter((c) => stageOf(c, scene.day) >= i).length;

  const segs = [];
  if (casting) {
    segs.push({ id: 'casting', cls: 'pp-ghost', dot: 'pq-dot--ghost', n: casting, label: 'Casting…', sub: `${casting} being cast right now`, who: [], badge: 0 });
  }
  STAGES.forEach((s, i) => {
    if (!counts[i]) return;
    const allYou = needs[i] > 0 && needs[i] === counts[i];
    segs.push({
      id: i,
      cls: allYou ? 'pp-amber' : `pp-s${i}`,
      dot: allYou ? 'pp-lamber' : `pp-l${i}`,
      n: counts[i],
      label: s.label,
      sub: `${counts[i]} of ${total} here · ${Math.round((reached(i) / (named.length || 1)) * 100)}% reached this stage or beyond`,
      who: who[i],
      badge: allYou ? 0 : needs[i],
    });
  });

  return (
    <div className="pq">
      <div className="pq-top">
        <span className="pq-pct">{PCT[scene.day]}</span>
        <span className="pq-pct-label">through</span>
        <span className="pq-fcast">{FCAST[scene.day]}</span>
      </div>
      <div className="pq-band">
        {segs.map((s) => (
          <button
            type="button"
            key={s.id}
            className={`pq-seg ${s.cls}${filter === s.id ? ' pq-seg--active' : ''}`}
            style={{ flexGrow: (s.n / total) * pct }}
            onClick={() => onFilter(filter === s.id ? null : s.id)}
          >
            {s.n}
            {s.badge > 0 && <span className="pp-badge">{s.badge}</span>}
            <span className="pq-tip">
              <b className="pq-tip-title">{s.label}</b>
              <span className="pq-tip-sub">{s.sub}</span>
              {s.who.length > 0 && <span className="pq-tip-names">{s.who.join(' · ')}</span>}
            </span>
          </button>
        ))}
        {pct < 100 && <div className="pq-rest" style={{ flexGrow: 100 - pct }} />}
      </div>
      <div className="pq-chips">
        <button
          type="button"
          className={filter == null ? 'pq-chip pq-chip--active' : 'pq-chip'}
          onClick={() => onFilter(null)}
        >
          <i className="pq-dot pq-dot--all" /> All creators <b>{rows.length}</b>
        </button>
        {segs.map((s) => (
          <button
            type="button"
            key={s.id}
            className={filter === s.id ? 'pq-chip pq-chip--active' : 'pq-chip'}
            onClick={() => onFilter(filter === s.id ? null : s.id)}
          >
            <i className={`pq-dot ${s.dot}`} /> {s.label} <b>{s.n}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

/* R · Fixed stages — P's subway with constant geometry: always 8 slots
   (Casting… slot never disappears) and every stop the same fixed-size pill,
   so scrubbing days never reflows the layout. */
export function PipelineFixedBar({ scene }) {
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
  if (ready) needs[0] = counts[0];

  const cols = [{
    key: 'casting',
    cls: casting ? 'pp-ghost' : '',
    line: '',
    n: casting,
    badge: 0,
    name: 'Casting…',
    cap: casting ? `${casting} being cast now` : 'none needed right now',
  }];
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
        <div className="pr-grid">
          {cols.map((c) => (
            <div key={c.key} className={c.n ? 'pp-col' : 'pp-col pp-col--off'}>
              <div className={`pr-stop${c.cls ? ` ${c.cls}` : ''}`}>
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
