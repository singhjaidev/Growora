# Growora premium rebuild — 13 October 2026

## Delivered

The homepage now contains the full 15-section narrative: hero, problem, journey signals, workspace, capture, qualification, automation, segmented 3D cube, AI ribbon, analytics, integrations, use cases, pricing, FAQ and final call to action. The shared marketing header and footer use the same neutral off-white, forest/teal, Newsreader and Inter design direction.

Working browser demos include journey stage selection and playback, lead filtering and stage movement, an accessible lead-detail dialog, capture and qualification controls, workflow simulations, AI draft selection, analytics periods, integration categories, annual billing and FAQs. These are illustrative local interactions; this change does not add live authentication, lead ingestion, email delivery, AI generation or third-party integrations.

The signature cube uses 27 rounded Three.js meshes with physical materials and independently moving layers. The fluid ribbon uses deforming geometry and physical materials. Both load near the viewport, pause offscreen or when the document is hidden, offer pause controls, cap pixel density, and include original SVG fallbacks. Reduced-motion handling is implemented in CSS and scene lifecycle logic.

Existing product, informational and application routes remain available. Deployment configuration is preserved. No publication or deployment was performed. Earlier uncommitted work remains in the checkout; this rebuild uses new homepage and scene components.

## Main source files

- `src/components/marketing/premium-homepage.tsx`
- `src/components/marketing/premium-homepage.module.css`
- `src/components/marketing/studio-visual.tsx`
- `src/components/three/studio-scene.tsx`
- `src/components/marketing/shell.tsx`
- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/opengraph-image.tsx`
- `public/images/growora-cube-still.svg`, `public/images/growora-fluid-still.svg`
- `scripts/generate-studio-fallbacks.mjs`

Inter is self-hosted through `@fontsource-variable/inter`. The existing Three.js dependency is reused.

## Verification completed

- Production build passed; 26 routes generated.
- Type checking and repository lint passed.
- All nine existing domain tests passed.
- HTTP smoke checks returned 200 for all tested marketing and app routes, robots, sitemap, Open Graph image and both fallback assets.
- Browser review covered desktop 1440px, tablet 768px, mobile 390px and narrow mobile 320px. No horizontal document overflow was observed.
- All 15 homepage sections and internal anchor targets were checked.
- Interactive controls were exercised, including keyboard tab selection, lead dialog Escape, FAQ Enter and mobile navigation.
- Both Three.js scenes rendered in browser checks. Cube pause was exercised against the final production build.
- Final production console samples contained no errors or warnings.
- Desktop/mobile screenshots are saved in `.checkpoints/premium-rebuild/`.

## Verification limits

Reduced-motion behavior was reviewed in source, but the browser tool did not support media-preference emulation. Forced WebGL failure, physical-device GPU profiling, screen-reader certification and a Lighthouse performance comparison were not performed. These checks should not be represented as passing. The pricing and product data remain illustrative, as in the existing demo.

## Local preview

Run `npm run dev` from this checkout. Production can be previewed after building with `npm run start -- --port 3002`. Browser screenshots capture the completed implementation independently of preview-server lifetime.
