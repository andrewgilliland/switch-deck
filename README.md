# Switch Deck

Switch Deck is an Astro presentation library. Each Deck is a directory of ordered MDX Slides, rendered together at a static route so React component state survives navigation.

## Development

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

The Deck Catalog is at `/`. The included example is at `/presentation-1`.

## Add a Deck

Create a directory under `src/content/decks`. Its directory name becomes the public route.

```text
src/content/decks/my-deck/
├── deck.json
├── theme.css
└── slides/
		├── intro.mdx
		└── demo.mdx
```

Define the Deck metadata in `deck.json`:

```json
{
	"title": "My Deck",
	"description": "What this Deck covers.",
	"draft": false
}
```

Draft Decks are available during development and excluded from production routes and the Deck Catalog.

Each Slide needs a unique kebab-case `slug` and integer `order`:

```mdx
---
title: Interactive demo
slug: interactive-demo
order: 20
---

import Demo from "../../../../components/slides/Demo";

## Components work here

<Demo client:visible />
```

Slides are ordered by `order` and linked by hash, such as `/my-deck#interactive-demo`. All Slides stay mounted as the active Slide changes.

## Theme a Deck

An optional `theme.css` beside `deck.json` is loaded only for that Deck. Scope selectors to its generated Deck attribute:

```css
[data-deck="my-deck"] h1 {
	color: tomato;
}
```

## Present

Open a Deck and choose **Start presentation**. Navigation supports:

- Keyboard: Left Arrow for Previous; Right Arrow or Space for Next
- Standard gamepads: D-pad, shoulder buttons, A, and B
- Unknown controllers and horizontal Joy-Cons: follow the two-button calibration prompt
- On-screen Previous and Next controls

Controller Profiles are saved locally per controller. The first controller to send navigation input becomes active.

To verify a Joy-Con is visible to the browser, open a Deck route (for example, `/presentation-1`) in Chrome, open that tab's DevTools Console with the **Info** level enabled, and reload. `[Switch Deck] Gamepad diagnostics ready` confirms the Deck script loaded and reports whether the Gamepad API is available and how many controllers are currently exposed. Press a Joy-Con button to activate the browser's Gamepad API; look for `Gamepad detected` (ID, mapping, button/axis counts) and `pressed buttons` (button indices). Disconnects are logged too. If only the startup line appears, the browser has not exposed the controller to this page yet.

Interactive components can temporarily own gamepad input:

```ts
window.switchDeck.captureInput("Demo controls");
window.switchDeck.releaseInput();
```

Escape or the visible release action returns input to the Deck.

## Tests

Unit tests live beside the implementation under `src/` and use the `*.test.ts` suffix. Browser workflows live under `tests/e2e/` and use the `*.spec.ts` suffix.

```text
src/lib/navigation.test.ts   # Vitest unit test
tests/e2e/deck.spec.ts       # Playwright browser workflows
```

Run unit tests with `npm test` and browser workflows with `npm run test:e2e`.

## Validate

```sh
npm run check
npm test
npm run build
npm run test:e2e
```

Playwright expects a running development server and uses `http://localhost:4321` by default. Override it with `PLAYWRIGHT_TEST_BASE_URL` when needed.
