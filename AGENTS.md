## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Validation

After making changes, run the checks that cover the edited code before considering the work complete:

```sh
npm run lint
npm run check
```

When changing behavior, also run the relevant tests. Use `npm test` for unit tests, `npm run test:e2e` for browser workflows, and `npm run build` for production or routing changes.

## Tests

- Keep unit tests beside the implementation under `src/`, using `src/**/*.test.ts`.
- Keep Playwright browser workflows under `tests/e2e/`, using `tests/e2e/**/*.spec.ts`.
- Run `npm test` for unit tests and `npm run test:e2e` for browser workflows.

## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five default canonical labels. See `docs/agents/triage-labels.md`.

### Domain docs

Domain documentation uses the single-context layout. See `docs/agents/domain.md`.
