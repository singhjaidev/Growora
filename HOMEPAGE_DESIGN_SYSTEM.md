# Growora homepage design system

Updated 5 October 2026. Homepage only; establish the design here before extending it to other pages.

## Identity

Signature navy: #10263F, chosen to echo the shaded left side of the closing architectural image. Supporting ink #173752, text #526478, pearl #F8FAFC and pale steel-blue surfaces. White buttons and white branding on the navy homepage navbar. Avoid adding competing decorative theme colors.

## Typography

Hero: Manrope 650 for “Better leads.” and italic Newsreader 430 for the opportunity statement. Fluid scale with dedicated phone and laptop breakpoints. Section headings use Manrope, body and controls use DM Sans. Body 18px desktop, 16–17px small screens; primary action labels 16px; helper labels 12–14px. Compact navigation adapts at 900px.

## Motion and depth

- One WebGL hero console, enlarged on wide desktops, with bounded native scroll chapters. Initial renderer shows its settled pose; no intro rotation mismatch or persistent idle loop. Mobile and reduced-motion paths use the CSS console.
- Scroll reveals run once as section content enters the viewport; no server-rendered content is hidden while JavaScript loads.
- Enquiry, workflow, pipeline, business and pricing changes use a short 550ms settle transition. Selection controls stay mounted so keyboard focus is retained.
- Layered surfaces and shadows establish depth for opportunity cards, enquiry records, workflow icons/cards, pipeline records, business document, integrations and pricing. Hover effects use small lifts or rotations, not moving text targets.
- Honor prefers-reduced-motion for reveals, switches and hover effects. No pause/replay controls or developer indicator in the homepage UI.

## Section decisions

1. Hero: no background image. Larger console beside the editorial headline, subtle pearl/steel backdrop.
2. Opportunity: three dimensional illustrations with readable static copy.
3. Capture: clearly clickable numbered option cards, selected navy state, hint and short descriptions; animated enquiry content.
4. Workflow: deep navy textured surface, raised process cards and physical icon tiles, selectable routes.
5. Pipeline: stage selector brings the corresponding record forward; small screens show the selected card.
6. Business types: icon tabs with selection indicators and animated content/document.
7. Integrations: dimensional tiles with hover lift.
8. Pricing: navy featured plan, dimensional cards, animated billing values.
9. FAQ: native accessible disclosures.
10. Closing: image-backed architectural scene, legible navy overlay; no image in hero.

## Image provenance

Asset: public/images/growora-blue-architecture.png. Generated using the built-in image-generation tool, then copied into the project. Prompt: “Use case: ads-marketing. Create a premium wide website background photograph/render for Growora, a business opportunity platform. Architectural editorial still life: sculptural cobalt blue glass ribbon and brushed blue aluminum sweeping upward through a white travertine architectural courtyard, crisp daylight, elegant shadows, realistic fine materials, sophisticated enterprise brand, not sci-fi. Signature blue #3454D1, pearl white, deep navy only. Wide 3:2 composition with forms concentrated on right half, left half dark navy shaded wall with quiet negative space for white website headline overlaid later. No text, no logos, no charts, no people, no watermark. Beautiful high-end architectural photography, restrained and tangible.” The later brief selected the image’s navy as the interface signature.

## Design references consulted

- https://design-system.service.gov.uk/styles/type-scale/ — consistent type roles and line-height hierarchy; not a claim that this design reproduces GOV.UK styling.
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum — usable pointer targets.
- https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html — reduced-motion support.

## Scope boundaries

These are presentation and local interactive illustrations. No backend, live authentication, sending, payment processing or production integrations were implemented in this design phase. Preserve existing local workspace data.

## Editorial refinement — 5 October 2026

User preference: quiet/editorial, strong typography and restrained details, with a premium and distinctive impression. Simplified enquiry options to radio-style rows; workflow icon blocks became large typographic step numbers. Removed the bottom-left scroll captions. Pricing cards are compact (approximately 523px desktop in the reviewed browser), with no decorative icon row or redundant bottom captions; Growth badge and body text explicitly use contrasting light colors. FAQ now uses keyboard-operable buttons with aria-expanded, inert collapsed answer regions and a 400ms grid-height transition, respecting reduced motion. Homepage footer is full-width signature navy. Other pages and backend scope remain unchanged.

Future evaluation: favor clarity and distinctive editorial composition over adding more generic icons, shadows or animated ornaments. Ask whether the visitor understands the product, can recognize controls, and can explain the purpose of each visual.
