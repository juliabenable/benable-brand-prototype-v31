# benable-brand-prototype-v31 — Campaign Pulse

Brand-portal prototype: captured production HTML + React overlays. v27 archives the full A–W variant exploration; v28 carries only the surviving direction.

## Architecture
- Captured page HTML lives in `src/data/capturedHtml.js` (huge — grep, never read whole).
- Pages render captured HTML via `dangerouslySetInnerHTML`, then mount React overlays into injected host divs with their own `createRoot` + a MutationObserver re-mount (pattern in `CampaignDetailPage.jsx` / `CampaignsListPage.jsx`).
- Campaign page overlay: `src/components/pulse/` —
  - `pulseData.js` — ALL demo content (DAYS day-states, CREW per-day rows, TIMELINES, banners). Copy tweaks go here.
  - `LiveStatus.jsx` — motion registers: shimmer = machine working now · katie = human present (typing, never a spinner) · heartbeat = watching (breathe, one still sentence) · celebrate = go-live (emoji bounces, words still) · facts/static = quiet. Every animation is a claim — only emit from real signals in production.
  - `tiles.jsx` — Lead, RecapTile ("While you were away"), UpNextTile, PaceTile, LiveBarTile (only exists after first live post; continuous fill).
  - `CampaignPulse.jsx` — crew view shell + demo scrubber. Variants: V gray+crew · W +live bar · X +call fixes (D1 Katie welcome, D3 big review CTA / orange ready rows / request-more) · P pipeline (default).
  - `pipelineBar.jsx` — P's "Where your N creators are" card: aligned stage columns on a subway track (solid stop = creators there, hollow node = future), color = who has the ball (purple ramp = in motion with us, amber = waiting on brand [whole stage, or corner badge when partial], green = content real, dashed ghost = casting). Counts derive from CREW; "moved forward" pill diffs stages vs the previous demo day.
- Brand overview overlay: `BrandPulse.jsx` (lifetime totals, milestone tracker, insight cards) mounted before `.campaigns-section`.
- CSS: `src/styles/pulse.css` only — `cp-` campaign page, `bp-` brand overview. Keep it pruned; don't append dead styles.

## Copy rules
- Operational claims say "Katie's team" (never solo Katie); Katie's first-person voice only in her signed cursive notes.
- No struggle updates; rematches framed as reassurance. Emoji stripped in crew statuses except celebrate.
- A tile row never shows a zero — it shows a sentence about what's happening.

## Dev + ship
- Dev: launch.json name `brand-prototype-v28`, port 5206. Demo page: `/brand/tonypikora/campaigns/46` (campaign) and `/brand/tonypikora/campaigns` (brand overview).
- Deploy: `bash scripts/ship.sh "commit message"` — builds, commits, pushes, watches the Pages run, curls the live URL.
- Live: https://juliabenable.github.io/benable-brand-prototype-v31/
