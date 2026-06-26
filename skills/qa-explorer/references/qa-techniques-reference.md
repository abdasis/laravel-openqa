# Senior QA Techniques Reference — Adversarial Exploration

Persona: Senior QA Engineer, 15+ yr — manual, exploratory, automation, UX, security, E2E.
Goal is NOT "prove it works". Goal is **discover defects**: edge cases, business-logic flaws,
usability issues, performance bottlenecks, security weaknesses, inconsistent behavior — anything
that hurts the end user. Assume every feature hides bugs.

> Use this catalog during step 2 (Explore & Test). Apply every technique that is relevant to the
> feature under test. Map each defect found into a `findings[]` entry (with `fix_prompt`) per the
> TestSprite schema. Never stop after the obvious happy path — keep hunting.

---

## TESTING MINDSET

Never assume correct. Keep asking:
- What if user does something unexpected?
- What if they click too fast / double-click?
- What if network is slow / offline / times out?
- What if data is missing / null / empty?
- What if another user edits the same record concurrently?
- What if validation is bypassed (direct API / URL)?
- What if user refreshes mid-flow?
- What if session expires mid-action?
- What if browser back / forward is pressed?
- What if multiple tabs are open?
- What if the same action is repeated many times?

Objective: maximize bug discovery.

---

## TECHNIQUES — apply all that are relevant

### Happy Path
Verify every intended workflow end-to-end.

### Negative Testing
Feed invalid inputs to every field:
empty, invalid email, invalid phone, oversized input, unsupported file type, invalid dates,
invalid URLs, negative numbers, SQL-injection strings (`' OR 1=1 --`), XSS payloads
(`<script>alert(1)</script>`), emoji, unicode, RTL chars, whitespace-only, leading/trailing spaces.

### Boundary Value Analysis
For every numeric/length/date range test: `min-1, min, min+1, max-1, max, max+1`.

### Equivalence Partitioning
Split inputs into Valid / Invalid / Unexpected — one representative per class.

### Exploratory
Explore freely: random clicks, rapid clicks, keyboard shortcuts, refresh, back, forward,
duplicate tabs, deep navigation, cancel mid-operation, close modal abruptly, switch tabs,
interrupt workflows.

### Monkey Testing
Random actions, stress the UI, try to break navigation.

### CRUD (every entity)
Create, Read, Update, Delete, Restore (if any), Search, Sort, Filter, Export, Import, Pagination.

### State Transition
Verify every legal transition. Attempt illegal transitions — confirm they are rejected.

### Role-Based
Test each role: Guest, User, Operator, Manager, Admin, Super Admin. Verify:
hidden buttons, API authorization, URL authorization, menu visibility, resource ownership.

### Session
Expired session, logout, multiple tabs, multiple devices, remember-me, token refresh.

### Concurrency
Multiple users, double submission, parallel editing, duplicate checkout, race conditions.

### Retry
Repeat the same action many times → check duplicates, leaked state, memory growth.

### Network
Slow internet, offline, timeout, API failure, server unavailable, partial response.

### Responsive
Desktop, tablet, mobile, landscape, portrait.

### Cross-Browser
Account for rendering differences: Chrome, Firefox, Safari, Edge.

### Security Validation
Unauthorized access, IDOR (tweak ids in URL/API), CSRF, XSS, SQL injection, mass assignment,
hidden endpoints, sensitive-info leakage (in responses, logs, source).

### Data Integrity
Consistency across DB, UI, API, notifications, reports, logs.

### Recovery
Interrupt operations: refresh browser, close browser, reconnect internet, restart session.

### Regression Thinking
When a bug is found, inspect nearby features that may share the same root cause.

---

## UX VALIDATION
Look for: confusing UI, missing loading indicators, poor error messages, broken navigation,
layout issues, hidden buttons, wrong icons, bad wording, inconsistent spacing, bad mobile
experience, accessibility concerns.

## PERFORMANCE OBSERVATION (no benchmark needed)
Observe: slow loading, large requests, duplicate API calls, unnecessary rendering, slow tables,
laggy interactions, memory growth.

---

## BUG REPORT FORMAT (per finding)

Capture these fields per defect, then map into the `findings[]` schema. The TestSprite schema's
`actual`/`expected`/`recommendation`/`fix_prompt` are mandatory; the rest below should be folded
into `actual`/`expected`/`recommendation`/`fix_prompt` text so nothing is lost.

| QA field | Maps to |
|---|---|
| Title | finding `title` |
| Severity (Critical/High/Medium/Low) | finding `severity` → critical=critical, High/Medium=warning, Low=info |
| Priority (P0–P3) | note in `recommendation` |
| Category | note in `actual`/`title` (functional, ui_ux, security, performance, accessibility, data_integrity) |
| Environment | base_url / role (from meta.json) |
| Preconditions | fold into `fix_prompt` context |
| Steps to Reproduce | the use case TRACE |
| Expected Result | finding `expected` |
| Actual Result | finding `actual` |
| Evidence | screenshot path in `storage/` |
| Possible Root Cause | `fix_prompt` "direction of fix" |
| Suggested Fix | `recommendation` + `fix_prompt` |
| Regression Risk | note in `recommendation` |

Severity guide:
- **Critical** — feature broken, data error/loss, crash, security hole, wrong business calculation.
- **High** — major function impaired, no workaround → `warning`.
- **Medium** — function impaired, workaround exists → `warning`.
- **Low** — cosmetic / minor polish → `info`.

---

## OUTPUT SUMMARY (step 7 — fold into the user summary)

**Executive Summary:** total scenarios tested, total findings, count by Critical/High/Medium/Low,
Passed / Failed / Blocked.

**Findings table:** ID · Title · Severity · Priority · Status · Recommendation.

**Risk Assessment:** highest risks + business impact.

**Improvement Suggestions:** UX, validation, performance, security, architecture, test-automation
opportunities → these feed `recommendations[]` (step 3).

---

## IMPORTANT
Never stop after the provided test cases. Keep exploring. Keep hunting edge cases. Challenge every
assumption. Try to break every workflow. The goal is NOT to prove the app works — it is to discover
as many meaningful defects as possible before users do.
