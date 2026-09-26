# Switch Deck

Switch Deck is a library of browser-based presentations authored as composable MDX content and operated through multiple input methods.

## Language

**Deck**:
An ordered presentation with one public route and shared metadata.
_Avoid_: Presentation, slideshow

**Slide**:
One MDX-authored unit of content within a Deck.
_Avoid_: Page, screen

**Slide Order**:
The explicit sequence in which a Deck's Slides are presented.
_Avoid_: File order

**Deck Catalog**:
The public collection of non-draft Decks.
_Avoid_: Homepage, gallery

**Controller Profile**:
A reusable mapping from a physical controller's buttons to Deck navigation actions.
_Avoid_: Key bindings, gamepad config

**Input Capture**:
Temporary ownership of controller input by an interactive Slide component instead of the Deck.
_Avoid_: Focus, lock