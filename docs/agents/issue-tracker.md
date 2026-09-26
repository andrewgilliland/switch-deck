# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply or remove labels**: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** Set this to `yes` if external pull requests should enter the triage queue.

When set to `yes`, PRs use the same labels and states as issues through the equivalent `gh pr` commands. List external PRs by keeping the `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, and `NONE` author associations.

GitHub shares one number space across issues and pull requests. Resolve an ambiguous `#42` with `gh pr view 42`, then fall back to `gh issue view 42`.

## Skill operations

- When a skill says "publish to the issue tracker," create a GitHub issue.
- When a skill says "fetch the relevant ticket," run `gh issue view <number> --comments`.

## Wayfinding operations

The map is one issue labelled `wayfinder:map`; its child issues are tickets.

- Create children as GitHub sub-issues. If sub-issues are unavailable, add each child to a task list in the map and put `Part of #<map>` at the top of the child body.
- Label children `wayfinder:<type>`, where type is `research`, `prototype`, `grilling`, or `task`.
- Represent blocking with native issue dependencies. If unavailable, put `Blocked by: #<n>, #<n>` at the top of the child body.
- The frontier is the first open, unassigned child in map order with no open blockers.
- Claim a ticket with `gh issue edit <n> --add-assignee @me` as the session's first write.
- Resolve a ticket by commenting with the answer, closing it, and adding a context pointer to the map's Decisions-so-far.
