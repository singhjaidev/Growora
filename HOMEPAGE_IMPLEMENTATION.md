# Growora homepage — completed refinement

The full homepage replaces the earlier hero-only first pass. The request's pasted text was available; the referenced index.html was not present in the attachment folder or project. Implementation follows the detailed feedback and the existing split-hero composition.

## Implementation

- Shared charcoal, neutral light, white and muted green tokens in homepage.module.css. White hero headings, sans-serif typography and light supporting sections.
- A substantial CSS 3D opportunity file beside the left-aligned headline. Capture, Qualify, Connect and Complete progressively align its persistent layers. All context stays in the DOM and remains readable.
- The same illustrative Northline enquiry continues into a workspace board and moves through Qualified, In conversation and Proposal. Controls work without changing stored workspace records.
- One scroll-motion scheduler; a roughly 300 ms visible settling period, native page scrolling and no wheel/touch interception. The discreet Motion easing control disables smoothing. Reduced motion removes depth and pipeline translation.
- ResizeObserver returns oversized sticky panels to normal flow, including with enlarged text. Mobile uses an unrotated record and a single readable pipeline stage with controls.
- Compact business-fit tabs and integration links, three white pricing cards, recommended Growth card, 220 ms hover feedback, and a one-open-at-a-time FAQ using 300 ms grid expansion with inert closed answers.
- Existing monthly prices (£29 / £79 / £179), annual calculation, feature lists, contact query strings, login dialog and routes preserved. Homepage navigation uses native anchors.
- Superseded active homepage CSS and section animation logic were replaced rather than overridden. Previous unmounted WebGL files were retained to preserve pre-existing user edits; they are not imported by the homepage.

## Validation

- ESLint and TypeScript pass; production build prerenders all 26 pages.
- All nine existing domain tests pass.
- Desktop inspection at 1440×1000 and 1280×800; mobile inspection at 390×667 and 320×568. No horizontal overflow.
- Forward, fast and reverse scroll, stage controls, native anchors, mobile navigation, keyboard activation and visible focus checked.
- Monthly/yearly pricing and contact links checked. White card backgrounds, Growth emphasis and focus feedback verified; hover styling also visible during browser inspection.
- FAQ opening, closing, switching, inert hidden answers and the long answer checked.
- Reduced-motion code paths exercised with a temporary forced media match, including static record, static workspace and disabled transitions. Original media queries restored afterward.
- 200% text enlargement exercised using a temporary 32px root font at desktop and mobile sizes. Fixed overflow and oversized sticky panels; long FAQ text expands to full measured height. Temporary validation styling removed afterward.
- Scroll/resize listeners, media listeners, ResizeObserver and animation frame cleanup inspected. No browser console errors observed.

Physical trackpad/touch-device testing was not available. The implementation leaves those native browser inputs untouched. The 200% check was text enlargement, not an OS-level browser zoom setting.

Run `npm run dev` and open http://localhost:3000 to review. Screenshots are in .checkpoints/homepage-validation/.
