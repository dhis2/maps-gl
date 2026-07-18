---
name: pre-review
description: Use before converting a PR from draft to "ready for review" — the final quick self-check so issues get caught before a human reviewer spends time on them. Verifies tests, SonarQube, code quality/conventions, and the PR title/description, in that order.
---

# Pre-review

Still iterating on review feedback? Use `pr-polish` instead — come back here once a round passes clean; this is the last, quick pass, not the place to work through a fix list.

Before marking a PR ready for review and requesting a human review, verify all four in order:

## 1. Zero failing tests

```
yarn lint && yarn test
```

No Cypress in this repo (Jest only) — don't proceed past this step with anything red.

## 2. Zero remaining SonarQube issues

Query the anonymous SonarCloud endpoint `/sonarqube-fix` uses:

```
curl -s "https://sonarcloud.io/api/issues/search?projectKeys=dhis2_maps-gl&pullRequest=<pr-number>&resolved=false&ps=100"
```

If anything's still open, fix it now in the same BLOCKER→INFO order `/sonarqube-fix` uses, or explicitly hand off to that command if the list is long. Don't mark ready with open issues on this PR.

## 3. Code quality

Self-review the diff — either invoke the `/code-review` skill, or fetch it directly (`gh pr diff`) and read it critically. Specifically check for, not just "does it look reasonable":

-   **DRY** — logic duplicated across files/classes that should share a helper.
-   **Convention adherence** — matches this repo's real patterns (`CLAUDE.md`, and the `maps-gl-architecture` skill for anything layer/control-related), not a plausible-but-different approach.
-   If the diff touches `src/index.js`'s exported surface — confirm it isn't an unintended breaking change for `maps-app` or other consumers (see `maps-gl-architecture`'s "Public API surface" section).
-   Correctness bugs and genuine simplification opportunities — not style nits.

## 4. PR title/description

This repo has **no PR body template** — write concise, "what"-focused prose (a short `## Description`, sub-headers like `#### The bug`/`#### The fix` only if genuinely useful, no checklist). See `commit-and-pr-messages` for the format rules rather than re-deriving them here.

**Get the title right — it's actually CI-checked here**: `dhis2-verify-pr-title.yml` lints the PR title via commitlint (unlike `maps-app`, where this is advisory-only). A malformed Conventional Commits header fails a real check, not just a style nit.

## 5. Check CI, then mark ready

```
gh pr checks
```

Don't mark ready while checks are still running or failing — this includes the PR-title-lint check above. Marking ready (`gh pr ready`) is a remote write — per this repo's universal rule, this always needs a fresh, explicit, in-the-moment ask before running it, regardless of how this skill was invoked; never treat "the user asked for a pre-review" as blanket permission to also mark the PR ready without asking separately.

If `gh` isn't set up (no `GH_TOKEN` configured yet), use `curl` against the public GitHub REST API instead:

-   Diff: `curl -s -H "Accept: application/vnd.github.v3.diff" "https://api.github.com/repos/{owner}/{repo}/pulls/{n}"`
-   Checks: `curl -s "https://api.github.com/repos/{owner}/{repo}/commits/{sha}/check-runs"`
-   PR number for the current branch: `curl -s "https://api.github.com/repos/{owner}/{repo}/pulls?head={owner}:{branch}&state=open"`

`{owner}/{repo}` comes from `git remote get-url origin`; `{branch}` from `git rev-parse --abbrev-ref HEAD`.
