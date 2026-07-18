---
name: pr-polish
description: Use when iterating on an already-open PR across multiple rounds of review feedback — organizing fix lists, re-verifying each fix narrowly, and deciding when to hand off to the pre-review skill for the final self-check. Heavier and more interactive than pre-review, which is only the last quick pass.
---

# PR polish

The umbrella workflow for an open PR (yours, or handed off from another Claude session) that isn't done after one pass — the user reports back a list of things to fix, Claude fixes them, and this repeats until the user is satisfied. `pre-review` is the last, quick step of this loop, run once per "I think we're done" moment — not a replacement for it.

| Situation                                                      | Do this                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Picking this PR up cold (new session, or another agent's work) | Orient first — step 1                                                          |
| User just handed you a list of desired fixes                   | Turn it into a todo list — step 2                                              |
| A fix from the todo list is implemented                        | Verify narrowly, not the whole suite — step 3                                  |
| Todo list is fully checked off                                 | Report back and wait for the next round of feedback — don't assume you're done |
| User says something like "I think this is it" / "ship it"      | Run the `pre-review` skill — step 4                                            |
| `pre-review`'s self-review surfaces a new issue                | Loop back to step 2 — see "Repeated final passes"                              |

## 1. Orient

Before touching anything, confirm what state the PR is actually in — don't assume your session's memory matches reality, especially if earlier rounds happened without you:

```
gh pr view --json number,title,body,state
gh pr diff
```

## 2. Turn feedback into a todo list

When the user gives you a batch of fixes (review comments, a failing test, whatever), convert each distinct item into a `TodoWrite` entry before starting on any of them — this keeps the list visible and resumable across a long session, the same pattern the `sonarqube-fix` command uses for its issue list. Word each item as a concrete, checkable outcome, not a vague restatement.

If an item is ambiguous, ask rather than guessing.

## 3. Fix, then verify narrowly

For each todo:

1. Implement the fix.
2. Verify just that fix — the touched file(s), per `CLAUDE.md`'s "Lint/test workflow for agents" (`yarn jest <file>`, `yarn d2-style check <file>`). Don't run the full `yarn lint && yarn test` after every single item; that's step 4's job.
3. Mark the todo complete and tell the user _specifically_ what changed.

Run the full suite after a batch (roughly 3-5 related fixes, or whenever the todo list empties) — same cadence as `sonarqube-fix`.

Don't commit as you go unless the user asks — `CLAUDE.md`'s "don't stage or commit unless explicitly asked" applies throughout this loop, not just at the very end.

### Updating the PR description (optional, ask first)

Unlike `maps-app`, this repo has no PR body template or checklist to keep in sync — if the description needs updating as the fix list evolves (e.g. the `## Description`'s stated scope changed), propose the new text and get an explicit, in-the-moment ask before applying it via `gh pr edit` — same universal rule as any other remote write.

## 4. Know when it's actually done

Finishing the current todo list means "ready for another round," not "ready for review." Only move to the final pass when the user explicitly confirms — then invoke `pre-review`.

### Repeated final passes

`pre-review`'s self-review step can itself surface a new issue. When it does: add it as a new todo (step 2), fix and verify it (step 3), then re-run `pre-review` from the top — a changed diff needs a fresh lint/test/self-review pass. If you're on a third or later `pre-review` pass for the same PR, say so explicitly — that's often a sign of a design question worth discussing rather than another quick fix.

## See also

-   `pre-review` — the final quick self-check this workflow hands off to.
-   `sonarqube-fix` — the same todo-list-per-batch pattern, applied to SonarCloud findings instead of user-reported fixes.
-   `commit-and-pr-messages` — format rules for the PR title/description this skill helps keep accurate; note the PR title is CI-lint-checked here (`dhis2-verify-pr-title.yml`), unlike in `maps-app`.
