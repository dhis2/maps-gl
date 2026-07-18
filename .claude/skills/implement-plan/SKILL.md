---
name: implement-plan
description: Autonomously executes a written implementation plan (from spec-from-ticket, or pasted/referenced directly) through a commit-by-commit implement/test/self-review/commit cycle, requesting permissions up front rather than piecemeal. Explicit invocation only — run with /implement-plan <path-to-spec-or-plan>.
disable-model-invocation: true
---

# implement-plan

Executes a plan (a `.claude/specs/*.md` file, or one pasted/described directly) through a disciplined commit-by-commit cycle, with **local** permissions negotiated once up front — because nobody is available to approve tool calls piecemeal for the duration of the run. Remote writes (push, PR create/edit/ready) are never part of that negotiation — see "Handoff."

| Situation                                                                 | Do this                                                              |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Starting a fresh run                                                      | Do the permission negotiation (step 1) before touching anything else |
| A plan step is ambiguous, or the code doesn't match what the plan assumed | Stop, ask — see "Escalation conditions"                              |
| A step is done, tests pass, self-review is clean                          | Commit it, move to the next step                                     |
| Every step is done and committed                                          | Full suite, then a fresh-context full-diff review — see step 5       |
| Ready to push / open a PR                                                 | Stop and ask explicitly, every time — see "Handoff"                  |

## 1. Negotiate permissions — before anything else

Ask the user to either grant a session allowlist for **local** operations only, or switch to Claude Code's auto mode (`/permission-mode auto`) for the run. Concrete Bash patterns this workflow realistically needs — all local, nothing that touches a remote:

-   `Bash(yarn d2-style check*)` / `Bash(yarn lint*)` — touched-file and full-suite lint
-   `Bash(yarn jest*)` / `Bash(yarn test*)` — touched-file and full-suite tests
-   `Bash(yarn build*)` — only if the plan's verification step needs it
-   `Bash(git status*)`, `Bash(git diff*)`, `Bash(git log*)`, `Bash(git add*)`, `Bash(git commit*)` — the commit cycle itself
-   `Bash(git merge*)` — for syncing master into the feature branch mid-flight (merge, not rebase — team convention, see `branch-update`)
-   `Skill(code-review)` / `Skill(code-review:*)` — per-step and final self-review

**Never include `git push`, `gh pr create/edit/ready`, or any other remote-write command in this negotiation** — no matter how far ahead the user wants to go. This repo's universal rule (see `CLAUDE.md`) is that remote writes are never pre-negotiated or bundled into a blanket allowlist; they're handled fresh, per the "Handoff" section below, only when actually reached and only with a fresh explicit ask at that moment.

## 2. Break the plan into commits

If the plan document already has numbered, file-scoped "Implementation plan" steps (the `spec-from-ticket` shape), treat each as one commit unless it's too large (spans unrelated files — split it) or too small/coupled to compile independently (merge it with its neighbor). If working from a looser/pasted plan, derive equivalent units yourself. Commit messages follow `commit-and-pr-messages` (Conventional Commits + the real `[TICKET-ID]` bracket convention, **never** fabricating the `(#PRNUM)` suffix GitHub appends at squash-merge, **never** hand-writing a `chore(release): cut X.Y.Z [skip ci]` message).

Track progress with `TodoWrite` as you go — this is a multi-step, potentially long-running loop.

## 3. The cycle, per step

1. Implement the step.
2. Test/lint the touched files only — reuse `CLAUDE.md`'s "Lint/test workflow for agents" verbatim (`yarn jest <file>`, then `yarn d2-style check <file>`), don't reinvent it.
3. Self-review just this step's diff — invoke `/code-review` at low/medium effort. Address findings; don't blindly `--fix` — surface what was found so there's an audit trail.
4. Commit (message per `commit-and-pr-messages`).
5. Next step.

## 4. Escalation conditions — stop and ask, don't guess

-   The plan's assumption about the code no longer holds (file renamed/moved, a registry entry already exists, etc.).
-   A test fails and the fix requires a judgment call about behavior, not a mechanical fix.
-   A step would touch something the plan's "Out of scope" section excludes, or wasn't anticipated at all.
-   A step touches `src/index.js`'s exported surface and the plan didn't already flag that as a semver-relevant, consumer-affecting change.
-   A pre-existing, unrelated test/lint failure shows up (don't silently "fix" things outside the plan's scope — flag it and ask whether to proceed past it or address it first).
-   Anything needs a tool/command outside what was negotiated in step 1 — pause and ask for that specific addition rather than expanding scope silently.

## 5. After the last step

1. Full suite: `yarn lint && yarn test`.
2. Fresh-context full-diff review: dispatch a subagent to run `/code-review` (or read the diff cold) across the _whole_ diff, not just the last step — the main session's context is full of the implementation by now, a fresh pair of eyes catches what a tired context misses.
3. Address findings as additional small commits (never amend prior commits — new commits only, per this repo's git norms), unless the user explicitly asks to clean up history before it's pushed.
4. Report a summary: commits made (SHAs + messages), test/lint status, current branch. If mid-flight master moved significantly, this is also where you'd have merged master into the feature branch (merge, not rebase — this team's convention, see `branch-update`) and re-run the suite; mention if that happened.

## Handoff

Stop here by default and ask before pushing/opening a PR — always, no exceptions, regardless of anything negotiated in step 1. Explicit `/implement-plan` invocation is permission to commit locally throughout (per `CLAUDE.md`'s "don't stage or commit unless explicitly asked," which this explicit invocation satisfies) — it is **not** permission for anything that writes to a remote. Push and PR-create are qualitatively different, harder-to-reverse actions, and this repo's universal rule requires a fresh, explicit, in-the-moment ask for those specifically, every single time.

If the user explicitly says to proceed: push, then `gh pr create`. Unlike the sibling `maps-app` repo, this repo has **no PR body template** — write a plain, free-form `## Description` (matching real PR bodies here: a short goal statement, then sub-headers like `#### The bug`/`#### The fix` as needed, no checklist). **The PR title matters more here than in maps-app**: `dhis2-verify-pr-title.yml` actually lint-checks it in CI via commitlint, so get the Conventional Commits format right (see `commit-and-pr-messages`) — a malformed title fails a real CI check, not just a style preference. Then hand off to the `pre-review` skill for the final self-review-and-mark-ready pass — don't duplicate its logic.
