# Output format and state

## Presenting suggestions

One run produces 0-7 suggestions (see Scope discipline in `SKILL.md`). Present each as:

### N. \<short title\>

-   **What**: one line, concrete — name the file/skill/`CLAUDE.md` section.
-   **Why**: the friction/mistake it's tied to.
-   **Evidence**: e.g. "seen in 3 sessions this window: \<dates/shas\>" or "user correction on 2026-07-15: '\<quote\>'" or "`<skill>` still tells the agent to run `<command>`, removed in `<sha>`".
-   **Proposed change**: a short diff-style snippet or a frontmatter + section-header outline — never a fully polished file inline; that's what the follow-up Plan Mode pass is for.
-   **How to apply**: "re-enter Plan Mode on this one" for anything nontrivial, or "say the word and I'll make this small edit directly" for a one-line addition.

Ask per suggestion, not once for the whole batch — accept / reject / defer. Nothing under `.claude/skills/*`, `.claude/agents/*`, `.claude/commands/*`, `CLAUDE.md`, or `.claude/settings.json` gets touched until the user says so for that specific item.

## Retro log

Write `.claude/retros/YYYY-MM-DD.md` (append `-2`, `-3` if a second/third retro lands the same day):

```markdown
# Retro — YYYY-MM-DD

Window: <lastReviewedSha>..<HEAD-sha> (<date range>)

## Suggestions

### 1. <title> — accepted

<what/why/evidence, 2-4 lines>
Applied as: <what actually got written, or "deferred to a follow-up session">

### 2. <title> — rejected

<what/why/evidence>
Reason given: "<user's stated reason, verbatim or close to it>"

### 3. <title> — deferred

<what/why/evidence>
```

## State file

`.claude/retros/.state.json`:

```json
{
    "lastReviewedSha": "<full 40-char sha of HEAD at the time this retro ran>",
    "lastReviewedDate": "YYYY-MM-DD",
    "rejectedFingerprints": []
}
```

`rejectedFingerprints`: a kebab-case slug of each rejected suggestion's title. Before including a candidate in a future run, slug its title the same way and skip it silently on a match. If the same underlying friction resurfaces with clearly new evidence, it's fine to re-raise it — say explicitly it was rejected before and why this time is different.

Deferred suggestions are **not** fingerprinted — they weren't rejected, just not acted on yet.

Update this file every run, even a "nothing to report" one — it still moves `lastReviewedSha`/`lastReviewedDate` forward.
