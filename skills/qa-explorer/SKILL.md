---
name: qa-explorer
description: |
  QA exploration of a Laravel+Inertia feature, TestSprite-style: explore via browser-use, run functional + UI/UX tests, save results as JSON to .openqa/<module>/ (meta.json + explorer.json + index.json + <sub-feature>.json + storage/), generate a Playwright E2E spec + Page Object per sub-feature to .openqa/<module>/e2e/, then automatically open GitHub Issues (one per critical/warning bug + one per feature request, with dedup). For consumption by the Laravel web package.

  Activate this skill whenever the user asks to:
  - "qa feature X", "explore feature X", "walk module X"
  - "test feature X and save to openqa", "write a qa report for X"
  - "run exploration X", "record the qa trace for module X"
  - "check feature X then write the json result"

  Do not wait for the user to explicitly say "testsprite" or "explorer.sh" — if it is clear they want to QA a feature and save the results to .openqa/, use this skill. This skill writes a JSON report + E2E spec to .openqa/ AND opens GitHub Issues from its findings. e2e-feature-audit is an alternative that goes straight to GitHub Issues without .openqa/ artifacts.
allowed-tools: Bash, Read, Write, Agent
---

# QA Explorer

Goal: explore a feature via the browser, document the exploration trace + functional/UI-UX findings TestSprite-style, save as JSON to `.openqa/<module>/`.

Output per module, under `.openqa/<module>/`:
- `explorer.json` — raw module-level exploration trace (use cases, TRACE, forms, pages)
- `index.json` — module-level summary + categorized findings for the Laravel web package
- `meta.json` — session metadata: base_url, tenant, credentials per role, notes
- `<sub-slug>.json` — scoped report per sub-feature/page (e.g. `categories.json`, `student-cases.json`); one file per important sub-feature
- `storage/` — recorded evidence: per-step screenshots at `storage/<sub-slug>/<uc>-<step>.png` + session video `storage/video.mp4` (via `scripts/record.sh`)
- `e2e/` — Playwright spec + Page Object per sub-feature, generated automatically at the end of the flow (step 5): `<sub-slug>.spec.ts`, `pages/<sub-slug>.page.ts`, `tsconfig.json`

**Read first** `references/testsprite-exploration-reference.md` for the full schema of every file and the four-outcome rules (succeeded/ui_bug/incomplete/skipped). That is the source of truth for the format.

**Read also** `references/qa-techniques-reference.md` — the Senior QA technique catalog (adversarial mindset, negative/boundary/concurrency/security/session/recovery testing, the per-finding bug-report fields, and the executive summary). Apply every relevant technique during exploration; the goal is to discover defects, not to prove the feature works.

## Workflow

### 1. Determine Target URL & Module Name

**DO NOT read application code.** From the conversation context:
- Identify the feature name and module slug (kebab-case, e.g. `cbt`, `student-cases`) — this slug becomes the folder name `.openqa/<module>/`.
- Determine the base URL (ask the user if absent — default `http://smknura.localhost:8006`).
- Open the browser directly.

### 2. Explore & Test via browser-use (HEADLESS)

**The browser is the source of truth — not the code.**

```bash
browser-use --headless open <BASE_URL>
browser-use --headless screenshot
browser-use --headless state   # see elements on the page
browser-use --headless keys "Tab"          # move focus to the next field (check tab order)
browser-use --headless keys "Shift+Tab"    # move back
browser-use --headless keys "Control+s"    # check save shortcut (Mac: "Meta+s")
```

To test **tab order**: click the first form field, then `keys "Tab"` repeatedly while running `state`/`screenshot` each time to observe which elements receive focus and in what order. To test **Ctrl+S**: fill the form (valid/invalid), `keys "Control+s"`, then `screenshot` — confirm the form was submitted (app toast/validation) and NOT the browser "Save As" dialog.

Log in via the form if needed, then navigate to the target feature like a real user.

#### MANDATORY: UNDERSTAND the feature's purpose first — not just click around

This QA is not "click button, see no error". You MUST **understand the feature's business purpose** before and during exploration, then test whether the feature actually **fulfills that purpose**, not just "is clickable".

**Adversarial mindset (from `references/qa-techniques-reference.md`):** assume every feature hides bugs. Never assume correct. While walking, constantly ask: what if user clicks too fast / double-submits? slow or offline network? missing/null data? another user edits the same record? validation bypassed via direct URL/API? refresh mid-flow? session expires? browser back/forward? multiple tabs? same action repeated many times? The objective is to **maximize bug discovery**, not confirm success.

Before starting the walk, answer first (from observing UI, labels, data, flow — not reading code):
1. **What is this feature for?** Who is the user, what problem does it solve, what end result does the user expect. Write 1-2 sentences → this becomes `description` in explorer.json.
2. **What does "success" really mean?** Not just "a toast appeared", but: is the data actually saved, counted, linked to other entities, and does it have the right **impact**? Example: in a violation-points feature, "success" = the student's points actually **increase** and the accumulated total updates, not just that a record was inserted into a table.
3. **What business rules & invariants must hold?** (e.g. total must not go negative, status may only move forward, end date ≥ start date, role X must not see role Y's data, quota must not be exceeded). Test each rule consciously — try to violate it, confirm the system rejects it.
4. **What are the correct consequences/side effects?** After the action, what should change elsewhere (balance, counter, related-entity status, notification, log)? Verify those effects, not just the form screen.

**Verify the outcome, not the mechanics.** Every `succeeded` use case MUST have a `success_signal` stating a **verified business impact** (the number changed correctly, data is linked, the calculation is right) — not just "the button was clickable / a toast appeared". If a success toast shows but the data/calculation turns out wrong → that is a `ui_bug` (a `critical` finding), not `succeeded`.

#### MANDATORY: record every step to storage/

The exploration **must be recorded**. For every important action in the trace (open form, submit, validation appears, success toast, confirm dialog, result after reload) take a screenshot via `record.sh shot` — DO NOT use raw `browser-use screenshot`, so the naming & folder layout stay consistent.

```bash
SKILL_DIR="$HOME/.claude/skills/qa-explorer"
REC="$SKILL_DIR/scripts/record.sh"

# Take a step screenshot: storage/<sub-slug>/<uc>-<step>.png
# --sub = sub-feature slug (same as the subreport filename), --uc = use case index, --step = trace step number
bash "$REC" shot <module> --sub categories --uc 1 --step 3 --root "$(pwd)"
```

Recording rules:
- One media folder per sub-feature: `storage/<sub-slug>/`. Files `<uc>-<step>.png` (2 digits), easy to correlate to the trace in `explorer.json`/`<sub-slug>.json`.
- Minimum to record: the initial page state, every submit + its result, every defect found (proof frame for `ui_bug`), and the success signal.
- The full session video is assembled in step 4 from these screenshots.

#### TestSprite-style mindset: break into USE CASES

Before exploring, identify the **use cases** of this feature (e.g. for CRUD: Create, Verify/Read, Edit, Delete, Search, History). Walk them one by one. For each use case record:
- **TRACE** — numbered steps `action → result`. Insert a `wait` node (with a reason) when waiting.
- **Outcome** — one of: `succeeded` | `ui_bug` | `incomplete` | `skipped`.
- **FORMS OBSERVED** — the schema of forms encountered (field, required, input type, submit-disabled condition).

**Dependencies between use cases are load-bearing.** If Create fails, then Verify/Edit/Delete that depend on it → `skipped` with `blocked_by` naming Create. Do not force-walk a use case whose upstream already failed — mark it `skipped`. Distinguish strictly:
- `incomplete` = the use case **ran** (has a trace, often created data) but verification failed / the budget ran out.
- `skipped` = the use case was **never attempted** because a dependency failed first.

#### Functional Checklist (per use case, skip what is not relevant)

**Create** — form opens & fields complete; empty submit → per-field validation; valid submit → data appears in the list + toast; data saved correctly (check the detail) **and its business effect is correct** (number/relation/status updated per the feature's purpose, not just a record inserted).
**Edit** — form pre-filled with old data; save → updated + toast; empty submit → validation.
**Tab inside the form (MUST be tested for every input form)** — all fields can be focused and filled via the keyboard `Tab`/`Shift+Tab` in a **logical order** (top→bottom, left→right; no random jumps / skipped fields / focus traps). Non-native elements (custom combobox/select, date picker, switch, file upload) **must** be in the tab order and operable via keyboard (Enter/Space/arrows), not mouse only. The focus ring/focus indicator is visible. `Tab` on the last field does not unexpectedly jump out of the form. Record any field skipped from the tab order or not operable via keyboard as a finding (`warning`, accessibility).
**Ctrl+S shortcut for save (MUST be tested if this form is the primary work area / a long form)** — press `Ctrl+S` (Mac: `Cmd+S`) with focus inside the form: it must **submit/save the form**, NOT trigger the browser's built-in "Save page" dialog (meaning the app calls `preventDefault`). With valid data → saved + toast; with invalid data → show validation, do not stay silent. If the shortcut is absent while this form is the primary work area → record as a `recommendation` (power-user). If the shortcut EXISTS but triggers the browser dialog / does not save → finding (`warning`).
**Delete** — confirm dialog appears; cancel → still present; confirm → gone + toast.
**Search & Filter** *(if present)* — matching keyword → relevant results; no match → empty state, not an error; clear keyword → returns; filter dropdown → each option; combinations stay consistent.
**Sorting** *(if present)* — click header → asc → desc; sorting persists across pagination.
**Navigation** — pages open with no console error/404/500; all links/breadcrumbs are not 404/403.

#### Adversarial techniques (per use case, from `references/qa-techniques-reference.md`)

Beyond the functional checklist, actively try to BREAK the feature. Apply each relevant technique and file any defect into `findings[]`:

**Negative testing** — feed each field invalid input: empty, invalid email/phone, oversized, unsupported file, invalid date, negative number, SQL-injection string (`' OR 1=1 --`), XSS payload (`<script>alert(1)</script>`), emoji, unicode, whitespace-only, leading/trailing spaces. Confirm the app rejects them gracefully (no crash, no stored XSS, clear validation).
**Boundary value analysis** — for every numeric/length/date range test `min-1, min, min+1, max-1, max, max+1`.
**State transition** — try every legal transition; attempt illegal ones (status moving backward, skipping a step) and confirm rejection.
**Role-based** — re-run the use case as a lower-privileged role: are buttons hidden AND the API/URL actually authorized? Try IDOR (change an id in the URL/API to another tenant/user's record) — it must be blocked.
**Session** — expired session mid-action, logout, multiple tabs editing the same record, remember-me; the app must handle each without data loss or silent failure.
**Concurrency / retry** — double-submit (rapid clicks), parallel edits, repeat the same submit many times — check for duplicate records, race conditions, leaked state.
**Network / recovery** — slow/offline/timeout/partial-response; refresh or close mid-flow then reopen — confirm no corrupt/partial data and a sane recovery state.
**Responsive** — check the page at mobile/tablet widths (no overflow, controls reachable).
**Performance observation** — note slow loads, duplicate API calls, laggy tables/interactions (no benchmark needed, just observe).
**Regression thinking** — when a bug is found, probe nearby features that may share its root cause.

Map each defect using the **bug-report fields** in `references/qa-techniques-reference.md` (Severity Critical/High/Medium/Low, Priority P0–P3, Category, Steps, Expected, Actual, Evidence screenshot, Root Cause, Regression Risk), then fold them into the `findings[]` schema (severity → critical/warning/info per the table there).

#### UI/UX Checklist — Actively Evaluate Every Point

Don't just note the obvious deviations. Compare against the project's design system.

**Structure & Layout** — consistent spacing across the module's pages; breadcrumb present & correct hierarchy (non-last items = links); clear visual hierarchy; tidy grid at 1280px & 1440px; no overflow/clipping/overlap.
**Components & Design System** — all components use the design system (not raw HTML); button/badge/status colors consistent with the palette; icons from one library (HugeIcons); consistent label capitalization; one primary button per page.
**Feedback & State** — loading/skeleton while loading (not a blank screen); informative empty state (icon+text+action); a consistent toast for each CRUD; server errors shown clearly; submit shows a loading state.
**Accessibility** — clear button/link labels (no icon without a tooltip); logical tab order; destructive actions ask for a confirmation that names the data.

**Each UI/UX finding → record actual vs expected + a concrete recommendation** (name the component/color/state, not "fix the UI").

### 3. Mine Feature-Development Recommendations

After exploring, an active thinking session: **"What is missing but would be useful for this module's users?"** Use this framework:

1. **Friction Points** — slow/confusing/many-click moments. What can be cut?
2. **Data exists but unused** — could it become a report, chart, statistical summary?
3. **Frequently repeated actions** — could they become a bulk action, duplication, Excel/PDF export?
4. **Cross-module information** — relationships between modules not yet visible in the UI?
5. **Notifications & Triggers** — events that should fire a notification/email/log?
6. **Power User** — keyboard shortcuts, saved filters, custom columns?
7. **Audit & Transparency** — who changed what & when? Activity log?
8. **Proactive UI/UX (improvement, not defect)** — beyond actual-vs-expected bugs (those are `findings`), what could be polished to make it better? A more scannable layout, clearer visual hierarchy, more comfortable density/whitespace, progressive disclosure, redesigned card/table/form, clearer microcopy, more informative empty/loading states, consistent patterns across pages. These are UI/UX improvement suggestions that don't violate a specific expectation — not "the button is broken", but "this flow could feel nicer if ...".

Each recommendation: **problem/need → concrete solution → value to the user**.

**Separate strictly from findings:** a UI problem that deviates from expectation (overflow, wrong color, missing breadcrumb, no toast) → `findings` (a reactive defect, needs a `fix_prompt`). A proactive UI/UX improvement suggestion (redesign, polish, density) → `recommendations` (lens 8) → becomes a feature request in step 6.

### 4. Assemble & Write the JSON

Assemble the JSON payload per the schema in `references/testsprite-exploration-reference.md`:

**meta.json** — `module`, `feature`, `base_url`, `tenant`, `credentials{}` (per role: email/password/role/verified), `notes[]`. Assemble from the credentials & tenant context used during exploration.

**explorer.json** — `module`, `feature`, `description`, `base_url`, `use_cases[]` (with trace, outcome, forms_observed), `pages_visited[]`, `app_observations[]`. (The `counters` & `status` fields are computed automatically by the script — may be left empty.)

**index.json** — `module`, `feature`, `base_url`, `findings[]` (severity critical/warning/info + actual/expected/recommendation), `recommendations[]`. (`summary` is computed automatically.)

**`<sub-slug>.json` (per sub-feature)** — when a module has several pages/areas worth reporting separately, write one scoped file per sub-feature. Requires `page` (the page path); may carry `use_cases[]` (same schema as explorer.json) + `findings[]` + `recommendations[]` specific to that sub-feature. A finding `id` uses the sub-feature prefix (e.g. `bk-cat-001`) so it does not collide with module-level ids. (`summary` is computed automatically.)

Finding severity categories:
- **critical** — the feature does not work, data error, crash.
- **warning** — functional but has a UX/consistency problem.
- **info** — improvement suggestion, minor polish.
- Feature-development ideas AND proactive UI/UX improvement suggestions (step 3, including lens 8) → go into `recommendations[]`, not findings.

**Fix prompt for ALL findings (MANDATORY, including `info`).** Every finding — `critical`, `warning`, or `info` — MUST carry a `fix_prompt` field: a single ready-to-paste prompt for an LLM coding agent (Claude Code / Cursor) to apply the fix or improvement. The validator rejects an index/subreport if any finding lacks a `fix_prompt`.

Rules for writing `fix_prompt` — make it self-contained, the receiving agent does not see this report:
1. **Context** — name the module, page/route (`page`), and related use case in 1-2 sentences.
2. **Symptom / current situation** — what is wrong or missing (from `actual`), what is expected (from `expected`).
3. **Direction of the fix** — concrete pointers to the likely root cause or implementation site (controller/query/component/state), not "fix the UI".
4. **Done criteria** — a measurable condition that marks the fix/improvement complete.

Write it in English, imperative, dense. Example:
> "In the CBT module on page `/counseling/student-cases/create`, a newly submitted violation does not appear in the list (the list stays 'No data') even though it should show with a success toast. Check the redirect after store and the list query in the index controller — the scope filter (tenant/user) likely mismatches between create and list. Ensure that after a valid submit, the new record appears in the table and a success toast shows."

Write via `scripts/explorer.sh` — the script validates the schema & writes it cleanly, and also creates the `e2e/` + `storage/` folders. **Always go through this script**, do not write JSON manually into `.openqa/`, so the schema stays consistent (valid outcome, correct counters, skipped without trace, complete credentials, etc.).

```bash
SKILL_DIR="$HOME/.claude/skills/qa-explorer"
SH="$SKILL_DIR/scripts/explorer.sh"

# meta.json — session metadata + credentials
cat /tmp/meta-payload.json | bash "$SH" meta <module> --root "$(pwd)"

# explorer.json — module-level exploration trace
cat /tmp/explorer-payload.json | bash "$SH" explorer <module> --root "$(pwd)"

# index.json — module-level findings
cat /tmp/index-payload.json | bash "$SH" index <module> --root "$(pwd)"

# <sub-slug>.json — per sub-feature report (repeat per important sub-feature)
cat /tmp/categories-payload.json | bash "$SH" subreport <module> --slug categories --root "$(pwd)"
```

If the script fails (non-zero exit), it prints the schema reason to stderr **and writes no file**. Fix the payload and re-run.

After the JSON is written, stitch all the screenshots in `storage/` into one session video (per-step slideshow) via `record.sh video`:

```bash
bash "$REC" video <module> --root "$(pwd)"   # → .openqa/<module>/storage/video.mp4
```

`video` collects all PNGs in `storage/` (recursive, name-sorted) and muxes them into `storage/video.mp4` via ffmpeg. Default 1 frame/second (`--fps N` to change). If ffmpeg is absent or there are no screenshots yet, it exits non-zero without writing — just skip it, the per-step screenshots are still saved.

### 5. Generate E2E Playwright (MANDATORY, automatic)

After the JSON is written, **always** generate a Playwright spec into `.openqa/<module>/e2e/`, **one spec + one Page Object per sub-feature** (each `<sub-slug>.json`; if there is no subreport, use the module level from `explorer.json`). Do not wait for the user to ask — this is part of the flow.

Output structure under `.openqa/<module>/e2e/`:
```
e2e/
  tsconfig.json                  # once per module (see template below)
  <sub-slug>.spec.ts             # one per sub-feature
  pages/
    <sub-slug>.page.ts           # Page Object per sub-feature
```

**Required pattern** (follow the project's existing `tests/e2e/` — read 1-2 existing specs + POMs first as examples of real selectors):
- Use `import { test, expect } from '@playwright/test'`. Auth via `storageState` (the project config already has `auth.setup.ts`) — **do not** log in manually in the spec.
- **Page Object per sub-feature** in `pages/<sub-slug>.page.ts`: arrows optional (follow the existing class pattern), store locators in the constructor, methods `goto()`, actions (`openCreateDialog`, `fillForm`, `submit`, `search`, etc.) per `forms_observed` in the JSON.
- **Selectors** come from `forms_observed` (field_name, input_type), `pages_visited.key_ui_elements`, and the trace. For field ids, project examples: `#cat-name`, `#cat-points`, `#reset-per-year`, `getByRole('spinbutton')`, `getByRole('button', { name: 'Edit' })`. If an id is uncertain, use role/label/placeholder + comment the assumption.
- **One test per `succeeded` use case**: run the trace as the happy path, assert the `success_signal` (toast `/berhasil/i`, data appears, etc.). A test that mutates data MUST be **idempotent** — restore the seed value at the end (see `data_created` & `notes` in meta for the original value).
- **Tab-order + Ctrl+S test per form** that has `forms_observed`: one test presses `Tab` across the fields and asserts focus moves in a logical order (e.g. `await page.keyboard.press('Tab'); await expect(page.locator('#field-2')).toBeFocused()`); one test presses `Control+s` in a valid form and asserts the `success_signal` (the form submitted, not the browser dialog). Skip only if the feature is genuinely not a form-based work area.
- **REGRESSION test per `critical`/`warning` finding** (not `info`): write a test asserting the **correct expectation** (`expected`), commented `// REGRESI <id> — <title>`. This test **fails while the bug is unfixed** — that is the point (the reference for verifying `fix_prompt`). Name the finding id in the comment.
- `incomplete`/`skipped` → may use `test.fixme()` with the reason from `why_incomplete`/`why_skipped`.
- Header of each file: a 2-3 line comment naming the source (`.openqa/<module>/<sub-slug>.json`) and the idempotency note.

`tsconfig.json` (write once per module):
```json
{
  "compilerOptions": {
    "target": "ESNext", "module": "ESNext", "moduleResolution": "bundler",
    "allowJs": true, "noEmit": true, "isolatedModules": true,
    "esModuleInterop": true, "forceConsistentCasingInFileNames": true,
    "strict": true, "skipLibCheck": true,
    "types": ["@playwright/test", "node"]
  },
  "include": ["**/*.ts"]
}
```

After writing, **type-check** the spec (do not run it live unless the app is reachable):
```bash
npx tsc --noEmit --skipLibCheck --esModuleInterop --module esnext \
  --moduleResolution bundler --target es2022 --types node \
  .openqa/<module>/e2e/*.spec.ts .openqa/<module>/e2e/pages/*.ts
```
The specs live in `.openqa/` (outside Playwright's `testDir` `./tests/e2e`) — they are **not** auto-run by `npx playwright test`. To run them: copy/symlink to `tests/e2e/<module>/` then `E2E_LOCAL_URL=<base_url> npx playwright test tests/e2e/<module>`. Mention this in the summary, don't run it automatically.

### 6. Open GitHub Issues (MANDATORY, automatic)

After the JSON + e2e are written, **always** open GitHub Issues: **one issue per `critical`/`warning` finding** (bug) and **one issue per recommendation** (feature request). Do not wait for the user to ask. Issues are created via `scripts/issues.sh`, which **automatically checks for duplicates** — a finding whose issue already exists (marker `<!-- qa:<id> -->` in the body, open or closed) is skipped, so it is safe to run repeatedly.

```bash
SKILL_DIR="$HOME/.claude/skills/qa-explorer"
ISS="$SKILL_DIR/scripts/issues.sh"

# Preview what will be created & what already exists (does not write to GitHub).
bash "$ISS" <module> --root "$(pwd)" --dry-run

# Create the issues that don't exist yet (auto-skip duplicates).
bash "$ISS" <module> --root "$(pwd)"
```

What the script does:
- Reads `index.json` + each `<sub-slug>.json`, gathers findings (`critical`/`warning` only — `info` is skipped) + all `recommendations`.
- **Bug issue:** title `[Bug][Critical|Warning] <title>`, labels `bug,qa-explorer`, body with actual/expected/recommendation + a `fix_prompt` block (ready to paste into a coding agent) + dedup marker.
- **Feature request:** title `[Feature Request] <title>`, labels `feature-request,qa-explorer`, body with problem/solution/value + marker.
- The labels `bug`, `feature-request`, `qa-explorer` are created automatically if absent.

Three dedup layers:
1. **Marker (strong):** for each id, find an issue (open OR closed) whose body contains `<!-- qa:<id> -->`. Already exists → SKIP. This prevents the same qa-explorer issue from being created twice across runs.
2. **Within-batch:** two items with identical/similar titles in the same report (e.g. the same recommendation appearing in both `index.json` and a subreport) → only one is created.
3. **Similar to an existing OPEN issue (soft):** an item title similar (Jaccard token ≥0.6) to a feature request / bug already open in the repo → SKIP + warn, **unless** `--force`. This avoids adding an FR someone else already requested (e.g. "Excel export" that already exists).

Notes:
- **Always run `--dry-run` first**, show the user the candidate issues + the skipped ones (already exist / similar to existing / batch duplicate), then run without the flag. Creating issues is outward-facing — make sure not to spam duplicates.
- **Checking existing feature requests first** is the core of this step: the soft dedup automatically compares against the repo's OPEN issues. If unsure whether an FR already exists, look at the dry-run output — anything skipped as "similar to existing issue #N" already exists; no need to create it again.
- Requires an authenticated `gh`. If `gh` is absent / not authenticated / not a GitHub repo, the script exits non-zero — skip this step and tell the user (don't fail the whole flow).
- `--only bugs` / `--only features` to limit the type. `--force` to create anyway despite a title similar to an existing issue (use when you're sure the context differs).
- If a finding already has a `fix_prompt`, the issue body includes it automatically — the bug issue becomes directly actionable by a coding agent.

### 7. Summarize to the User

After all files are written, give a short summary. Lead with an **Executive Summary** (per `references/qa-techniques-reference.md`): total scenarios/use cases tested, total findings broken down by Critical/High/Medium/Low, and Passed / Failed / Blocked counts; then a one-line **Risk Assessment** naming the highest risk + its business impact. Follow with: count of use cases per outcome, critical/warning findings, the list of reported sub-features, the list of generated E2E specs (`e2e/<sub-slug>.spec.ts` + POM), **the list of GitHub Issues created vs skipped (already exist)**, and the paths of the produced files (`meta.json`, `explorer.json`, `index.json`, each `<sub-slug>.json`, plus the `e2e/` & `storage/` folders). Mention how to run the E2E (copy into `tests/e2e/` + the Playwright command) and remind them that the REGRESSION tests intentionally fail until the `fix_prompt` is done.

---

## Tips

- **browser-use error:** run `browser-use --headless close` then try again.
- **Login required:** log in via the form in browser-use before testing.
- **Empty master data:** create it through the app UI — navigate to the master module, fill the form, return to the feature.
- **Large payload:** write to a temp file first (`/tmp/explorer-payload.json`) then pipe it into the script — easier to debug than a long heredoc.
- **Re-run:** re-running overwrites `.openqa/<module>/<kind>.json` — safe, one file per module per kind.
- **Keyboard test:** focus the element first (`browser-use click` on the first field), then send `keys`. `keys "Control+s"` on Linux/Win, `keys "Meta+s"` on Mac. If `Control+s` triggers the browser "Save As" dialog, the app has not called `preventDefault` → that is a finding.
- **Understand the feature, don't click blindly:** before the walk, formulate the business purpose + the real definition of "success" (the data/calculation/relation impact), not just "a toast appeared". The `success_signal` must prove that impact.
