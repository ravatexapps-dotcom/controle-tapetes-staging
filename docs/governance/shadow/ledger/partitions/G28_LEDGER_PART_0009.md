<!-- GENERATED NON-CANONICAL SHADOW LEDGER PARTITION — DO NOT EDIT -->
<!-- partition_id: G28-LEDGER-PART-0009 -->
<!-- canonical_source: docs/ledgers/G28_LEDGER.md -->
<!-- source_unit_interval: G28-LEDGER-UNIT-0159..G28-LEDGER-UNIT-0168 -->
<!-- canonical_byte_interval: 740608..808395 -->
<!-- canonical_line_interval: 6643..7609 -->
<!-- payload_sha256: aad61ad7fb51201c1b188bad85f45f262f35e935a0d693bd25aacb532e122eae -->
<!-- oversized_single_unit: false -->
<!-- partition_status: CLOSED -->
<!-- G28_LEDGER_SHADOW_PAYLOAD_BEGIN_7b9d4e3a -->
## 2026-07-21 — PHASE-C3D-B — Supervisor acceptance and documentary reconciliation

- **Type:** documentation-only checkpoint under the "PHASE-C3D-B SUPERVISOR
  ACCEPTANCE AND DOCUMENTARY RECONCILIATION" order. Entry checkpoint
  `5441321014883c4e8149dc8b20da9d053a193699`, branch `dev`, `staging/dev` equal
  to HEAD, preserved residue exactly `.gitignore` (modified, unstaged),
  `.codex/config.toml` (untracked), `.mcp.json` (untracked). No product, test,
  script, migration, database, Supabase, or environment action.
- **Supervisor ruling:** `PHASE-C3D-A` = `CLOSED / TECHNICALLY ACCEPTED /
  LOCALLY VERIFIED` (accepted checkpoint
  `096cd60325e4987010d328c856ee6a3a51ca66bf`); `PHASE-C3D-B` = `CLOSED /
  TECHNICALLY ACCEPTED / LOCALLY VERIFIED` (accepted checkpoint
  `5441321014883c4e8149dc8b20da9d053a193699`). Recorded in the contract §R.
- **OC-C3D-DEPLOY-001 advanced to SATISFIED** (traceability matrix updated) on
  the combined accepted C3D-A + C3D-B evidence: exact `db/01…db/76` application
  in two fresh disposable PostgreSQL 18.4 clusters; `db/75`/`db/76` terminal;
  `db/75` ordered single-application; `db/76` deterministic reapplication with
  no drift; exact inactive Component A/B results; zero mutation and zero lock
  leakage; application flat-fallback compatibility; zero newly failing
  full-suite identity; shared-development migrations/state/fingerprints
  re-confirmed read-only; no persistent database mutation.
  `OC-C3D-FENCE-001`/`OC-C3D-ACL-001`/`OC-C3D-LOCK-001`/`OC-CUTOVER-001`/
  `OC-CUTOVER-PONR-001` dispositions unchanged.
- **Traceability reconciliation:** the stale header (`ACTIVE_PHASE: NONE`, C3D
  contract described as `PROPOSED`, `OC-C3D-DEPLOY-001 PLANNED`, C3D awaiting
  review) was corrected to `ACTIVE_PHASE: PHASE-C3D` with C3D-A/C3D-B recorded
  as accepted sublots inside the active (not closed) `PHASE-C3D` contract;
  `CLOSED_MATERIAL_PHASES` unchanged; `NEXT_AUTHORIZABLE_ACTION` = execute
  `PHASE-C3D-C` from a fresh Claude session.
- **Pre-PONR rollback correction (§G item 9 / §R.2):** the wording that pre-PONR
  rollback restores `flat`/`legacy_active` was corrected. Grounded in spec
  §R.29.6 and `db/75 public.ordem_compra_c3c_pre_ponr_rollback(BIGINT)` (`SET
  read_authority='flat', status='maintenance_fenced', canonical_activated_at=NULL
  WHERE … productive_receipt_started_at IS NULL`): rollback restores `flat` read
  authority only; the mutation fence stays active; `status` stays
  `maintenance_fenced` (never returns to `legacy_active`); it does not restore
  or widen flat mutation grants or removed `PUBLIC` policies; grants/policies
  stay byte-identical to their pre-rollback state; `cutover_generation`, frozen
  snapshot/inventory baseline, and committed import/reconciliation history
  remain; `productive_receipt_started_at` stays NULL; `canonical_activated_at`
  is cleared. The normative spec and `db/75` were not modified.
- **Next sublot:** `PHASE-C3D-C` = `AUTHORIZED / NOT STARTED`, execution context
  a fresh Claude session required (contract §R.3); `PHASE-C3D-D`…`C3D-F` not
  authorized. No C3D-C command, test file, PostgreSQL start, Supabase access, or
  fence transition performed this pass.
- **Files changed:** `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`
  (§R appended; §G item 9 corrected; STATUS marker), `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  (header + `OC-C3D-DEPLOY-001` row + boundary prose),
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this ledger,
  `docs/DOCUMENTATION_INDEX.md` (C3D contract row status). No `db/*.sql`,
  `tests/*`, `scripts/*`, `js/*`, HTML/CSS, package/lock, CI, validator,
  normative spec, Supabase/MCP config, or protected residue modified.
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS at entry and
  final; `node scripts/validate-spec-custody.mjs --self-test` fails identically
  at entry and final with the known pre-existing active-contract fixture
  limitation (`R1: ACTIVE_PHASE_CONTRACT is not an existing file: …C3D_PHASE_CONTRACT.md`);
  validator/fixtures not modified; `git diff --check` / `git diff --cached
  --check` clean.
- **State after this pass:** `PHASE_ID: PHASE-C3D`; `ACTIVE_PHASE: PHASE-C3D`;
  `LAST_ACCEPTED_PHASE: PHASE-C3C-B`; `ACCEPTED_CHECKPOINT:
  5441321014883c4e8149dc8b20da9d053a193699`. `PHASE-C3D-A` = CLOSED /
  TECHNICALLY ACCEPTED / LOCALLY VERIFIED; `PHASE-C3D-B` = CLOSED / TECHNICALLY
  ACCEPTED / LOCALLY VERIFIED; `OC-C3D-DEPLOY-001` = SATISFIED; `PHASE-C3D-C` =
  AUTHORIZED / NOT STARTED.
- **Exact accounting subject:** `docs: accept C3D-B and correct rollback semantics`.
- **NEXT_AUTHORIZABLE_ACTION:** execute `PHASE-C3D-C` from a fresh Claude session
  at the final documentation-only HEAD produced by this pass; `PHASE-C3D-D` and
  every later sublot remain unauthorized. One fast-forward push to `staging/dev`
  records this pass.

## 2026-07-21 — PHASE-C3D-C — Fence and pre-PONR rollback rehearsal

- **Phase:** `PHASE-C3D-C` (fence and pre-PONR rollback rehearsal), the third
  sublot of the `PHASE-C3D` material phase contract
  (`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` §C, corrected §0
  Findings 2 & 6).
- **Authorization:** the "PHASE-C3D-C — FENCE AND PRE-PONR ROLLBACK
  REHEARSAL" order, a fresh Claude session as required. Entry checkpoint
  `7f73b4d8210da249ddd5b085c7c3b59244afd72b` (the accepted `PHASE-C3D-B`
  documentation-only checkpoint), branch `dev`, `staging/dev` equal to HEAD,
  preserved residue exactly `.gitignore` (modified, unstaged),
  `.codex/config.toml` (untracked), `.mcp.json` (untracked).
- **Entry state verified:** `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`
  recorded `PHASE-C3D-A`/`PHASE-C3D-B` `CLOSED / TECHNICALLY ACCEPTED /
  LOCALLY VERIFIED` at checkpoints `096cd603…`/`5441321…`, `OC-C3D-DEPLOY-001`
  `SATISFIED`, `PHASE-C3D-C` `AUTHORIZED / NOT STARTED` — matching
  `PROJECT_STATE.md`/`AGENT_HANDOFF.md`.
- **Implementation:** one authorized new file,
  `tests/ordem-compra-c3d-fence.integration.sql`. No `db/*.sql`,
  `scripts/c3d/bootstrap-disposable-cluster.mjs`,
  `tests/ordem-compra-c3d-deploy.smoke.js`,
  `tests/ordem-compra-c3d-deploy.integration.sql`, or product file modified.
- **Isolated environment:** two fresh, disposable, isolated local PostgreSQL
  18.4 clusters via the unmodified `scripts/c3d/bootstrap-disposable-cluster.mjs`
  (ports 61812, 57100 across the two runs) each carrying the full ordered
  `db/01`…`db/76` sequence plus an ephemeral, uncommitted rehearsal preamble
  (roles `anon`/`authenticated`/`service_role`; `auth` schema with
  `auth.uid()`/`auth.users`; `extensions` schema with `pgcrypto` — same class
  of preamble as the accepted `PHASE-C3D-B` run; modifies no `db/*.sql`, not
  committed) and an ephemeral, uncommitted classification-shape-only
  synthetic 64-row `ordens_compra_fio` corpus loaded before `db/67` (27 A /
  12 B / 13 C / 12 D; `db/67`'s self-check and reconciliation confirmed
  `64/51/51/51/51`), carrying the order's reserved synthetic identities
  (admin `00000000-0000-4000-8000-00000000c3a1`; matching supplier
  `00000000-0000-4000-8000-00000000c3b1`; fornecedor `930000301`; target
  flat row `930000311`, Class B, `kg_pedido=15.500`, one of the 51 mapped
  rows; cutover generation `930003001`).
- **Pre-fence authorization controls:** for the admin and matching-supplier
  identities independently, a rolled-back transaction proved `auth.uid()`
  resolved to the intended actor and the exact real writer-shape
  `UPDATE public.ordens_compra_fio SET kg_recebido=…, data_recebimento=…,
  status=… WHERE id=930000311` affected exactly one row with no `42501`/RLS/
  grant failure; the target row returned byte-identical to its initial state
  after rollback.
- **Fence entry:** `ordem_compra_c3c_fence_and_snapshot(930003001)`, after
  acquiring the session advisory lock, transitioned
  `legacy_active/flat/not_started/all-null` to
  `maintenance_fenced/flat/previewed`, `cutover_generation=930003001`,
  `source_snapshot_count=51`, non-null source/inventory hashes,
  `productive_receipt_started_at` NULL, session lock held, live
  source/inventory counts matching the frozen counts.
- **Evidence Class 5A (database-faithful authenticated actor-context fence
  proof):** the same real flat-table UPDATE shape, under authenticated admin
  and matching-supplier contexts independently, denied with exact `SQLSTATE
  55000` / message `legacy_receipt_fenced` (never `42501`, never a silent
  zero-row result); zero mutation across every business/cutover fingerprint;
  `auth.uid()` still resolved to the intended actor after the caught
  exception. Database-only — no JavaScript/browser/PostgREST execution;
  `js/screens/op-writes.js`/`js/screens/fornecedor.js` were read-only shape
  references.
- **Evidence Class 5B (eight-table structural fence):** all eight
  `trg_c3c_protected_mutation_guard` installations confirmed
  `BEFORE INSERT OR UPDATE OR DELETE`; the full 8-table × 3-operation matrix
  (24 controlled, savepoint-isolated probes) each returned exact
  `legacy_receipt_fenced`/`55000`; zero mutation across every fingerprint.
  Three tables (`ordem_compra_item_alocacao`, `ordem_compra_item`) carry
  additional upstream BEFORE ROW guards (`alocacao_origem_guard`,
  `alocacao_rascunho_guard`, `item_quantidade_rascunho_guard`) requiring a
  consistent, rascunho-status parent order; probes for those two tables
  clone real Class-D (rascunho) rows so the fence guard — not an unrelated
  upstream guard — is the one that denies. Internal trigger-depth exception
  (`saldo_fios`/`saldo_fios_op`, `pg_trigger_depth() > 1 AND status =
  canonical_active`): the direct depth-1 denial is proven by the 24-probe
  matrix; no `SECURITY DEFINER` function was fabricated to synthesize a
  nested caller; the legitimate nested-path runtime is recorded as belonging
  to `PHASE-C3D-E`, not claimed as covered here.
- **Pre-PONR rollback rehearsal:** a test-only owner-level fixture set
  `read_authority='canonical'`, `reconciliation_status='reconciled'`
  (`productive_receipt_started_at`/`canonical_activated_at`/
  `final_acl_closed_at` remained NULL; not a claim of real
  import/reconciliation — the real historical totals are unavailable to
  this synthetic corpus). `ordem_compra_c3c_pre_ponr_rollback(930003001)`
  produced `status=maintenance_fenced`, `read_authority=flat`,
  `canonical_activated_at` NULL, `productive_receipt_started_at` NULL,
  `cutover_generation` unchanged, snapshot/inventory-baseline row counts and
  effective grants/policies byte-identical before/after, no transition to
  `legacy_active`, direct protected-table writes still fenced after
  rollback. The advisory lock was released and proven absent (`pg_locks`
  count 0); the script issues no unterminated `BEGIN`, leaving no open
  transaction.
- **Cleanup (both runs):** `scripts/c3d/bootstrap-disposable-cluster.mjs`'s
  own audited `stop()` proved postmaster PID absent, port closed, temp
  directory removed after each run; zero leftover disposable process or
  `c3d-disposable-pg-*` directory afterward.
- **Shared development database (`ucrjtfswnfdlxwtmxnoo`) read-only:**
  migrations `75`(`20260720234958`)/`76`(`20260720235820`) present; cutover
  singleton `legacy_active`/`flat`/`not_started`, all markers NULL;
  fingerprint `ordens_compra_fio=64`, `ordem_compra=51`,
  `ordem_compra_item=51`, `ordem_compra_item_alocacao=51`,
  `ordem_compra_item_compat_fio=51`, `necessidade_compra_fio=64`,
  `ordem_compra_recebimentos=0`, `ordem_compra_fio_lancamentos=0`,
  `ordem_compra_fio_movimentos_estoque=0`, `saldo_fios=5`,
  `saldo_fios_op=0`, zero advisory locks — captured before and after the
  local rehearsals, byte-identical. No DDL/DML/mutating RPC; only
  `execute_sql` read-only `SELECT` queries via the pre-scoped
  `supabase-dev-g28` MCP connection.
- **Files materially changed:** `tests/ordem-compra-c3d-fence.integration.sql`
  (new); `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (§S
  appended; `STATUS` marker corrected); `PROJECT_STATE.md`;
  `AGENT_HANDOFF.md`; `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  (`OC-C3D-FENCE-001` evidence/debt columns updated — disposition and
  accepted checkpoint held unchanged, pending supervisor review);
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` (one dated closeout
  note); this ledger. `docs/DOCUMENTATION_INDEX.md` not touched (no indexed
  status materially changed beyond the C3D contract row's own STATUS text,
  already covered by the contract itself). No `db/*.sql`, product `js/*`/
  `index.html`/CSS, existing test, validator, package/lockfile, CI,
  deployment/Supabase/MCP config, or `.gitignore` modified; the three
  preserved residue paths are excluded from the commit.
- **Validation:** `node --check` on `scripts/c3d/bootstrap-disposable-cluster.mjs`
  and `tests/ordem-compra-c3d-deploy.smoke.js`; `node --test
  tests/ordem-compra-c3d-deploy.smoke.js` (24/24); `node --test
  tests/ordem-compra-receipt-cutover.smoke.js` (43/43); `node
  scripts/validate-spec-custody.mjs` PASS; the disposable-cluster fence/
  rollback proof executed twice from fresh clusters (both
  `C3D_C_FENCE_INTEGRATION_PASS`); `git diff --check` / `git diff --cached
  --check` clean; the full mandatory Node suite differential against the
  entry checkpoint `7f73b4d8210da249ddd5b085c7c3b59244afd72b` in a temporary
  detached worktree outside the canonical workspace (removed and pruned
  after) — 141 baseline failing identities, 122 in this workspace, **final
  minus baseline = empty** (added = 0; the 19 baseline-only identities are
  pre-existing non-determinism, not claimed as a fix). `node
  scripts/validate-spec-custody.mjs --self-test` fails identically at the
  entry checkpoint and here (`R1: ACTIVE_PHASE_CONTRACT is not an existing
  file` — the same pre-existing active-contract fixture-harness limitation
  recorded at `PHASE-C3D-B`); no new validator/self-test failure; the
  validator itself was not modified.
- **State after this pass:** `PHASE_ID: PHASE-C3D`; `ACTIVE_PHASE:
  PHASE-C3D`; `LAST_ACCEPTED_PHASE: PHASE-C3C-B` (unchanged);
  `ACCEPTED_CHECKPOINT: 5441321014883c4e8149dc8b20da9d053a193699`
  (unchanged — `PHASE-C3D-C` is not self-accepted). `PHASE-C3D-A`/
  `PHASE-C3D-B` = CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED;
  `PHASE-C3D-C` = IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
  ACCEPTANCE. `OC-C3D-DEPLOY-001` = SATISFIED (unchanged); `OC-C3D-FENCE-001`
  = `PARTIALLY_SATISFIED` (unchanged — only the supervisor may advance it
  after review); `OC-C3D-ACL-001`/`OC-C3D-LOCK-001` = `PARTIALLY_SATISFIED`
  (unchanged).
- **Exact accounting subject:** `test: rehearse C3D purchase-order fence`.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the
  `PHASE-C3D-C` evidence (contract §S). No `PHASE-C3D-D`/`C3D-E`/`C3D-F`
  implementation, environment mutation, branch creation, staging
  validation/application of `db/76`, activation, real snapshot/import, fence
  transition, read switch, final ACL-closure invocation, cutover, C4, C5,
  production access, Supabase write, `main`, `origin`/`production` remote
  mutation, or any further push beyond the one authorized `staging/dev`
  fast-forward for this pass is authorized.

## 2026-07-21 — PHASE-C3D-C — Targeted evidence correction

- **Phase:** `PHASE-C3D-C` targeted evidence correction (§T), correcting
  four incomplete-evidence findings identified against the §S
  implementation; does not redesign or repeat the already-passing
  actor-context, 24-probe, fence, or rollback behavior.
- **Authorization:** the "PHASE-C3D-C TARGETED EVIDENCE CORRECTION" order.
  Entry checkpoint `a4b2e13bf0d9fb19b0ee69196f21d86f4904961e` (the accepted
  `PHASE-C3D-C` implementation checkpoint), branch `dev`, `staging/dev`
  equal to HEAD, preserved residue exactly `.gitignore` (modified,
  unstaged), `.codex/config.toml` (untracked), `.mcp.json` (untracked).
- **Implementation:** modified exactly
  `tests/ordem-compra-c3d-fence.integration.sql`. No `db/*.sql`, product
  file, other test, or script modified.
- **Finding 1 (exact live-versus-frozen hash proof):** added
  `public.ordem_compra_c3c_assert_snapshot_and_live(930003001)` invocations
  post-fence, post-Evidence-5A, post-24-probe-matrix, and post-rollback,
  each required to succeed. Added a session `TEMP` evidence anchor
  (`source_snapshot_count`/`_total_kg`/`_serialization`, `snapshot_hash`,
  `inventory_baseline_count`/`_total_kg`/`_serialization`,
  `inventory_baseline_hash`, plus `md5(string_agg(row::text, ... ORDER BY
  stable_position))` full-row hashes of both
  `ordem_compra_cutover_source_snapshot` and
  `ordem_compra_cutover_inventory_baseline`) captured once post-fence and
  compared byte-for-byte at every later checkpoint — all four comparisons
  passed with zero drift in both runs. Replaced the prior counts-only
  business fingerprint with a full-content fingerprint (row-cast hashes,
  deterministic primary-key ordering) for all eleven listed tables,
  captured pre-Evidence-5A and re-verified after 5A, after the 24-probe
  matrix, and — newly — after the test-only pre-PONR fixture and rollback,
  proving zero mutation of any real business table across the entire test.
  The cutover singleton itself is excluded from both the fingerprint and
  the snapshot/inventory anchor; its exact expected state at each
  checkpoint (including the intentional `reconciliation_status`-stays-
  `reconciled` / `read_authority` canonical→flat rollback transition) is
  asserted field-by-field by the existing per-checkpoint state checks, per
  the order's explicit instruction not to compare the whole cutover row as
  if those intended differences should disappear.
- **Finding 2 (installed trigger-depth exception):** added an empirical
  catalog assertion against
  `pg_get_functiondef('public.trg_c3c_protected_mutation_guard()'::regprocedure)`,
  normalized-whitespace-matched: exactly one `saldo_fios`/`saldo_fios_op`
  branch; exactly one `pg_trigger_depth() > 1 AND v_state =
  'canonical_active'` gate; the gate, its pass-through `RETURN`, and the
  `ELSE`-path `RAISE EXCEPTION 'legacy_receipt_fenced' USING ERRCODE =
  '55000'` proven as one contiguous block; `'canonical_active'` referenced
  exactly once in the whole guard body (no broader pass-through); the
  literal `maintenance_fenced` never referenced anywhere in the guard
  (proving it cannot satisfy the gate regardless of trigger depth). No
  `SECURITY DEFINER` function was fabricated to synthesize a depth>1
  caller; combined with the direct depth-1 denial already proven by the
  24-probe matrix, the finding is closed without exercising the legitimate
  nested-path runtime, which remains `PHASE-C3D-E` scope.
- **Finding 3 (test-backend termination proof):** removed the prior
  overstated in-session "idle" claim. The test file's final section now
  emits its own `pg_backend_pid()` as a stable `NOTICE`
  (`TEST_BACKEND_PID=<n>`) and in its final result row. The ephemeral
  orchestration runner (scratch, outside the repository, removed after
  validation) parses that PID from the exited `psql` process's combined
  output, then opens a **separate** connection — proving `pg_stat_activity`
  has zero rows and `pg_locks` has zero advisory locks for that PID —
  before any cluster teardown. Both runs: PID captured, zero
  `pg_stat_activity` rows, zero advisory locks, confirmed via the separate
  connection.
- **Finding 4 (traceability correction):** `OC-C3D-FENCE-001`'s
  residual-debt column no longer states a real, non-disposable-local
  admin/supplier fence rehearsal is pending. It now records: Option 2
  (disposable local PostgreSQL + read-only shared-DB inspection) is the
  selected and sole environment strategy for this requirement; every
  state-changing fence exercise is confined to disposable local PostgreSQL
  18.4; the shared development database is read-only only; no
  remote/shared `maintenance_fenced` exercise is required or authorized by
  `PHASE-C3D-C`; only supervisor acceptance of the corrected evidence
  remains pending. Disposition remains `PARTIALLY_SATISFIED` — not
  advanced by this pass; `OC-C3D-ACL-001`/`OC-C3D-LOCK-001` untouched.
- **Two fresh-cluster re-validation:** both runs green
  (`C3D_C_FENCE_INTEGRATION_PASS`), including all four new evidence
  classes; both proved full postmaster-PID/port/directory cleanup after
  teardown; zero leftover `c3d-disposable-pg-*` directory.
- **Files materially changed:**
  `tests/ordem-compra-c3d-fence.integration.sql` (corrected, not
  recreated); `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (§T
  appended; `STATUS` marker corrected); `PROJECT_STATE.md`;
  `AGENT_HANDOFF.md`; `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  (`OC-C3D-FENCE-001` evidence/residual-debt columns corrected per Finding
  4 — disposition/checkpoint held unchanged); `docs/architecture/
  PEDIDO_PRODUCTION_FLOW_BACKLOG.md` (one dated closeout note); this
  ledger. `docs/DOCUMENTATION_INDEX.md` not touched (no indexed status
  materially changed beyond the C3D contract row's own STATUS text, already
  covered by the contract itself). No `db/*.sql`, product `js/*`/
  `index.html`/CSS, other existing test, validator, package/lockfile, CI,
  deployment/Supabase/MCP config, or `.gitignore` modified; the three
  preserved residue paths excluded from the commit.
- **Validation:** `node --check` on
  `scripts/c3d/bootstrap-disposable-cluster.mjs` and
  `tests/ordem-compra-c3d-deploy.smoke.js` (unmodified); `node --test
  tests/ordem-compra-c3d-deploy.smoke.js` (24/24); `node --test
  tests/ordem-compra-receipt-cutover.smoke.js` (43/43); `node
  scripts/validate-spec-custody.mjs` PASS; the corrected disposable-cluster
  fence/rollback proof executed twice from fresh clusters (both
  `C3D_C_FENCE_INTEGRATION_PASS` with all new gates passing); `git diff
  --check` / `git diff --cached --check` clean; the full mandatory Node
  suite differential against the entry checkpoint
  `a4b2e13bf0d9fb19b0ee69196f21d86f4904961e` in a temporary detached
  worktree outside the canonical workspace (removed and pruned after) —
  final minus baseline = empty (added = 0). `node
  scripts/validate-spec-custody.mjs --self-test` fails identically at the
  entry checkpoint and here (`R1: ACTIVE_PHASE_CONTRACT is not an existing
  file` — the same pre-existing active-contract fixture-harness limitation
  recorded at `PHASE-C3D-B`/`PHASE-C3D-C`); no new validator/self-test
  failure; the validator itself was not modified.
- **State after this pass:** `PHASE_ID: PHASE-C3D`; `ACTIVE_PHASE:
  PHASE-C3D`; `LAST_ACCEPTED_PHASE: PHASE-C3C-B` (unchanged);
  `ACCEPTED_CHECKPOINT: 5441321014883c4e8149dc8b20da9d053a193699`
  (unchanged — `PHASE-C3D-C` is not self-accepted). `PHASE-C3D-A`/
  `PHASE-C3D-B` = CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED;
  `PHASE-C3D-C` = IMPLEMENTED / LOCALLY VERIFIED / CHANGES_REQUIRED
  RESOLVED / AWAITING SUPERVISOR ACCEPTANCE. `OC-C3D-DEPLOY-001` =
  SATISFIED (unchanged); `OC-C3D-FENCE-001` = `PARTIALLY_SATISFIED`
  (unchanged disposition; residual-debt language corrected per Finding 4 —
  only the supervisor may advance the disposition after review);
  `OC-C3D-ACL-001`/`OC-C3D-LOCK-001` = `PARTIALLY_SATISFIED` (unchanged).
- **Exact accounting subject:** `fix: complete C3D fence evidence`.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the
  corrected `PHASE-C3D-C` evidence (contract §T). No `PHASE-C3D-D`/`C3D-E`/
  `C3D-F` implementation, environment mutation, branch creation, staging
  validation/application of `db/76`, activation, real snapshot/import, fence
  transition, read switch, final ACL-closure invocation, cutover, C4, C5,
  production access, Supabase write, `main`, `origin`/`production` remote
  mutation, or any further push beyond the one authorized `staging/dev`
  fast-forward for this pass is authorized.

## 2026-07-21 — PHASE-C3D-C — Supervisor acceptance

- **Authorization:** the "PHASE-C3D-D — EFFECTIVE ACL AND ROLE-MATRIX
  REHEARSAL" order, which opens by recording the supervisor's ruling on
  `PHASE-C3D-C`. Documentation-only acceptance; entry checkpoint
  `6fd63a56a123d6d006353c6ae629611cbc7c01e9` (the accepted `PHASE-C3D-C`
  evidence checkpoint), branch `dev`.
- **Acceptance:** `PHASE-C3D-C` (fence and pre-PONR rollback rehearsal, contract
  §S corrected §T) is **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** at
  accepted checkpoint `6fd63a56a123d6d006353c6ae629611cbc7c01e9`. The accepted
  evidence advanced **`OC-C3D-FENCE-001` to `SATISFIED`** (traceability matrix
  updated): database-faithful authenticated admin/matching-supplier exact fence
  denial (55000/legacy_receipt_fenced, no 42501, zero mutation); 8 protected
  tables × INSERT/UPDATE/DELETE = 24/24 structural probes; four
  `ordem_compra_c3c_assert_snapshot_and_live` checkpoints + byte-identical frozen
  snapshot/inventory evidence anchor; full-content business fingerprints;
  installed trigger-depth-exception catalog proof; pre-PONR rollback to
  `maintenance_fenced`/`flat` (no return to `legacy_active`); captured
  test-backend termination and advisory-lock cleanup; two fresh
  disposable-cluster runs; read-only shared-development invariance.
- **Residual debt (recorded, non-blocking):** the legitimate nested
  canonical-active `saldo_fios`/`saldo_fios_op` runtime remains owned by
  `PHASE-C3D-E`; real cutover remains separately unauthorized; the 13 unmapped
  rows remain a real-cutover completeness item; the validator self-test
  active-contract fixture limitation remains a governance-harness debt.
- **Unchanged:** `OC-C3D-ACL-001`, `OC-C3D-LOCK-001`, `OC-CUTOVER-001`,
  `OC-CUTOVER-PONR-001`.
- **Files:** `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (§U
  appended; STATUS marker updated);
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` (`OC-C3D-FENCE-001`
  advanced to SATISFIED; fenced block + prose reconciled); `PROJECT_STATE.md`;
  `AGENT_HANDOFF.md`; `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`;
  `docs/DOCUMENTATION_INDEX.md`; this ledger. Recorded in the same commit as the
  `PHASE-C3D-D` implementation below (`test: rehearse C3D purchase-order ACL`).
- **NEXT (at this record):** execute `PHASE-C3D-D` (recorded immediately below).

## 2026-07-21 — PHASE-C3D-D — Effective ACL and role-matrix rehearsal

- **Authorization:** the "PHASE-C3D-D — EFFECTIVE ACL AND ROLE-MATRIX
  REHEARSAL" order (contract §U authorizes `PHASE-C3D-D`). Entry checkpoint
  `6fd63a56a123d6d006353c6ae629611cbc7c01e9`, branch `dev`, `staging/dev` equal
  to HEAD at entry. Primary requirement `OC-C3D-ACL-001` (§13.15.2).
- **Artifact:** one authorized new file
  `tests/ordem-compra-c3d-acl.integration.sql` (984 lines). No `db/*.sql`,
  `scripts/c3d/bootstrap-disposable-cluster.mjs`,
  `tests/ordem-compra-c3d-fence.integration.sql`, other existing test, or
  product file was modified.
- **Environment:** two separate fresh disposable, isolated local PostgreSQL 18.4
  clusters, each applying the exact ordered `db/01`…`db/76` plus an ephemeral
  uncommitted Supabase-platform preamble (anon/authenticated/service_role;
  schema `auth` with `auth.uid()`/`auth.users`; schema `extensions` with
  `pgcrypto`) and an ephemeral uncommitted classification-shape-only synthetic
  64-row corpus loaded before `db/67` (27 A / 12 B / 13 C / 12 D; reconciliation
  64/51/51/51/51), with the reserved identities (admin c3a1; matching supplier
  c3b1/930000301; non-matching supplier c3b2/930000302; without-supplier c3b3 =
  active `cliente`; target flat row 930000311; non-matching-only order
  930000312; cutover generation 930004001). Neither preamble nor corpus is
  committed. A separately-scoped read-only inspection of `ucrjtfswnfdlxwtmxnoo`
  before/after was byte-identical (migrations 75/76 present/terminal; cutover
  `legacy_active`/`flat`/`not_started` all-null; business
  64/51/51/51/51/64/5/0/0/0; ACL/policy/function fingerprint md5
  `a73a5c2a1f8389e3b3227b741fe6d5e3` over 370 lines; zero advisory locks) — zero
  DDL/DML/mutating RPC.
- **Evidence:** 14-table / 7-sequence / 11-column / function inventories; an
  empirical `pg_get_functiondef` proof that the installed
  `ordem_compra_c3c_close_final_acl(bigint)` embeds the exact db/75 table/column/
  sequence revokes and the `0::oid = ANY (p.polroles)` PUBLIC-policy drop loop; a
  simulated closure reproducing those ACL effects in one rolled-back transaction
  WITHOUT invoking `close_final_acl` (`final_acl_closed_at` proven NULL at start
  and end); post-simulation table (7 grant-revoked → zero for
  public/anon/authenticated/service_role; 7 retained canonical tables' grants
  byte-identical — canonical direct-read authority not silently removed),
  11-column (no effective UPDATE nor table-level UPDATE), 7-sequence (no
  USAGE/SELECT/UPDATE), RLS-policy (zero PUBLIC / non-PUBLIC byte-identical), and
  function (owner-only no-EXECUTE; Component A/B authenticated-only; no
  owner/security-definer/search_path drift) matrices; four authenticated actors
  denied 42501 on direct INSERT/UPDATE/DELETE of protected tables (12/12);
  byte-identical ACL/business/cutover rollback. Runtime role matrix under a
  TEST-ONLY canonical_active fixture: Component A — admin sees the target + all
  51 mapped orders; matching supplier sees the target and zero foreign-supplier
  orders; non-matching supplier sees zero for the target; without-supplier denied
  `sem_permissao`/42501; anon/service_role denied by function privilege; PUBLIC
  no EXECUTE. Component B — admin + matching supplier absolute-total no-ops return
  `sem_alteracao` (rolled-back savepoints, unique idempotency keys); non-matching
  + without-supplier denied `sem_permissao` (zero mutation); anon/service_role
  denied by function privilege; PUBLIC no EXECUTE. No successful
  increase/decrease committed; `productive_receipt_started_at` NULL throughout;
  fixture rolled back to `legacy_active`/`flat`/`not_started`.
- **Reported DOCUMENTARY deviation (contract §V.3):** the db/75
  `ordem_compra_cutover_c3c_state_check` makes `canonical_active` unrepresentable
  unless `final_acl_closed_at`/`canonical_activated_at` are NOT NULL, so the
  TEST-ONLY runtime fixture sets synthetic markers (rolled back); the
  closure-simulation section keeps `final_acl_closed_at` NULL and never invokes
  the real closure; the post-test cutover is `legacy_active`/`flat`/`not_started`
  with `final_acl_closed_at` NULL.
- **Two fresh-cluster re-validation:** both runs green
  (`C3D_D_ACL_INTEGRATION_PASS`); each proved postmaster-PID absence, port
  closure, and data-directory removal, plus separate-connection backend absence
  (zero `pg_stat_activity` rows, zero advisory locks for the captured PID) before
  teardown.
- **Validation:** `node --check` on
  `scripts/c3d/bootstrap-disposable-cluster.mjs` and
  `tests/ordem-compra-c3d-deploy.smoke.js` (unmodified); `node --test
  tests/ordem-compra-c3d-deploy.smoke.js` and
  `tests/ordem-compra-receipt-cutover.smoke.js`; `node
  scripts/validate-spec-custody.mjs` PASS; `git diff --check` / `git diff
  --cached --check` clean; full mandatory Node suite differential (detached
  temporary worktree at entry checkpoint
  `6fd63a56a123d6d006353c6ae629611cbc7c01e9`, `node --test tests/**/*.js`) —
  final minus baseline = empty; `node scripts/validate-spec-custody.mjs
  --self-test` the identical pre-existing active-contract fixture-harness failure
  both sides, no new failure, validator not modified. Temporary worktree and
  every scratch orchestrator/preamble/corpus artifact removed and proven absent.
- **Files:** `tests/ordem-compra-c3d-acl.integration.sql` (new);
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (§V appended; STATUS
  marker updated); `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  (`OC-C3D-ACL-001` evidence updated, disposition held; fenced block + prose
  reconciled); `PROJECT_STATE.md`; `AGENT_HANDOFF.md`;
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`;
  `docs/DOCUMENTATION_INDEX.md`; this ledger. No `db/*.sql`, product
  `js/*`/`index.html`/CSS, other existing test, validator, package/lockfile, CI,
  or deployment/Supabase/MCP config modified; the three preserved residue paths
  (`.gitignore`, `.codex/config.toml`, `.mcp.json`) excluded from the commit.
- **State after this pass:** `PHASE_ID: PHASE-C3D`; `ACTIVE_PHASE: PHASE-C3D`;
  `LAST_ACCEPTED_PHASE: PHASE-C3C-B` (unchanged); `ACCEPTED_CHECKPOINT:
  6fd63a56a123d6d006353c6ae629611cbc7c01e9`. `PHASE-C3D-A`/`PHASE-C3D-B`/
  `PHASE-C3D-C` = CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED;
  `PHASE-C3D-D` = IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
  ACCEPTANCE. `OC-C3D-DEPLOY-001` = SATISFIED; `OC-C3D-FENCE-001` = SATISFIED
  (advanced by the acceptance entry above); `OC-C3D-ACL-001` =
  PARTIALLY_SATISFIED (not self-accepted); `OC-C3D-LOCK-001` =
  PARTIALLY_SATISFIED.
- **Exact accounting subject:** `test: rehearse C3D purchase-order ACL`.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the
  `PHASE-C3D-D` evidence (contract §V). No `PHASE-C3D-E`/`C3D-F` implementation,
  environment mutation, branch creation, staging validation/application of
  `db/76`, activation, real snapshot/import, fence transition, read switch, final
  ACL-closure invocation, cutover, C4, C5, production access, Supabase write,
  `main`, `origin`/`production` remote mutation, or any further push beyond the
  one authorized `staging/dev` fast-forward for this pass is authorized.

## 2026-07-21 — PHASE-C3D-D — Targeted evidence correction (bind runtime role matrix to the simulated ACL closure)

- **Authorization:** the "PHASE-C3D-D — TARGETED CORRECTION — BIND RUNTIME ROLE
  MATRIX TO THE SIMULATED ACL CLOSURE" order (forward correction of the §V
  evidence). Entry checkpoint `b808a5ea832b5038495afe80e492de724835cae6`, branch
  `dev`, `staging/dev` equal to HEAD at entry. Primary requirement
  `OC-C3D-ACL-001` (§13.15.2). Protected residue preserved and untouched:
  `M .gitignore`, `?? .codex/config.toml`, `?? .mcp.json`.
- **CHANGES_REQUIRED finding (BLOCKING):** the §V implementation proved the
  catalog post-closure matrix (table/column/sequence/policy/function + four-actor
  direct-table `42501` probes) and proved the Component A/B runtime role matrix,
  but the two executed in **separate transactions** (one `BEGIN … ROLLBACK` for
  the simulation, a second independent `BEGIN … ROLLBACK` for the runtime
  fixture/matrix). The simulated ACL closure had therefore already been rolled
  back before the runtime matrix ran, so the runtime matrix never executed while
  the revokes and PUBLIC-policy drops were in force.
- **Artifact:** exactly one modified file
  `tests/ordem-compra-c3d-acl.integration.sql` (the sole authorized technical
  artifact). No `db/*.sql` (db/75/db/76 byte-unchanged),
  `scripts/c3d/bootstrap-disposable-cluster.mjs`, any other test, script,
  validator, fixture, or product file was modified.
- **Corrected structure:** one outer closure-simulation transaction (`BEGIN`)
  holding the manual db/75 ACL revokes + PUBLIC-policy drops and the
  already-passing catalog matrices; a pre-runtime proof that the closure is still
  materially active; **one nested savepoint `c3dd_runtime_fixture`** setting the
  minimum valid synthetic `canonical_active` state (status/read_authority/
  reconciliation_status/cutover_generation 930004001/synthetic
  `final_acl_closed_at`+`canonical_activated_at`/`productive_receipt_started_at`
  NULL) required by the installed db/75 CHECK **without invoking**
  `ordem_compra_c3c_close_final_acl` or `ordem_compra_c3c_activate`; the complete
  Component A/B eight-actor runtime role matrix executed while the simulated
  closure remains active, with a mid-runtime re-assertion and a no-drift proof;
  `ROLLBACK TO SAVEPOINT c3dd_runtime_fixture` restoring the synthetic markers
  (proven NULL again, cutover byte-identical to pre-fixture) while the simulated
  ACL stays active; `RELEASE SAVEPOINT`; and the outer `ROLLBACK` restoring the
  pre-simulation catalog + business + cutover state byte-for-byte.
- **Evidence:** executed twice against two independently bootstrapped fresh
  disposable, isolated local PostgreSQL 18.4 clusters (same ephemeral uncommitted
  Supabase-platform preamble + classification-shape-only synthetic 64-row corpus
  as the §V rehearsal; `db/67` self-check 64/27/12/13/12; reconciliation
  64/51/51/51/51). Both runs emitted `C3D_D_ACL_INTEGRATION_PASS` under the
  corrected structure (36 `PASS[...]` assertions incl. the new pre-runtime,
  mid-runtime, no-drift, post-savepoint-rollback, and post-outer-rollback
  proofs). After each run the bootstrap `stop()` proved postmaster-PID absence,
  port closure, and data-directory removal (all `true`); a separate connection
  after `psql` exit proved the captured test-backend PID absent from
  `pg_stat_activity` with zero advisory locks. `node --check` bootstrap +
  deploy-smoke; `node --test` deploy-smoke (24/24) and receipt-cutover (43/43)
  PASS; `node scripts/validate-spec-custody.mjs` PASS; `git diff --check` /
  `git diff --cached --check` clean. Full mandatory Node suite differential
  (detached temporary worktree at baseline
  `b808a5ea832b5038495afe80e492de724835cae6`, `node --test tests/**/*.js`):
  baseline 141 failing identities, final 122, **added (final − baseline) =
  empty** (the corrected artifact is a `.sql` file, never run by the Node suite;
  the 19 baseline-only identities are pre-existing suite non-determinism).
  Validator self-test: the known active-contract fixture-harness failure only,
  byte-identical material output on baseline and final (paths aside); validator/
  fixtures unmodified. The temporary worktree and every scratch
  orchestrator/preamble/corpus artifact were removed and proven absent before
  commit.
- **Disposition:** `PHASE-C3D-D` = `IMPLEMENTED / LOCALLY VERIFIED /
  CHANGES_REQUIRED RESOLVED / AWAITING SUPERVISOR ACCEPTANCE` — not
  self-accepted. `OC-C3D-ACL-001` = `PARTIALLY_SATISFIED` (not advanced);
  `OC-C3D-FENCE-001` = `SATISFIED`; `OC-C3D-LOCK-001` = `PARTIALLY_SATISFIED`.
  `PHASE-C3D-E`/`C3D-F` remain NOT AUTHORIZED. Full detail: contract §W.
- **Exact accounting subject:** `fix: bind C3D ACL role matrix to closure simulation`.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the corrected
  `PHASE-C3D-D` evidence (contract §V, corrected §W). No `PHASE-C3D-E`/`C3D-F`
  implementation, environment mutation, branch creation, staging
  validation/application of `db/76`, activation, real snapshot/import, fence
  transition, read switch, final ACL-closure invocation, cutover, C4, C5,
  production access, Supabase write, `main`, `origin`/`production` remote
  mutation, or any further push beyond the one authorized `staging/dev`
  fast-forward for this pass is authorized.

## 2026-07-21 — PHASE-C3D-D — Supervisor acceptance

- **Authorization:** the "PHASE-C3D-E — SESSION LOCK, RESOURCE LOCK AND
  CONCURRENCY REHEARSAL" order, which opens by recording the supervisor's ruling
  on `PHASE-C3D-D`. Documentation-only acceptance; entry checkpoint
  `5a2be05c19a62346b906f7b3cbb0b89d07b3a571` (the corrected `PHASE-C3D-D`
  evidence checkpoint, §W), branch `dev`.
- **Acceptance:** `PHASE-C3D-D` (effective ACL and role-matrix rehearsal, contract
  §V corrected §W) is **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** at
  accepted checkpoint `5a2be05c19a62346b906f7b3cbb0b89d07b3a571` (original C3D-D
  evidence `b808a5ea832b5038495afe80e492de724835cae6`; targeted
  transaction-binding correction `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`). The
  accepted evidence advanced **`OC-C3D-ACL-001` to `SATISFIED`** (traceability
  matrix updated): the exact 14-table / 11-column / seven-sequence
  protected-object inventories; the empirical `pg_get_functiondef` proof of the
  installed `close_final_acl` body; the exact table/column/sequence closure
  simulation; removal of PUBLIC-targeted policies; effective table/column/
  sequence/function/RLS matrices; direct-table denial for authenticated actors;
  the Component A/B eight-actor runtime role matrix executed while the simulated
  closure remained active (one outer closure-simulation transaction + one nested
  canonical-active fixture savepoint); synthetic `final_acl_closed_at` /
  `canonical_activated_at` confined to that savepoint with
  `productive_receipt_started_at` NULL; savepoint rollback restoring the synthetic
  markers while retaining the simulated closure; outer rollback restoring catalog
  and business byte-for-byte; no invocation of `ordem_compra_c3c_close_final_acl`
  or `ordem_compra_c3c_activate`; two fresh disposable-cluster runs; read-only
  shared-development invariance; zero persistent database mutation.
- **Residual debt (recorded, non-blocking):** real `close_final_acl` invocation,
  real activation, and real cutover remain separately unauthorized; the 13
  unmapped historical rows remain a real-cutover completeness item; the validator
  active-contract self-test fixture-harness limitation remains governance-harness
  debt; concurrency, session/resource locking, legitimate nested
  `saldo_fios`/`saldo_fios_op` runtime, LIFO reversal, and the imported-balance
  floor are owned by `PHASE-C3D-E`.
- **Unchanged:** `OC-C3D-DEPLOY-001`/`OC-C3D-FENCE-001` = `SATISFIED`;
  `OC-C3D-LOCK-001` = `PARTIALLY_SATISFIED`; `OC-CUTOVER-001`,
  `OC-CUTOVER-PONR-001`, `OC-C4-ADMIN-001`, `OC-C4-SUPPLIER-001`,
  `OC-C5-EMISSION-001` unchanged.
- **Files:** `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (§X appended;
  STATUS marker updated); `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  (`OC-C3D-ACL-001` → `SATISFIED`, header/boundary reconciled); `PROJECT_STATE.md`;
  `AGENT_HANDOFF.md`; `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`; this
  ledger. No `db/*.sql`, product, script, migration, or normative file was
  modified by the acceptance itself.
- **Exact accounting subject:** `test: rehearse C3D purchase-order concurrency`
  (recorded together with the `PHASE-C3D-E` implementation in the same pass and
  single commit).
- **NEXT (at this record):** execute `PHASE-C3D-E` (recorded immediately below).

## 2026-07-21 — PHASE-C3D-E — Session lock, resource lock, and Component B concurrency rehearsal

- **Authorization:** the "PHASE-C3D-E — SESSION LOCK, RESOURCE LOCK AND
  CONCURRENCY REHEARSAL" order (contract §X authorizes `PHASE-C3D-E`). Entry
  checkpoint `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`, branch `dev`,
  `staging/dev` equal to HEAD at entry. Primary requirement `OC-C3D-LOCK-001`
  (§R.29.5). Protected residue preserved and untouched: `M .gitignore`,
  `?? .codex/config.toml`, `?? .mcp.json`.
- **Artifact:** one authorized new file
  `tests/ordem-compra-c3d-lock-concurrency.mjs`. No `db/*.sql`,
  `scripts/c3d/bootstrap-disposable-cluster.mjs`, any other existing test,
  validator, fixture, or product file was modified.
- **Environment:** two independently bootstrapped fresh disposable, isolated
  local PostgreSQL 18.4 clusters (distinct random ports, fresh temp directories
  outside the repository), each applying the exact ordered `db/01`…`db/76` over
  an ephemeral uncommitted Supabase-platform preamble and the
  classification-faithful synthetic 64-row corpus (`db/67` self-check
  64/27/12/13/12; reconciliation 64/51/51/51/51; target flat row 930000311 =
  Class B / fornecedor 930000301 / `kg_pedido` 15.500 / `kg_recebido` 5.000 /
  one allocation `kg_alocado` 15.500). Preamble/corpus/actor fixtures live only
  in OS temp files removed before process exit; the test connects to no
  shared/remote host and carries no credential.
- **Evidence (both runs, `C3D_E_LOCK_CONCURRENCY_PASS`):** the session
  advisory-lock matrix (deterministic key `-1959642271488922014` stable across
  connections, distinct control-generation key, NULL/0/negative rejected 42501;
  same-generation exclusion with the granted lock bound to the holder's backend
  PID; different-generation independence; release/reacquire; backend-disconnect
  auto-release; owner-only boundary — no EXECUTE for authenticated/anon/
  service_role; no leak); the installed Component B resource-lock order (order →
  item → idempotency advisory → header lookup → allocations asc → ledger asc →
  inventory advisory) proven by empirical `pg_get_functiondef` and a real staged
  blocker (`pg_blocking_pids`, `wait_event` Lock/transactionid, rolled back
  pre-PONR, zero mutation, no leak); pre-PONR cutover preparation (real session
  lock + real `fence_and_snapshot(930005001)` + the accepted synthetic equivalent
  of `import_and_reconcile` — per-row `import_snapshot_row`, 40 import headers, +
  `assert_snapshot_and_live` — establishing a 5.000 kg immutable imported opening
  balance, then a manual TEST-ONLY `canonical_active` state with
  `close_final_acl`/`activate` never invoked and Component A resolving the target
  row); a two-session Component B sequence crossing exactly one synthetic PONR per
  cluster (T1 distinct PID commits to 10.000 setting
  `productive_receipt_started_at`; T2 distinct PID waits on the row lock —
  `pg_blocking_pids(T2)` contains T1, `wait_event_type=Lock`, no header, no
  deadlock, observable wait — then re-evaluates a fresh +5.000 to 15.000, never a
  stale 20.000; final item 15.000, two productive headers, two `tipo=recebimento`
  lines, imported line untouched at 5.000); idempotency (same key/payload replay
  zero mutation; same key/different payload → `idempotencia_conflitante`;
  actor-scoped identity); the legitimate nested canonical-active path (item cache
  + inventory movement at `pg_trigger_depth()>1`; direct depth-1 client mutation
  denied `legacy_receipt_fenced`/55000; the `saldo_fios`/`saldo_fios_op` exception
  gated exactly on `pg_trigger_depth()>1 AND v_state='canonical_active'`);
  deterministic LIFO reversal 15.000 → 8.000 (all of T2's 5.000, then exactly
  2.000 of T1, leaving 3.000; imported 5.000 untouched; id-descending;
  idempotent replay); the imported-balance floor (reduction to 4.000 rejected
  `reducao_abaixo_saldo_importado`, floor 5.000, zero mutation, total stays
  8.000); post-PONR compliance (`pre_ponr_rollback` never invoked, no
  `legacy_active` regression, no advisory leak, no idle-in-transaction, deadlocks
  unchanged, all client sessions closed); and mandatory full cluster destruction
  (postmaster PID absent, port closed, data directory + all scratch artifacts
  absent) both runs.
- **Reported DOCUMENTARY axes:** `saldo_fios` is not empirically mutated (the
  order's fixed fixture — `kg_alocado` 15.500 ≥ maximum total 15.000 — produces
  no excess line, so `derive_state`'s `saldo_fios` branch is never reached; the
  canonical-active depth>1 exception is proven structurally and by a depth-1
  denial probe), and `saldo_fios_op` is `NOT_APPLICABLE` (no receipt/reversal/
  import path writes it, proven from the installed trigger topology). Neither is
  a gap in `OC-C3D-LOCK-001`.
- **Validation:** `node --check` bootstrap + new test; `node` the new test (two
  fresh-cluster proofs, exit 0); `node --test` deploy-smoke + receipt-cutover
  smoke PASS; `node scripts/validate-spec-custody.mjs` PASS; `git diff --check` /
  `git diff --cached --check` clean; full-suite failing-identity differential
  (detached worktree at `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`, `node --test
  tests/**/*.js`): added = empty (the new artifact is a `.mjs`, never executed by
  the Node suite); validator self-test the identical pre-existing fixture-harness
  failure only. Read-only `ucrjtfswnfdlxwtmxnoo` inspection byte-identical
  before/after.
- **State after this pass:** `PHASE_ID: PHASE-C3D`; `ACTIVE_PHASE: PHASE-C3D`;
  `LAST_ACCEPTED_PHASE: PHASE-C3C-B` (unchanged); `ACCEPTED_CHECKPOINT:
  5a2be05c19a62346b906f7b3cbb0b89d07b3a571`. `PHASE-C3D-D` = CLOSED / TECHNICALLY
  ACCEPTED / LOCALLY VERIFIED; `PHASE-C3D-E` = IMPLEMENTED / LOCALLY VERIFIED /
  AWAITING SUPERVISOR ACCEPTANCE (not self-accepted). `OC-C3D-DEPLOY-001` /
  `OC-C3D-FENCE-001` / `OC-C3D-ACL-001` = SATISFIED; `OC-C3D-LOCK-001` =
  PARTIALLY_SATISFIED. `PHASE-C3D-F` = NOT AUTHORIZED.
- **Exact accounting subject:** `test: rehearse C3D purchase-order concurrency`.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the `PHASE-C3D-E`
  evidence (contract §Y). No `PHASE-C3D-F` implementation, real `close_final_acl`
  invocation, real activation, real cutover, environment mutation, branch
  creation, staging validation/application of `db/76`, deployment, Supabase
  write, `main`, `origin`/`production` remote mutation, or any further push
  beyond the one authorized `staging/dev` fast-forward for this pass is
  authorized.

## 2026-07-21 — PHASE-C3D — Aggregate closeout (PHASE-C3D-F) & PHASE-C3D-E supervisor acceptance

- **Authorization:** the "PHASE-C3D-F — AGGREGATE CLOSEOUT AND READINESS
  DISPOSITION" order (documentation-only closeout). Entry checkpoint
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`, branch `dev`, `staging/dev` equal to
  HEAD at entry. Protected residue preserved and untouched: `M .gitignore`,
  `?? .codex/config.toml`, `?? .mcp.json`.
- **PHASE-C3D-E supervisor acceptance (STEP 1):** `PHASE-C3D-E` (session lock,
  resource lock, and Component B concurrency rehearsal, contract §Y) is **CLOSED /
  TECHNICALLY ACCEPTED / LOCALLY VERIFIED** at accepted checkpoint
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a` (contract §Z), advancing
  **`OC-C3D-LOCK-001` to `SATISFIED`** (traceability updated; its §M item 4 exit
  criteria met). Accepted evidence: two independently bootstrapped fresh
  disposable PostgreSQL 18.4 clusters; exact ordered `db/01`…`db/76`;
  classification-faithful 64-row synthetic corpus; deterministic session
  advisory-lock key; same-generation exclusion; different-generation independence;
  release/reacquisition; backend-disconnect auto-release; owner-only lock-command
  boundary; zero advisory-lock leakage; the installed Component B resource-lock
  order; a real staged blocker and `pg_blocking_pids` evidence; two real T1/T2
  sessions and a real PostgreSQL lock wait; T2's fresh post-commit absolute-total
  delta re-evaluation; no stale delta; unchanged deadlock counter; exactly one
  synthetic PONR crossing per cluster; idempotent replay and
  `idempotencia_conflitante`; deterministic LIFO reversal; imported-balance
  immutable floor; direct depth-1 fence denial; the legitimate nested
  `ordem_compra_item`/movement runtime; mandatory destruction of both post-PONR
  clusters; read-only shared-development invariance; zero persistent database
  mutation.
- **Documentary precision correction (non-blocking):** the two-session blocking
  evidence was not produced by one fixed observer backend. The test creates and
  captures a backend PID labelled *observer*, **closes that marker session**, and
  performs the `pg_blocking_pids`/`pg_stat_activity` observations through
  independent transient observer queries — recorded as **INDEPENDENT OBSERVER
  CONNECTIONS CONFIRMED THE T1/T2 BLOCKING RELATIONSHIP**. The accepted technical
  artifact (`tests/ordem-compra-c3d-lock-concurrency.mjs`) is unchanged.
- **`saldo_fios`/`saldo_fios_op` disposition:** `ordem_compra_item` and inventory
  movement runtime were empirically exercised; direct depth-1 `saldo_fios`
  mutation was denied `55000`; the installed exception was structurally proven to
  require `pg_trigger_depth() > 1 AND canonical_active`; the fixed scenario
  produced no excess because `kg_alocado` 15.500 exceeded the maximum tested total
  15.000, so `saldo_fios`'s excess branch was not empirically executed;
  `saldo_fios_op` is `NOT_APPLICABLE` to the installed receipt/reversal/import
  write topology; neither is an `OC-C3D-LOCK-001` §M exit criterion.
- **Aggregate PHASE-C3D closeout (STEP 2):** sublots `PHASE-C3D-A`
  `096cd60325e4987010d328c856ee6a3a51ca66bf`, `PHASE-C3D-B`
  `5441321014883c4e8149dc8b20da9d053a193699`, `PHASE-C3D-C`
  `6fd63a56a123d6d006353c6ae629611cbc7c01e9`, `PHASE-C3D-D`
  `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`, `PHASE-C3D-E`
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a` all **CLOSED / TECHNICALLY ACCEPTED /
  LOCALLY VERIFIED**; `PHASE-C3D-F` **CLOSED / ACCEPTED / DOCUMENTATION-ONLY**;
  aggregate **`PHASE-C3D` CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY
  VERIFIED** at accepted technical checkpoint
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`. All four `OC-C3D-*` requirements
  **SATISFIED**. The final `PHASE-C3D-F` documentation commit is the
  closeout-documentation checkpoint, not a new technical evidence checkpoint; no
  real cutover was executed; no `OC-CUTOVER-001`/`OC-CUTOVER-PONR-001`/
  `OC-C4-ADMIN-001`/`OC-C4-SUPPLIER-001`/`OC-C5-EMISSION-001` disposition was
  advanced.
- **13 unmapped rows (STEP 3):** exact ids `153`–`165`, all
  `rascunho`/`pendente`/`nao_recebido`, `kg_recebido` NULL, outside the 51-row
  mapped/frozen corpus; Component A cannot project them; Component B must fail
  `mapeamento_compat_ausente` if invoked; no mapping/bridge/migration/backfill/
  exclusion record created. **DEFERRED to the `REAL_CUTOVER` readiness gate** — a
  binding hard authorization prerequisite recorded in `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, the
  C3D contract §Z, the `OC-CUTOVER-001` traceability residual debt, and this
  ledger. Before `REAL_CUTOVER` may be authorized, a separate read-only
  completeness diagnosis must disposition each of the 13 by exactly one of (1)
  authorized mapping/backfill and re-baseline, (2) documented exclusion with
  business-owner approval, or (3) cancellation/removal via a separately authorized
  business-data action. `OC-CUTOVER-001` stays `PLANNED`.
- **Residual debt (STEP 4, non-blocking):** (1) the 13-row completeness gate; (2)
  the exact real historical totals — 39 headers / 44 entries / 20,221.280 kg /
  405.980 kg excess — remain real-cutover evidence; (3) the synthetic corpus does
  not substitute for those totals; (4) real `close_final_acl` invocation, (5) real
  activation, (6) real read-authority switch, and (7) any productive receipt on a
  shared/real environment all remain unauthorized; (8) the validator
  active-contract self-test fixture limitation remains governance-harness debt; (9)
  the mandatory Node suite retains pre-existing nondeterminism (no new failing
  identity introduced); (10) the C3D-E fixed scenario produced no excess line and
  did not empirically mutate `saldo_fios` (not an `OC-C3D-LOCK-001` exit
  criterion); (11) `saldo_fios_op` `NOT_APPLICABLE`.
- **Read-only shared-development closeout check (`ucrjtfswnfdlxwtmxnoo`,
  SELECT-only):** migrations `75` (`20260720234958`)/`76` (`20260720235820`)
  present; cutover singleton `legacy_active`/`flat`/`not_started` with every
  marker NULL; counts `ordens_compra_fio`=64, `ordem_compra`=51,
  `ordem_compra_item`=51, `ordem_compra_item_alocacao`=51,
  `ordem_compra_item_compat_fio`=51, `necessidade_compra_fio`=64, `saldo_fios`=5,
  `saldo_fios_op`=0, `ordem_compra_recebimentos`=0,
  `ordem_compra_fio_lancamentos`=0, `ordem_compra_fio_movimentos_estoque`=0;
  advisory locks=0. No DDL, DML, mutating RPC, role/policy mutation, or remote
  fence/activation/receipt/cutover action.
- **Files (exactly seven authorized documents; zero technical file):**
  `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`,
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (§Z appended, STATUS
  marker updated), `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  (`OC-C3D-LOCK-001` → `SATISFIED`, header/boundary reconciled, R21 accounting
  subject), `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this ledger.
  Every accepted technical artifact byte-identical; no `db/*.sql`, test, script,
  product, validator, or normative file modified; zero new/deleted file.
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS; `git diff
  --check` / `git diff --cached --check` clean; the validator self-test is all-PASS at final (`ACTIVE_PHASE_CONTRACT` `NONE`); the known active-contract fixture-harness artifact
  (`R1: ACTIVE_PHASE_CONTRACT is not an existing file`) surfaced only at baseline `429aa398`, a baseline-only harness limitation with no new self-test failure and not a claimed fix;
  full-suite failing-identity differential (detached temporary worktree at
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`, `node --test tests/**/*.js`): final
  minus baseline = empty; the temporary worktree and every scratch artifact
  removed and proven absent.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3D`; `ACTIVE_PHASE:
  NONE`; `ACTIVE_PHASE_CONTRACT: NONE`; `ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C`;
  `ACCEPTED_CHECKPOINT: 429aa3980c7027b9d872a1902e2f31f1a4a85a2a`; `PHASE-C3D:
  CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`.
- **Exact accounting subject:** `docs: close C3D purchase-order rehearsal`.
- **NEXT_AUTHORIZABLE_ACTION:** architect authorization decision for `PHASE-C4` —
  ADMIN RECEIPT UI (`OC-C4-ADMIN-001`). `PHASE-C4`, `PHASE-C5`, and `REAL_CUTOVER`
  (blocked from authorization behind the 13-row completeness disposition) remain
  unauthorized; the next chat must re-read the canonical repository before
  authoring or executing any `PHASE-C4` order. One clean fast-forward push to
  `staging/dev` is authorized for the single closeout commit.

## 2026-07-21 — C4-MATERIAL-PHASE-CONTRACT-R1 — Admin Receipt UI material contract (proposed)

- **Authorization:** `C4-MATERIAL-PHASE-CONTRACT-R1` — read-only repository
  reconciliation + documentation-only PHASE-C4 material phase contract
  authoring. Explicitly does **not** authorize product implementation,
  database migration, environment mutation, staging application, deployment,
  activation, cutover, or push beyond the one authorized documentation
  commit (no push authorized this pass — see below).
- **Entry checkpoint:** workspace `D:\Programação\controle-tapetes-g28`; git
  dir `.git` (normal repository); branch `dev`; `HEAD`
  `0df4228f903ae68c7e8b240e69ff3b37df9ebd86`; `HEAD^`
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`; `git status --short
  --untracked-files=all` = `M .gitignore`, `?? .codex/`, `?? .mcp.json`
  (expected protected residue, untouched); `staging/dev` after `git fetch
  staging` = `0df4228f903ae68c7e8b240e69ff3b37df9ebd86`, identical to `HEAD`
  (`git rev-list --left-right --count staging/dev...HEAD` = `0 0`); one
  worktree. All baseline facts matched the order's expected values exactly.
- **Canonical reread:** full read of `docs/governance/AGENT_INSTRUCTIONS.md`,
  `PROJECT_STATE.md` (both halves), `AGENT_HANDOFF.md`, `CLAUDE.md`,
  `docs/DOCUMENTATION_INDEX.md`, `docs/governance/DOCUMENTATION_MODEL.md`,
  `docs/governance/SUPERVISION_PROTOCOL.md`,
  `docs/architecture/CODE_HEALTH_RULES.md`,
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (3,750 lines,
  full), `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` (1,318 lines,
  full), `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`,
  `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`, and the ledger
  tail. Also read, in response to an explicit mid-task instruction to ground
  the visual contract in the applicable governance:
  `docs/architecture/UI_VISUAL_CONTRACT.md` (354 lines, full) — confirmed
  authoritative in place of the untracked `.claude/design-skill/` (`inttex-ui`
  skill), which this pass confirmed **absent** from this worktree
  (`find .claude -iname "*design*" -o -iname "*skill*"` and
  `find .claude -iname preview` both empty) — exactly the condition that
  document's own header anticipates. Also read `js/ui.js` (310 lines) and
  `css/tokens.css` to ground the visual contract in the real, currently-wired
  component/token surface (confirming `--rv-*` tokens are pilot-scoped only
  and not yet linked into the `ordem-compra*` render path).
- **Targeted inventory (read-only, no mutation):** all fourteen named
  application files
  (`js/screens/ordem-compra.js`/`-data.js`/`-render.js`/`-events.js`/
  `-distribuicao.js`/`-receipt-cutover.js`, `js/screens/op-writes.js`,
  `js/screens/fornecedor.js`, `js/screens/pedido-detail-data.js`,
  `js/screens/pedido-detail-events.js`, `js/router.js`, `js/boot.js`,
  `js/screens/common.js`, `index.html`); the full `db/68`-`db/76` migration
  sequence (confirmed terminal at `db/76`; no `db/77`+) with exact effective
  signatures/grants/gates for `registrar_recebimento_ordem_compra`,
  `estornar_recebimento_ordem_compra`,
  `obter_historico_recebimento_ordem_compra`, `obter_ordem_compra_admin`,
  `registrar_recebimento_ordem_compra_fio_compat`; and all twenty
  `tests/*ordem*compra*` files plus `tests/fornecedor-screens.smoke.js`,
  `tests/boot.smoke.js`, `tests/router.smoke.js` for existing coverage.
- **Evidence — artifact created:** exactly one new file,
  `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md` (`PHASE_ID:
  PHASE-C4`, `STATUS: PROPOSED / AWAITING SUPERVISOR REVIEW / IMPLEMENTATION
  NOT AUTHORIZED`). Binds `OC-C4-ADMIN-001` to: an exact functional scope
  (admin receipt registration, item/allocation remaining quantities,
  explicit excess entry with no fabricated OP, receipt command history,
  administrator reversal, document/origin metadata, replay/idempotency
  behavior); an actor/state/action matrix keyed to the real
  `status_administrativo`/`status_aceite`/`legado` vocabulary and the
  server-derived `acoes.receber`/`acoes.estornar` flags (verified from the
  installed `obter_historico_recebimento_ordem_compra` body — `acoes.receber
  = NOT legado AND status_administrativo='emitida' AND status_aceite IN
  ('nao_aplicavel','aceita')`; `acoes.estornar = is_admin() AND EXISTS(a
  reversible positive line)`, independent of order status); an API ownership
  matrix (native `registrar_recebimento_ordem_compra`/
  `estornar_recebimento_ordem_compra`/
  `obter_historico_recebimento_ordem_compra`, explicitly excluding the
  PHASE-C3C-B legacy-compat adapter `js/screens/ordem-compra-receipt-cutover.js`
  from C4's call graph, with a binding scoping rule requiring C4 to
  reimplement — not import — the idempotency-lifecycle pattern
  independently); a closed three-new-file product manifest
  (`js/screens/ordem-compra-receipt-data.js`/`-render.js`/`-events.js`, plus
  additive `js/screens/ordem-compra.js`/`index.html` touches); an explicit
  unchanged-file list (`js/router.js` — route already exists;
  `js/boot.js` — no exact-match route needed; `js/screens/common.js`; all
  legacy/compat surfaces; all existing `ordem-compra-data/render/events.js`;
  all `db/*.sql`); a two-independent-tracker idempotency/error contract; and
  a visual contract (§13) authored against `docs/architecture/UI_VISUAL_CONTRACT.md`'s
  rule taxonomy (component structure, interaction pattern, responsive
  behavior deferred to the existing `OPEN` cockpit/breakpoint points, and a
  visual-validation procedure using the existing `tests/ordem-compra.smoke.js`
  VM/DOM render-harness pattern in place of the confirmed-absent
  `.claude/preview` harness, per `UI_VISUAL_CONTRACT.md` §18's own fallback).
- **Reversal-ownership determination:** resolved as in-scope for C4, not
  `UNPROVEN`, from five independent textual anchors — `§R.24.9` (creation and
  reversal open "a dedicated modal" as one bundled admin receipt UI),
  `§R.24.10` ("C4: admin receipt UI," undifferentiated), `§R.25.4`
  (`estornar_recebimento_ordem_compra` is a real, shipped, admin-gated RPC),
  `§R.29.6` ("C4 exclusively owns the new admin receipt UI... supplier UI is
  deferred" — the only named carve-out is supplier), and `§R.31`'s registry
  row for `OC-C4-ADMIN-001`. Only **supplier** reversal remains textually
  unresolved (`§R.24.6`), and that is out of C4's scope regardless
  (`OC-C4-SUPPLIER-001` `DEFERRED`).
- **Database-prerequisite disposition:** none required. The installed
  `db/70`/`db/75`/`db/76` RPCs and read model are already complete, signed,
  ACL'd, and sufficient for a correct UI. Documented as risks, not blockers:
  all three receipt-family writer RPCs are currently inert
  (`ordem_compra_cutover.status='legacy_active'` as of `db/76`; only a
  separate, owner-only `REAL_CUTOVER` runbook can flip it), and no native
  order can currently reach `status_administrativo='emitida'`
  (`emitir_ordem_compra` is granted to no client role at all, `db/74`).
- **Files (exactly seven documents; zero technical file):**
  `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md` (new), `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this ledger. No
  `db/*.sql`, test, script, product, validator, or normative
  (`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`/`PEDIDO_OP_SCHEMA_CONTRACT.md`)
  file modified; the three protected residue paths (`.gitignore`,
  `.codex/config.toml`, `.mcp.json`) untouched.
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS (vacuous on
  the `MATERIAL_PHASE_CONTRACT` marker check — `ACTIVE_PHASE` remains `NONE`,
  so no active-phase/marker mismatch is possible); `git diff --check` /
  `git diff --cached --check` clean; documentary manifest verified against
  the exact seven-file list above; no product, test, script, migration,
  configuration, or protected-residue path changed.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3D`; `ACTIVE_PHASE:
  NONE`; `ACTIVE_PHASE_CONTRACT: NONE`; `ACTIVE_TRACK:
  PURCHASE_ORDER_PHASE_C`; `ACCEPTED_CHECKPOINT:
  429aa3980c7027b9d872a1902e2f31f1a4a85a2a` (unchanged — this pass adds no
  new technical evidence checkpoint); `OC-C4-ADMIN-001` remains `PLANNED`.
- **Exact accounting subject:** `docs: define C4 admin receipt UI contract`.
- **NEXT_AUTHORIZABLE_ACTION:** supervisor review and acceptance/rejection of
  the proposed `PHASE-C4` material contract
  (`docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`). `PHASE-C4`
  implementation, `PHASE-C5`, and `REAL_CUTOVER` (blocked from authorization
  behind the 13-row completeness disposition) remain unauthorized; a fresh
  session must re-read the canonical repository before executing any
  `PHASE-C4` implementation order. **No push is authorized by this pass.**


<!-- G28_LEDGER_SHADOW_PAYLOAD_END_7b9d4e3a -->
