> **4 October 2026 override:** The latest user brief is authoritative. Homepage now uses larger left-aligned copy with the 3D console on the right, more color and custom section layouts. Backend/auth and other-page redesign are later work. See GROWORA_PROGRESS.md for the current state. The document below is historical.
> Current implementation: the 29 September console direction supersedes this historical design plan. Follow GROWORA_PROGRESS.md and the latest user brief. Hero + first six-stage story only; keep the current light console concept for evaluation.

# Growora — Final design and implementation blueprint

**Direction: Directed momentum.**  
**Decision date: 27 September 2026.**  
**Status: design decisions complete; implementation has NOT started.**

This is an evolution of the existing Fieldwork design, not a replacement brand or a new application. Keep warm paper, printed ink, cobalt, the Growora mark, Newsreader, and the working local product. Make the route taken by an individual lead the main visual event. Marketing should feel like watching an exact, understandable system do useful work. The application should feel like operating that system.

Read this document with `GROWORA_PROGRESS.md`. Execute the numbered stages in P, updating the checkpoint after each stage. Do not reinterpret the art direction, install a new animation stack, or rebuild the repository. Read the relevant installed Next.js guides before code changes, as required by `AGENTS.md`.

## A. Recovered current state

### Audit and evidence

The current application was run with `npm run dev` at `http://localhost:3000`. The browser viewport was explicitly set to **1440 × 900** and **390 × 844**. The homepage was scrolled from the hero through the footer at both sizes. These observations are from rendered screenshots and interaction, not solely source inspection.

Visual review also covered:

- Desktop `/app`, `/app/leads`, `/app/pipeline`, `/app/automations` and its high-value editor, `/app/forms` and its website form builder, `/app/analytics` including the lower data panels.
- Mobile `/app`, `/app/leads` and an open lead detail dialog, `/app/pipeline`, `/app/automations`, `/app/forms` builder, `/app/analytics`, `/app/settings`. The shared automation editor was also viewed throughout the mobile homepage.
- Desktop `/product`, `/solutions`, `/integrations`, `/pricing`. Supporting editorial, demo, contact, legal, metadata and error routes were inspected in source; they were not all individually visually tested.
- The automation Test flow / Stop simulation interaction was exercised. Existing local records were preserved; no lead was submitted, moved, deleted or reset during this audit. The existing browser contained 21 leads after hydration, including a previously created demo record; source fixtures contain 20.

Baseline checks passed: `npm run build` (26 generated pages), `npm run typecheck`, `npm run lint`, and `npm run test` (5/5). Browser error/warning log inspection returned no entries at the end of the reviewed routes. This is a healthy baseline, not a claim of exhaustive functional or accessibility testing. No Lighthouse, GPU trace or throttled-device performance baseline was captured.

There is **no `.git` repository in this supplied directory**, and neither of the requested checkpoint documents existed at audit start. Prior interrupted-turn boundaries cannot be reconstructed reliably. The state below describes what exists now; do not invent a list of unfinished commits.

### Architecture and functionality to preserve

| Area | Current implementation / contract |
| --- | --- |
| Framework | Installed Next.js 16.3.6 App Router, React 19.3.0, TypeScript 6.0.3; static marketing/app routes with client interaction islands. Promise-based route params are already used. |
| Dependencies | Three.js 0.186.1, lucide-react, Tailwind 4 tooling; local variable Manrope, DM Sans and Newsreader fonts. **No Motion, Framer Motion, GSAP or React Three Fiber dependency exists.** |
| Routing | Home; 11 slugs: product, solutions, integrations, pricing, about, demo, contact, docs, guides, privacy, terms; `/app` plus leads, pipeline, automations, forms, analytics, integrations, settings. Invalid dynamic routes are rejected. |
| State | Root `Providers`, `useLeads`, validated `growora-leads-v1` localStorage, and `useLocalState` with same-document custom-event synchronization. No backend, authentication, external delivery, payment or live CRM sync. |
| Domain | `qualify`, `createLead`, `metrics`, GBP formatting, and New → Qualified → Contacted → Proposal → Won stages in `src/lib/domain.ts`. |
| Capture | Required fields, deterministic qualification, processing states, one generated UUID, provider insertion, result and `/app/leads?highlight=<id>` link. Currently insertion waits for five 450 ms presentation steps. |
| Leads | Search, stage/score filtering, sorting, CSV export with spreadsheet-formula escaping, add-lead dialog, persistent notes/stage changes, detail dialog and highlighted-row URL. Highlight currently prioritizes/colors the row; it does not auto-open the detail. |
| Pipeline | HTML drag/drop, accessible/touch stage select on each card, search, details, provider-backed stage changes and activity entries. |
| Automations | Five flow variants, selected node settings, persisted values/enabled state, editable budget threshold, YES/NO simulation. Test uses a fixed £7,500 example and repeating CSS effects; it is not a real execution engine. |
| Forms | Three initial forms, create/add/remove/rename/reorder fields, type/required/options, status, local persistence and validated preview. Builder preview intentionally does not create leads. |
| Analytics | Provider-backed metrics, cumulative line chart, source breakdown and stage values; explicitly illustrative visitors/marketing trend. |
| Other | Search dialog/keyboard shortcut, notifications view, workspace settings/density/timezone, JSON export and explicit reset dialog, integration search/category/detail and local connection simulations. |
| Site shell | Responsive menus, navigation, skip link, native dialogs, keyboard tabs, canonical/social metadata, OG image, sitemap, robots and noindex for `/app`. |

Do not treat the deliberate local-demo boundaries as unfinished production work. Never add authentication, email sending, payments or live integrations as part of this design plan. Preserve the useful disclosure near the relevant interaction; avoid filling the interface with implementation explanations.

### Existing visual system and assets

- CSS order at root: `globals.css` → `product-surfaces.css` → `art-direction.css`; app adds `app.css` → `design.css`. There are about 240 KB of raw CSS across these five files and substantial overlapping selectors. Do not add a sixth global override layer.
- Paper `#f3f0e8`, ink `#252c29`, cobalt `#2b49ae`; pale warm surfaces, square corners, hairline rules, editorial Newsreader headings, DM Sans interface text. `--lime` is already an alias for cobalt, not an instruction to use green.
- The latest layer has already removed many pills, rounded cards and glow treatments. Do not report those problems as universal or restore them.
- Brand mark is custom SVG in `ui.tsx`; favicon is `src/app/icon.svg`; OG art is generated by `opengraph-image.tsx`. There is no `public/` image collection, photography, video, GLB or external 3D model. Product visuals are DOM/SVG; the hero is procedural Three.js.
- Hero is already a full-width typographic masthead above a routing board. Preserve that useful compositional premise. Current WebGL depicts a layered microprocessor, 7 incoming paths, 4 outgoing paths and independent tiny packets; the output register is a static score of 91.
- WebGL already loads dynamically, excludes small screens/reduced motion, caps DPR at 1.7, uses visibility checks, ResizeObserver, context-loss handling and disposal. Preserve these protections, while improving their implementation. Animation speed currently advances per frame, so speed varies with refresh rate.
- Existing motion: packet travel/pointer tilt; mobile fallback signal; scroll-selected five-stage workflow; inbox organization on click; chart line reveal; form processing scan; repeated automation node/connector animation; lead highlight and loading states. There is no cross-section lead continuity controller.

### Actual remaining design problems

| Observed area | What the browser revealed | Decision |
| --- | --- | --- |
| Hero | Elegant heading, but tiny packets and a low-contrast board make activity hard to notice. Large grid/blank margins dominate the machine. Generic processor symbolism does not explain qualification. Static score ticket is detached from packet motion. | Keep the masthead; replace the chip with visible qualification gates, a score rail and three explicit routes. Increase active-object scale and synchronize state. |
| Problem | Three rotated mail cards are still a familiar stock-SaaS illustration. | Replace with a compact, ruled intake ledger; preserve the useful before/after control. |
| Workflow | Five tabs omit a distinct Score stage. Scrolling jumps through states in a short section; Capture and Qualify can pass before the user reads them. The entire example remounts with `key={active}`. | Six-stage continuous specimen, one stable object, a deliberate desktop scroll runway and manual step control. |
| Repeated section headers | Most sections use the same small left index, serif headline, right description, then a framed demo. Each is polished; collectively they flatten the rhythm. | Three chapter openers, varied internal layouts, fewer framed product replicas. |
| Dashboard preview | Four metrics + line chart + donut + recent table + pipeline repeats a recognizable dashboard template; tiny labels make it read as a screenshot. On mobile it occupies multiple screens before the visitor reaches capture. | Show a focused opportunity desk after capture; reuse real data/components, reveal the full workspace by link. |
| Automation | Distinct IN/IF/delay geometry is good. The homepage renders the entire seven-node editor plus settings, using considerable vertical space. Test flow loops highlights rather than showing a finite causal run. | A compact execution schematic on marketing; keep the full editor in `/app` and `/product`. |
| Pipeline | Ten miniature cards repeat the full application's board. On mobile, it is a horizontally scrolled fragment; useful controls are below it. | Homepage follows one opportunity across an open stage rail. Keep a real board in the product. |
| Analytics | Line/donut/funnel arrangement remains generic; repeated metric arrows imply growth without a comparison. Funnel widths are fixed decoration, not counts. | Action-led overview and labelled linear distributions. Remove implied growth/directional claims. |
| App hierarchy | 47 px editorial titles and small 9–12 px data compete for attention; long intros push working content down. | Smaller app headings and larger data text; increase useful density without reducing targets. |
| Mobile details | Capture headline visibly joins words as “context.A” where hidden `<br>` removed spacing. Hero annotations are too tiny. The fallback's tilted logo block is a generic replacement for the actual engine. | Fix text semantics and design a legible top-down engine. No miniature desktop canvas. |
| Supporting pages | Serif introductions and ruled selectors work; integration initial-letter symbols look provisional. | Preserve their layouts; use clear named connection rows, fewer decorative icons. |

### Technical/design debt to resolve during the relevant stages

1. CSS ownership and old animation rules overlap; deleting a style file wholesale would break layouts.
2. `ready` exists in the lead provider but data displays initially paint the 20 fixtures before persisted data arrives. The audit saw counts update to 21. Avoid misleading first-paint counts using a stable loading treatment for data-dependent regions.
3. Workflow manual selection disables scroll synchronization indefinitely; its example is replaced rather than transformed.
4. Capture delays saving until the presentation timer finishes; navigation/unmount can cancel the save. Reduced motion changes CSS but does not remove that JavaScript delay.
5. High-value automation condition uses budget > £2,000, whereas lead priority uses score ≥75. These are different rules. Do not depict them as equivalent.
6. Seed scores are illustrative stored scores and do not all reproduce `qualify(seedInput)`. The static Alex story routes to Jamie, but sample-1 currently belongs to Sam. Keep the illustrative story separate from actual seed records.
7. Analytics “7 days” uses a hard-coded cutoff, while overview uses a latest-record anchor. Stage-value/pipeline-mini widths have arbitrary multipliers, and the funnel has fixed tapered widths. Normalize and label data truthfully.
8. Several forms/settings save automatically while a Save button only changes its label. Preserve data until save semantics are deliberately clarified; do not imply a button controls persistence when it does not.
9. Mobile table/board scrolling exists, but important lead status and routing are often offscreen. Mobile product design needs an intentional default view.
10. Mobile menus, chart keyboard interaction, zoom, contrast and all fallback paths still need a full accessibility pass. Existing accessibility primitives are a starting point, not a certification.

## B. Final creative direction

### Directed momentum

**A legible route from interest to opportunity.** Growora's signature is a cobalt lead moving through an open, precise routing instrument on warm paper. Human editorial typography gives the system purpose; straight paths, calibrated scores, explicit branch decisions and accountable ownership give it authority.

Recognizable elements, always used together:

1. Warm untextured paper and deep ink, with cobalt reserved for active information and decisions.
2. Large Newsreader statements, including selective italic emphasis; firm DM Sans labels and tabular operational numbers.
3. One small chamfered lead marker that becomes a record. It is carried by visible paths, never floating independently.
4. A linear score ruler with real 55/75 thresholds, not a donut, magical confidence orb or unexplained percentage.
5. Routing junctions with visible alternatives and explicit owners/actions.
6. Quiet human context between demonstrations, followed by one strong cobalt closure.

Energy comes from scale, directional travel, short decisive motion, and change of state. Calm sections remain still. Motion must answer “what happened to this lead?”

The selected approach gives the current design more force without a rebrand, fits the existing deterministic data model, needs only one WebGL scene, and has a faithful SVG equivalent. It avoids turning the homepage into either a static editorial brochure or an elaborate scroll-controlled film. We accept one custom scene and one bounded sticky chapter; we reject a global 3D world, a second animation framework, and page-long pinning.

## C. Design tokens and visual grammar

### Color

Centralize these semantic roles in the existing token layer. Migrate references as each component is touched; retain old aliases temporarily for compatibility.

| Token | Value | Use |
| --- | --- | --- |
| `--paper` / `--bg` | `#F3F0E8` | Main marketing canvas and app backdrop |
| `--surface` | `#EAE7DD` | Sidebar, passive registers, secondary planes |
| `--surface-2` | `#F8F6F0` | Editable fields, active work surface |
| `--surface-3` | `#E1DFD4` | Structural separators/headers, not every panel |
| `--text` | `#252C29` | Main text and structural ink |
| `--muted` | `#5E665D` | Secondary text with readable contrast |
| `--signal` | `#2B49AE` | Active route, primary action, selected state |
| `--signal-hover` | `#20398F` | Button hover/pressed emphasis |
| `--signal-wash` | `#E1E6F1` | Selected record / active stage background |
| `--success` | `#3F5D48` | Explicit Won/completed status only |
| `--pending` | `#816039` | Scheduled/waiting state, never general decoration |
| `--danger` | `#A0352B` | Error/removal only |
| `--rule` | `#C8C9BF` | Decorative page divisions |
| `--control-border` | `#7A827A` | Input boundaries and essential graph structure |
| `--route-idle` | `#76827C` | Inactive diagram paths, paired with labels |
| `--inverse-text` | `#F8F6F0` | Text on cobalt/ink |

Normal copy must meet 4.5:1; large text and meaningful interface graphics 3:1. Check actual rendered pairs, including disabled/hover/selected combinations. Decorative rules can be quieter but must not be the only sign of a control or branch. Never lower the opacity of essential text to make a scene elegant.

Use roughly 75% paper, 18% neutral/ink structures, 7% cobalt in the opening view. This is a composition guideline, not a pixel quota. The final CTA is the only full cobalt field on the homepage. No gradients except an optional ≤6% chart area tint; no glows, noise textures or glass.

### Typography

| Role | Desktop | 390 px | Rules |
| --- | --- | --- | --- |
| Hero | Newsreader roman 96/92 px; italic 100/94 px | 44/43 px roman; 46/44 px italic | Weight 430/400, tracking −0.04em; whole words, no masked character reveals |
| Chapter statement | Newsreader 56/58 px | 36/38 px | Max 20–24 characters per line, italic used only where specified |
| Section heading | Newsreader 40/43 px | 30/33 px | Not every section receives one |
| App page heading | DM Sans 30/36 px, weight 600 | 27/33 px | Title names the task: Overview, Leads, Pipeline, Automations, Forms, Analytics |
| UI/subheading | DM Sans 16/22 px, weight 550–600 | Same | Short, informative |
| Body | DM Sans 16/25 px | 15/23 px | 45–65ch; body copy never shrunk to fit |
| Product data | DM Sans 14/20 px | 14/20 px | Names 14–15 px; secondary data ≥12 px |
| Labels/captions | DM Sans 12/16 px | 12/16 px | 0.035em for short uppercase labels; no long all-caps sentences |
| Score/KPI | DM Sans 44/46 px; hero score 72/72 px | 36/38 px; hero score 44/46 px | `font-variant-numeric: tabular-nums`; never count arbitrary intermediate scores |

Keep the current wordmark proportions. DM Sans can carry its weight/spacing. Final font payload should be DM Sans variable normal + Newsreader variable normal/italic, Latin subsets. Remove Manrope only after migrating its actual uses and verifying the wordmark and headings; do not silently change all fonts at once. The installed packages contain Latin WOFF2 files; use documented local loading or explicit local `@font-face`, not guessed package import paths. Retain sensible Georgia/system fallbacks and `font-display: swap`.

### Grid, spacing and geometry

- Marketing container: max 1280 px, 80 px ideal side margins at 1440, 32 px at tablet, 20 px at 390. Allow for scrollbar width; never force a desktop width beyond the layout viewport.
- Desktop: 12 columns, 24 px gaps. Tablet 6 columns/20 px. Mobile 4 columns/16 px; usable width approximately 350 px.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Chapter gaps 96–128 desktop / 64 mobile; internal section gaps 48–64 / 32. Do not impose identical 85 px padding on every section.
- Header: 72 px desktop, 64 px mobile. Flat paper, 1 px lower rule, no blur. Existing sticky behavior stays.
- App: 224 px sidebar; 64 px topbar; 32 px content gutter desktop / 16 mobile; max working width 1440 px. Hide sidebar below 1024, preserving accessible drawer navigation.
- Corner radius: 0 for documents, rows, diagrams and panels; 2 px for controls; 4 px maximum for dialogs. Never use a pill for a number, status or decorative label.
- Rules: 1 CSS px for separators; 1.5 px structural routes, 2.5 px active routes. SVG paths use non-scaling strokes. A path has 90° turns with 8 px corner transitions or 45° chamfers; no decorative curly routing.
- Lead marker: cobalt 14 × 8 px desktop, 12 × 8 mobile, one clipped 3 px upper-right corner. This modest geometry echoes the Growora G without stamping the logo everywhere. A selected record carries the same 3 px cobalt leading edge.
- Nodes: intake slot (rectangular opening), condition (small diamond at a junction), action (square terminal), delay (open terminal with a time tick), completion (closed terminal + check). Shapes indicate meaning; they are not icon tiles.
- Shadows: none for normal sections/cards; one light contact shadow in 3D, one restrained `0 12px 32px #252c2920` dialog elevation. No ambient floating-card effect.
- Lucide: 16–18 px, 1.5–1.75 px stroke, functional use only. Remove decorative Sparkles and metric growth arrows. Preserve the existing custom G mark.

## D. Flagship hero specification

### Composition: masthead and open routing field

The hero is one full-width composition, **not a text column beside a floating object**. Keep the existing headline, but give its two lines a deliberate offset and let a large routing field span beneath it. The CTA sits beside the introductory text in a compact action band; the machine is open on the page, not inside a pale dashboard panel.

Desktop wireframe (1440 × 900 reference; flow layout, not fixed screen coordinates):

```text
72 px header     G growora.        Product / Solutions / Integrations / Pricing       Demo

80 ←──────────────────────────── 1280 px content ────────────────────────────────→ 1360
     THE LEAD CONVERSION SYSTEM                                INTEREST → OPPORTUNITY
     Good leads deserve                    [roman, cobalt, full-width masthead]
              a clear next step.           [italic, ink; offset one grid column]

     Turn interest into a qualified        [Try a lead ↗]       See the route ↓
     opportunity. Keep the next step clear.                     [Pause motion]

     INTAKE                     GROWORA / QUALIFICATION                    NEXT STEP
     Website enquiry ───╲       ┌ fit/context gate ┐               ┌── PRIORITY / JAMIE
     Project request ──▰─╲══════╪ budget / timing ╪═══ score 91 ══◇
     First conversation ─╱      └ open route deck ┘               ├── DISCOVERY
                                                                 └── NURTURE
     Alex Morgan / Example        30 + 35 + 21 + 5              Owner + action terminal

     CAPTURE ───── QUALIFY ───── SCORE ───── ROUTE ───── OPPORTUNITY       Follow the lead ↓
```

At the reference viewport: header y0–72; edition y96–116; headline y138–315; action/copy band y337–405; routing field y422–758; baseline y778–814. Leave a small glimpse of the next section. The complete primary CTA, meaningful diagram and baseline must fit without scrolling at 1440 × 900. Shorter viewports may naturally extend; do not clip or scale all type to fit.

- Keep “Good leads deserve / a clear next step.” as the H1, with roman first line and italic second. Do not animate its letters or hide it until JavaScript runs.
- First line begins at column 1; second at column 2. Intro at columns 1–5, max 420 px; actions occupy columns 6–12 on the same band. This replaces the current paragraph sitting beside the headline.
- Primary action: **Try a lead**, native link to `#lead-demo`. Secondary: **See the route**, to `#workflow`. Header retains an obvious `/app` demo link. “Watch it work” becomes a truthful action without a play/video implication.
- Routing field uses the whole 1280 × 336 area. Intake at x0–260, gates at x310–650, score/junction at x670–850, output terminals at x880–1280 relative to the container. Keep DOM label exclusion zones; no label rides over a rail.
- Ground plane matches paper. Remove the full perspective grid and enclosing engine-stage panel. Only 5–7 short calibration marks near meaningful nodes remain.
- The machine is an **open three-gate routing assembly**, not a CPU. Three thin, matte, lightly elevated guide frames read context, budget and timing. A horizontal calibrated rail after the gates records the score. A visible switch chooses one of three outgoing tracks. The packet stays visible through the openings.
- Main branch rises gently toward the priority terminal; other paths remain visible but quiet. Leads are never represented as disappearing into a box and magically reappearing.
- Output is an anchored record terminal continuous with its rail: `91 / 100`, `Priority sales queue`, `Jamie Lee`, `Contact within 10 minutes`. No detached floating score card. High/Medium/Nurture are priority routes, not pipeline stages.
- Label the scene **Illustrative lead / Alex Morgan**. This is not `sample-1`, not a newly saved record, and not live traffic. Use the shared example input in H, so the score is computed by the same domain function.

### First-load motion and ongoing energy

All text, buttons and a static SVG routing view are in the initial HTML. No loading splash. Begin the lightweight signal motion once the hero is visible and hydrated; the WebGL renderer may join at the same state after it is ready. Never replay the opening solely because Three finished loading.

| Time | Event |
| --- | --- |
| 0–180 ms | Marker is already visible at the intake; active intake rule gains cobalt. No whole-hero fade. |
| 180–1000 ms | One 18 × 8 visual packet travels into the gates; constant velocity through rails, short ease into the stop. Adjacent quiet input paths establish context. |
| 1000–1550 ms | Three gates register in sequence, 150–180 ms each. Their small state ticks close; only a 3–4 px mechanical displacement, no bouncing. |
| 1550–2050 ms | Ruler gains its position; show the final score 91 once. Under it, reveal the actual contribution labels. Do not roll through random numbers. |
| 2050–2800 ms | Selected branch draws from junction to priority terminal; the same packet follows. The other routes remain readable. |
| 2800–3450 ms | Marker extends into the leading edge of the anchored record; owner and next action become legible. |
| 3450–4200 ms | Hold the completed state. Baseline route is visibly connected. |

After the opening, keep the completed record visible. At most once every 8 seconds, one small corroborating signal makes a 1.6-second pass along the already selected route. Do not rerun scoring, replace the record or imply multiple saved leads. A visible **Pause motion / Resume motion** button controls all hero motion. Add **Replay route** as a quiet control after the opening; manual replay resets only presentation.

Use a single elapsed-time clock for SVG/DOM/WebGL. Pause when offscreen or document hidden; resume from the same logical time with clamped delta. No background catch-up burst. No camera orbit, hovering, autonomous tilt or cursor chase; the movement of the lead supplies the energy.

### 3D treatment

- One orthographic view, approximately 55° elevation and 18° yaw, looking along the intake-to-output axis. Camera is fixed; design the projection against the SVG fallback.
- Neutral matte guides (`#D9D9CF` top, `#A3AEA7` edges), low metalness 0.1–0.2, roughness 0.65–0.8; cobalt packet and selected route. No chrome, emissive materials, bloom, glass or environment maps.
- The three gates visibly correspond to collected context, budget and timing. The score rail and branch reveal the routing decision. Tiny generic processor pins and the large decorative central chip are removed.
- Labels and controls remain real DOM at all times. 3D is an enhancement of the diagram, never the only explanation.
- Share topology definitions between WebGL and SVG. Derive DOM anchors from the same fixed projection on resize; do not measure and reposition labels every animation frame.
- Crossfade renderer opacity over 120 ms only after the first successful rendered frame; hide duplicate geometry but retain accessible HTML. If initialization/context restoration fails, show the static SVG without layout change.

### 390 px hero: a compact intake instrument

No WebGL below 1024 px. Do not show the current tilted G block or squeeze desktop labels into 6–8 px type.

- Header 64 px; 20 px gutters. Edition 12 px at y84. H1 around y118–216, two designed lines at the sizes in C; allow natural wrapping at 320/360 or zoom instead of `white-space: nowrap`.
- Two short lines of supporting copy around y242–291; primary action 48 px high at y316, secondary link on the same row if it fits (otherwise below). All actions visible before the diagram.
- Diagram approximately 350 × 290 px from y398. Three named input ports across the top; the selected source opens into one vertical cobalt trunk. Three short horizontal gate ticks cross it. Ruler/score occupy the right middle; the branch opens into three labelled text rows below. Priority terminal is fully visible.
- Mobile labels ≥12 px. Only the selected source gets its expanded name; the other two have short labels “Project” and “Conversation”. Three stage words `Capture / Score / Route` appear in the local legend; the six-stage story below remains complete.
- Use the same chamfered marker and final terminal as desktop, rendered in SVG/DOM. First run ≤2.4 seconds, then stop. Replay available; no ambient mobile loop, no pointer tracking.
- At 390 × 844, heading, CTA, score and chosen route fit within the first viewport; the next section may begin below it. Content height remains intrinsic at zoom/large text.
- Reduced motion/no JS/WebGL failure: final static topology, selected route, 91 score and owner/action. No meaning depends on animation.

## E. Homepage section map

The page is a connected narrative with **three chapter labels**, not 13 identical feature sections. Preserve content and capabilities, but change placement and scale. Target approximately 8,000–9,200 px total desktop scroll height including the bounded story runway; about 8,000–10,000 px on mobile with the story collapsed. These are pacing checks, not reasons to clip content. The audited mobile page was about 12,725 px tall.

Final order: **Hero → Intake gap → Lead journey → Try your lead → Opportunity desk → Automation execution → Pipeline + insight → Business context / Philosophy → Solutions → Connections → Pricing → Final CTA → Footer.**

| Section / purpose | Layout and visual treatment | Motion | Transition in → out |
| --- | --- | --- | --- |
| Header | Existing flat masthead. Keep primary pages and demo access. Desktop 72 px / mobile 64 px. | Color/underline interaction only. | Open paper canvas → hero shares the same background. |
| 1. Hero / impact | D's oversized headline and full-width open routing instrument. | Signature 1 only. | Immediate readable content → final route exits at the shared chapter gutter. |
| 2. Intake gap / calm | Rework `Problem`. Left: “Interest moves fast. Give it a clear next step.” Right: three aligned intake rows with Source / Context / Owner. One row has an unassigned owner. No rotated mail cards. 320–400 px desktop. | “Bring some order” fills context/owner in place over 240 ms; no auto-play or physics. | Hero exit becomes the ledger's leading rule → lead marker sits at “Alex / example”, ready to inspect. |
| 3. One lead, six decisions / build | Replace homepage `Workflow` with `LeadJourney`. One persistent specimen on a sticky open work surface; six short step descriptions, same object and paths. Cobalt, score ruler, branch and outcome visible at the appropriate stages. Details in F/G. | Signature 2. One bounded sticky chapter desktop; explicit steps mobile. | Ledger row reduces to the marker → final example settles as a completed record. A short text cue invites the visitor to try their own. |
| 4. Try your lead / interaction | Move `LeadCapture` before the workspace preview. Left is a compact explanation and transparent scoring key, not a second giant heading. Right is the existing working form. Chapter label “02 / Make it yours”. On success the form region becomes its actual saved record. | First half of signature 4; immediate data commit, finite visual acknowledgement. | Example ends explicitly: “That was an example. Now try your lead.” → the saved record's leading edge aligns with the workspace below. |
| 5. Opportunity desk / product moment | Refine `DashboardPreview` into one focused live workspace surface: compact metrics strip, selected lead row plus owner/next action, 2–3 recent records, a small real trend. Remove fake sidebar and donut from the homepage variant. Keep visible `/app` and highlighted lead links. | Second half of signature 4. Brief row insertion/highlight after submit; otherwise still. | Form result repeats the same identity and score → lower action rail leads to the automation explanation. No forced scroll. |
| 6. Automation execution / build | New compact `AutomationShowcase`, 700–820 px desktop including heading; a wide trigger → condition → actions path with a visible alternative branch and a short execution receipt. Settings hidden until “Edit rule”; full editor stays in app/product. | Signature 3, run on user action, finite and replayable. | Selected lead appears as input labelled “Simulation” → completed action tick becomes the pipeline's first active stage tick. |
| 7. Pipeline + insight / calm | Combine homepage `PipelineSection` and `AnalyticsSection` into one two-part operational spread. A single featured opportunity traverses five stage columns; below, a compact real source summary and lead-volume chart share a ruled baseline. No 10-card miniature board, no generic feature trio beneath chart. | User stage change only, ≤240 ms, no extra signature. Chart appears fully plotted. | Automation receipt attaches to the same record → chart baseline ends cleanly at the editorial break; never morph fabricated values into real data. |
| 8. Business context / editorial rest | Evolve `Philosophy` into one photography/editorial spread. Left ~7 columns image, right 5 columns: “The next step happens in the real world.” Follow with the existing principle “Every lead deserves a next step.” and `/about` link. Details J. | None; no image parallax. | All routes stop before image. A small lead reference remains in the margin → image edge/rule returns to solutions layout. |
| 9. Solutions / quiet relevance | Retain the existing six-industry selector and substantive source/qualification/action copy. Chapter label “03 / Built around your work”. Improve label size; remove Sparkles. Reduce repeated serif messaging within the selected panel. | 120 ms opacity change on manual selection, no slide carousel. | Editorial context grounds the use cases → selected action line meets connection register. |
| 10. Connections / quiet | Replace homepage hub/orbit glyph drawing with six named rows on a shared horizontal/vertical connection rail, category + proposed event. Link to full directory; retain “Conceptual connections” disclosure. No unofficial single-letter logos. | Focus/hover underline only. | Solutions action joins rail → rail becomes pricing divider, without a travelling packet. |
| 11. Pricing / calm decision | Keep the three aligned plan columns, amounts, monthly/yearly interaction, plan URLs and honest illustrative pricing. Smaller header, simpler feature alignment. Growth gets a cobalt top rule, not a large tinted recommendation card. | Instant/120 ms price update, no number rolling. | Thin connection rule → breathing room and clear plan comparison → small ending lead marker points toward closure. |
| 12. Final CTA / final impact | Full-width cobalt field, with paper text, a single completion terminal and one large italic line. “Every lead deserves / a clear next step.” Primary “Try your lead” to `#lead-demo`, secondary `/app`. Preserve `/demo` access in footer/supporting pages. | Signature 5 once. Always show buttons immediately. | Marker seals the terminal → motion ends on a stable completed route. |
| Footer / rest | Keep existing useful links and portfolio disclosure, paper background, compact hierarchy, legible ≥12 px copy. | None. | A quiet rule resolves the cobalt panel → page ends without another feature or animation. |

Retired homepage presentations are not deleted wholesale: full dashboard remains `/app`; full automation editor remains `/app/automations` and `/product`; complete pipeline remains `/app/pipeline`; full analytics remains `/app/analytics`. Reuse existing features and domain logic.

## F. Five signature interactions

### 1. Lead Engine

Use the sequence in D. A visible packet causes a gate response, score response and selected route. The first 1 second must visibly move the packet a meaningful distance. The score/owner cannot change independently of the packet arriving. User actions never wait for animation completion. One animation clock; at most two moving markers, with only one featured.

### 2. One lead, six decisions

Use one stable `LeadSpecimen` keyed by identity, not by active step. Its identity, leading cobalt edge and reference `G / 001` remain visually recognizable. Its content regions change with the six states; never remount the whole specimen or show six separately animated cards.

| Stage | Persistent object's visible change | Supporting text |
| --- | --- | --- |
| Capture | Marker expands into a short intake record, revealing name, service, budget, timeline. | “Collect the context that changes the next step.” |
| Qualify | Budget, timing and company fields align with three gates. Presence/context checks resolve; no AI scanning. | “Make the signals legible.” Service is context, not a scored input in current rules. |
| Score | Record opens a calibrated lower edge; marker lands at 91; 30 base +35 budget +21 timing +5 company appear. | “A score you can explain.” |
| Route | Three routes become visible. ≥75 path to Jamie takes cobalt; 55–74 Discovery and <55 Nurture stay labelled. | “Put the opportunity with the right person.” |
| Follow up | The record retains score/owner; a time rail extends from its right edge to a prepared-response terminal and a +1 day reminder tick. | “Give the conversation a next step.” Show simulation/proposed action, not a sent email. |
| Convert | Record extends into an opportunity row; example advances through Proposal to Won, value £7,500, closed check terminal. | “Carry the context all the way through.” Always label illustrative outcome. |

The scroll chapter tells a **sample lifecycle**, including a possible Won outcome. It does not mutate stored data. Later interaction sections zoom into operations and let the visitor make their own record. The explicit sample-to-real handoff prevents the narrative from claiming that a submitted lead was automatically won.

### 3. Automation execution

Use a finite state machine `idle → trigger → condition → branch → action → scheduled → complete` (or `stopped`). Do not loop `.running` classes forever. Reuse a shared definition/evaluator with the full editor, not a second set of flow rules.

- Controls: Run example / Stop / Replay; route input label and editable budget threshold. On desktop use a compact side inspector opened by a real button; on mobile inline below the condition. Maintain keyboard access.
- Default input is the example £7,500 lead. If the visitor has created a lead this visit, use its value and show its name. Changing this input never changes the user's actual record.
- Timeline: trigger 0–300 ms; travel to condition 300–650; evaluate 650–1050; branch travel 1050–1450; primary action receipt 1450–1950; scheduling 1950–2350; stable complete by 2800 ms.
- `value > threshold` selects YES; equality selects NO, matching current code. NO goes to Nurture, skipping priority/owner actions. Both branches remain visible. Use the exact stored numeric threshold; validate finite nonnegative input.
- YES receipt exposes existing steps in a readable cluster: mark priority, assign owner, prepare first response, schedule check, notify owner if no reply. Group visually without hiding the actual steps or pretending they ran externally.
- Delay shows `Scheduled · +1 day`, not a one-day animation. User edits to the existing flow values must appear in the receipt. A changed rule invalidates the previous presentation and returns to idle with an explanation.
- After completion, remove the transient packet and leave one completed route. Pausing the flow disables running. Stop does not alter values or saved leads.
- Reduced motion produces the same evaluated route and receipt immediately. In `/app`, keep state updates local to the editor; no cinematic entry or auto-run.

### 4. Homepage lead → actual workspace record

This is the most important proof of product reality. Reuse `createLead`, `addLead` and the existing highlight URL.

1. Validate normally. On a valid submit, create exactly one Lead and add it to the provider immediately. Lock duplicate submit for that operation. Do not wait on a decorative timer to commit.
2. Remember the returned ID in a lightweight homepage session context (`activeLeadId`). It is a reference into the existing provider, not a second copy of the lead. “Try another” clears form/result presentation but does not delete saved records.
3. Preserve the form/result area's space. Over at most 700 ms, transform its leading rule into a record row and reveal final score/route. No 2.25-second pretend analysis delay. If reduced motion, show result immediately.
4. The adjacent/below Opportunity desk displays that exact provider record at the top, with a 600 ms wash fading to its normal state. Render actual name, score, status and owner. Live data must replace all stale “Alex / 91” labels in that interactive region.
5. CTA remains `/app/leads?highlight=<id>`. Link navigation is normal and never delayed by a transition. Wait for `ready` before resolving the highlight; briefly reveal/focus the correct row once. Provide “Open details” as a clear control. Do not auto-open a modal over the user's destination.
6. Announce once: “Lead saved in this demo workspace. Score 91. Assigned to Jamie Lee.” Adapt wording to actual route and storage notice. If storage is unavailable, say saved for this visit. No emails are sent.
7. Refresh `/app/leads?highlight=<id>` must still show the same persisted UUID. An unknown/stale ID yields a useful message and normal directory, not an error or sample substitute.

No cross-route FLIP framework or full-screen morph is required. Matching object geometry, identity, leading rule and a brief destination highlight provide continuity reliably. No confetti, success orb or forced navigation. The real result is success; the motion merely makes it visible.

### 5. Final closure

On first entry at about 45% visibility, a short paper route on the cobalt field completes over 600 ms. A 12 × 8 marker travels its final 80 px and resolves into a check terminal in another 150 ms. It plays once per page visit and stops. The headline and CTAs are already visible.

- Without user submission: terminal says `G / 001 · Example outcome · Won`. It is the same sample story, not a claimed customer result.
- With a created lead: show its actual name and current stage, labelled `Your demo lead`; do not mark it Won. If it has been deliberately moved to Won, the completion status may reflect that.
- The closing copy works in either case: “Every lead deserves a clear next step.” No statement that every enquiry converts.
- Mobile: a 56 px vertical final segment above the terminal, same ≤750 ms resolution. Reduced motion: completed static segment.

## G. Scroll choreography

### Page intensity

```text
Hero          Intake      Journey      Capture      Desk       Automation
IMPACT  5  →  CALM  1  →  BUILD  4  →  INTERACT 3  →  CALM 2  →  BUILD 4

Pipeline      Photograph      Solutions / Connections / Pricing       CTA
PRODUCT 3  →  REST  1      →   CONSIDER  2                         →   IMPACT 5
```

Only the journey pins. No scroll smoothing dependency, wheel interception, forced snap, horizontal page scrolling, or navigation locked behind an animation. Native page scrolling is the master interaction. Browser find, hash links, Home/End and keyboard navigation must work.

### Desktop journey geometry and states

Apply sticky mode only at width ≥1024 px **and** viewport height ≥740 px, with normal motion preference. All other cases use the compact manual layout.

- Heading sits before the scroll track. Sticky panel top: header height +16 px, normally 88 px. Panel height: `min(680px, 100svh - 112px)`; use natural content height if text enlarges beyond this, then disable pinning.
- Track height = panel height + **1800 px** scroll travel. Six stages therefore get about 300 px of deliberate travel. Do not add this runway on mobile, reduced motion or failed enhancement.
- Progress `p = clamp((scrollY - (trackDocumentTop - stickyTop)) / 1800, 0, 1)`. Recompute geometry on resize/fonts loaded, not on every frame. `stage = min(5, floor(p * 6))`.
- Within each sixth: first 20% holds the previous/foundation state, middle 60% resolves the one meaningful change, final 20% holds the new state. Capture's foundation is the visible intake marker. At p=1, hold the completed record without resetting.
- Use one passive listener that schedules at most one rAF read/write while the track is near view. React state changes only at stage boundaries; continuous path progress goes to local CSS variables/SVG transforms. Never re-render the whole homepage on scroll.
- Scroll backwards reverses presentation only. No provider writes, score recalculation side effects, announcements or analytics events per pixel.
- Six explicit stage buttons remain available. Clicking/keyboard-selecting sets a manual override at the current scroll position; show **Follow scroll** to release it. The override ends when the chapter leaves view. Do not silently fight the selection, move page scroll, or prevent exiting the chapter.
- Provide **Skip the journey → Try a lead** at chapter start. The link targets `#lead-demo` with appropriate scroll margin below the header.

### Boundaries and continuity

Use section-local SVG/DOM connectors that meet consistent gutter anchors. Do not draw one fixed SVG over the full document. Each section owns its own marker; at a handoff only one is visible. Fade the departing representation at the section boundary and reveal the receiving representation already at the matching anchor. This is a perceptual handoff, not a global canvas that follows the pointer or obstructs content.

No motion across the photograph or pricing decisions. In these calm regions, the continuity is carried by a small reference, matching score/routing notation, and aligned rules. A line may become a chart baseline, but its geometric transformation must not suggest invented numeric values.

For programmatic jumps/deep links: render the receiving section in a coherent final state immediately. Never require the visitor to scroll past preceding scenes to see content. Observer callbacks may enhance visibility, but content must not start permanently transparent.

## H. Object continuity and data ownership

### The canonical illustrative lead

Define one pure example input in `src/lib/lead-story.ts`:

```text
Reference: G / 001 (presentation only; never a provider UUID)
Name: Alex Morgan
Company: Northline Studio
Email: alex.morgan@example.com (do not feature email in the hero)
Service: Website redesign
Budget: £5,000–£10,000
Timeline: Within 30 days
qualify(input): value £7,500; score 91; High; Priority sales queue
Illustrative assigned owner: Jamie Lee
```

Call `qualify` to derive the result. Do not call `createLead` for illustrative rendering; it generates IDs and implies a real record. Do not bind this story to sample-1, whose current stored owner/status differ.

### Identity through the page

| Location | Representation | Data authority |
| --- | --- | --- |
| Hero | Chamfered marker → anchored route terminal | Pure example input/result |
| Intake gap | Short ruled example row | Same example |
| Journey | Marker → context record → ruler → routing record → scheduled action → example Won row | Same example with presentation-only lifecycle |
| Lead demo before submit | Visitor's editable form; explicit end of sample story | Local form state |
| Lead demo after submit | Actual record with same leading marker and score geometry | Provider Lead referenced by UUID |
| Opportunity desk | Highlighted real row; otherwise clearly labelled sample records | Provider |
| Automation showcase | Same selected input in a clearly labelled simulation | Provider input snapshot or example; simulation never writes to provider |
| Pipeline | Actual current stage and explicit user move; without a new lead, featured existing example record | Provider; avoid always using `leads[0]` implicitly |
| Editorial / solutions / pricing | Small non-personal `G / 001` reference if needed, no personal data decoration | Presentation only |
| Final CTA | Sample closure OR current actual lead status | Explicit mode, never fabricated Won |

Use a homepage-only `JourneyContext` with `activeLeadId: string | null`, `setActiveLeadId`, and a motion-paused preference. Resolve the record via `useLeads()`. Do not persist a second lead array, repurpose storage keys, or put transient scene progress into the domain Lead type. A session-only active ID is sufficient; the existing query-string highlight carries identity into the app.

### Scoring, routing and status language

- Scoring is deterministic: **30 base + budget (8 / 22 / 35) + timeline (4 / 12 / 21) + company present (5)**, capped at 99. Both £5k–£10k and £10k+ use the 35-point budget contribution. Service is useful context but contributes no points today. Do not show it earning fictional points.
- Priority routes: score <55 → Nurture sequence; 55–74 → Discovery consultation; ≥75 → Priority sales queue. Exact existing next actions stay. High-intent creation starts Qualified/owner Jamie; other creation starts New/Unassigned.
- Score is an **intent index**, not a conversion probability. Display `91 / 100`, not “91% likely to buy”. Show 55 and 75 as labelled ruler thresholds in expanded views; compact rows can use the number, short ruler and accessible full label.
- A stored seed score may not match today's rule output. Show it as a recorded sample score; only show the computed contribution breakdown when it reproduces the stored score. Route explanations should use the stored score consistently. If extracting a shared `routingForScore` helper, retain `qualify` outputs and tests unchanged.
- Pipeline status is separate: New, Qualified, Contacted, Proposal, Won. Do not infer that a high score is Won, or that a Won lead must have a high score.
- Automation's budget condition remains a distinct editable demonstration rule. “YES” means that condition passed, not that `qualify` necessarily returned High.

## I. 3D and motion implementation plan

### Renderer responsibilities

Keep `src/components/three/lead-engine.tsx` as the only WebGL entry. Rebuild its scene graph, not the application. Introduce a pure topology/configuration shared with an accessible `RoutingDiagram` SVG. The primary geometry can be procedural boxes/rails with chamfered silhouettes; do not add GLTF loaders, models, texture atlases, physics or postprocessing.

| WebGL | Lightweight DOM/SVG/CSS |
| --- | --- |
| Gate depth, guide rails, switch housing, packet, contact plane | All words, score ruler labels, input/output descriptions, CTAs, pause/replay |
| One orthographic hero composition ≥1024 px | Entire mobile/tablet hero |
| Same shared state/time as overlay | Lead journey, automation schematic, dashboard, pipeline, charts, final CTA |

### Loading and lifecycle

1. Server-render the textual hero and static diagram. Reserve its aspect/height so no layout shift occurs.
2. In the existing client hero boundary, check media, reduced motion, visibility and optional save-data/connection capability. Unknown device capabilities are not an error; use conservative defaults.
3. Load Three dynamically after the text/buttons are painted and the hero is visible. Schedule with `requestIdleCallback` with a short timeout or a simple post-paint fallback. Do not make a fast desktop wait seconds for activity: the lightweight marker sequence starts independently.
4. Import `ssr: false` only from a Client Component, in accordance with installed Next 16.3.6 docs. No root import of Three from shared types/config.
5. First successful render sets a local ready state; SVG geometry gives way without moving DOM labels. A failed renderer leaves the SVG visible.
6. Render only while a motion segment is active or after resize/state changes. Stop rAF entirely during holds, pause, offscreen or hidden document. Timers for sparse ambient activity exist only while visible.
7. ResizeObserver updates dimensions/camera and cached screen anchors. No global mouse listener. No per-frame layout read.
8. Use elapsed milliseconds, not `frame += constant`. Clamp resume delta. Handle context lost/restored; if restoration does not succeed, stay on SVG. Avoid repeated recreation loops.
9. On teardown disconnect observers/listeners, cancel timers/rAF, dispose geometries/materials once (use unique sets for shared resources), dispose renderer and remove canvas. React Strict Mode mount/unmount must not leave two scenes.

### Render limits

- ≤32 draw calls, ≤15k triangles, ≤4 shared materials, ≤2 lights (ambient/hemisphere + one directional); no shadow maps. Contact shading can be one simple translucent plane shape.
- DPR 1.25 default desktop, ceiling 1.5. Never blindly use device DPR 2/3. If measured visible active rendering averages >24 ms/frame over 120 frames, lower DPR to 1; if still persistently slow, use 30 fps active segments or SVG. Do not increase DPR again during that visit.
- No new WebGL instances in product pages, scroll sections, footer or modals.
- No graphics fetched over a network. All geometry generated locally. No continuous allocations during animation.
- Cache path samples/lengths once. Translate the marker along the shared route; do not rebuild curves or buffers per frame.

## J. Image art direction

**Use exactly one meaningful photograph**, in the business-context/philosophy spread after Pipeline + insight and before Solutions. The homepage currently has no photography. A single physical environment gives the visitor a rest from diagrams and reminds them that routing supports real work.

Required image brief:

- Documentary photograph of a small joinery/interiors workshop in use: one craftsperson's hands measuring a finished timber sample on a working bench; part of the room and daylight visible. No posed team, handshake, laptop presentation, camera-facing smile, glossy corporate office or simulated customer endorsement.
- Natural side light, tactile timber/plaster/metal, warm neutral color, moderate contrast. The business is active but the image feels observed, not staged. Cobalt comes from the surrounding design, not a blue photo filter.
- Desktop crop 16:10, image occupies approximately 7/12 columns (around 730 × 456 px). Mobile 4:3, full content width, followed by copy. Keep the hands/work area around focal point 45% x / 60% y so both crops remain useful.
- Rectangular crop, no radius, no tilted frame, no overlaid glass caption or text over faces. Small external caption: “More time for the work that matters.” Do not name a customer or claim measured improvement.
- One source image, responsive derivatives about 480, 800, 1200 px wide; AVIF/WebP with explicit dimensions and lazy loading. Target mobile ≤70 KB, desktop ≤140 KB. No photo in the hero.
- Proposed asset names: `public/images/growora-business-context.avif` and WebP fallback. Record source, license and any required attribution in `public/images/README.md` when acquired. A genuine, licensed photograph is the primary choice; no fabricated AI people.

**Asset status: not acquired in this planning turn.** Do not let sourcing block the hero or core product stages. If a suitable licensed photograph is unavailable at the image stage, ship that same spread as an intentional typographic statement on paper with a large existing Growora mark and the exact editorial copy. No stock placeholder, broken URL, unrelated image or empty grey rectangle. The rest of the direction does not depend on this asset.

## K. Product UI plan

The app uses the same visual vocabulary at lower intensity. No auto-playing diagrams, scroll pinning, chart drawing on route entry, hero-like headlines or animation when opening a routine page. Working state changes are normally 120–180 ms; reduced motion makes them immediate.

### App shell and common rules

- Preserve nav routes, command search, notifications, documentation, profile/settings, workspace identity, existing local storage and dialogs.
- Keep the quiet sidebar and cobalt active rule. Remove purely decorative 01–08 nav counters; retain actual lead count. Use one distinct functional icon per section or plain text, not glyph substitutions.
- Page titles name the task. Keep a short explanatory subtitle only when it helps the current action. The first useful data should appear within 240 px of the topbar on desktop and 280 px on mobile.
- Tables: row height 56 px normal, 44 px compact; header 40 px. Names 14 px, secondary copy 12 px, numbers aligned right/tabular, rows separated by rules. Select controls and icon buttons remain ≥44 px targets on touch.
- Status: text + small square/shape, no pill. New = open grey square; Qualified = cobalt square; Contacted = outlined communication mark; Proposal = amber open square; Won = muted green check. No color-only distinction.
- Score: standard linear ruler + number; never two different gauges in the same workspace. Expanded detail explains thresholds and compatible score contributions.
- Routing is a small readable statement: `Priority sales → Jamie Lee`, with a next action. It is not a badge. Unassigned is explicit; no empty avatar posing as an owner.
- Forms/automation/settings: decide persistence language consistently. Retain current autosave behavior, replace redundant Save controls with a non-interactive “Saved locally” status unless a genuine draft/commit interaction is deliberately implemented. Do not add an unnecessary second persistence system.

### Overview / Dashboard

Keep the metrics and working chart, but make the first working region **Next actions**: a ruled list of up to 5 high-intent open leads, sorted by score then newest, with owner and suggested action. Label this rule; do not invent overdue timestamps or scheduled tasks that the data model does not contain.

Desktop layout: 8 columns action register, 4 columns compact source distribution; four KPIs in a 96–112 px strip above; secondary trend and stage totals below. Replace source donut with horizontal source rows showing count and proportion. A subdued line chart is secondary, not the whole dashboard's reason to exist. Remove metric arrows unless there is a real previous-period comparison (none is currently implemented).

Mobile: show action register before charts. KPIs are a compact 2 × 2 strip. Source list is text + short bars; show a readable chart around 220 px high with accessible data view. Keep full record links.

### Leads and details

Preserve search, filter, sorting, export, add and highlight behavior. Desktop core columns: Lead (name + company), Score, Route / owner, Stage, Value, Updated; keep email/source in detail or an optional expanded view. Do not remove these fields from CSV. Avoid repeating company in two columns.

Mobile default becomes a semantic list of compact records: name + company, score at trailing edge, stage and owner on second line, next action on third. A **Table view** can preserve full horizontal inspection, but essential status should not require horizontal scrolling. Filters collapse under a labelled Filters disclosure showing active count. Sorting remains directly available.

Keep the native detail dialog, improved into a paper dossier: identity → score/route → qualification facts → stage/action → notes/activity. 760 px max width desktop, nearly full-width mobile with internal scrolling, stable close button. Ensure focus return, Escape, visible validation and one status announcement. Keep user-entered notes intact across route/style work.

### Pipeline

A kanban board is appropriate in the actual product. Keep drag/drop and per-card stage selection. Tighten cards to a useful 136–156 px base height: company/name, value, owner, one score, next-step access. Remove decorative grip when the device cannot drag; never remove the keyboard alternative.

Each column header shows stage, count and sum in one 64 px band. Keep all stages including empty columns. On mobile default to a labelled stage selector with counts and one full-width list; provide a Board toggle for horizontal overview. A selected lead's stage move is explicit and announced. Won never wraps to New merely because a “next” button was clicked; backward movement requires an explicit stage selection.

### Automations

Keep the current ruled flow list; it already feels more specific than a card grid. Reduce its marketing introduction and show truthful Enabled/Paused state from the existing keys beside each flow (do not show invented run counts). The selected editor keeps node selection, values, enable state and the alternative branch.

Use the same IN / IF / action / delay geometry as marketing, with larger node labels and a finite test run. Desktop inspector stays at right; mobile selected-node settings expand immediately below the selected node or in an accessible native dialog, not one screen below the entire graph. Display the full configuration string, not a bare “2000” with its unit/condition lost. Non-numeric variant conditions must not inherit the “Minimum budget (£)” label.

### Forms

Keep the existing form list and builder actions. The list's editorial rows are good; reduce large serif form names to 22–24 px and enlarge counts/labels. Explicitly mark traffic counts as sample data.

Builder desktop: field-order register left, selected field properties right, preview as an existing dialog. A field summary row shows number, label, type and required state; expand editing for the selected row. Mobile uses the same summary/expand behavior with reorder controls; avoid rendering every field as a tall fully expanded editor. Preserve IDs, ordering, validation, budget-comma handling and preview-only submission semantics.

### Analytics

- Share a single reporting-window calculation between overview and analytics. Anchor to the latest dataset record (with the existing September 2026 fixture fallback), explicitly show the ending date, and use UTC boundaries. Do not silently compare a fixed “September 2026” label with newer records.
- Keep cumulative chart but call it **Cumulative captured leads**. Date ticks and integer values are real; zero baseline stays. Use a solid 2 px cobalt line, max 6% fill. Static on initial display, keyboard/touch point inspection and a data table alternative.
- Replace decorative tapered funnel with labelled horizontal bars based on actual counts. Separate illustrative visitors visually. Distinguish “High intent (score ≥75)” from “Progressed beyond New”; current “Qualified” funnel label conflates them. Do not claim cohort funnel conversion from arbitrary current stage counts.
- Value by stage uses a shared zero-to-maximum-stage-value axis, labelled GBP; source distribution uses count/total. No arbitrary 240%/300% multipliers. Empty datasets show truthful zero/empty states without NaN widths.
- Remove repeated KPI cards and irrelevant arrows. Retain source table, range controls and access to the lead directory.

### Integrations / settings / supporting marketing

- Integrations: keep search, filters, details and local simulation toggles. Names/categories/proposed events carry the design; replace provisional letter logos with text-led rows, using official assets only if locally acquired with a valid source.
- Settings: keep workspace/density/timezone/notification/threshold preview/data controls. The preferred lead threshold remains a preview distinct from homepage qualification until a separate product decision changes it. Preserve reset confirmation and export.
- `/product`: reuse the six-stage diagram in **manual** mode (no extended scroll runway), full capture/editor/pipeline/analytics sections. Avoid a second hero WebGL.
- `/solutions`: retain the industry selector; use the new type sizes and routing terms. `/integrations` retains the full directory. `/pricing` retains full comparison and FAQ.
- `/demo` and `/contact` retain `DemoRequest` behavior; it saves a request, not a lead. Do not merge it with LeadCapture accidentally. Preserve plan query strings.
- About/docs/guides/legal: keep readable editorial layout, update explanatory text only to match changed behavior. Docs must retain accurate scoring and local-data descriptions. Keep metadata, sitemap, noindex rules and error states.

## L. Mobile and tablet plan

| Surface | 390 px decision | Tablet / short landscape |
| --- | --- | --- |
| Hero | Top-down SVG intake instrument, readable gate/route labels, score visible, no WebGL; D specifies first viewport. | SVG until 1024; wider diagram may use desktop left-to-right topology. |
| Lead journey | Six 44 px buttons arranged 3 × 2 above ONE stable specimen. Current step title + “n of 6”; Previous/Next controls, no autoplay. Panel target 420–520 px. Expandable plain-language transcript. | Manual mode whenever height <740, no sticky trap. |
| Capture | One concise heading; form labels ≥14, inputs 16 px/48 px tall. Name/company full-width; budget/timeline full-width if native select values truncate. No repeated intro screen. | 2-column fields when content fits, no scale transform. |
| Opportunity desk | Featured live lead plus up to two other compact rows, two summary metrics and a clear Open workspace link. No fake sidebar, donut, or shrunken desktop table. | Four metrics permitted; prioritize the same selected lead. |
| Automation | One vertical rail, 5 semantic groups (trigger, condition, route/action group, delay, receipt). Alternative route under the condition with YES/NO labels. Expand configuration locally. | Wide schematic only when labels remain ≥12 px. |
| Marketing pipeline | One featured lead; full-width stage select or labelled 5-step rail. All current value/status visible without lateral swipe. Move remains a user action. | Compact lane view; no miniature full board. |
| Actual app pipeline | Stage list default, Board optional; preserve stage select and details. | Board uses controlled horizontal overflow only inside its region. |
| Analytics | Real names, values and ≥12 px labels. One chart at a time, optional table. Hide redundant ticks, not data. | Shared axes and readable labels; no tiny full desktop chart. |
| Editorial photo | 4:3 crop, no overlays or parallax, copy below. | 16:10 or 4:3 based on real image focal point. |
| Solutions | Existing compact 2-column industry options with ≥44 px targets; selected text panel below. | Text remains readable; no hover-only information. |
| Pricing | Three compact ruled plan sections. Price/name on first row; up to four readable features and direct plan CTA each. Billing toggle always visible. | 3 columns only if names, prices and targets fit. |
| Final CTA | Full-width cobalt, 40/42 px statement, static or one short terminal resolution, 48 px action. No huge blank panel. | Natural content height. |
| App shell | 64 px bar, accessible drawer, search and activity controls. Current app page indicated. | Sidebar appears at 1024 only if working area remains usable. |

Check 320, 360, 390, 768, 1024, 1440 and 1920 widths; 390 × 844 and 1440 × 900 are mandatory visual acceptance sizes. At 200% zoom allow natural page height and use compact/manual layouts. Do not use `overflow-x: hidden` to conceal layout mistakes. Only intentional tables/board regions may scroll sideways.

## M. Performance budget

These are **implementation acceptance targets**, not measurements from this audit. Measure a production build; dev compilation and HMR are not performance evidence.

| Budget | Target / rule |
| --- | --- |
| Homepage critical JS | ≤230 KiB gzip transferred before optional hero renderer; reduce shared client scope if over budget |
| Deferred hero increment | ≤220 KiB gzip including Three; desktop-only download; total homepage JS target ≤450 KiB gzip |
| Mobile/reduced motion | Zero Three/WebGL chunk requests; no extra motion library |
| CSS | Homepage ≤32 KiB gzip; app route total ≤45 KiB gzip. Remove superseded rules during staged ownership work. |
| Fonts | ≤140 KiB combined initially used WOFF2, at most 3 faces (DM normal; Newsreader normal/italic); no remote font requests |
| Imagery | One lazy photo, ≤70 KB mobile / ≤140 KB desktop; no hero raster/video |
| Rendering | One WebGL context, I's geometry/DPR limits; target ≤6 ms renderer CPU+GPU work per active desktop frame on test hardware |
| Main thread | No motion-induced long task >50 ms during steady use; no synchronous form work beyond validation/create/insert |
| LCP | ≤2.5 s on representative mobile production test; hero text is immediately available |
| CLS | ≤0.05 target; canvas, font fallback, result region and image have stable space |
| Interaction | ≤200 ms INP target when field data exists; use lab interaction traces as a proxy before deployment, not an invented field measurement |
| Idle | No active rAF when scene paused/offscreen/hidden or holding still; no chart animation on each route render |

No dependency additions for animation, charts, scroll smoothing, icons or state management. Prefer CSS transitions, SVG, Web Animations API for isolated transitions and small native React hooks. Use transforms/opacity; path drawing is limited to small diagrams with cached geometry. Animate no blur, filter, big shadow, full-page background, layout height or hundreds of DOM elements.

Optimize loading boundaries before minification tricks. Keep route pages server-rendered, with client islands for controls. Shared pure types/config must not pull Three or entire application editors into mobile marketing. Measure bundle/network output after each major feature; a failed budget is a reason to simplify the feature, not to conceal it with a loader.

## N. Accessibility and reduced motion

- Keep one logical H1, ordered headings, semantic landmarks, skip link and real links for navigation. Update the app overview heading structure without losing its current accessible title.
- Native form validation and labelled fields stay. Visible errors attach to the relevant field. A button indicates its action rather than “Continue” without context.
- All clickable targets at least 44 × 44 px on touch; keyboard focus is a 2 px cobalt outline offset 3 px on paper, paper outline on cobalt. Focus is not conveyed solely by a background tint.
- Keep `tabKeyboard` semantics or equivalent roving tabs with selected state/panel association. Scroll-selected decorative stages must not steal keyboard focus or announce every progress increment.
- Hero canvas/SVG embellishment is `aria-hidden`; adjacent text summarizes source, rule, score, selected route, owner and next action. Do not duplicate that summary in several accessible diagram layers.
- Score: readable “91 out of 100, High intent”; use suitable meter semantics where appropriate, with min/max/value. The ruler is not an input slider unless it actually edits a value.
- Branch alternatives are labelled YES/NO or named priorities. Waiting/completed/error each have text and shape. Color alone never supplies meaning.
- Chart keyboard/touch inspection and equivalent values table; tooltips are not hover-only. Counts and axis scales remain readable at mobile width.
- Native dialog focus trap/escape/background handling stays. Verify focus returns to the opener after close, long mobile dialog scroll remains usable, and mobile nav background is inert while modal navigation is open.
- One `aria-live=polite` result announcement for submission or stage move. Do not expose every timer tick or frame as a live region.
- `prefers-reduced-motion: reduce`: no WebGL import, no packets, no sticky runway, no faux processing delay, no chart draw, no animated scroll, no expanding scene zoom. The selected final state and all six manual story steps remain available.
- A visible Pause motion control covers ongoing hero motion. Stop simulation covers automation; all autoplay stops while the tab is hidden. No flashing or bouncing elements.
- No-JS: headline, navigation, story transcript, static hero route, pricing and explanatory copy remain visible. Interactive local demo controls must not claim a submission succeeded without JavaScript.
- Persist content during font loading; do not shrink text below these tokens to preserve an idealized screenshot.

## O. File and component ownership

Paths below are repository-relative. Do not implement all rows in one turn. The plan adds small presentation components while preserving business logic.

### Existing files to edit deliberately

| File | Intended change | Preserve |
| --- | --- | --- |
| `src/app/page.tsx` | Reorder sections per E; compose homepage continuity provider and focused views | Server page, canonical metadata, MarketingShell |
| `src/components/marketing/hero.tsx` | New masthead/action band, open engine, pause/replay, responsive enhancement boundary | Immediate HTML headline/links, dynamic import pattern |
| `src/components/three/lead-engine.tsx` | Replace processor scene with routing assembly and state/time input | Single scene, observers, fallback, cleanup; improve frame clock |
| `src/components/marketing/sections.tsx` | Incrementally delegate Workflow to new journey, simplify Problem/Pipeline/Analytics/Connections, relocate Philosophy into editorial spread | Solutions data/tab behavior, pricing data/toggle/links, exported compatibility for `/product` |
| `src/components/product/lead-capture.tsx` | Immediate insertion, duplicate-submit guard, finite result presentation, optional `onCreated(id)` | Input validation, local scope, result route, notice, compact use in modal |
| `src/components/product/dashboard.tsx` | Refine full Dashboard; delegate homepage preview to focused opportunity desk | Provider, real metrics/range, links, chart calculation after accurate range fix |
| `src/components/product/automation.tsx` | Shared flow definitions/evaluator; finite execution sequence; readable values and mobile inspector | All five flow IDs, settings keys, enable state, node selection and current values |
| `src/components/ui.tsx` | Standardize linear ScoreMeter, tokens, focus/target sizes; keep current API or compatibility adapter | Logo/Mark, ButtonLink, Dialog and tab keyboard behavior |
| `src/components/marketing/shell.tsx` | Header sizing/labels, final cobalt closure, footer legibility | Navigation routes, responsive menu, all footer access |
| `src/components/app/shell.tsx` | Smaller task headings, simpler nav decoration, drawer accessibility | Search, notifications, prefs, route handling |
| `src/components/app/leads.tsx` | Data hierarchy, mobile list, route explanation, robust highlight readiness | Filters, sort, CSV escaping, notes/status and details |
| `src/components/app/pipeline.tsx` | Denser board, mobile stage-list mode, explicit moves | Drag/drop, stage select, activity and details |
| `src/components/app/automations.tsx` | Tighter flow register; real persisted enabled state summary | Selection and editor IDs |
| `src/components/app/forms.tsx` | Collapsible field register and truthful autosave indication | Form/field IDs, ordering, options parsing, preview validation, storage schema |
| `src/components/app/analytics.tsx` | Accurate reporting window/bars/labels and keyboard-readable chart data | Existing source/stage data and navigation |
| `src/components/product/integrations.tsx` | Text-led connection register | Search/filter/dialog/simulation behavior |
| `src/components/app/settings.tsx` | Typography/density/save-status wording only as needed | Storage keys, reset confirmation/export, preview threshold distinction |
| `src/app/layout.tsx` | Controlled font subset cleanup, tokens/import ownership as staged | Providers, metadata, skip link, styles needed by existing routes |
| `src/app/globals.css` | Base tokens, resets, accessibility, remove migrated superseded component rules in stages | Untouched component layout rules until migrated |
| `src/app/art-direction.css` | Marketing/hero/story composition ownership; replace existing rules instead of appending repeats | Working subpage/responsive rules until verified |
| `src/app/product-surfaces.css` | Shared product primitives, score, rows, forms, schematic and chart geometry | Shared marketing/app compatibility |
| `src/app/app/app.css` and `design.css` | Consolidate working app rules into app.css component by component; remove duplicates, then remove empty design.css import | Mobile, dialogs, compact mode and untouched pages |
| `src/app/[slug]/page.tsx` | Select manual story mode on product, update reusable component variants/docs when behavior changes | Static params, metadata, all 11 routes and editorial/demo distinctions |

### New files with narrow responsibilities

| New file | Contract |
| --- | --- |
| `src/lib/lead-story.ts` | Pure example input, six presentation states, shared route topology/config; no browser/Three imports |
| `src/lib/automation-flow.ts` | Extract existing variants and pure condition evaluation; distinguishes test input/result from lead store writes |
| `src/lib/reporting.ts` | Shared reporting anchor/window and truthful chart/bar calculations, introduced with analytics stage |
| `src/components/marketing/journey-context.tsx` | Homepage-only activeLeadId and pause preference; resolve actual records from existing provider |
| `src/components/marketing/lead-journey.tsx` | Six-state sticky/manual wrapper, controls and readable transcript |
| `src/components/marketing/opportunity-desk.tsx` | Focused provider-backed homepage preview, selected-record emphasis and app links |
| `src/components/marketing/automation-showcase.tsx` | Compact causal demo using shared flow evaluator, no duplicate persistence |
| `src/components/marketing/business-context.tsx` | One responsive editorial photo/copy spread or deliberate typographic fallback |
| `src/components/visual/lead-specimen.tsx` | One stable presentation of a lead; explicit illustrative/actual mode; no data mutations |
| `src/components/visual/routing-diagram.tsx` | SVG hero fallback/mobile topology, shared anchor geometry and meaningful static summary |
| `src/hooks/use-motion-preference.ts` | SSR-safe reduced-motion subscription and cleanup; no animation library |
| `src/hooks/use-section-progress.ts` | Bounded visible-section progress with cached layout and one pending rAF |

Do not add files for every minor transition. Start with these contracts, co-locate small helper functions, and avoid a generic animation framework.

### Do not rewrite

- `Providers`/`useLocalState` storage schemas, keys or persistence behavior for an aesthetic change. Small readiness/error fixes are allowed when required, with explicit validation.
- `qualify`, `createLead`, stage names, GBP formatting or current scoring rules. Extracting shared route lookup is acceptable only with unchanged outputs.
- `src/data/demo.ts` fictional records to make screenshots look tidier. Existing stored records must remain intact.
- `DemoRequest` as LeadCapture; they have different purposes and storage.
- Native Dialog, keyboard tab helper, CSV escaping, accessible pipeline selectors or form builder option parsing.
- Error/not-found/loading routes, sitemap, robots, OG generation and static route configuration without a specific verified need. Update visual tokens only where inconsistent.
- Package manager, framework version, build configuration or the whole CSS architecture in one step. No project restart, blanket `!important` patch or mass dependency upgrade.

## P. Numbered implementation stages

Each stage ends with a checkpoint entry recording files changed, checks actually run, unresolved issues and the next stage. Use a recoverable source snapshot/version-control checkpoint before the first code edit because this supplied directory has no Git metadata. Preserve existing user work; do not initialize/restructure the project just to perform a design task.

| Stage | Scope and concrete output | Completion gate |
| --- | --- | --- |
| **0 — Recovery and direction** | Repository/source inventory, live desktop/mobile audit, baseline checks, this plan and progress document. | **Complete in this turn.** No production source redesign. |
| **1 — Foundations and static hero** | Snapshot baseline; read installed Next docs; centralize semantic tokens as used; implement pure example/topology, routing SVG, hero layout and 390 px design. Keep the current renderer disabled only inside the new hero until aligned, not remove Three globally. Fix mobile text spacing. | Static hero reads source → decision → route at 1440×900 and 390×844, CTA visible, no overflow; reduced-motion/no-WebGL fallback complete. Typecheck/lint/build. |
| **2 — Lead Engine motion and 3D** | Rebuild the one Three scene, synchronize DOM/SVG, first-load sequence, pause/replay, visibility/clock/cleanup/DPR. | All states readable, first-second energy visible, no duplicate canvas, desktop budget measured, zero Three requests on mobile/reduced motion. Browser check and build. |
| **3 — Six-stage journey** | Stable LeadSpecimen, bounded scroll track, six step controls, manual/mobile/reduced modes; replace only homepage workflow, manual variant in product. | No remount flashes or skipped reading windows, reverse scroll safe, keyboard/manual override/skip work, no provider mutation. Visual tests at both required sizes. |
| **4 — Real lead handoff** | Reorder capture and preview; immediate single insert, activeLeadId context, focused Opportunity desk, robust highlight/readiness. | Submit high/medium/nurture examples, verify score/route/UUID match in homepage/app after reload; navigate away during presentation without losing lead; no duplicate on rapid submit. Domain tests plus targeted interaction checks. |
| **5 — Automation execution** | Shared definitions/evaluator, compact marketing showcase, finite app simulation and settings labels. | £7,500 against thresholds 2,000 and 10,000 takes opposite paths; equality takes NO; stop/pause/replay/edit/reduced-motion behave; no lead writes or external requests. |
| **6 — Pipeline and truthful insight** | Homepage single-record stage rail, combine insight region, shared reporting utility and correct visual scales; full app pipeline preserved. | Explicit stage moves update metrics/activity, Won never auto-wraps, unknown/zero data safe, range boundaries consistent, chart labels truthful. Relevant domain/reporting tests. |
| **7 — Human context and page cadence** | Source one licensed image or deliberate text fallback; retain/refine solutions, connections, pricing; remove repeated feature framing and migrate Philosophy. | Complete desktop/mobile scroll review, pacing matches E/G, image optimized/credited, disclosures and all supporting routes preserved. |
| **8 — Final conversion closure** | One cobalt end field, truthful sample/actual terminal, once-only resolution. | Buttons usable before/during motion, no fake Won record, reduced motion static, footer complete. |
| **9 — Product refinement** | App typography/data density; overview next-action register; mobile leads/pipeline; form field summaries; automation inspector; settings/integration polish. | Search/filter/sort/export, notes, drag/select moves, form editing/preview, persisted settings and reset confirmation still work; no cinematic app motion. |
| **10 — Consolidation and release QA** | Remove superseded CSS, finish font subsetting, verify route/asset/bundle loading, accessibility/fallbacks and final screenshots. Update docs/OG if necessary. | Q passes, all baseline commands pass, production performance results recorded; no empty plan placeholders or unreported regressions. |

**Next execution: Stage 1.** Do not start by replacing the whole homepage or rebuilding `/app`. Stage 2 follows only after the static desktop/mobile composition is good. Split a stage across turns if needed; checkpoint partial state rather than pretending the stage is complete. No requirement to deploy or publish is implied by this plan.

## Q. Quality and verification checklist

### Visual direction

- [ ] At 1440×900 the headline, primary action, meaningful machine, score and route are visible together; the scene spans the composition instead of floating beside copy.
- [ ] At 390×844 the headline/actions and top-down route are legible; no 6–9 px diagram copy or tilted-logo fallback.
- [ ] The original paper/cobalt/editorial identity remains recognizable. Only the final CTA is a large cobalt field; no return to neon/glass/dark AI visuals.
- [ ] The hero is visibly active in its first second, but its initial static frame is already useful. The marker causes subsequent visible state changes.
- [ ] Gates correspond to context, budget and timing; the viewer can identify where the score and owner come from. No generic chip as the main explanation.
- [ ] Six stages include a distinct Score state. The same reference/geometry persists through the journey; there are not six animated feature cards.
- [ ] Homepage section silhouettes vary: open machine, short ledger, bounded journey, working form/desk, schematic, stage rail, editorial break, decisions, closure.
- [ ] Mobile never presents a scaled-down full dashboard. The full app remains available and usable.
- [ ] Score numbers, route wording and owners agree within a displayed example or actual record. Seed-specific score limitations are represented honestly.
- [ ] No default-looking icon tiles, decorative metric arrows, Sparkles, repeated tinted cards or inexplicable pills remain in touched sections.
- [ ] Text is not joined at hidden line breaks (“context.A”), clipped, overly faint, or forced into a fixed-height animation panel.

### Motion and continuity

- [ ] Pause/resume/replay affect only intended presentation and respect hidden-tab/offscreen state.
- [ ] First-load sequence does not replay when WebGL finishes loading; fallback-to-canvas creates no jump.
- [ ] Desktop scroll track has one clear bounded runway; mobile/short/reduced layouts have none.
- [ ] Manual step selection is not overwritten by scroll, and returning to scroll mode is explicit.
- [ ] Scrolling backwards and skipping sections do not change real leads, scores, counts or pipeline states.
- [ ] Test flow resolves the correct YES/NO branch and stops; no perpetually pulsing editor.
- [ ] A valid lead is committed before presentation, inserted exactly once, and linked by the same UUID.
- [ ] Final actual-record closure reflects actual status, including New/Qualified, rather than silently marking Won.

### Functional regression cases

- [ ] Existing high-intent input returns 91/High/Priority sales; low input returns 47/Nurture; medium returns 69/Discovery. Existing five tests stay green.
- [ ] Rapid double submission, navigation during feedback and browser refresh do not duplicate or lose a committed lead.
- [ ] Highlight URL works after hydration, with existing/unknown ID, both on navigation and direct reload.
- [ ] Search, combined filters, all sorting options, empty results and CSV export work; exported text retains escaping.
- [ ] Notes and explicit stage changes persist. Pipeline drag and stage select work, with activity updated and sensible empty-stage rendering.
- [ ] Automation edits/enable state persist across pages; opposite/equal threshold branches and Stop are correct. Existing variants retain their correct configuration labels.
- [ ] Form create/edit/add/reorder/remove and required/type/options changes persist; budget comma parsing remains correct; preview does not create a lead.
- [ ] Analytics zero dataset, changed stage, current/new lead dates and reporting boundaries yield finite accurate values/bars.
- [ ] Integration filter/search/detail and demo connection states; settings name/density/timezone/activity preference; export/reset confirmation retain behavior.
- [ ] `/demo?plan=growth` still saves the selected plan locally without sending a request; marketing and lead demo remain distinct.
- [ ] All known marketing/app routes, mobile menus, unknown routes, OG image, sitemap and robots remain intact.

### Accessibility, responsive and performance

- [ ] Full homepage visually reviewed at 1440×900 and 390×844, plus key app screens at both sizes; capture stage-specific screenshots for later comparison.
- [ ] 320/360/768/1024/1920 widths and 200% zoom checked; no page-wide horizontal overflow, pinned content clipping or inaccessible control.
- [ ] Keyboard-only traversal of nav, journey, capture, dialogs, chart, forms and pipeline; visible focus and proper focus return.
- [ ] Reduced-motion is emulated at load and changed during a visit; no WebGL download, runway, processing delay or hidden content.
- [ ] No-WebGL/context-loss and slow-loading renderer leave a complete SVG hero; JavaScript-disabled route remains meaningful.
- [ ] Existing saved local data is preserved; disabled/unavailable storage produces a useful visit-only notice.
- [ ] Screen-reader headings, score semantics, branch labels, one-time announcements and chart data equivalent checked.
- [ ] Contrast and touch target sizes verified, including in the cobalt CTA.
- [ ] Production network/bundle/render traces compared with M; actual device/method/results recorded, not guessed from a dev screenshot.
- [ ] `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build` pass after final changes. No unexplained browser errors.

Test semantic behavior and risky state transitions; do not create brittle unit tests for every CSS declaration or one-off animation keyframe. Use meaningful domain/state tests and manual/browser visual acceptance for composition.

## R. Do-not-do list

1. Do not restart the project, replace the current visual identity or downgrade the installed framework to a familiar version.
2. Do not begin with a full-site CSS override or a mechanical rewrite of every component. Complete and verify one stage at a time.
3. Do not use text-left/floating-object-right as the hero, or restore a decorative sphere/cube/blob/chip as its meaning.
4. Do not add neon, bloom, glass panels, AI particle clouds, gradients behind every section, glowing borders or science-fiction copy.
5. Do not animate every heading, card or icon. No repeated slide-up reveals, staggered letter entrances, bouncing nodes or generic cursor parallax.
6. Do not use 3D anywhere except the hero, introduce physics/postprocessing/video, or download the renderer on mobile merely to hide it with CSS.
7. Do not hijack scrolling or force a long pinned story on mobile, short screens, reduced motion or keyboard users.
8. Do not make the visitor wait for a fake analysis sequence before saving a lead or activating navigation.
9. Do not change real pipeline state because the page scrolled, animation completed, or the illustration reached Won.
10. Do not claim live external execution, AI qualification, paid plans, real customer performance or customer endorsements. This remains a local portfolio product.
11. Do not replace working tables/boards with visually novel but less usable arrangements in the application. Reduce repetition on marketing; preserve appropriate product conventions.
12. Do not show a score as probability, hardcode a returned score, fabricate score contributions, or confuse budget-condition passes with high-intent qualification.
13. Do not mutate fixture/user data to make the visual story consistent. Use the explicit illustrative model and provider-backed actual mode.
14. Do not let images become a new stock-photo feature grid. One relevant, licensed image or the defined editorial fallback is enough.
15. Do not use “precision” as a reason for microscopic type, faint controls, fake calibration ticks everywhere or decorative serial numbers on every UI element.
16. Do not remove honest local-demo disclosures, export protections, native accessibility behavior or the user's saved state during aesthetic work.
17. Do not add Motion/GSAP/R3F/chart libraries for capabilities covered by current tools and small native primitives.
18. Do not mark a stage complete because it compiles. Check its desktop/mobile appearance and the specific functional acceptance gate, then update `GROWORA_PROGRESS.md`.

## Implementation override — 27 September 2026

The subsequent implementation brief supersedes conservative color/scale limits in C/D/Q: the hero now uses a solid ultramarine `#2447D8` field, paper typography/gates and ONE complementary signal-orange `#FF8259` chamfered lead ticket. Cobalt remains the brand/action color on paper. The final CTA is no longer the only full-color field. The lead is intentionally much larger than the former 14px marker; it must be recognizable in motion. Desktop keeps the full-width offset masthead/open architecture; mobile has a separate top-down route. This is an implementation of Directed momentum, not a new direction. Later untouched stages remain as specified above.

## Authoritative revision — 28 September 2026

The latest user brief rejects the 27 September cobalt-field/oversized-serif/arch implementation. It supersedes that override and the earlier hero/journey separation in D/F/I. Milestones A/B now use ONE persistent spatial Three world from hero through six native-scroll stages. Use contemporary sans hierarchy, a neutral physical environment, dimensional indigo routes, layered ceramic/metal lead record and restrained warm metal details. Camera motion, subtle pointer response and quiet visible idle activity are permitted. No separate WebGL scenes, full-blue rectangle, chunky arch gates or orange ticket. Mobile/reduced-motion use an individually composed DOM/SVG alternative. Other product stages are deferred; no broader redesign is authorized for this run. Existing scoring/storage contracts remain authoritative.

