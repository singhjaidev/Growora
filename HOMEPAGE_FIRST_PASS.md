# Homepage first pass

Historical checkpoint. The full charcoal/green homepage refinement is now described in HOMEPAGE_IMPLEMENTATION.md.

Scope: hero and Capture → Decide → Act signature sequence only. Existing lower sections and earlier uncommitted design work are preserved.

## Direction

One enquiry becomes a complete opportunity. Warm white, navy typography and a cobalt accent frame one persistent HTML product record. Its context, decision and action layers align as the reader progresses. Depth belongs to this object; supporting content uses rules and typography.

The Northline Studio enquiry reuses the existing illustrative story data. Priority criteria and the owner are explicitly example UI, not customer evidence or live automation. No outcome statistics, new dependencies or WebGL are added.

## Interaction

- Desktop: native scrolling updates the active stage in both directions. One requestAnimationFrame callback per scroll frame; the listener detaches outside the section.
- Stage buttons support native Tab, Enter and Space interaction with visible focus. Selecting a stage on desktop brings its explanation into view.
- Mobile and short windows: ordinary document flow, front-facing record, touch controls and a complete visible transcript.
- Operating-system reduced motion removes transforms and transitions via CSS. The explicit Reduce motion control provides the same presentation and disables smooth anchor scrolling.
- Server-rendered content stays readable before hydration or without animation. Nothing depends on completing a timed entrance.

## Validation

- TypeScript and ESLint pass.
- Production build compiles and prerenders successfully.
- Browser inspection at 1440×1000, 1280×800, 390×844 and 320×740; no horizontal overflow.
- Forward, fast and reverse scrolling verified, including persistent record/stage continuity.
- Keyboard stage activation and visible focus verified.
- Reduced-motion presentation verified through the explicit control; OS media-query rules inspected in source (browser OS preference was not changed).
- Narrow mobile stage selection verified. Physical-device touch testing remains outside this desktop review.

## Next review

Review the hero composition, readability and the degree of transformation before extending this direction. The existing lower homepage still contains the repeated journey sections; consolidating those belongs to the next stage, together with the interactive enquiry demo, workspace reveal, business fit, integrations, pricing, FAQ and closing CTA.
