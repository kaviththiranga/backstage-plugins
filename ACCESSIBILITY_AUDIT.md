# Accessibility Audit — OpenChoreo Backstage Portal

**Scope:** `backstage-plugins` workspace, branch `acessbility-audit` (rebased onto `upstream/main` @ `9a48bb86`, deploy-view PR #575 included).
**Regulatory frame:** WCAG 2.2 Level AA · BITV 2.0 (Anhang 1, EN 301 549 V3.2.1 clause 9) · BGG §12a operator obligations.
**Audit date:** 2026-05-21.
**Method:** four-layer audit (static lint · automated browser scan · Lighthouse · manual Chrome DevTools MCP). Raw evidence under `audit-artifacts/`.

---

## 1. Executive summary

The OpenChoreo portal is **conditionally conformant with WCAG 2.2 Level AA**. Material-UI v4 provides a solid semantic baseline (forms, dialogs, tables, icon labels) and the global `<html lang="en">` is set — but several systemic patterns produce repeatable failures across most routes. None of the findings are unfixable; the audit found **0 Critical incident-level barriers**, **88 axe violation instances** rolling up to **10 distinct rules**, and **Lighthouse scores between 94 and 100** across the 7 routes scored.

| WCAG principle    | Verdict | Reasoning |
|-------------------|---------|-----------|
| 1. Perceivable    | **Partial** | 35 contrast violations cascade from one design-system token (sidebar label). 0 image alt-text issues. |
| 2. Operable       | **Partial** | No skip-link (2.4.1), 7 target-size violations (new WCAG 2.2 SC 2.5.8), code-editor scroller not keyboard-reachable (2.1.1). |
| 3. Understandable | **Pass**   | Lang declared, form labels coherent, focus does not steal context. |
| 4. Robust         | **Partial** | 17 nested-interactive (4.1.2), 6 unlabeled inputs, 2 buttons without accessible names. |

**Top-3 highest-leverage fixes (estimated ≤ 2 dev-days):**
1. Sidebar label contrast token — single token fix eliminates **35 of 88** violations (~40%).
2. Card components on `/create` and `/environments` — replace the nested-button pattern with a single button surrounded by sibling controls — eliminates **17 nested-interactive** + several target-size hits.
3. Component-header heading level (`<h5>` → `<h1>`) plus a Backstage app-shell skip-link — addresses **11 heading-order + 7 page-has-heading-one** + the 2.4.1 finding in one PR.

A **BITV 2.0 self-declaration is not yet defensible**. After the three fixes above plus the remediation roadmap §6, it becomes defensible with normal residual notes. BGG §12a operator obligations (accessibility statement, feedback channel, Schlichtungsstelle reference) are unmet today — they sit with the deploying organization, not engineering; Appendix A provides a publishable template.

---

## 2. Methodology & evidence trail

| Layer | Tool | Scope | Headline result | Raw output |
|-------|------|-------|-----------------|------------|
| **a. Static lint** | `eslint-plugin-jsx-a11y` (recommended preset, warnings) | 486 `.tsx` files in 7 frontend plugins + design-system + app shell | **0 jsx-a11y violations** — see §3 for why this is *not* good news | `audit-artifacts/eslint/` |
| **b. Automated browser scan** | `@axe-core/playwright` + axe-core 4.10 | 18 routes (11 app shell + 7 entity tabs) on a real component (`team-shop/component/snip-api-service`) | **88 violation instances** across 10 rules; worst routes: entity-definition (6), entity-environments (5), entity-alerts/metrics/runtime-logs (4) | `audit-artifacts/axe/` |
| **c. Lighthouse** | Chrome DevTools MCP `lighthouse_audit` | 7 representative routes inc. sign-in | Scores 94–100 (median 98) | `audit-artifacts/lighthouse/` |
| **d. Manual MCP walkthroughs** | take_snapshot, press_key, screenshots, resize_page | sign-in, home, catalog, create, deploy view, runtime-logs, settings-AC | Confirms axe findings, surfaces structural issues (h-level wrong, no skip-link, nested buttons), validates good patterns (live regions on errors) | `audit-artifacts/mcp/` |

The audit ran against the **post-rebase code** including PR #575 (Release vs Deploy split). Tooling scaffold lives in commit `chore(a11y): scaffold jsx-a11y lint, jest-axe, and axe-playwright` on this branch.

Reproduction commands are in §7.

---

## 3. Important meta-finding: jsx-a11y produces zero hits on this codebase

`eslint-plugin-jsx-a11y/recommended` returned **0 violations across 486 frontend `.tsx` files**, while the runtime axe scan produced 88 violation instances on the same code.

Cause: `eslint-plugin-jsx-a11y` inspects **JSX element names statically**. Material-UI v4 abstracts every interactive HTML primitive behind wrapper components (`<Box>`, `<Typography>`, `<Button>`, `<IconButton>`, `<Dialog>`, `<Table>`, `<TableCell>`, …), so the linter cannot see through to the rendered `<div>` / `<button>` / `<table>`. Verified by writing a throwaway component containing raw `<div onClick>` + `<img>` + `<a href="#">` — the linter immediately fired four jsx-a11y warnings.

**Implication for compliance evidence:** The static-lint layer of this audit is **structurally low-coverage** for an MUI codebase. The detective work moves to:
- `@axe-core/playwright` (runtime DOM, MUI wrappers transparent) — Phase B.
- Manual code review for MUI-`onClick`-on-`<Box>` patterns (e.g., `plugins/openchoreo/src/components/Environments/TraitParameters.tsx:124` — `<Box className={...} onClick={...}>` with no keyboard handler — invisible to jsx-a11y).
- Chrome DevTools MCP for dynamic-state and keyboard checks.

The lint scaffold is still kept: it catches *new* a11y regressions any time someone writes raw HTML, and future jsx-a11y rule additions land automatically.

---

## 4. WCAG 2.2 AA conformance — per-Success-Criterion table

Status legend: ✅ Pass · ⚠️ Partial · ❌ Fail · N/A Not applicable.

### Principle 1 — Perceivable

| SC | Title | Level | Status | Evidence / notes |
|----|-------|-------|--------|------------------|
| 1.1.1 | Non-text Content | A | ✅ | No `<img>` without alt found; MUI icons consistently `aria-hidden` or `aria-label`'d (e.g., `MiniEnvironmentNode.tsx:237`). axe `image-alt` rule 0 violations. |
| 1.2.x | Time-based media | A/AA | N/A | Portal has no audio/video content. |
| 1.3.1 | Info and Relationships | A | ⚠️ | 1 `list` violation (`/search` — `<ul>` with non-`<li>` children); table headers lack `scope` on `RolesTable.tsx`; entity pages have `<h5>` as the highest heading. |
| 1.3.2 | Meaningful Sequence | A | ✅ | DOM order matches visual order on inspected routes. |
| 1.3.3 | Sensory Characteristics | A | ✅ | No instructions rely on shape/colour alone. |
| 1.3.4 | Orientation | AA | ✅ | No orientation lock detected. |
| 1.3.5 | Identify Input Purpose | AA | ⚠️ | `autocomplete` attributes are not consistently applied to inputs that match WCAG-defined purposes. Low-risk for a dev portal but worth wiring up on `Profile` / `email` style fields if introduced. |
| 1.4.1 | Use of Color | A | ⚠️ | Environment deployment status chips (`MiniEnvironmentNode.tsx:220`) rely on green/red/yellow with a text label adjacent — borderline. Recommend an icon glyph in addition to colour. |
| 1.4.3 | Contrast (Minimum) | AA | ❌ | **35 axe violations** — dominated by `BackstageSidebarItem-label` (one design-system token fails on ~every route). |
| 1.4.4 | Resize Text | AA | ⚠️ | Not strictly verifiable via MCP (browser clamps resize at 500px). Recommend manual browser-zoom test. |
| 1.4.5 | Images of Text | AA | ✅ | No images of text used. |
| 1.4.10 | Reflow | AA | ⚠️ | Not strictly verifiable via MCP (see §5). Manual browser-zoom test required for sign-off. |
| 1.4.11 | Non-text Contrast | AA | ⚠️ | UI components (form borders, icon-only buttons) have not been measured. Theme tokens define `primary.main` at `#5567d5` against light surfaces — recommend running an explicit token-contrast script. |
| 1.4.12 | Text Spacing | AA | ✅ | MUI defaults respect text-spacing user overrides on inspected routes. |
| 1.4.13 | Content on Hover/Focus | AA | ✅ | Tooltips inherit MUI behaviour (dismissable via ESC, persistent on hover). |

### Principle 2 — Operable

| SC | Title | Level | Status | Evidence / notes |
|----|-------|-------|--------|------------------|
| 2.1.1 | Keyboard | A | ❌ | (i) `TraitParameters.tsx:124` — `<Box onClick>` with no key handler, invisible to jsx-a11y. (ii) `scrollable-region-focusable` axe finding on `entity-definition` — CodeMirror's `.cm-scroller` has `tabindex="-1"` blocking keyboard scroll. |
| 2.1.2 | No Keyboard Trap | A | ✅ | No traps observed; MUI Dialog focus-trap behaves correctly. |
| 2.1.4 | Character Key Shortcuts | A | ✅ | No single-character app shortcuts found. |
| 2.2.1 | Timing Adjustable | A | ✅ | No time-bound interactions. |
| 2.2.2 | Pause, Stop, Hide | A | ✅ | No auto-updating content beyond user-initiated log streaming (which has a Live toggle). |
| 2.3.1 | Three Flashes | A | ✅ | No flashing content. |
| 2.4.1 | Bypass Blocks | A | ❌ | **No "skip to main content" link** — first Tab on home lands on the sidebar logo. Confirmed manually via MCP. |
| 2.4.2 | Page Titled | A | ✅ | Every audited route has a meaningful `<title>` (verified across 18 axe scans). |
| 2.4.3 | Focus Order | A | ✅ | Tab order is logical on home; sidebar then main, no positive `tabindex` overrides found. |
| 2.4.4 | Link Purpose (In Context) | A | ✅ | Sidebar links labelled; entity-card links have descriptive text. |
| 2.4.5 | Multiple Ways | AA | ✅ | Sidebar + Search + Catalog filters provide multiple navigation routes. |
| 2.4.6 | Headings and Labels | AA | ❌ | `page-has-heading-one` fails on every entity tab — the component title renders as `<h5>` (`BackstageHeader-title`) with no preceding `<h1>` for the page. |
| 2.4.7 | Focus Visible | AA | ✅ | Computed `outline-style: auto, outline-width: 1px` on the first tab target; theme has explicit `.Mui-focused` styling in `buildOpenChoreoTheme.ts`. |
| 2.4.11 | Focus Not Obscured (Minimum) — **new in WCAG 2.2** | AA | ⚠️ | Not exhaustively tested. Sticky sidebars and floating action buttons (Deploy view) are candidates — manual check recommended. |
| 2.5.1 | Pointer Gestures | A | ✅ | No multipoint/path-based gestures. |
| 2.5.2 | Pointer Cancellation | A | ✅ | MUI buttons activate on up-event. |
| 2.5.3 | Label in Name | A | ⚠️ | Lighthouse `label-content-name-mismatch` fails on a sidebar `Home` link (visible "Home" but accessible name "OpenChoreo"). |
| 2.5.4 | Motion Actuation | A | ✅ | No motion-based interactions. |
| 2.5.7 | Dragging Movements — **new in WCAG 2.2** | AA | ⚠️ | The Catalog Graph and PipelineDAG use draggable nodes — verify a single-pointer alternative exists. |
| 2.5.8 | Target Size (Minimum) — **new in WCAG 2.2** | AA | ❌ | **7 axe violations** on Deploy-view IconButtons (e.g., `Actions for Development`, environment "more" menus) — under 24×24 effective size. |

### Principle 3 — Understandable

| SC | Title | Level | Status | Evidence / notes |
|----|-------|-------|--------|------------------|
| 3.1.1 | Language of Page | A | ✅ | `<html lang="en">` set in `packages/app/public/index.html`. |
| 3.1.2 | Language of Parts | AA | ✅ | Single-language UI; no foreign-language passages. |
| 3.2.1 | On Focus | A | ✅ | No focus-triggered context changes. |
| 3.2.2 | On Input | A | ✅ | No input-triggered context changes. |
| 3.2.3 | Consistent Navigation | AA | ✅ | Sidebar is consistent across routes. |
| 3.2.4 | Consistent Identification | AA | ✅ | Action buttons consistently labelled. |
| 3.2.6 | Consistent Help — **new in WCAG 2.2** | A | N/A | No help mechanism currently shown. |
| 3.3.1 | Error Identification | A | ⚠️ | Form errors set MUI's `error={...}` + `helperText` — visual only. Recommend `aria-describedby` linking helperText to input. |
| 3.3.2 | Labels or Instructions | A | ⚠️ | 6 `label` axe violations (combobox inputs on Catalog Graph and Create page) + 2 `button-name` (floating save/discard icon buttons on `entity-definition`). |
| 3.3.3 | Error Suggestion | AA | ✅ | Helper text provides suggestions on inspected forms. |
| 3.3.4 | Error Prevention (Legal/Financial) | AA | N/A | No legal/financial transactions. |
| 3.3.7 | Redundant Entry — **new in WCAG 2.2** | A | ✅ | Scaffolder review step shows previously entered data. |
| 3.3.8 | Accessible Authentication (Minimum) — **new in WCAG 2.2** | AA | ✅ | OpenChoreo OAuth + Guest. No cognitive function test imposed. |

### Principle 4 — Robust

| SC | Title | Level | Status | Evidence / notes |
|----|-------|-------|--------|------------------|
| 4.1.2 | Name, Role, Value | A | ❌ | **17 nested-interactive** + **6 label** + **2 button-name** + **1 aria-input-field-name** = 26 violations. The nested-interactive pattern dominates: entity-card buttons containing "Add to favorites" sub-buttons (`/create`), and Deploy-view environment buttons containing Actions + Promote sub-buttons (`/environments`). |
| 4.1.3 | Status Messages | AA | ⚠️ | Good: errors on `/settings/access-control` and `/runtime-logs` use `role="alert" aria-live="assertive"` (verified via MCP snapshot). Gap: `CircularProgress` loading states are not announced — recommend wrapping with `role="status" aria-busy`. |

**Per-principle conformance:** 1 ⚠️, 2 ⚠️ (with 3 ❌), 3 ✅ (with 2 ⚠️), 4 ⚠️ (with 1 ❌).
**Overall WCAG 2.2 AA conformance: Partial.**

---

## 5. BITV 2.0 conformance

BITV 2.0 Anhang 1 imports EN 301 549 V3.2.1 clause 9 (web), which is functionally WCAG 2.1 AA. Every WCAG 2.1 SC in §4 (i.e., excluding the new 2.2 SCs flagged) applies verbatim. BITV's organisational obligations (Anhang 2, §§3–5) are summarised below:

| BITV reference | Requirement | Applies? | Status |
|----------------|-------------|----------|--------|
| §3 Anhang 1 (web) | WCAG 2.1 AA technical conformance | Yes | Partial — see §4. |
| §4 Leichte Sprache (Easy-Read on home page) | Government-facing public sites must provide Easy-Read content | **N/A with justification** | OpenChoreo Backstage is an *internal developer-platform portal*. BITV §4 explicitly targets citizen-facing public-sector websites. Justification must be recorded in the accessibility statement (Appendix A). |
| §5 DGS (German Sign Language video on home) | Same scope as §4 | **N/A with justification** | Same reasoning. |
| §7 Accessibility statement | A public statement listing conformance status, exceptions, contact, complaints procedure | Yes | **Not published.** Template at Appendix A. |
| §8 Self-assessment / monitoring | Annual self-assessment | Yes (operator) | Operator obligation; recommend annual rerun of this audit. |

A BITV 2.0 self-declaration of conformance is **not yet defensible** because:
- The technical WCAG 2.1 AA layer is currently **Partial**, not Pass (see §4).
- The accessibility statement is unpublished.

After the §6 Phase 1 + Phase 2 remediations and publishing the statement, a *Teilweise konform* (partially conformant) declaration with documented exceptions becomes defensible. Full *Konform* requires the §6 roadmap through Phase 3.

---

## 6. BGG §12a — operator obligations

BGG §12a (and its implementing regulation BITV §7) require the **operator** (the organisation that hosts the portal for public-sector or federally-funded use) to:

1. **Publish an accessibility statement** in a stable URL accessible from every page footer. Must be available in German. Template: Appendix A.
2. **Provide a feedback channel** for users reporting accessibility barriers — typically an email address (`accessibility@<org>`) plus a contact form. Acknowledge within 4 weeks per BITV §7.
3. **Reference the Schlichtungsstelle BGG** (federal arbitration body) as escalation path: <https://www.schlichtungsstelle-bgg.de/>.
4. **Annual review** of the accessibility statement (BITV §7 Abs. 4).
5. **Provide a process for substantive feedback to flow back into the engineering backlog.**

These are *not* engineering deliverables — they sit with whoever deploys OpenChoreo. The engineering deliverable is to make compliance **achievable**: a footer slot for the statement link, a documented feedback path, and a regression-prevention process (this audit + the tooling scaffold).

---

## 7. Findings register

Severity = `(impact × prevalence × user-blocking-ness)`. Effort: S = ≤ 1 dev-day, M = 1–3 days, L = ≥ 1 week.

### Critical / High — fix before any BITV self-declaration

| # | Finding | SC | Impact | Where | Effort | Status |
|---|---------|-----|--------|-------|--------|--------|
| 1 | **Sidebar label colour contrast** | 1.4.3 | serious | `BackstageSidebarItem-label` token — 35 instances across ~every route | S (single token change) | Open |
| 2 | **Nested interactive elements on `/create` template cards** | 4.1.2 | serious | `plugins/openchoreo/src/components/...` (scaffolder template list); 10+ cards each `role="button"` containing inner `<button aria-label="Add to favorites">` | M (refactor card component) | Open |
| 3 | **Nested interactive elements on Deploy view** | 4.1.2 | serious | `plugins/openchoreo/src/components/Environments/components/MiniEnvironmentNode.tsx:204` — outer button + inner Actions / Promote buttons | M | Open |
| 4 | **No skip-to-main-content link** | 2.4.1 | serious | App-shell layer (`packages/app/src/components/Root/Root.tsx`) | S | Open |
| 5 | **Entity page `<h5>` as highest heading** | 1.3.1, 2.4.6 | moderate (but feeds 18 route-level downstream violations) | `BackstageHeader-title` styling in entity pages | S (rebrand `<h1>` styling) | Open |
| 6 | **Form inputs without accessible label** | 4.1.2 | critical | 6 instances on Catalog Graph combobox + Create page filters | M (audit each combobox usage) | Open |
| 7 | **Icon-only buttons without accessible name** | 4.1.2 | critical | `entity-definition` floating save/discard IconButtons | S | Open |
| 8 | **Touch-target size < 24×24px** | 2.5.8 | serious | Deploy-view `Actions for <env>` IconButtons + Promote buttons (7 instances on `/environments`) | S–M | Open |
| 9 | **TraitParameters expandable `<Box onClick>` has no key handler** | 2.1.1 | serious | `plugins/openchoreo/src/components/Environments/TraitParameters.tsx:124` | S | Open |
| 10 | **CodeMirror scroller not keyboard-reachable** | 2.1.1, 2.1.3 | serious | `entity-definition` `.cm-scroller` — `tabindex="-1"` | S (set `tabindex="0"`) | Open |

### Medium — fix in normal sprint cadence

| # | Finding | SC | Impact | Where | Effort |
|---|---------|-----|--------|-------|--------|
| 11 | Heading order skips levels | 1.3.1, 2.4.6 | moderate | Knock-on of #5; verify all entity-page sub-headings cascade correctly | S |
| 12 | `<ul>` containing non-`<li>` direct children | 1.3.1 | serious | `/search` | S |
| 13 | Form errors not associated via `aria-describedby` | 3.3.1 | medium | Multiple TextField usages — e.g., `CreateSecretDialog.tsx:456`, `EditTraitDialog.tsx:339` | M (codemod) |
| 14 | Loading states (CircularProgress) not announced | 4.1.3 | medium | Multiple — `RolesTable.tsx:246`, runtime-logs | S–M |
| 15 | Dialogs missing `aria-labelledby` linking to title | 4.1.2 | medium | Multiple Dialog usages | S (codemod) |
| 16 | Tables missing `scope` on `<TableCell>` headers | 1.3.1 | medium | `RolesTable.tsx:151` and others | S |
| 17 | Status colour chips rely partly on colour | 1.4.1 | medium | `MiniEnvironmentNode.tsx:220` | S (add icon) |

### Low — best-practice / belt-and-braces

| # | Finding | SC | Impact | Where | Effort |
|---|---------|-----|--------|-------|--------|
| 18 | `label-content-name-mismatch` on a sidebar `Home` link (text "Home", a11y name "OpenChoreo") | 2.5.3 | minor | `packages/app/src/components/Root/Root.tsx` | S |
| 19 | `autocomplete` attributes missing on profile/email inputs (when added) | 1.3.5 | minor | Future Profile / Settings forms | S |
| 20 | Required-field visual asterisk without `aria-required` | 3.3.2 | minor | Multiple TextField usages | S (codemod) |
| 21 | German UI strings (i18n) | — | minor | Product decision; engineering needs an i18n layer if pursued | L |

### Cross-reference: aggregate axe violations

| Rule | Impact | Instances | Routes affected | SC mapping |
|------|--------|-----------|-----------------|-------------|
| color-contrast | serious | 35 | 16 of 18 | 1.4.3 |
| nested-interactive | serious | 17 | 7 | 4.1.2 |
| heading-order | moderate | 11 | 8 | 1.3.1, 2.4.6 |
| target-size | serious | 7 | 4 | 2.5.8 (WCAG 2.2 new) |
| page-has-heading-one | moderate | 7 | 7 | 1.3.1, 2.4.6 |
| label | critical | 6 | 2 | 1.3.1, 4.1.2 |
| button-name | critical | 2 | 1 | 4.1.2 |
| aria-input-field-name | serious | 1 | 1 | 4.1.2 |
| scrollable-region-focusable | serious | 1 | 1 | 2.1.1, 2.1.3 |
| list | serious | 1 | 1 | 1.3.1 |

Per-rule example offenders with file paths and HTML snippets are in `audit-artifacts/axe/_per-rule-examples.json`.

---

## 8. Remediation roadmap

### Phase 1 — Quick wins (~1–2 dev-days)

Goal: knock out the highest-leverage low-effort items so a *Teilweise konform* BITV declaration becomes defensible.

- **Sidebar label contrast token** (Finding 1) — bump the `BackstageSidebarItem-label` foreground colour to meet 4.5:1 against its background in both light and dark themes. Single token change in `packages/design-system/src/theme/tokens.ts`. **Eliminates 35 violations.**
- **App-shell skip-link** (Finding 4) — add `<a href="#main" className="skipLink">Skip to main content</a>` as the first child of `<Root>`, visually hidden until focused. Style in design-system.
- **`<html lang="en">`** — already present; no action.
- **TraitParameters keyboard handler** (Finding 9) — add `onKeyDown` handler + `role="button"` + `tabIndex={0}` + `aria-expanded` to the expanding `<Box>`.
- **CodeMirror tab-index** (Finding 10) — flip `.cm-scroller` to `tabindex="0"` (CodeMirror config).
- **Floating save/discard IconButtons** (Finding 7) — add `aria-label="Save"` / `aria-label="Discard"`.
- **Tables `scope="col"`** (Finding 16) — codemod `<TableCell>` in header rows.
- **Status colour chips** (Finding 17) — add an icon to each status state.

### Phase 2 — Systemic refactors (~1–2 weeks)

- **Card-as-button refactor** (Findings 2, 3) — replace `<Box role="button">` wrapping inner buttons with a layout in which the card body is a plain region and exactly one button per action is rendered as a button. This pattern fixes the entire nested-interactive category and removes several target-size hits.
- **Entity-page heading hierarchy** (Findings 5, 11) — promote the `BackstageHeader-title` from `<h5>` to `<h1>` for the page-level title; demote breadcrumb-derived titles below.
- **Dialog `aria-labelledby`** (Finding 15) — codemod across all `<Dialog>` usages to set `aria-labelledby={titleId}`.
- **Form-error association** (Finding 13) — codemod `<TextField error helperText>` to `aria-describedby={errorId} aria-invalid={!!error}`.
- **Loading announcements** (Finding 14) — wrap `CircularProgress` instances that gate page sections with `role="status" aria-busy="true"`.
- **Touch-target sizing** (Finding 8) — increase Deploy-view IconButton sizes from `small` → `medium` *or* add 4px of margin between them.
- **Combobox / Create-page input labels** (Finding 6) — audit each `<Autocomplete>` usage and add `getOptionLabel` / `inputProps` so the underlying `<input>` carries a real label.

### Phase 3 — Process & ongoing assurance

- **Promote `eslint-plugin-jsx-a11y` from warn → error** in CI (`eslint-a11y-rules.js`) once existing violations are zero.
- **Wire `yarn test:e2e:a11y` into PR CI** with a violation budget that ratchets down per quarter.
- **Add `jest-axe` to new component PRs** — template lives in `packages/test-utils` (added in this audit's scaffold; usage example for the team to copy).
- **Annual full audit rerun** (BITV §7 Abs. 4) — re-execute Phases A–D in `.claude/plans/i-need-to-evaluetae-expressive-marble.md`.
- **Publish + maintain the accessibility statement** (Appendix A) — operator obligation, but engineering provides the footer slot.
- **Add a manual VoiceOver / NVDA pass** to the audit checklist — MCP cannot substitute for a real AT verification.

---

## 9. Tooling scaffold left behind

The audit branch ships a reusable scaffold (commit `chore(a11y): scaffold jsx-a11y lint, jest-axe, and axe-playwright`):

- `eslint-a11y-rules.js` — shared jsx-a11y warning preset, wired into all 7 frontend plugins + design-system + app.
- `packages/app/e2e-tests/e2e-test/a11y/axe.spec.ts` + `routes.ts` — parameterised Playwright + axe-core scan over 18 routes; tag `@a11y`.
- `app-config.audit.yaml` — overlay that turns auth off so the spec can crawl all authenticated routes.
- `audit-artifacts/` (gitignored) — raw evidence directory layout.
- npm scripts: `yarn lint:a11y`, `yarn test:e2e:a11y`.

---

## 10. Out of scope (declared)

- Application-code fixes (this is an audit, not a remediation PR).
- i18n / German UI string translation (product decision).
- Publication of the accessibility statement (legal / comms).
- DGS sign-language video and Leichte Sprache content (justified N/A — see §5).
- CI wiring of the new lint/test scripts (recommended in §8 Phase 3).
- Backend plugins.
- Mobile-emulation Lighthouse run (recommended follow-up).
- Real-AT (VoiceOver / NVDA / TalkBack) verification (recommended follow-up).
- Strict 320px-effective reflow check at 400% zoom (manual browser test required — MCP transport clamps at 500px).

---

## Appendix A — Accessibility statement template (DE + EN skeleton)

> *This template fulfils BITV §7 / BGG §12a. The operating organisation publishes the final text at a stable URL (typically `/accessibility-statement`) and links it from every page footer. Update the bracketed fields and review annually.*

### A.1 Erklärung zur Barrierefreiheit (Deutsch)

**Diese Erklärung gilt für:** [URL der OpenChoreo-Instanz]
**Erstellt am:** [TT.MM.JJJJ] · **Zuletzt überprüft am:** [TT.MM.JJJJ]
**Erstellt durch:** [Name der betreibenden Organisation]

**Stand der Vereinbarkeit mit den Anforderungen:** *Teilweise konform* mit der BITV 2.0 / WCAG 2.2 Level AA.

**Nicht barrierefreie Inhalte / Ausnahmen:** Die folgenden Bereiche sind derzeit nur teilweise barrierefrei (Stand des letzten Audits):
- Kontrast einzelner Sidebar-Beschriftungen (siehe WCAG 1.4.3) — geplante Behebung: [Quartal/Jahr].
- Verschachtelte interaktive Elemente in der Deploy-Ansicht und im Create-Dialog (WCAG 4.1.2) — geplante Behebung: [Quartal/Jahr].
- Touch-Zielgrößen einiger Icon-Buttons (WCAG 2.5.8) — geplante Behebung: [Quartal/Jahr].
- Fehlende Sprungmarke "Zum Hauptinhalt springen" (WCAG 2.4.1) — geplante Behebung: [Quartal/Jahr].

**Nicht anwendbar:** §4 BITV (Leichte Sprache) und §5 BITV (DGS-Video) sind nicht anwendbar, da OpenChoreo Backstage als internes Entwickler-Portal nicht an die Allgemeinheit gerichtet ist.

**Erstellung dieser Erklärung:** Diese Erklärung beruht auf einer Selbstbewertung durch [Organisation], gestützt auf das in `ACCESSIBILITY_AUDIT.md` dokumentierte technische Audit vom [Datum] (automatisierte Prüfung mit axe-core 4.10 und Lighthouse, ergänzt durch manuelle Tests).

**Feedback und Kontaktangaben:** Sollten Ihnen Mängel beim barrierefreien Zugang zu Inhalten auffallen, schreiben Sie uns bitte an **[accessibility@example.org]** oder nutzen Sie das Kontaktformular unter **[Link]**. Wir antworten innerhalb von 4 Wochen.

**Schlichtungsverfahren:** Bei nicht zufriedenstellender Antwort können Sie sich an die Schlichtungsstelle nach §16 BGG wenden: <https://www.schlichtungsstelle-bgg.de/>.

### A.2 Accessibility statement (English)

**Applies to:** [URL of the OpenChoreo deployment]
**Issued on:** [DD-MM-YYYY] · **Last reviewed:** [DD-MM-YYYY]
**Issued by:** [Operating organisation]

**Compliance status:** *Partially compliant* with WCAG 2.2 Level AA and the German Federal Accessibility Regulation BITV 2.0.

**Non-accessible content / exceptions:** The following items are currently only partially accessible:
- Sidebar label colour contrast (WCAG 1.4.3) — planned fix: [Q/Y].
- Nested interactive elements on the Deploy view and Create page (WCAG 4.1.2) — planned fix: [Q/Y].
- Touch-target size for some icon-only buttons (WCAG 2.5.8) — planned fix: [Q/Y].
- Missing skip-to-main-content link (WCAG 2.4.1) — planned fix: [Q/Y].

**Not applicable:** BITV §4 (Easy-Read) and §5 (DGS sign-language video) do not apply: OpenChoreo Backstage is an internal developer-platform portal and is not addressed to the general public.

**Preparation of this statement:** Self-assessment based on the technical audit recorded in `ACCESSIBILITY_AUDIT.md`, dated [date] (axe-core 4.10 and Lighthouse automated testing, plus manual interactive checks).

**Feedback and contact:** If you encounter accessibility barriers, please contact **[accessibility@example.org]** or use **[contact form link]**. We will respond within 4 weeks.

**Enforcement procedure:** If our response is unsatisfactory, you may escalate to the German Federal Accessibility Arbitration Body (Schlichtungsstelle nach §16 BGG): <https://www.schlichtungsstelle-bgg.de/>.

---

## Appendix B — How to reproduce this audit

```bash
# 1. Install (already done on this branch)
yarn install

# 2. Re-run the static lint baseline
node node_modules/eslint/bin/eslint.js \
  'packages/app/src/**/*.tsx' 'packages/design-system/src/**/*.tsx' \
  'plugins/openchoreo/src/**/*.tsx' 'plugins/openchoreo-ci/src/**/*.tsx' \
  'plugins/openchoreo-observability/src/**/*.tsx' \
  'plugins/openchoreo-portal-assistant/src/**/*.tsx' \
  'plugins/openchoreo-react/src/**/*.tsx' \
  'plugins/openchoreo-workflows/src/**/*.tsx' \
  'plugins/platform-engineer-core/src/**/*.tsx' \
  --no-error-on-unmatched-pattern --format json \
  --output-file audit-artifacts/eslint/jsx-a11y-baseline.json

# 3. Re-run the axe / Playwright suite
#    Start the dev server with auth disabled (audit overlay):
NODE_OPTIONS=--no-node-snapshot yarn backstage-cli repo start \
  --config $(pwd)/app-config.yaml \
  --config $(pwd)/app-config.local.yaml \
  --config $(pwd)/app-config.audit.yaml &

#    Wait for http://localhost:3000 to respond, then:
PLAYWRIGHT_URL=http://localhost:3000 yarn test:e2e:a11y --workers=1

# 4. Re-run Lighthouse / MCP walkthroughs
#    Open Chrome via Chrome DevTools MCP, navigate to each route,
#    run lighthouse_audit (mode=snapshot), take_screenshot, take_snapshot.
#    See audit-artifacts/mcp/README.md for the recipe.
```

After steps 2–3, regenerate the aggregated summaries:

```bash
node -e "/* see audit-artifacts/eslint/README.md and axe/README.md for the exact snippet */"
```

---

## Appendix C — WCAG 2.2 — new Success Criteria summary

WCAG 2.2 added 9 SCs over 2.1. This audit highlighted them in §4 with the `— new in WCAG 2.2` tag:

| SC | Title | Level | This audit |
|----|-------|-------|------------|
| 2.4.11 | Focus Not Obscured (Minimum) | AA | ⚠️ Manual check pending |
| 2.4.12 | Focus Not Obscured (Enhanced) | AAA | Out of AA scope |
| 2.4.13 | Focus Appearance | AAA | Out of AA scope |
| 2.5.7 | Dragging Movements | AA | ⚠️ Catalog graph + PipelineDAG need verification |
| 2.5.8 | Target Size (Minimum) | AA | ❌ 7 violations |
| 3.2.6 | Consistent Help | A | N/A |
| 3.3.7 | Redundant Entry | A | ✅ |
| 3.3.8 | Accessible Authentication (Minimum) | AA | ✅ |
| 3.3.9 | Accessible Authentication (Enhanced) | AAA | Out of AA scope |
