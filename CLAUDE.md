# maps-gl

`@dhis2/maps-gl` — a vanilla-JS class library wrapping MapLibre GL JS for DHIS2 Maps. Babel, Jest, ESLint/Prettier/Stylelint via `@dhis2/cli-style`, Yarn 1 classic. Not a React library, not a DHIS2 App Platform app.

## Stage

Published npm package (currently v4.3.1+), consumed by `maps-app` and other DHIS2 apps. `src/index.js`'s exports are a semver contract — a breaking change there needs a major bump and consumer coordination. Everything else is free to refactor.

## Not an app-platform app

No `.d2/`, no dev server. Babel builds to `build/cjs` and `build/es` (`yarn build`; `yarn watch` for continuous rebuild).

## Structure

```
src/
  controls/     map controls (zoom, attribution, scale, fullscreen, search, measure, fitBounds)
  layers/       layer classes + layerTypes.js registry
  earthengine/  Earth Engine worker (Comlink) integration
  ui/
  utils/
  __tests__/
Map.js          the Map class (extends MapLibre's Evented)
Map.css
index.js        public API surface — see below
jest.stub.js    global test mocks (mockMap, mockMapGL)
```

## Commands

`yarn build` / `watch` / `test` / `lint` / `format`.

## Conventions

-   Comments: prefer self-documenting code. Comment only non-obvious domain context. No historical/time-bound comments.
-   Classes needing pub/sub extend MapLibre's `Evented` (`Map`, `Layer`).
-   New layer type: subclass `Layer` (`src/layers/Layer.js`), implement `getSource()`/`getLayers()` as needed, register it in `src/layers/layerTypes.js`.
-   New control type: implement `addTo(map)` and/or MapLibre's `onAdd()`/`onRemove()` DOM-returning contract, register it in `src/controls/controlTypes.js`.
-   PascalCase class files, camelCase utils, colocated `__tests__/*.spec.js`.
-   Full architecture (registry pattern, `Layer` lifecycle, Earth Engine worker boundary, public API surface): see the `maps-gl-architecture` skill.

## Testing

Colocated `__tests__/*.spec.js`. Use `globalThis.mockMap`/`mockMapGL` (defined in `jest.stub.js`) instead of re-mocking MapLibre per test.

## DHIS2 specifics

No direct DHIS2 Web API calls — config and data arrive as plain JS objects from the consuming app (e.g. `maps-app`). Real external network calls that do exist: Azure Maps attributions (`layers/AzureLayer.js`), OSM Nominatim search (`controls/Search.js`), Google Earth Engine (`earthengine/*`).

## Plugins / MCP

`context7` plugin + `grep` MCP server. No browser-testing MCP here — this library has no e2e tests of its own; for visual verification of a rendering change, do it in the `maps-app` repo, which already has a WebGL-tuned chrome-devtools setup.

## Git / PR workflow

Don't stage or commit unless explicitly asked. Use `gh` (`gh pr view`, `gh pr diff`, `gh pr checks`) for reading PR state/diff/CI — a read-only-scoped token is configured (see README); fall back to plain `curl` against the public GitHub REST API if `gh` isn't set up. Before marking a PR ready for review: see the `pre-review` skill.

**Universal rule — no remote writes by default, for any skill.** Never push to a remote, or open/edit/ready a PR, without a fresh, explicit, in-the-moment ask from the user for that specific action — every time, no exceptions. This is never pre-negotiated or bundled into an earlier approval, and there's no special write-scoped credential to provision to get around the ask — a skill just stops and asks, then attempts the action through the normal tool-permission flow. Local operations (edit, lint, test, `git commit`, `git merge`) stay governed by "don't stage or commit unless explicitly asked" above.

Unlike `maps-app`, **this repo lint-checks the PR title in CI** (`.github/workflows/dhis2-verify-pr-title.yml`, commitlint against the PR title) — get the Conventional Commits format right, it's a real check, not just style. There's also **no PR body template** here (`maps-app` has one, this repo doesn't) — see `commit-and-pr-messages` for the real free-form pattern to match instead.

`.hooks/pre-commit` (`d2-style check --staged`) and `.hooks/pre-push` (`yarn test`) are plain Husky git hooks — separate from, but consistent with, the Claude PostToolUse hook below.

## Security / Performance

Validate third-party responses (Azure/Nominatim/Earth Engine) before trusting their shape. Be mindful of Worker message-passing overhead in the Earth Engine integration.

## Skills in this repo

`.claude/skills/<name>/SKILL.md`, loaded on demand. Each opens with a short decision table and pushes long reference material into `references/*.md`.

-   `maps-gl-architecture` — registry pattern, `Layer` lifecycle, Earth Engine worker boundary, public API surface.
-   `pre-review` — self-review pass before marking a PR ready.
-   `spec-from-ticket` — turns a pasted Jira ticket into a durable spec + implementation plan under `.claude/specs/`.
-   `implement-plan` — autonomously executes a written plan through a commit-by-commit cycle.
-   `pr-polish` — iterating on review feedback across multiple rounds; hands off to `pre-review` for the final pass.
-   `commit-and-pr-messages` — Conventional Commits / PR title / PR description conventions (note: PR title is CI-checked here).
-   `branch-update` — merge master into a feature branch and resolve conflicts (explicit invocation only).
-   `pr-chain` — plans/creates/maintains a stacked chain of dependent PRs for a big epic.
-   `claude-stack-retro` — at a work-session checkpoint, retrospects on that stretch and proposes updates to this repo's own `.claude/` tooling without editing it directly; logs decisions under `.claude/retros/`.

Not ported from `maps-app`: `mockup-pr`, `manual-test-scenarios`, `community-post`, `docs-update` — none have real footing in this repo (no PR-preview mechanism, no `docs/` end-user manual, no historical mockup-PR precedent; maps-gl feature announcements happen via `maps-app`'s own `community-post` skill instead). Worth adding here later only if a genuine need for one shows up.

## Subagents in this repo

`.claude/agents/<name>.md` — a persona for output whose audience isn't "developer reading code," dispatched by the skill that gathers the relevant facts first. Restricted `tools:` per persona.

-   `spec-writer` — technical/architecture voice for a durable spec; dispatched by `spec-from-ticket` after its interactive interview.

## Lint/test workflow for agents

Touched-files-only during development: `yarn jest <file>`, then `yarn d2-style check <file>` (wraps eslint+prettier, and stylelint once a local config exists — this repo doesn't have one yet, so CSS only gets prettier-checked for now). Full `yarn test && yarn lint` before finishing. The PostToolUse hook auto-formats/fixes on Edit/Write only — Bash-created edits aren't covered, run `yarn d2-style apply <file>` manually after those.
