# Domain Docs

This repository uses a single-context domain documentation layout.

## Before exploring

- Read the root `CONTEXT.md`.
- Read ADRs under `docs/adr/` that affect the area being changed.

If either location does not exist, proceed silently. The domain-modeling workflow creates documentation when terms or decisions are resolved.

## Use glossary vocabulary

Use terms as defined in `CONTEXT.md` in issue titles, proposals, hypotheses, tests, and implementation notes. Avoid synonyms the glossary explicitly rejects.

When a needed concept is absent, reconsider whether it belongs to the project vocabulary or note the gap for domain modeling.

## Flag ADR conflicts

Surface any conflict with an existing ADR instead of silently overriding it. Name the ADR and explain why reopening the decision may be warranted.
