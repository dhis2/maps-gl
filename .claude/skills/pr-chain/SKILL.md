---
name: pr-chain
description: Use when planning, creating, or maintaining a stacked chain of dependent PRs (PR1 -> PR2 -> ... -> PRn, each branched from the previous) for one large epic. Covers slicing a plan into a 5-10 PR chain, propagating review-feedback changes down the still-open stack, and re-anchoring downstream PRs after an earlier one squash-merges to master. Creates real branches/PRs — always requires explicit invocation, never trigger this automatically.
disable-model-invocation: true
---

# PR chain

A "chain" is a stack of dependent branches for one epic: `pr1 -> pr2 -> ... -> prN`, each branched from the previous one's branch (not from `master`), each its own small, independently-reviewable PR. This repo squash-merges everything, which is the one fact that makes chains tricky — see "After a stack member merges" below before touching anything post-merge.

| Situation                                                                                       | Do this                                                           |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| You have (or need to produce) a plan with 3-10 discrete steps and want it as a reviewable chain | "Creating the chain"                                              |
| Review feedback changed an earlier PR that **hasn't merged yet**                                | "Propagating a change down the chain"                             |
| An earlier PR in the chain **just squash-merged to master**                                     | "After a stack member merges" + `references/squash-merge-sync.md` |
| The chain is pushing past ~10 PRs, or a propagation is turning into a conflict-fest             | "When to stop and re-plan"                                        |
| You just want to sanity-check the chain's current shape                                         | "Chain health check"                                              |

## Before creating anything

This skill only runs when explicitly invoked — it stages branches and opens PRs, which `CLAUDE.md`'s "don't stage or commit unless explicitly asked" policy puts squarely behind explicit consent. **Every push, `gh pr create`, and `gh pr edit` in this workflow still needs its own fresh, explicit, in-the-moment ask** — the initial `/pr-chain` invocation authorizes the workflow conceptually, not a standing blanket permission for every subsequent remote write across what could be a long-running epic. Confirm before each one.

Interview the user before creating branches:

-   **Slices**: if there's an existing plan (e.g. from `implement-plan`) with numbered steps, use those as the slice boundaries and confirm the count; otherwise ask them to describe the epic and propose a slicing, then confirm it.
-   **Ticket scheme**: one shared epic ticket across the whole chain, PRs numbered in their titles/bodies — confirm rather than assume a sub-ticket per slice.
-   **Count check**: if the plan has more than ~10 steps, flag it before creating anything (see "When to stop and re-plan").

## Rollout

**PR1 opens ready-for-review; PR2..N open as drafts incrementally**, each only once its own branch/commits actually exist — not all upfront.

## Naming convention — adapted for this repo's CI-checked PR title

`<type>/<TICKET-ID>-PRk-<short-description>` for branches, same idea as `maps-app`'s (no real chain precedent exists in this repo's own history yet, so this is a fresh convention, not a copy of an established one):

```
feat/DHIS2-18821-PR1-toolbar
feat/DHIS2-18821-PR2-bidirectional-sync
```

**PR titles are different from `maps-app`'s convention on purpose**: `maps-app` puts the position marker as a `[PRk]` _prefix_ (`[PR1] feat: ...`), which is fine there since maps-app doesn't lint-check PR titles. **This repo does** (`dhis2-verify-pr-title.yml`, via commitlint) — a title that doesn't start with a valid `type(scope): subject` header fails a real CI check. So here, put the position marker as a **trailing bracket tag**, same slot as the ticket ID, keeping the Conventional Commits header intact at the front:

```
feat: add data table toolbar [PR1/4] [DHIS2-18821]
feat: add bidirectional map/table selection sync [PR2/4] [DHIS2-18821]
```

## Creating the chain

Build branches strictly in order, each one rooted on the previous, pushing and opening each PR before starting the next slice (so cross-links can reference real PR numbers) — confirming with the user before each push/`gh pr create`:

```bash
git fetch origin master

git checkout -b feat/DHIS2-18821-PR1-toolbar origin/master
# ... implement slice 1, commit ...
# ask before pushing:
git push -u origin feat/DHIS2-18821-PR1-toolbar
# ask before opening the PR:
gh pr create --base master --head feat/DHIS2-18821-PR1-toolbar \
  --title "feat: add data table toolbar [PR1/4] [DHIS2-18821]" \
  --body "$(cat <<'EOF'
## Description

Part 1 of 4 in the DHIS2-18821 chain: **this PR** -> #<PR2 once opened>

- First in the chain — no dependency.
- Merge order matters: this must land before the rest of the chain.

#### Goal
...
EOF
)"
# capture the PR number gh just printed, e.g. PR1=1234

git checkout -b feat/DHIS2-18821-PR2-bidirectional-sync feat/DHIS2-18821-PR1-toolbar
# ... implement slice 2, commit ...
# ask before pushing:
git push -u origin feat/DHIS2-18821-PR2-bidirectional-sync
# ask before opening the draft PR:
gh pr create --draft --base feat/DHIS2-18821-PR1-toolbar \
  --head feat/DHIS2-18821-PR2-bidirectional-sync \
  --title "feat: add bidirectional map/table selection sync [PR2/4] [DHIS2-18821]" \
  --body "## Description

Part 2 of 4: #<PR1> -> **this PR** -> #<PR3 once opened>
..."
# capture PR2's number, then ask before backfilling PR1's body with the real PR2 link
gh pr edit <PR1> --body "<PR1's body with the real #<PR2> link filled in>"
```

Repeat for slices 3..N. Base branches are chained on purpose (`gh pr create --base <previous-branch>`, not `--base master`) — only PR1 targets `master`.

## PR body: chain cross-links

No template exists here — fold the chain position into the same free-form `## Description` this repo already uses (see `commit-and-pr-messages`):

```markdown
## Description

Part 2 of 4 in the DHIS2-18821 chain: #1234 -> **this PR** -> #1236 -> #1237

-   Depends on: #1234 — merge that first.
-   Base branch: `feat/DHIS2-18821-PR1-toolbar` (retargets to `master` once #1234 merges).

#### Goal

...
```

No checkbox-blocking CI exists here (unlike `maps-app`'s `check-tasklist.yml`), so there's no equivalent "never leave a checkbox unchecked" gotcha — plain prose is fine.

Since there's no stacked-PR tooling installed (no Graphite config, no `git-branchless`, no `gh` stacking extension, no relevant git aliases), merge-order is enforced purely by this text plus reviewer discipline.

## Propagating a change down the chain (all still open)

Team convention for keeping any branch in sync is **merge, never rebase** (confirmed in recent history — see `branch-update`) — apply the same rule between stack members while nothing has merged to master yet:

```bash
git checkout feat/DHIS2-18821-PR2-bidirectional-sync
git fetch origin feat/DHIS2-18821-PR1-toolbar
git merge origin/feat/DHIS2-18821-PR1-toolbar
# resolve conflicts if any, commit the merge
# ask before pushing:
git push origin feat/DHIS2-18821-PR2-bidirectional-sync
```

Then cascade the same merge down the rest of the tail, one generation at a time, in order. If a merge conflicts, resolve it in place and commit — don't rebase to dodge the conflict.

## After a stack member merges

The moment PR1 squash-merges, PR2's branch has a problem: it still contains PR1's original, unsquashed commits, but `master` now has a single new squash commit instead. PR2's diff against `master` will suddenly show PR1's _entire_ changeset again — a huge, wrong, likely-conflicting "phantom diff."

**Fix it immediately after the merge** — the fix is `git rebase --onto`, re-anchoring PR2 directly onto the new `master`, dropping everything that came from PR1. Full mechanics and the cascading effect on PR3..PRN are in `references/squash-merge-sync.md` — read that before doing this the first time.

## Merge/review order discipline

Merge strictly top-down: PR1, then PR2, then PR3, ... No tooling enforces this — the `## Description`'s chain notes plus reviewer discipline are the only enforcement.

## When to stop and re-plan

-   The chain is at or approaching ~10 PRs — ship what's ready, start a fresh shorter chain off the new master.
-   A single propagation touches most of the remaining tail with real conflicts — usually means a slice boundary was wrong; pause and discuss re-slicing.
-   Rule of thumb: if fixing one thing requires touching more than half the remaining stack with conflicts, stop and raise it with the user.

## Chain health check

```bash
git branch -a | grep "DHIS2-18821-PR"
git merge-base --is-ancestor origin/feat/DHIS2-18821-PR1-toolbar origin/feat/DHIS2-18821-PR2-bidirectional-sync && echo ok
git log --oneline origin/feat/DHIS2-18821-PR1-toolbar..origin/feat/DHIS2-18821-PR2-bidirectional-sync
gh pr view <PR2_NUMBER> --json baseRefName,number,title
```

If a `..` diff between adjacent branches looks like the _whole epic_ rather than one slice, that branch is out of sync with a squash-merge upstream of it — go to "After a stack member merges".

## Related

-   `implement-plan` — a natural source of the numbered plan steps that become this chain's slices.
-   `branch-update` — the simpler, single-branch version of "merge master in" this skill's own step reuses.
