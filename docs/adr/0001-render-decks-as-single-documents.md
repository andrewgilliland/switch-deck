# Render Decks as single documents

Each Deck is rendered as one hash-addressed document with all Slides kept mounted, rather than as one route per Slide. This increases the initial page payload, but preserves interactive component state, keeps gamepad polling uninterrupted, supports stable Slide links, and retains static deployment.