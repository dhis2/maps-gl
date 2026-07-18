# maps-gl

[![DHIS2 Build and Release](https://github.com/dhis2/maps-gl/workflows/DHIS2%20Build%20and%20Release/badge.svg)](https://github.com/dhis2/maps-gl/actions?query=workflow%3A%22DHIS2+Build+and+Release%22)

WebGL mapping engine for DHIS2 Maps

## Link to DHIS2 Maps:

maps-gl folder: `yarn link`
maps-app folder: `yarn link @dhis2/maps-gl`

## How to upgrade earthengine-api

We run earthengine-api in a web worker for performance reasons, and this requires a separate build:

1. git clone https://github.com/MasterMaps/earthengine-api/tree/master (make sure the fork is synced)
2. git chekout master
3. git pull
4. git checkout web-worker-build
5. git merge master
6. cd javascript
7. yarn build
8. copy the contents of javascript/build/worker.js to ee_api_js_worker in this repo

PR to main earthengine-api repo: https://github.com/google/earthengine-api/pull/173

## Build from source

In order to use the library you must first build it from source using the command `yarn build`

You may also watch the src directory for changes with the command `yarn watch`

Both of these commands will run the javascript files in the `src` directory through babel to produce both CommonJS and ES Module builds in the `build` directory.

## Publishing

Publication is done automatically by a GitHub action for all commits on the `master` branch. Commits (including pull-request squashed commits) should follow the [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) guidelines so that the release bot can determine which version to cut - breaking, feature, or bug

## Publishing pre-release versions during app development

Builds for all non-production branches are automatically copied to [d2-ci/maps-gl](https://github.com/d2-ci/maps-gl) for use during development and testing, prior to production release.

To test changes in a development branch, change the maps-gl dependency of package.json of the app you are testing with. There are a few options:

1. point to a specific commit:

```
"dependencies": {
        "@dhis2/maps-gl": "git+https://github.com/d2-ci/maps-gl.git#70249ebe8be39051fa10142f850de449e1ec488c",
        ...
}
```

2. point to a branch:

```
"dependencies": {
        "@dhis2/maps-gl": "git+https://github.com/d2-ci/maps-gl.git#chore/some-chore",
        ...
}
```

## Claude Code Setup (optional)

This repo has a [`CLAUDE.md`](./CLAUDE.md) plus a set of `.claude/skills/` — Claude Code reads `CLAUDE.md` automatically every session, and pulls in a skill on demand when its topic is relevant, so you don't need to do anything for those to work.

One-time setup for a smoother experience:

1. Install [`jq`](https://jqlang.org/) — the auto-format/lint hook that runs after every file edit depends on it.
2. Create a [fine-grained GitHub personal access token](https://github.com/settings/personal-access-tokens/new) scoped to **read-only** (Pull requests, Contents, Actions), and export it as `GH_TOKEN` in your shell profile. This lets Claude use the `gh` CLI for reading PRs/CI status without ever being able to write, merge, or admin anything — deliberately narrower than a normal `gh auth login`.
3. In Claude Code, run `/plugin install context7@claude-plugins-official` then `/reload-plugins`.

What this gets you: before a PR is marked ready for review, the agent runs a self-review pass (lint, test, diff review) rather than leaving that entirely to your human reviewer. PR/CI reads go through a deliberately read-only-scoped `gh` token, never a write-capable session. This library's exports (`src/index.js`) are a semver contract shared with `@dhis2/maps-app` and other consumers — breaking changes there need coordinating, not just a code review.

## Report an issue

The issue tracker can be found in [DHIS2 JIRA](https://jira.dhis2.org)
under the [LIBS](https://jira.dhis2.org/projects/LIBS) project.

Deep links:

-   [Bug](https://jira.dhis2.org/secure/CreateIssueDetails!init.jspa?pid=10700&issuetype=10006&components=11028)
-   [Feature](https://jira.dhis2.org/secure/CreateIssueDetails!init.jspa?pid=10700&issuetype=10300&components=11028)
-   [Task](https://jira.dhis2.org/secure/CreateIssueDetails!init.jspa?pid=10700&issuetype=10003&components=11028)
