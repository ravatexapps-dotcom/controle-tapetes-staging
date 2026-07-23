<!-- GENERATED NON-CANONICAL SHADOW LEDGER PARTITION — DO NOT EDIT -->
<!-- partition_id: G28-LEDGER-PART-0010 -->
<!-- canonical_source: docs/ledgers/G28_LEDGER.md -->
<!-- source_unit_interval: G28-LEDGER-UNIT-0169..G28-LEDGER-UNIT-0178 -->
<!-- canonical_byte_interval: 808395..870694 -->
<!-- canonical_line_interval: 7610..8514 -->
<!-- payload_sha256: 6e10677a7c50afffaaacc2b9903352c81efac97dd2114fb5706928595c1d8fce -->
<!-- oversized_single_unit: false -->
<!-- partition_status: CLOSED -->
<!-- G28_LEDGER_SHADOW_PAYLOAD_BEGIN_7b9d4e3a -->
## 2026-07-21 — C4-CONTRACT-CORRECTION-R1 — C4 contract manifest correction + cancel-debt record

- **Authorization:** `C4-CONTRACT-CORRECTION-R1` — documentation-only
  correction, ordered after a supervisor evidence-review packet
  (`C4-CONTRACT-SUPERVISOR-REVIEW-PACKET-R1`) found the prior review
  response non-compliant. Explicitly does not authorize `PHASE-C4`
  implementation. Files authorized for this pass:
  `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger — exactly four, no other file changed.
- **Entry checkpoint:** `HEAD` `67fb71176e5629494f5f4600944ed8d2daad6b10`;
  `git status --short --untracked-files=all` = `M .gitignore`, `?? .codex/`,
  `?? .mcp.json` (expected protected residue, untouched throughout).
- **Findings on the two review-compliance defects:** (1) the prior review
  response did not reproduce the contract's complete text nor the full
  commit diff in-band as the review order required — a review-response
  defect, not a defect in the contract's own content; (2) the claimed
  "manifest contradiction" between `js/screens/ordem-compra.js`'s treatment
  in different sections was investigated by direct `grep` against the
  committed file (`grep -n "ordem-compra\.js"
  docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`, commit `67fb711`):
  the bare orchestrator file was found listed only in the modified-files
  manifest, never in the unchanged/prohibited list (which named three
  distinct sibling files —`-render.js`/`-data.js`/`-events.js` — not
  `ordem-compra.js` itself). No literal contradiction existed in the
  committed text; §10/§11 were nonetheless restated in the exact two-list
  form (`AUTHORIZED PRODUCT FILES` / `UNCHANGED PRODUCT FILES`) mandated by
  the correction order, to remove any possibility of future misreading, and
  an explicit "deliberately absent from this list" note was added for
  `ordem-compra.js` in §11.
- **Ratified (no longer open supervisor decisions):** administrator reversal
  ownership for `OC-C4-ADMIN-001` (contract §2 — the mandatory order stated
  this must not be reopened); the row-level reversal-button interaction
  pattern — compact icon-only, `UI_VISUAL_CONTRACT.md` §8.1, all seven
  guards mandatory (30×30px; functional icon; complete `title`; matching
  `aria-label`; visually hidden accessible text; `confirmDialog` before
  execution; disabled state derived from the server-provided action model)
  — contract §13.1, revised.
- **Visual authority reconfirmed, unchanged in substance:** `.claude/design-skill/`
  remains absent from the canonical workspace and is not a prerequisite;
  `docs/architecture/UI_VISUAL_CONTRACT.md` remains the sole binding
  versioned visual authority; no untracked asset was restored or copied
  from any other workspace during this correction (contract §0a).
- **Recorded — `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE`:**
  `createEvents()` (`js/screens/ordem-compra-events.js:30`) captures
  `state.ordem || {}` before `loadOrdemDetail()`
  (`js/screens/ordem-compra.js:45`) replaces `state.ordem`; the returned
  `cancelar` handler (zero parameters) ignores the current-order argument
  passed by `js/screens/ordem-compra-render.js:156` and reads the stale
  closure variable instead — every real click of "Cancelar ordem" on
  `#/ordens-compra/:id` calls `cancelar_ordem_compra` with `p_ordem_id:
  undefined`. Confirmed by direct code trace (not by execution). Disposition:
  genuine pre-existing defect; not part of `PHASE-C4` (the affected file is
  on the unchanged/prohibited list, §11); does not block the `PHASE-C4`
  receipt UI contract; requires a separate, localized correction order;
  must not be silently fixed during `PHASE-C4` implementation. Recorded in
  `PROJECT_STATE.md` POST-LAUNCH DEBT REGISTER item 15,
  `AGENT_HANDOFF.md`, and contract §21 (new section).
- **Files (exactly four documents; zero technical file):**
  `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger. No `db/*.sql`, test, script, product,
  validator, or normative file modified; `docs/DOCUMENTATION_INDEX.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, and
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` were **not**
  touched this pass (outside this pass's authorized-file list); the three
  protected residue paths (`.gitignore`, `.codex/config.toml`, `.mcp.json`)
  untouched.
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` 47/47 PASS; `git diff
  --check` clean; documentary manifest verified against the exact four-file
  list above; no product, test, script, migration, configuration, or
  protected-residue path changed.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3D`; `ACTIVE_PHASE:
  NONE`; `ACTIVE_PHASE_CONTRACT: NONE`; `ACCEPTED_CHECKPOINT:
  429aa3980c7027b9d872a1902e2f31f1a4a85a2a` (unchanged); `OC-C4-ADMIN-001`
  remains `PLANNED`.
- **Exact accounting subject:** `docs: correct C4 contract manifest and
  record cancel debt`.
- **NEXT_AUTHORIZABLE_ACTION:** supervisor review and acceptance/rejection of
  the proposed `PHASE-C4` material contract, now with its manifest
  unambiguous and two sub-decisions ratified
  (`docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`). `PHASE-C4`
  implementation, `PHASE-C5`, and `REAL_CUTOVER` remain unauthorized; a
  separate, localized correction order is the next authorizable action for
  `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE`, independent of `PHASE-C4`.
  **No push is authorized by this pass.**

## 2026-07-21 — C4-ADMIN-RECEIPT-UI-IMPLEMENTATION-R1 — Supervisor acceptance + PHASE-C4 implementation authorization

- **Authorization:** `C4-ADMIN-RECEIPT-UI-IMPLEMENTATION-R1` — the supervisor
  **ACCEPTED** the PHASE-C4 material phase contract
  (`docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`) and **AUTHORIZED**
  local `PHASE-C4` / `OC-C4-ADMIN-001` admin receipt UI implementation. This
  documentation-only authorization commit records that decision in the
  repository (the prior recorded state, at HEAD
  `d98c498e62b640ea160a7bbe2d71231751a5b9b6`, was `PROPOSED / AWAITING
  SUPERVISOR REVIEW / IMPLEMENTATION NOT AUTHORIZED`, `ACTIVE_PHASE`/
  `ACTIVE_PHASE_CONTRACT` `NONE`, `OC-C4-ADMIN-001` `PLANNED`). Per
  `docs/governance/AGENT_INSTRUCTIONS.md` §1 a chat order cannot by itself
  establish authorization; this commit promotes the supervisor's explicit
  acceptance into the canonical owners so the audit trail is complete before
  any product code is written.
- **Entry checkpoint:** `HEAD` `d98c498e62b640ea160a7bbe2d71231751a5b9b6`;
  parent `67fb71176e5629494f5f4600944ed8d2daad6b10`; branch `dev`;
  `git status --short --untracked-files=all` = `M .gitignore`,
  `?? .codex/config.toml`, `?? .mcp.json` (expected protected residue,
  untouched throughout); single worktree; `staging/dev`
  `0df4228f903ae68c7e8b240e69ff3b37df9ebd86` (behind by the two local C4
  documentation commits — expected, not a blocker); accepted checkpoint
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a` unchanged.
- **Contract status change:** `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`
  `STATUS: PROPOSED / AWAITING SUPERVISOR REVIEW / IMPLEMENTATION NOT
  AUTHORIZED` → `STATUS: ACCEPTED / IMPLEMENTATION AUTHORIZED`; new §0b records
  the bounded supervisor acceptance; §22 restated. No ratified decision and no
  accepted manifest changed: the functional scope (§6), actor/state/action
  matrix (§7), native-RPC-only API ownership matrix (§8), the closed five-file
  manifest (§10) and unchanged/prohibited list (§11), the idempotency/error
  contract (§12), the visual contract (§13), and the test manifest (§15) are
  binding and unchanged; the two RATIFIED sub-decisions (§2 administrator
  reversal in scope; §13.1 compact icon-only row-level reversal button, all
  seven guards) remain ratified and are not reopened. One latent
  validator-blocking defect was corrected as a necessary consequence of
  activation: contract §4.1 had quoted the `MATERIAL_PHASE_CONTRACT` marker
  convention as a second verbatim literal marker pair, harmless while
  `ACTIVE_PHASE` was `NONE` but tripping spec-custody R2 ("exactly one
  well-formed material-phase marker") the moment the C4 contract becomes the
  active contract; §4.1 now describes the convention (pointing to the
  authoritative `docs/governance/DOCUMENTATION_MODEL.md:605-609`) instead of
  re-pasting the literal markers, leaving exactly one marker (the header
  block). This changes no scope, decision, or manifest.
- **Bounded scope of the acceptance:** local implementation only. No database
  migration, environment mutation, staging application, deployment,
  activation, REAL_CUTOVER, `PHASE-C5`, branch creation, or push is
  authorized. The two writer RPCs remain inert under the live `legacy_active`
  cutover state (contract §17) — a recorded risk, not a blocker; fixture-level
  DOM/mocked-RPC evidence is the implementation proof (contract §13.4, §15).
  The implementation may **not** be self-accepted or closed and may **not**
  mark `OC-C4-ADMIN-001` `SATISFIED` — it stops at `IMPLEMENTED / LOCALLY
  VERIFIED / AWAITING SUPERVISOR REVIEW`, pending supervisor review and the
  mandatory architect visual validation (`SUPERVISION_PROTOCOL.md` §4). The
  pre-existing out-of-scope defect
  `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` (PROJECT_STATE POST-LAUNCH
  DEBT REGISTER item 15, contract §21) stays out of scope and must not be
  fixed during this implementation.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3D` (unchanged — C4
  is not yet accepted-as-complete); `ACTIVE_PHASE: PHASE-C4`;
  `ACTIVE_PHASE_CONTRACT: docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`;
  `ACCEPTED_CHECKPOINT: 429aa3980c7027b9d872a1902e2f31f1a4a85a2a` (unchanged);
  `OC-C4-ADMIN-001` is `ACTIVE / IN IMPLEMENTATION` — its traceability-matrix
  disposition is held at the valid `PLANNED` enum at authorization (the enum
  set is `SATISFIED`/`PARTIALLY_SATISFIED`/`PLANNED`/`DEFERRED`/`BLOCKED`/
  `NOT_APPLICABLE`/`SUPERSEDED`; `ACTIVE / IN IMPLEMENTATION` is a status, not
  an allowed disposition value), advancing to `PARTIALLY_SATISFIED` with
  implementation artifact, test evidence, and residual debt at the
  implementation commit.
- **Files (exactly five documents; zero technical file):**
  `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`, `PROJECT_STATE.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, `AGENT_HANDOFF.md`, and
  this ledger. No `db/*.sql`, test, script, product, validator, normative, or
  configuration file modified; the three protected-residue paths
  (`.gitignore`, `.codex/config.toml`, `.mcp.json`) untouched. No push.
- **Note on validator R4 accounting:** the pre-existing baseline
  `node scripts/validate-spec-custody.mjs` failure at HEAD
  `d98c498e62b640ea160a7bbe2d71231751a5b9b6` (its own ledger `Exact accounting
  subject` was line-wrapped, so no single added line carried the full subject)
  is cleared by this entry referencing that commit's full SHA — the append-only
  historical entry is not edited or normalized.
- **Exact accounting subject:** `docs: authorize PHASE-C4 admin receipt UI implementation`
- **NEXT_AUTHORIZABLE_ACTION:** execute the authorized local `PHASE-C4` admin
  receipt UI implementation per the contract §10 manifest and §15 test
  manifest, then stop at `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
  REVIEW`. `PHASE-C5`, `REAL_CUTOVER`, staging validation/application of
  `db/76`, activation, deployment, branch creation, production access, and any
  push remain unauthorized. **No push is authorized by this pass.**

## 2026-07-21 — C4-ADMIN-RECEIPT-UI-IMPLEMENTATION-R1 — PHASE-C4 admin receipt UI implementation

- **Authorization:** `C4-ADMIN-RECEIPT-UI-IMPLEMENTATION-R1` — local `PHASE-C4`
  / `OC-C4-ADMIN-001` implementation, authorized by the 2026-07-21 supervisor
  acceptance recorded in the immediately preceding ledger entry and contract
  §0b. Local implementation only; no migration, database write, environment
  mutation, staging, deployment, activation, cutover, branch, or push.
- **Entry checkpoint:** `HEAD` `bdd4c7d2bc43bd054d7cbb2b0bd70e6234160c24` (the
  authorization commit), parent `d98c498e62b640ea160a7bbe2d71231751a5b9b6`;
  branch `dev`; protected residue `M .gitignore`, `?? .codex/config.toml`,
  `?? .mcp.json` untouched throughout; accepted checkpoint
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a` unchanged.
- **RPC re-verification (contract §14 entry gate 3):** the three native RPC
  input/return shapes were re-verified against the `db/70`/`db/74`/`db/75`
  bodies at this HEAD before writing product code — `registrar_recebimento_ordem_compra`
  `p_linhas` element `{item_id, destino('alocacao'|'excesso'), alocacao_id
  (allocation only), kg}` (closed key allowlist); `estornar_recebimento_ordem_compra`
  `p_linhas` element `{lancamento_id, kg}` (admin-only; over-cap
  `excede_estornavel`, not `reducao_abaixo_saldo_importado`, which belongs to a
  different legacy function); `obter_historico_recebimento_ordem_compra` return
  shape exactly as §4.3, `op_id` nullable, `acoes.receber`/`acoes.estornar`
  gate-agnostic. No schema drift; no migration.
- **Product manifest (exact, closed):** NEW
  `js/screens/ordem-compra-receipt-data.js` (native read-model loader +
  `registrar`/`estornar` writers + INDEPENDENT idempotency-token /
  attempt-tracker / transport-ambiguity primitives + pure payload builders; no
  DOM); NEW `js/screens/ordem-compra-receipt-render.js` (persistent
  Recebimentos section — item/allocation saldos, receipt/estorno command
  history, server-gated `Registrar recebimento` dominant action, and the
  ratified compact icon-only row-level reversal button §8.1; pure render, no
  RPC/DML); NEW `js/screens/ordem-compra-receipt-events.js` (registration and
  reversal action modals; the two independent attempt trackers). Additive:
  `js/screens/ordem-compra.js` (+21/-1 — load receipt history, append the
  section, merge receipt handlers alongside the unchanged `cancelar`) and
  `index.html` (+3 cache-busted `?v=20260721-c4` script tags, ordered
  data → render → events before `ordem-compra.js`). No other product file
  changed.
- **Unchanged/prohibited surfaces confirmed byte-unchanged:**
  `ordem-compra-data.js`/`-render.js`/`-events.js`/`-distribuicao.js`,
  `ordem-compra-receipt-cutover.js`, `js/router.js`, `js/boot.js`,
  `js/screens/common.js`, `fornecedor.js`, `op-writes.js`,
  `pedido-detail-*.js`, all `db/*.sql`. The pre-existing out-of-scope defect
  `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` was NOT touched.
- **API ownership (contract §8):** native RPCs only —
  `obter_historico_recebimento_ordem_compra` /
  `registrar_recebimento_ordem_compra` / `estornar_recebimento_ordem_compra`
  via direct `window.supa.rpc`; the PHASE-C3C-B legacy-compat adapter and every
  `*_fio_compat` RPC are absent from the C4 call graph; no flat-table fallback
  after any deterministic or ambiguous failure (proven by test).
- **Idempotency (contract §12):** two independent in-memory attempt trackers
  (registration, reversal), one fresh token per deliberate attempt, reused
  verbatim only on a genuinely ambiguous transport (`status === 0`), a new
  token after any deterministic success/rejection, never persisted
  (no localStorage/sessionStorage/URL/global), never shared between the two,
  never a fallback to another RPC after ambiguity.
- **Tests (NEW, exact):** `tests/ordem-compra-receipt-data.smoke.js` (12),
  `-render.smoke.js` (10), `-events.smoke.js` (12, incl. a full-screen
  `screenOrdemCompra(100)` integration proof), `-routing.smoke.js` (3) —
  **37/37 pass**. The §15 obligations are covered as faithful DOM/VM behavior,
  not source-text-only assertions. (Deviation from §15: the router/index.html
  coverage is a new `-routing.smoke.js` file rather than an edit to
  `boot.smoke.js`/`router.smoke.js`, to keep existing suites byte-unchanged;
  the proven obligations are identical.)
- **Full-suite differential (contract §14 exit gate 3):**
  `node --test tests/*.js` on the working tree = 4054 tests / 3932 pass / 122
  fail; a detached temporary worktree at the entry checkpoint
  `bdd4c7d2bc43bd054d7cbb2b0bd70e6234160c24` = 4017 / 3876 / 141;
  **added failing identities (worktree minus baseline) = EMPTY** (zero
  regressions). The 19 baseline-only failures (admin-tec-finalize,
  pedido-detail render, ingestor-ui, C3D-deploy hash checks, split-UI) are
  the documented pre-existing suite non-determinism — absent from the worktree
  run by timing, **not** claimed as fixes. `node scripts/validate-spec-custody.mjs`
  PASS; `--self-test` fails only on the pre-existing active-contract
  fixture-harness limitation (the self-test builder does not copy the active
  phase contract into its synthetic root — re-surfaced, not introduced, by
  activating `PHASE-C4`, identical to every prior active-phase pass);
  `git diff --check` / `git diff --cached --check` clean.
- **Environment:** the writer RPCs remain inert under the live `legacy_active`
  cutover state — `recebimento_canonico_inativo` is rendered as a normal
  deterministic business-rejection toast; implementation evidence is
  fixture-level DOM/mocked-RPC (contract §13.4/§15/§17), no live database
  round-trip. No shared or real environment was mutated.
- **Status:** `PHASE-C4` / `OC-C4-ADMIN-001` = **IMPLEMENTED / LOCALLY VERIFIED
  / AWAITING SUPERVISOR REVIEW**. Not self-accepted; not `CLOSED`/`ACCEPTED`/
  `SATISFIED`. The traceability disposition advances `PLANNED` →
  `PARTIALLY_SATISFIED` with implementation artifact, test evidence, and
  residual debt. The mandatory architect visual validation
  (`SUPERVISION_PROTOCOL.md` §4) is pending — the executor report stops at
  `IMPLEMENTAÇÃO VALIDADA / AGUARDANDO VALIDAÇÃO VISUAL DO ARQUITETO`.
- **Exact accounting subject:** `feat: add C4 admin purchase-order receipt UI`
- **NEXT_AUTHORIZABLE_ACTION:** supervisor review and the mandatory architect
  visual validation of the implemented `PHASE-C4` admin receipt UI, then
  supervisor acceptance/close (supervisor only — not self-accepted). `PHASE-C5`,
  `REAL_CUTOVER`, staging validation/application of `db/76`, activation,
  deployment, branch creation, production access, and any push remain
  unauthorized. **No push is authorized by this pass.**

## 2026-07-21 — C4-ADMIN-RECEIPT-UI-VISUAL-GATE-R1 — PHASE-C4 visual-contract correction + evidence

- **Authorization:** `C4-ADMIN-RECEIPT-UI-VISUAL-GATE-R1` — mandatory
  architect visual-validation preparation: audit + objective visual-contract
  correction (authorized manifest: `js/screens/ordem-compra-receipt-render.js`,
  `js/screens/ordem-compra-receipt-events.js`, and their two smoke suites
  only) plus deterministic Playwright screenshots. Entry checkpoint `HEAD`
  `25cbdd6f6128744a8668b034c192c7d012e58171`; protected residue
  (`M .gitignore`, `?? .codex/config.toml`, `?? .mcp.json`) untouched.
- **Pivotal audit finding (factual correction of contract §13.1):** contract
  §13.1/§4.6 claimed `css/tokens.css` "is not linked into the ordem-compra*
  render path," so C4 used literal values. That premise is **factually
  wrong**: `css/tokens.css` is linked globally at `index.html:11` and defines
  every `--rv-*` token on `:root`, so the canonical tokens ARE resolvable on
  this screen. Per this order's audit item 1 (use `--rv-*` where a canonical
  token exists) and `UI_VISUAL_CONTRACT.md`'s precedence, the literals were
  replaced with tokens. No ratified design decision (reversal ownership,
  row-level action, reversal flow, deferred legacy/supplier UI) was reopened.
- **Objective violations found and corrected** (render module):
  (1) the section card used `rounded-lg` = **8px**; the contract requires card
  **6px** — replaced with `border-radius:var(--rv-radius-card)` (computed
  **6px**, verified). (2) The section icon chip used accent-blue
  (`#eaf1fd`/`#2563eb`); §6 designates the neutral chip tokens — replaced with
  `--rv-color-chip-bg`/`--rv-color-chip-glyph`. (3) Literal hex/gray values
  (`#eceef1`, `text-gray-*`, `bg-gray-50`, `divide-gray-*`) replaced with the
  canonical tokens (`--rv-color-line-200`/`line-100`, `--rv-color-value`,
  `--rv-color-muted`, `--rv-color-bg-header`, `--rv-color-section-label`,
  `--rv-color-accent`, `--rv-radius-control`); layout/spacing/type-size
  utilities kept (no canonical token exists for those). (events module) the
  reversal `motivo` textarea used `rounded-lg` = 8px → `--rv-radius-control`;
  the live Alocado/Excesso/Total summary was below the fold on multi-item
  orders → made **sticky** above the modal footer (token colors). No receipt
  data behavior changed; no functional defect was found.
- **Out of scope (correctly not touched):** the shared `js/ui.js` `modal()`
  card and `textInput()` still use `rounded-lg` (8px) — inherited primitives
  outside the C4 manifest; a global `js/ui.js` token migration is a separate
  authorized decision. The row-level reversal button (`js/ui.js`
  `actionButton()`) is already token-equivalent (30×30, 4px, correct colors).
- **Computed-style evidence (real Chrome via Playwright, history scenario):**
  card border-radius `6px`; card box-shadow `none`; card border `1px solid
  rgb(231,234,238)` (= `--rv-color-line-200` `#e7eaee`); primary button radius
  `4px`; reversal button `30px × 30px`, radius `4px`; numeric cell + header
  `text-align:right`; numeric `font-variant-numeric:tabular-nums`; overflow
  container `overflow-x:auto`.
- **Screenshots (deterministic, offline, no Supabase/auth/network at render;
  `%TEMP%\ravatex-c4-visual-review\`):** `01-desktop-receipt-history.png`,
  `02-registration-modal.png`, `03-reversal-modal.png`,
  `04-disabled-and-empty-states.png`, `05-narrow-layout.png`, and
  `c4-visual-contact-sheet.png`. Rendered the ACTUAL C4 product modules (not a
  mock) via `playwright-core` driving the system Chrome, Tailwind bundled
  locally, `--rv-*` tokens from `css/tokens.css`, and representative fixture
  data (multi-item, NULL-op/Pedido-origin allocation, explicit excess,
  receipt + reversal commands, server-derived enabled/disabled actions).
  Browser console/pageerror: **empty** across all scenarios.
- **Tests:** the two authorized suites gained token/sticky assertions;
  `tests/ordem-compra-receipt-{data,render,events,routing}.smoke.js` = **38/38
  pass**. Full suite `node --test tests/*.js`: worktree 4055/3933/122; detached
  baseline worktree at `25cbdd6` 4054/3913/141; **added failing identities =
  EMPTY** (zero regressions; the baseline-only failures are the documented
  pre-existing non-determinism). `node scripts/validate-spec-custody.mjs` PASS;
  `--self-test` fails only on the byte-identical pre-existing identity
  `R1: ACTIVE_PHASE_CONTRACT is not an existing file: docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`
  (the synthetic-fixture harness does not copy the active phase contract into
  its temp root — identical at `25cbdd6`, not a new failure). `git diff --check`
  / `--cached --check` clean.
- **Status unchanged:** `PHASE-C4` / `OC-C4-ADMIN-001` remains **IMPLEMENTED /
  LOCALLY VERIFIED / AWAITING ARCHITECT VISUAL VALIDATION**; `OC-C4-ADMIN-001`
  stays `PARTIALLY_SATISFIED` (not advanced, not `SATISFIED`); the phase is not
  self-accepted or closed. One local correction commit only; no push, no
  migration, no environment/shared-database/activation/deployment action.
- **Exact accounting subject:** `fix: align C4 receipt UI with visual contract`
- **NEXT_AUTHORIZABLE_ACTION:** architect visual validation of the six-PNG
  evidence packet, then supervisor acceptance/close (supervisor only).
  `PHASE-C5`, `REAL_CUTOVER`, staging/deployment/activation, branch creation,
  and any push remain unauthorized. **No push is authorized by this pass.**

## 2026-07-21 — C4-CLOSEOUT-AND-C5-CONTRACT-R1 — PHASE-C4 supervisor acceptance and documentary closeout

- **Authorization:** `C4-CLOSEOUT-AND-C5-CONTRACT-R1` — record the
  supervisor's final acceptance and documentary closeout of `PHASE-C4`.
  Entry checkpoint `HEAD` `289b0cca66e9c057330a882f69da3476adf90469`; protected
  residue (`M .gitignore`, `?? .codex/`, `?? .mcp.json`) untouched. Preflight
  confirmed branch `dev`, `HEAD`/`HEAD^` matched the order's expected SHAs,
  and `staging/dev` (`0df4228f903ae68c7e8b240e69ff3b37df9ebd86`) remained
  behind local `HEAD` by five commits (`git rev-list --left-right --count
  staging/dev...HEAD` = `0	5`) — no `HARD STOP`.
- **Supervisor ruling recorded as final and binding:** `PHASE-C4` is `CLOSED /
  ACCEPTED / LOCALLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED`.
  `OC-C4-ADMIN-001` is `SATISFIED`. Accepted implementation commits:
  `bdd4c7d2bc43bd054d7cbb2b0bd70e6234160c24` (product implementation),
  `25cbdd6f6128744a8668b034c192c7d012e58171` (visual-contract correction),
  `289b0cca66e9c057330a882f69da3476adf90469` (accepted technical checkpoint).
  Accepted functional scope: native administrator receipt registration;
  allocation-shaped payload; explicit excess handling; immutable receipt and
  reversal history; administrator reversal; independent idempotency trackers;
  authoritative server reloads; server-derived action availability;
  NULL-op/Pedido-origin rendering without fabricated OP attribution; dedicated
  receipt UI on `#/ordens-compra/:id`; legacy compatibility RPC excluded from
  the native C4 call graph.
- **Accepted visual scope:** the six-image visual packet (desktop receipt
  history, registration modal, reversal modal, disabled/empty states, narrow
  1024px layout, contact sheet) was reviewed and accepted. Ratified: receipt
  card radius 6px; card shadow none; card border the canonical line token;
  primary controls 4px; reversal action 30×30px/4px; numeric headers/values
  right-aligned with tabular numerals; horizontal table overflow protection;
  canonical `--rv-*` token usage in the C4-specific surface; sticky receipt
  total in the registration modal.
- **Factual visual correction ratified:** `css/tokens.css` is linked globally
  through `index.html` and its `--rv-*` variables are available to the
  `ordem-compra` screen (prose already corrected at the
  `C4-ADMIN-RECEIPT-UI-VISUAL-GATE-R1` pass). `UI_VISUAL_CONTRACT.md` was
  inspected this pass and confirmed **not** to contain the incorrect
  unavailability claim (`grep -n "tokens\.css" docs/architecture/UI_VISUAL_CONTRACT.md`
  shows only correct references), so it was **not modified**.
- **Nonblocking debts:** `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE`
  preserved unchanged (item 15). New:
  `SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT` (item 16) — shared
  `js/ui.js` modal/input primitives still use `rounded-lg` (≈8px) rather than
  the canonical card/control token radii; inherited application-wide, outside
  the accepted C4 correction manifest, does not block `PHASE-C4`, requires a
  separately authorized global UI pass. Also preserved, open/nonblocking:
  behavior below ≈1024px remains governed by the visual contract's unresolved
  narrow-screen policy; long multi-item receipt forms may require scrolling
  (sticky total and pinned footer already accepted as usable).
- **Manifest (exact):** `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`
  (§0d, §22), `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/ledgers/G28_LEDGER.md` (this entry). No product, test, script,
  migration, or configuration file changed.
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` — the pre-existing
  synthetic-fixture identity (`R1: ACTIVE_PHASE_CONTRACT is not an existing
  file: docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`) is resolved by
  this closeout: with `ACTIVE_PHASE_CONTRACT` now `NONE`, that identity no
  longer applies; exact self-test result recorded at commit time below.
  `git diff --check` / `git diff --cached --check` clean. Protected residue
  (`.gitignore`, `.codex/config.toml`, `.mcp.json`) unstaged and untouched.
- **State after closeout:** `LAST_ACCEPTED_PHASE = PHASE-C4`; `ACTIVE_PHASE =
  NONE`; `ACTIVE_PHASE_CONTRACT = NONE`. `OC-C4-SUPPLIER-001` remains
  `DEFERRED`. `REAL_CUTOVER` remains unauthorized.
- **Exact accounting subject:** `docs: close C4 admin receipt UI`
- **NEXT_AUTHORIZABLE_ACTION:** this same pass continued immediately, without
  a stop, into read-only diagnosis and documentation-only authoring of the
  `PHASE-C5` material contract (`OC-C5-EMISSION-001`, purchase-order
  emission) — see the following ledger entry
  (`C4-CLOSEOUT-AND-C5-CONTRACT-R1` — C5 contract authoring). `PHASE-C5`
  implementation, `REAL_CUTOVER`, and any push remain unauthorized. **No push
  is authorized by this pass.**

## 2026-07-21 — C4-CLOSEOUT-AND-C5-CONTRACT-R1 (Part 2) — PHASE-C5 purchase-order emission material contract, proposed

- **Authorization:** `C4-CLOSEOUT-AND-C5-CONTRACT-R1`, Part 2 — read-only
  diagnosis and documentation-only `PHASE-C5` material-contract authoring,
  continuing immediately (no stop) after the Part 1 `PHASE-C4` closeout
  commit. Entry checkpoint `HEAD` `e657ec7b7ca98be522084474257c45d065f3a0f0`
  (the `PHASE-C4` closeout commit); protected residue untouched.
  Post-closeout baseline re-verified: branch `dev`, `HEAD^`
  `289b0cca66e9c057330a882f69da3476adf90469`, `git diff --stat HEAD^..HEAD`
  matched exactly the six files authorized for the C4 closeout.
- **Mandatory canonical reading performed:** `docs/governance/AGENT_INSTRUCTIONS.md`,
  `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `CLAUDE.md`,
  `docs/DOCUMENTATION_INDEX.md`, `docs/DOCUMENTATION_MODEL.md`,
  `docs/governance/SUPERVISION_PROTOCOL.md`,
  `docs/governance/CODE_HEALTH_RULES.md`,
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (full),
  `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` (full),
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/architecture/UI_VISUAL_CONTRACT.md` (full).
- **Mandatory product inventory performed:** `js/screens/ordem-compra.js`,
  `-data.js`, `-render.js`, `-events.js`, `-receipt-data.js`,
  `-receipt-render.js`, `-receipt-events.js`, `-distribuicao.js`,
  `-receipt-cutover.js`; `js/screens/op-writes.js`, `js/router.js`,
  `js/boot.js`, `js/screens/common.js`, `index.html`; `js/screens/op-nova.js`
  (boundary check). **Finding:** zero call sites of any emission RPC
  anywhere in `js/`; the `oc-emitir` button
  (`ordem-compra-render.js:165-177`) already exists, permanently disabled,
  no click handler; the server read model already returns
  `acoes.emitir`/`pode_emitir`/`bloqueio_emissao`
  (`db/68_ordem_compra_native_draft_admin.sql:528-535`) but the client never
  reads `acoes.emitir`; `status_aceite` is never rendered on the
  order-detail screen; `js/screens/common.js` contains no shared RPC
  idempotency/error-classification helpers (two independent, deliberately
  non-shared implementations exist elsewhere instead); existing tests
  (`tests/ordem-compra.smoke.js` 4-5, `tests/op-nova.smoke.js` 72/76)
  already assert the current inert/absent state.
- **Mandatory database inventory performed** (`db/65` through `db/76`, full
  sequential chain, terminal state — not the first migration found):
  two distinct emission functions exist — `emitir_ordem_compra_fio`
  (`db/66:82-150`, legacy flat, terminally granted to `authenticated`) and
  `emitir_ordem_compra` (`db/68:247-342`, native). **`emitir_ordem_compra`'s
  terminal grant, per `db/74`'s own "exact final execution ACL matrix" (§6,
  lines 1171-1207): `REVOKE ALL` from `PUBLIC`, `anon`, `authenticated`, AND
  `service_role`, with no accompanying `GRANT` (contrast every sibling
  entry in the same block) — reaffirmed absent from `db/75`/`db/76`.**
  `alocar_necessidade_compra_fio` (the allocation writer §R.22.5's
  precondition depends on) is independently, terminally ungranted in the
  same block (`db/74:1182-1183`), superseding its earlier `db/69:629` grant.
  Neither function is gated by the cutover singleton
  (`legacy_active`/`canonical_active`) — the grant absence alone makes both
  irrelevant to cutover state. No idempotency-key parameter exists on
  either function. One `ordem_compra_eventos` audit row is written per
  successful emission. No legacy-compat emission adapter exists anywhere.
  **A separate, pre-existing gap was found: no migration in `db/01`-`db/76`
  ever creates an RPC transitioning `status_aceite` from `pendente` to
  `aceita`/`rejeitada`** (confirmed by exhaustive grep) — any order emitted
  while `exige_aceite=TRUE` becomes permanently unreceivable per
  §R.8/§R.25.3's `status_aceite IN ('nao_aplicavel','aceita')` receipt gate.
- **Mandatory test inventory performed:** `tests/ordem-compra.smoke.js`,
  `tests/ordem-compra-emitir-cancelar.smoke.js` (DB-level, legacy flat
  function only), `tests/op-nova.smoke.js` (boundary — asserts zero inline
  emit/cancel buttons on the OP screen).
- **Database-prerequisite classification:** `BLOCKING_DATABASE_PREREQUISITE`.
  No migration is proposed or bundled into the C5 UI implementation
  manifest; the prerequisite (grant `emitir_ordem_compra` and
  `alocar_necessidade_compra_fio`, jointly or separately) is named exactly
  and assigned to a separate, later-authorized prerequisite phase.
- **Contract authored:** `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md`
  (`PHASE_ID: PHASE-C5`, `STATUS: PROPOSED / AWAITING SUPERVISOR REVIEW /
  IMPLEMENTATION NOT AUTHORIZED`) — full functional scope, actor/state/action
  matrix, API ownership matrix, database-prerequisite boundary, a closed
  purely-additive three-file manifest (no new product file — additive to
  `ordem-compra-data.js`/`-render.js`/`-events.js` only, within
  `docs/architecture/CODE_HEALTH_RULES.md` §7 size headroom), idempotency/error
  contract, visual contract (flags the emission destructive-confirmation
  classification as an open decision — `UI_VISUAL_CONTRACT.md` contains no
  emission-specific clause), test/evidence contract, entry/exit gates, hard
  stops, risks, and four recorded supervisor decisions (§18). The contract
  does not self-accept.
- **Corrected a premise in the order:** the order's framing implied a
  supplier-UI-reuse clause attached to C5; direct re-reading of §R.24.10's
  five-item list shows that clause is attached to item 4 (C4, for the
  receipt RPC), not to C5's one-line emission-gate item. The authored
  contract does not carry forward the mistaken attribution (§2 of the
  contract).
- **Manifest (exact):** `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md`
  (new), `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/DOCUMENTATION_INDEX.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/ledgers/G28_LEDGER.md` (this entry). No product, test, script,
  migration, or configuration file changed; no lifecycle spec or schema
  contract modified (every citation is read-only reference to already-ratified
  clauses).
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` — exact result
  recorded at commit time below; `git diff --check` / `git diff --cached
  --check` clean. Protected residue untouched.
- **State after this pass:** `LAST_ACCEPTED_PHASE = PHASE-C4` (unchanged);
  `ACTIVE_PHASE = NONE`; `ACTIVE_PHASE_CONTRACT = NONE`. `PHASE-C5` contract
  = `PROPOSED / AWAITING SUPERVISOR REVIEW`. `OC-C5-EMISSION-001` remains
  `PLANNED`. `PHASE-C5` implementation remains unauthorized.
- **Exact accounting subject:** `docs: define C5 purchase-order emission contract`
- **NEXT_AUTHORIZABLE_ACTION:** supervisor review and acceptance/rejection of
  the proposed `PHASE-C5` material contract, its four recorded supervisor
  decisions (§18), and the scoping/authorization of the separate
  database-prerequisite phase it identifies (§5). `PHASE-C5` implementation,
  `REAL_CUTOVER`, and any push remain unauthorized. **No push is authorized
  by this pass.**

## 2026-07-21 — C5-CONTRACT-ACCEPTANCE-CLOSEOUT-R1 — PHASE-C5 material contract supervisor acceptance

- **Authorization:** `C5-CONTRACT-ACCEPTANCE-CLOSEOUT-R1` — record the
  supervisor's acceptance of the `PHASE-C5` material contract in the
  canonical repository state. Documentation-only. Entry checkpoint `HEAD`
  `f9fa97703d2724d62a0d916cca7b9637d54a1e08`; protected residue (`M
  .gitignore`, `?? .codex/`, `?? .mcp.json`) untouched. Preflight confirmed
  branch `dev`, `HEAD`/`HEAD^` matched the order's expected SHAs exactly,
  and `staging/dev` (`0df4228f903ae68c7e8b240e69ff3b37df9ebd86`) remained
  behind local `HEAD` by seven commits (`git rev-list --left-right --count
  staging/dev...HEAD` = `0	7`) — no `HARD STOP`.
- **Contract disposition:** `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md`
  is `STATUS: ACCEPTED / IMPLEMENTATION BLOCKED BY DATABASE PREREQUISITE`
  (§21). Accepted contract commit
  `f9fa97703d2724d62a0d916cca7b9637d54a1e08`. Acceptance does **not**
  authorize `PHASE-C5` implementation.
- **`OC-C5-EMISSION-001` disposition:** `PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE`
  — not `SATISFIED`, `ACTIVE`, `IMPLEMENTED`, or `CLOSED`.
- **Database-prerequisite disposition:** `BLOCKING_DATABASE_PREREQUISITE`
  ratified. `PHASE-C5` UI must not be implemented as an operationally
  complete emission flow while `emitir_ordem_compra` and
  `alocar_necessidade_compra_fio` remain ungranted and the canonical
  UI-created draft path cannot satisfy allocation completeness. A separate
  **`PHASE-C5A-DB-EMISSION-READINESS`** database-readiness contract is
  required — **not authored in this session**.
- **Emission confirmation disposition:** ratified
  `CONTROLLED_IRREVERSIBLE_TRANSITION` — explicit confirmation required, no
  single-click emission, clear explanation of the resulting state, primary
  or neutral (never destructive-red) confirmation styling, authoritative
  reload after deterministic success.
- **Acceptance-decision gap disposition:** the missing `status_aceite`
  `pendente`→`aceita`/`rejeitada` transition capability is recorded as
  **`PHASE-C5B-ACCEPTANCE-DECISION`**, `IDENTIFIED / NOT AUTHORIZED`. Owns:
  actor ownership for acceptance decisions; canonical acceptance/rejection
  RPCs; state-transition rules; audit/history; UI ownership;
  supplier-versus-administrator permissions; rejection and administrative
  override semantics. `PHASE-C5A` must not implement or invent acceptance
  decisions. Orders with `exige_aceite=TRUE` must not be treated as
  lifecycle-complete until `PHASE-C5B` is implemented and accepted.
- **Manifest (exact):** `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md`
  (§21), `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/ledgers/G28_LEDGER.md` (this entry). No product, test, script,
  migration, configuration, or normative-contract (lifecycle spec/schema
  contract/UI visual contract) file changed.
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` — exact result
  recorded at commit time below; `git diff --check` / `git diff --cached
  --check` clean. Protected residue unstaged and untouched. No database or
  shared-environment access.
- **Canonical state after closeout:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C4
  ACTIVE_PHASE = NONE
  ACTIVE_PHASE_CONTRACT = NONE

  PHASE-C5 CONTRACT = ACCEPTED
  PHASE-C5 IMPLEMENTATION = NOT AUTHORIZED
  OC-C5-EMISSION-001 = PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE

  PHASE-C5A-DB-EMISSION-READINESS = NEXT AUTHORIZABLE CONTRACT PHASE
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED

  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **Exact accounting subject:** `docs: accept C5 emission contract`
- **NEXT_AUTHORIZABLE_ACTION:** a fresh Claude Code session performs
  read-only diagnosis and documentation-only material-contract authoring of
  `PHASE-C5A-DB-EMISSION-READINESS` — not issued or executed by this
  session. `PHASE-C5` implementation, `PHASE-C5B`, `REAL_CUTOVER`, and any
  push remain unauthorized. **No push is authorized by this pass.**

## 2026-07-21 — C5A-DB-EMISSION-READINESS-CONTRACT-R1 — PHASE-C5A database emission readiness material contract authored

- **Authorization:** `C5A-DB-EMISSION-READINESS-CONTRACT-R1` — read-only
  database reconciliation + documentation-only authoring of the
  `PHASE-C5A-DB-EMISSION-READINESS` material phase contract. Entry checkpoint
  `HEAD` `b4e8cd5825ef6f263a589e8e012dff7733bcb2d5` (`docs: accept C5 emission
  contract`); `HEAD^` `f9fa97703d2724d62a0d916cca7b9637d54a1e08`. Protected
  residue (`M .gitignore`, `?? .codex/config.toml`, `?? .mcp.json`) untouched.
  Preflight confirmed branch `dev`, `HEAD`/`HEAD^` matching the order's expected
  SHAs, and `staging/dev` (`0df4228f903ae68c7e8b240e69ff3b37df9ebd86`) behind
  local `HEAD` by eight commits (`git rev-list --left-right --count
  staging/dev...HEAD` = `0	8`) — no `HARD STOP`. **No database, Supabase, or
  shared-environment access; no migration application; no push.** Every database
  fact below is derived from the tracked migration files.
- **Artifact:** new
  `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
  (`PHASE_ID: PHASE-C5A-DB-EMISSION-READINESS`, `STATUS: PROPOSED / AWAITING
  SUPERVISOR REVIEW / IMPLEMENTATION NOT AUTHORIZED`). It introduces **no new
  requirement ID** — it is the database prerequisite of the existing
  `OC-C5-EMISSION-001` — and does not self-accept.
- **Terminal emission-writer contract (`emitir_ordem_compra(BIGINT)`,
  `db/68:247`):** `SECURITY DEFINER`, `SET search_path = public`, owner
  `postgres`; internal `is_admin()` gate; native + rascunho + fornecedor + ≥1
  item + full allocation (`SUM(active alloc)=kg_pedido`) + Pedido/material/color
  coherence; eight deterministic `codigo` values; one `administrativo/'emitida'`
  audit event; acceptance snapshot frozen from `ordem_compra_config.exige_aceite`;
  natural idempotency (`estado_invalido` on replay); no cutover reference in-body.
  **Terminal ACL: `REVOKE ALL` from PUBLIC/anon/authenticated/service_role with
  no `GRANT` anywhere** (`db/68:347-350`, restated `db/70:1203-1206`, terminal
  `db/74:1192-1193`). Body complete and byte-equivalent-preservable.
- **Terminal allocation-writer contract:** the live, **already-granted**
  (`authenticated`, `db/74:1177`) canonical allocation writer is
  `definir_alocacao_necessidade_compra_fio(BIGINT,BIGINT,NUMERIC,TEXT)`
  (`db/74:330`) — `SECURITY DEFINER`, `search_path=''`, internal
  authenticated-admin gate, need-first, atomic draft-order/item/allocation
  create-or-reuse under advisory locks, immutable actor-scoped idempotency
  journal (`ordem_compra_distribuicao_comandos`), coherence + need-cap enforced
  on write, wired at `js/screens/pedido-insumos-distribuicao.js:135`. The older
  `alocar_necessidade_compra_fio(BIGINT,BIGINT,BIGINT,NUMERIC)` is
  `SUPERSEDED / INTERNAL_FUNCTION_ONLY` (revoked, no re-grant, `db/74:1182`; not
  called from `js/`).
- **Terminal read model:** `obter_ordem_compra_admin` (`db/69:987`) and
  `listar_ordens_compra_admin` (`db/69:913`) — the terminal versions (superseding
  `db/68`, not redefined through `db/76`) — hard-code
  `pode_emitir=false`/`acoes.emitir=false` in every branch with no path to true
  ("pode_emitir stays false; emission awaits Phase C native receipt,"
  `db/69:1073-1075`); allocation completeness is already computed by
  `_distribuicao_completa_ordem` (`db/69:889`, byte-equivalent to the writer's
  `alocacao_incompleta` check) but not routed into `pode_emitir`/`acoes.emitir`.
- **Overall prerequisite classification:**
  `READ_MODEL_FUNCTION_AND_GRANT_PREREQUISITE` — one future migration (`db/77`,
  not created) grants `EXECUTE ON emitir_ordem_compra(BIGINT) TO authenticated`
  and corrects the two read models to derive `pode_emitir`/`acoes.emitir=true`
  (and clear `bloqueio_emissao`) for a fully-distributed native rascunho with
  `exige_aceite=FALSE`; no writer-body change, no allocation grant, no acceptance
  RPC. Grant and read-model correction are interdependent (one migration).
- **Actor ownership:** `emitir_ordem_compra = AUTHENTICATED_ADMIN_ONLY`;
  `definir_alocacao_necessidade_compra_fio = AUTHENTICATED_ADMIN_ONLY` (already
  granted); `alocar_necessidade_compra_fio = INTERNAL_FUNCTION_ONLY (SUPERSEDED)`.
- **Allocation-readiness:** `ALLOCATION_PATH_READY_AFTER_GRANT` (the grant already
  exists on the live writer).
- **Acceptance-required-order disposition:**
  `EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE` — already structurally
  server-enforced (`ordem_compra_config.exige_aceite` `DEFAULT FALSE`, seeded
  FALSE, `SELECT`-only, no client UPDATE path — `db/65:174,182,192`; no
  `pendente→aceita/rejeitada` RPC anywhere, the `PHASE-C5B` gap).
- **Cutover boundary:** both writer bodies never check cutover; the `db/75`
  `trg_c3c_protected_mutation_guard` (8 tables incl. `ordem_compra`/`_item`/
  `_item_alocacao`/`necessidade_compra_fio`) permits their DML under
  `legacy_active` (current) and denies it (`legacy_receipt_fenced`/`55000`) under
  `maintenance_fenced`/`canonical_active` (a `REAL_CUTOVER` question, recorded as
  an open item, out of C5A scope — not activated).
- **Reconciliation with the accepted C5 contract:** resolves the exact question
  C5 §5(b) deferred to C5A and adds the read-model prerequisite C5 §5 did not
  surface, grounded in §R.23.8/§R.23.9 — not a normative contradiction, so no
  `HARD STOP`; the accepted `PHASE-C5` contract is **not** modified.
- **Manifest (exact):**
  `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
  (new), `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/ledgers/G28_LEDGER.md` (this entry). No product, test, script, migration,
  configuration, or normative-contract (lifecycle spec / schema contract / UI
  visual contract) file changed; the accepted C5/C4 contracts are read-only
  references.
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` — exact result recorded at
  commit time below; `git diff --check` / `git diff --cached --check` clean.
  Protected residue unstaged and untouched.
- **State after this pass:** `LAST_ACCEPTED_PHASE = PHASE-C4`; `ACTIVE_PHASE =
  NONE`; `ACTIVE_PHASE_CONTRACT = NONE`. `PHASE-C5A` contract = `PROPOSED /
  AWAITING SUPERVISOR REVIEW`. `OC-C5-EMISSION-001` stays
  `PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE`. `PHASE-C5A`/`PHASE-C5`
  implementation remain unauthorized.
- **Exact accounting subject:** `docs: define C5A emission database readiness contract`
- **NEXT_AUTHORIZABLE_ACTION:** supervisor review and acceptance/rejection of the
  proposed `PHASE-C5A-DB-EMISSION-READINESS` material contract and its §19
  decisions; then, if accepted, a separate explicit `PHASE-C5A` implementation
  order in a fresh session. `PHASE-C5A`/`PHASE-C5` implementation, `PHASE-C5B`,
  `REAL_CUTOVER`, staging validation/application of `db/76`, and any push remain
  unauthorized. **No push is authorized by this pass.**

## 2026-07-21 — C5A-DB-EMISSION-READINESS-IMPLEMENTATION-R1 (Part 1) — PHASE-C5A database emission readiness contract accepted; local implementation authorized

- **Authorization:** `C5A-DB-EMISSION-READINESS-IMPLEMENTATION-R1` (Part 1) —
  documentation-only supervisor acceptance of the `PHASE-C5A-DB-EMISSION-READINESS`
  material phase contract, with local implementation authorization. Entry
  checkpoint `HEAD` `a476df3191b914d62acd6718c06771cd1753ac6b` (`docs: define C5A
  emission database readiness contract`); `HEAD^`
  `b4e8cd5825ef6f263a589e8e012dff7733bcb2d5`. Accepted proposal commit
  `a476df3191b914d62acd6718c06771cd1753ac6b`. Protected residue
  (`M .gitignore`, `?? .codex/config.toml`, `?? .mcp.json`) untouched. Preflight
  confirmed workspace `D:\Programação\controle-tapetes-g28`, git dir `.git`,
  branch `dev`, `HEAD`/`HEAD^` matching the order's expected SHAs, single
  worktree, and `staging/dev` (`0df4228f903ae68c7e8b240e69ff3b37df9ebd86`) behind
  local `HEAD` by nine commits (`git rev-list --left-right --count
  staging/dev...HEAD` = `0	9`) — the expected local-ahead condition, no
  `HARD STOP`. **No database, Supabase, or shared-environment access; no push.**
- **Ruling (final and binding):** `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
  is **ACCEPTED** — `STATUS: PROPOSED / AWAITING SUPERVISOR REVIEW /
  IMPLEMENTATION NOT AUTHORIZED` → `STATUS: ACCEPTED / IMPLEMENTATION AUTHORIZED
  LOCALLY` (contract §22). The acceptance changes no ratified decision and no
  accepted manifest.
- **§19 decisions ratified:**
  - **Classification `READ_MODEL_FUNCTION_AND_GRANT_PREREQUISITE`.** C5A requires
    exactly: (1) `GRANT EXECUTE ON public.emitir_ordem_compra(BIGINT) TO
    authenticated`; (2) preservation of the internal authenticated-administrator
    gate in the emission writer; (3) correction of the terminal read models
    `obter_ordem_compra_admin(...)` / `listar_ordens_compra_admin(...)` so the
    server-derived emission action can become true; (4) **no** modification of the
    `emitir_ordem_compra(BIGINT)` terminal body; (5) **no** allocation-writer
    migration.
  - **Allocation ruling.** `definir_alocacao_necessidade_compra_fio(BIGINT,BIGINT,
    NUMERIC,TEXT)` is the active canonical allocation writer — already granted to
    `authenticated`, internally admin-restricted; `ALLOCATION_PATH_READY_AFTER_GRANT`.
    The legacy `alocar_necessidade_compra_fio(...)` is `SUPERSEDED / REVOKED` and
    must remain ungranted (not re-granted, called, modified, or rehabilitated).
    The canonical Pedido/Insumos flow is unchanged.
  - **Acceptance-required-order disposition `EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE`.**
    No acceptance/rejection is implemented; the read models never expose
    `acoes.emitir=true` when `exige_aceite=TRUE`; the emission writer body is
    unchanged. Residual limitation recorded: a privileged direct RPC may still
    follow the writer contract for `exige_aceite=TRUE`, but the canonical
    application path must not expose that action before `PHASE-C5B`.
    `PHASE-C5B-ACCEPTANCE-DECISION` remains `IDENTIFIED / NOT AUTHORIZED`.
  - **Cutover ruling.** The C3C protected-mutation guard is **not** modified —
    `legacy_active` permits the local writer path;
    `maintenance_fenced`/`canonical_active` denial is a `REAL_CUTOVER` concern.
    **C5A local readiness ≠ `REAL_CUTOVER` readiness.**
- **Manifest (exact):**
  `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
  (§22 acceptance + STATUS flip), `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/ledgers/G28_LEDGER.md` (this entry). No product, test, script, migration,
  configuration, lifecycle-specification, schema-contract, visual-contract, or
  protected-residue change; no database, environment, or deployment action; no
  push.
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` — exact result recorded at
  commit time below (the pre-existing active-contract fixture-harness identity may
  re-surface now that an active phase exists); `git diff --check` / `git diff
  --cached --check` clean. Protected residue unstaged and untouched.
- **Canonical state after this acceptance (Part 1):**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C4
  ACTIVE_PHASE = PHASE-C5A-DB-EMISSION-READINESS
  ACTIVE_PHASE_CONTRACT = docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md

  PHASE-C5A CONTRACT = ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY
  PHASE-C5A IMPLEMENTATION = NOT YET IMPLEMENTED
  PHASE-C5 CONTRACT = ACCEPTED / IMPLEMENTATION BLOCKED BY C5A
  OC-C5-EMISSION-001 = PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **Exact accounting subject:** `docs: accept C5A emission database readiness contract`
- **NEXT_AUTHORIZABLE_ACTION:** local implementation of
  `PHASE-C5A-DB-EMISSION-READINESS` in a disposable local PostgreSQL environment
  under the same order (Part 2) — `db/77_ordem_compra_c5a_emission_readiness.sql`
  (grant + read-model correction) plus
  `tests/ordem-compra-c5a-emission-readiness.integration.sql`. `PHASE-C5` UI
  implementation, `PHASE-C5B`, any shared-database apply of `db/77`, staging
  validation/application of `db/76`/`db/77`, activation, deployment,
  `REAL_CUTOVER`, and any push remain unauthorized. **No push is authorized by
  this pass.**

## 2026-07-22 — C5A-DB-EMISSION-READINESS-IMPLEMENTATION-R1 (Part 2) — PHASE-C5A local database implementation (locally verified)

- **Authorization:** `C5A-DB-EMISSION-READINESS-IMPLEMENTATION-R1` (Part 2) —
  local disposable-environment implementation of `PHASE-C5A-DB-EMISSION-READINESS`,
  authorized by the Part 1 acceptance (contract §22). Entry checkpoint (Part 2)
  `HEAD` `27464520af2afa3c46d547ffaf76328df70b1889` (the Part 1 acceptance commit);
  `HEAD^` `a476df3191b914d62acd6718c06771cd1753ac6b`. Protected residue
  (`M .gitignore`, `?? .codex/config.toml`, `?? .mcp.json`) untouched. **No
  shared/remote/managed database, Supabase, staging, production, deployment,
  activation, `REAL_CUTOVER`, or push.**
- **Status:** `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR REVIEW`
  (contract §23). Not self-accepted, not closed, not shared-environment verified,
  not staging applied, not production ready, not `REAL_CUTOVER` ready.
- **Migration `db/77_ordem_compra_c5a_emission_readiness.sql` (forward-only,
  idempotent):**
  1. `REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT) FROM PUBLIC, anon,
     authenticated, service_role;` then `GRANT EXECUTE … TO authenticated;` — the
     exact final ACL (only `authenticated`). The writer body is **not** redefined
     (grant-only; grep-verified no `CREATE … FUNCTION emitir_ordem_compra`); the
     internal `is_admin()` gate remains the authoritative actor check.
  2. `CREATE OR REPLACE` of the two terminal read models
     `obter_ordem_compra_admin(BIGINT)` / `listar_ordens_compra_admin(UUID)`,
     byte-preserving every field except `pode_emitir`/`acoes.emitir`/`bloqueio_emissao`,
     which now derive TRUE iff a native rascunho is fully distributed
     (`_distribuicao_completa_ordem`) AND `ordem_compra_config.exige_aceite=FALSE`;
     `bloqueio_emissao` is `distribuicao_necessidades_pendente` when incomplete,
     the new UI-enablement blocker `emissao_bloqueada_exige_aceite` when complete
     but acceptance is required (`PHASE-C5B` gap), else NULL.
  - No allocation-writer migration: `definir_alocacao_necessidade_compra_fio`
    stays granted to `authenticated`, the superseded `alocar_necessidade_compra_fio`
    stays revoked; the C3C protected-mutation guard (`db/75`) is untouched.
- **Terminal grant matrix (verified):** `emitir_ordem_compra(bigint)` —
  authenticated=true, anon=false, service_role=false, PUBLIC=false;
  `definir_alocacao_necessidade_compra_fio(...)` — authenticated=true, others false;
  `alocar_necessidade_compra_fio(...)` — all false; both read models —
  authenticated=true, others false.
- **Test `tests/ordem-compra-c5a-emission-readiness.integration.sql`:** one
  transaction, self-planted Pedido-origin polyester fixtures, `ROLLBACK` (zero
  persistent mutation). Proves the order's 35 points (grant matrix; emitir body
  unchanged; allocation create/over-alloc/idempotency; read-model readiness true
  only for an eligible `exige_aceite=FALSE` native draft in detail and list; the
  `exige_aceite=TRUE` gate; deterministic denials + atomic failure invariance;
  authenticated-non-admin internal denial + anon ACL denial; authorized emission
  with `status_aceite='nao_aplicavel'` + exactly one `administrativo/'emitida'`
  event + deterministic `estado_invalido` duplicate replay + no fabricated
  acceptance; inert read models for legacy/emitted/cancelled/incomplete; receipt
  writers unchanged; audit preserved; the cutover fence permits/denies matrix).
  Sentinel `C5A_EMISSION_READINESS_INTEGRATION_PASS`.
- **Local environment (LOCAL only; contract §14 shared-environment evidence still
  owed to a future authorized non-production pass):** a fresh disposable local
  PostgreSQL **18.4** cluster (`initdb`/`pg_ctl`, non-default port, outside the
  repository); Supabase-platform preamble + ordered `db/01…db/77` (64-row corpus
  after `db/66` before `db/67`, reconciliation `64/51/51/51/51`); `db/77` applied
  cleanly after the full chain and reapplied idempotently; the integration test
  passes. No shared/remote host, no staging/production access, `REAL_CUTOVER` not
  activated.
- **Forced migration-manifest fixture update (deviation from the literal Part 2
  manifest — flagged for supervisor review):** adding the authorized `db/77`
  advanced the migration terminal 76→77, deterministically invalidating the frozen
  `PHASE-C3D-A` deployment-manifest guard `tests/ordem-compra-c3d-deploy.smoke.js`
  (`EXPECTED_TERMINAL = 76`, asserting exactly 76 migrations). That guard is a
  repo-wide migration-count bookkeeping test — not a UI/product/protected file and
  not a test of `db/77`'s behavior. It was updated minimally to the real terminal
  (`77`; terminal two `db/76`/`db/77`; a `db/77` checkpoint-hash + byte-stability
  check added), fail-closed mechanism unchanged. No optional concurrency file was
  created (`db/77` changes no writer body/locking; `PHASE-C3D-E` allocation-
  concurrency evidence + this test's idempotency proofs cover the unchanged
  allocation writer). Full same-branch Node-suite differential (db/77 present vs.
  absent): the only db/77-attributable added failures were the three C3D
  deploy-manifest assertions (resolved by the fixture update) plus one
  `document-decision` `git status --porcelain db/` guard failure that resolves once
  `db/77` is tracked; the post-commit differential is clean.
- **Manifest (exact):** created `db/77_ordem_compra_c5a_emission_readiness.sql`,
  `tests/ordem-compra-c5a-emission-readiness.integration.sql`; modified (forced)
  `tests/ordem-compra-c3d-deploy.smoke.js`; docs
  `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
  (§23), `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/ledgers/G28_LEDGER.md` (this entry). No `js/` product file, UI test,
  `index.html`, `router.js`, `boot.js`, `common.js`, C4 receipt module, Pedido/
  supplier/OP UI, lifecycle spec, schema contract, visual contract, protected
  residue, or production configuration changed.
- **Validation:** targeted integration test PASS; `db/77` clean apply + idempotent
  reapply; terminal ACL matrix + function-definition evidence captured;
  `node scripts/validate-spec-custody.mjs` PASS; `--self-test` fails only on the
  pre-existing active-contract fixture-harness identity (an active phase exists);
  `git diff --check` / `git diff --cached --check` clean; exact result recorded at
  commit time below.
- **Exact accounting subject:** `db: add C5A emission readiness`
- **Canonical state after this implementation:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C4
  ACTIVE_PHASE = PHASE-C5A-DB-EMISSION-READINESS
  ACTIVE_PHASE_CONTRACT = docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md

  PHASE-C5A CONTRACT = ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY
  PHASE-C5A IMPLEMENTATION = IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR REVIEW
  OC-C5-EMISSION-001 = PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE
  PHASE-C5 UI = NOT AUTHORIZED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **NEXT_AUTHORIZABLE_ACTION:** supervisor review and acceptance/closeout of the
  `PHASE-C5A` implementation (contract §23), including review of the forced
  `tests/ordem-compra-c3d-deploy.smoke.js` migration-manifest fixture update; then
  a separately authorized non-production apply of `db/77` with the contract §14
  shared-environment evidence. `PHASE-C5` UI, `PHASE-C5B`, `REAL_CUTOVER`, any
  shared-database apply of `db/77`, staging validation/application of
  `db/76`/`db/77`, and any push remain unauthorized. **No push is authorized by
  this pass.**


<!-- G28_LEDGER_SHADOW_PAYLOAD_END_7b9d4e3a -->
