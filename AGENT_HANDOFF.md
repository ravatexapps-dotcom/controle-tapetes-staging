# ACTIVE OPERATIONAL HANDOFF

> Derived, single active operational handoff. **Not** a second state owner:
> live current state belongs solely to `PROJECT_STATE.md`. The accumulated
> historical handoff stack that previously lived here was preserved verbatim in
> `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md` by
> `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1` (2026-07-20) and is superseded.

## Workspace and Git

- **Workspace:** `D:\Programação\controle-tapetes-g28`.
- **Standalone git directory:** `D:\Programação\controle-tapetes-g28\.git`
  (a normal repository, not a linked worktree).
- **Branch:** `dev`.
- **HEAD / worktree / index / staging / divergence:** live facts — derive from
  Git (`git rev-parse HEAD`, `git status --short --untracked-files=all`). Do not
  treat any copied HEAD as canonical. Compaction baseline HEAD (reference only):
  `17ff8adddaa9f2fd3bc61af7261d9ebaad275f08`.
- **Accepted checkpoint (stable, from the bootstrap):**
  `dd631299f410027ebb23b006aa5e380ad460aefa`.
- **Current Git residue:** modified `.gitignore` only (pre-existing, preserved,
  unstaged). No other tracked residue.

## Phase status

- **Last accepted product phase:** `PHASE-C3C-B` (application compatibility/
  adaptation) — `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`
  (2026-07-21), accepted checkpoint `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §36). No database,
  environment, or deployment action; the adapters' canonical branches remain
  unverified against a live `canonical_active` state (C3D/real cutover).
- **Prior accepted database-prerequisites phase:** `PHASE-C3C-B-DB-PREREQ` —
  `CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED / NOT APPLIED TO STAGING
  DATABASE` (2026-07-20), technical checkpoint
  `34d7d231d0875093bc2091f385c61cf35fa0b5cb` (contract §37). Validation occurred
  only in a disposable local PostgreSQL 18.4 cluster; `db/76` is not applied to
  any staging database.
- **Prior accepted product phase:** `PHASE-C3C-A` — `CLOSED / TECHNICALLY
  ACCEPTED — LOCALLY VERIFIED / INACTIVE / NOT APPLIED TO STAGING` (2026-07-20),
  technical checkpoint `89123729b3529fff6e4a2336bfec2907c4b94b4c`.
- **Active product phase:** `PHASE-C3D-A` — environment & deployment-manifest
  qualification, the currently active implementation sublot within the
  overall `PHASE-C3D` contract — `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR ACCEPTANCE`; `PHASE-C3D-B`…`C3D-F` not authorized.
- **Active phase contract:** `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`
  (`ACCEPTED`, §0c; `PHASE-C3D-A` evidence at §O).
- **Active track:** `PURCHASE_ORDER_PHASE_C`.
- **Current governance status:** `GOVERNANCE-SPEC-CUSTODY-FOUNDATION-R1`
  **ACCEPTED**; `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1` **ACCEPTED** by the
  supervisor at commit `1157b9e71bc629903c5940ab50d4b370964e560e` (state/handoff
  compaction; historical content preserved in tracked archives + the append-only
  ledger; validator PASS; self-tests 47/47 PASS).
- **`PHASE-C3C-B-DB-PREREQ` (implementation + DB-backed validation +
  supervisor acceptance):** `CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED
  / NOT APPLIED TO STAGING DATABASE` (2026-07-20, contract §37).
  `db/76_ordem_compra_c3c_b_db_prerequisites.sql` exists — Component A
  (`listar_ordens_compra_fio_compat`) and Component B
  (`registrar_recebimento_ordem_compra_fio_compat`), both inert until
  `canonical_active`, plus one additive `idempotency_namespace` `CHECK`; the
  corrected `§R.29.7`/`§13.18` deltas were applied; an installed-shape-guard
  finding was resolved by the architect ruling in contract §35 (reuse native
  command types, compat identity in `idempotency_namespace='legacy_compat_receipt_v1'`,
  no `recebimento_compat`, shape guard unchanged). A disposable, isolated local
  PostgreSQL 18.4 cluster (contract §36) then applied the full `db/01`…`db/76`
  sequence, reapplied `db/76` (idempotent), ran both DB-backed tests to PASS,
  rehearsed a real persisted rollback + reapply, and reran both tests to PASS
  again; one genuine `db/76` defect (a PL/pgSQL naming ambiguity in Component A)
  was found and corrected. The two C3C-A DB-backed regressions
  (`tests/ordem-compra-c3c-inactive.integration.sql`/`-concurrency.mjs`) remain
  genuinely unexecutable against any synthetic corpus (pre-existing, unrelated
  to `db/76`) — recorded as nonblocking C3C-A fixture debt. Static smoke
  suites PASS (49/49). `db/76` is **not applied to any staging database**.
  Supervisor acceptance does not mark any dependent requirement `SATISFIED`.
- **Development-DB application (`db/75`→`db/76`, 2026-07-20):** the separately
  authorized development/legacy-database application has been **executed and
  verified** against `ucrjtfswnfdlxwtmxnoo` — `db/75` (version `20260720234958`)
  and `db/76` (version `20260720235820`), both **inert** (`legacy_active`/`flat`;
  inactive-signal-only readers/writers; zero business-data mutation). Recorded in
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md` §39 as
  supervisor-**ACCEPTED**.
- **`PHASE-C3C-B` (application compatibility/adaptation):** `CLOSED /
  ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED` — supervisor-accepted
  2026-07-21 at `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §36, over §§33–35;
  activated by its §32 forward correction). New shared adapter
  `js/screens/ordem-compra-receipt-cutover.js` plus nine adapted call-sites
  (`js/screens/op-writes.js`, `js/screens/fornecedor.js`,
  `js/screens/pedido-detail-data.js`, `js/screens/op-nova.js`,
  `js/screens/op-persistir.js`, `js/screens/op-recalculo.js`, `index.html`).
  **§34 supervisor-review correction** (commit
  `fix: preserve C3C-B receipt idempotency attempts`): real receipt UI
  closures now own and retain their idempotency-attempt tracker across
  retries of unchanged intent (`js/screens/op-writes.js`,
  `js/screens/fornecedor.js`, `js/screens/op-nova.js`,
  `js/screens/pedido-detail-events.js`), and the missing-function classifier
  now checks the exact `42883` SQLSTATE only (message-text alternative
  removed). Full mandatory Node suite (3985 tests, +25 from this
  correction's own tests) has a 122-failure set — 2 fewer than the prior
  124-failure baseline (both incidental fixes of pre-existing CRLF-unaware
  regex assertions sharing a string this correction's test edit also
  touched); every other failure is the same pre-existing, unrelated set —
  zero regressions attributable to this correction; validator PASS. No
  dependent `OC-C3-*` requirement is `SATISFIED`.
  **§35 further correction** (commit `fix: complete C3C-B retry
  classification proof`, on top of `f9b1a54cc7b185a5e72f50209322d1473e93e8
  50`): the RPC-call-level error classifier's "any error except 42883 ⇒
  ambiguous" rule was replaced with a finite predicate (`status === 0` is
  the only genuine-transport-ambiguity signal, grounded in the real
  `@supabase/postgrest-js` response shape); a real DOM-click + stateful-mock
  runtime proof was added for `pedido-detail-events.js`'s receipt form
  (previously proven only statically). Only `js/screens/ordem-compra-
  receipt-cutover.js` and five test files changed. Full mandatory Node suite
  (3993 tests, +8) has the same 122-failure set as the `f9b1a54` baseline —
  byte-identical failing-name set, zero regressions; validator PASS. No
  dependent `OC-C3-*` requirement is `SATISFIED`.
- **Next authorizable action:** **read-only supervisor review of the
  `PHASE-C3D-A` implementation evidence**
  (`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` §O). The contract
  (two forward-corrected `PROPOSED` rounds — §0 R1: requirement disposition,
  the actor-path vs. structural eight-table fence proof split,
  disposable-cluster-only PONR semantics for the C3D-E concurrency proof, and
  the exact future manifest; §0b R2: a common documentary manifest so each
  C3D-A…E sublot can record its own canonical evidence, reclassification of
  the C3D-C fence proof as a **database-faithful authenticated actor-context**
  SQL proof, and a wildcard-wording correction) was **`ACCEPTED`** by the
  supervisor (§0c) at entry checkpoint
  `ab30c5115bb79c8952cc5575b68f8b976497699d`, with `PHASE-C3D-A` (environment
  & deployment-manifest qualification, §D Option 2 — disposable isolated
  local PostgreSQL + read-only shared-DB inspection) explicitly authorized.
  `PHASE-C3D-A` is now `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
  ACCEPTANCE` (§O): `scripts/c3d/bootstrap-disposable-cluster.mjs` +
  `tests/ordem-compra-c3d-deploy.smoke.js` only, no migration applied to any
  cluster or database, disposable-cluster process/directory proven removed
  after every run, read-only shared-DB inspection succeeded (not
  `UNPROVEN`). No `PHASE-C3D-B`/`C3D-C`/`C3D-D`/`C3D-E`/`C3D-F`
  implementation, environment mutation, branch creation, staging
  validation/application of `db/76`, activation, cutover, C4, C5, production
  access, Supabase write, or any further push beyond the one authorized
  `staging/dev` fast-forward for this pass is authorized. **`ACTIVE_PHASE`/
  `ACTIVE_PHASE_CONTRACT` are `PHASE-C3D-A` /
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`**, pending that
  review; no product phase chains automatically beyond `PHASE-C3D-A`.
  **Supervisor-review correction (contract §P), on top of commit
  `dd7f6739082d32dc5df849a9e69eaf1ee651f4cb`:** `CHANGES_REQUIRED` for three
  findings, all corrected — canonical `ACTIVE_PHASE` identity is
  `PHASE-C3D-A` everywhere (bootstrap block and this contract's own
  `PHASE_ID` marker); the bootstrap script's shutdown now proves captured
  postmaster-PID absence, port closure, and directory removal in that order,
  fails closed on any unproven step, preserves both the original and any
  cleanup error on the bootstrap-failure path, and stays retry-safe without
  poisoning a failed attempt; and an exact worktree-based failing-identity
  differential against the `ab30c511` baseline replaced the prior count-only
  comparison (baseline 137, corrected 122, added = 0, 15 pre-existing
  identities absent and reported as non-determinism, not claimed as a fix).
  `PHASE-C3D-A` remains `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR ACCEPTANCE`.

## Governing specifications and contracts

- **Governing spec:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  — §R.29 core is the unchanged accepted Phase-C3 product contract (§R.30 records
  C3C-A local technical acceptance; §R.31 is governance metadata only); `§R.29.7`
  (legacy-compat DB prerequisites) applied 2026-07-20 for `PHASE-C3C-B-DB-PREREQ`.
- **Technical contract:** `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` —
  §13.15 is the unchanged C3B executable contract (§13.16 records C3C-A local
  technical acceptance; §13.17 is governance metadata only); `§13.18`
  (legacy-compat receipt-adapter schema) applied 2026-07-20.
- **Sequence authority:** `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`.
- **Active-track traceability:** `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`.
- **Ledger (append-only):** `docs/ledgers/G28_LEDGER.md`.

## Active requirement IDs and dispositions

Full matrix and normative anchors: `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
(section "Requirement matrix"). Summary of active Phase-C continuation requirements:

- `OC-C3-READ-001`, `OC-C3-WRITE-001`, `OC-C3-COMPAT-001`, `OC-C3-NOUI-001` —
  `PARTIALLY_SATISFIED` (owning phase C3C-B). The database prerequisites
  (`db/76`) are `CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED`, applied
  and supervisor-accepted inert in the development database (contract §§35–39);
  the `PHASE-C3C-B` application-adapter layer that consumes them is now
  `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`, supervisor-
  accepted 2026-07-21 at `22bfb192`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §36). Not
  `SATISFIED` — real `canonical_active` verification is C3D/real-cutover
  territory; `db/76` remains unapplied to staging.
- `OC-C3D-DEPLOY-001` — `PLANNED`; `OC-C3D-FENCE-001`, `OC-C3D-ACL-001`,
  `OC-C3D-LOCK-001` — `PARTIALLY_SATISFIED` (C3D; inactive isolated-rehearsal
  proofs / role matrix pending). The `PHASE-C3D` material phase contract
  (`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`, `PROPOSED`) now scopes
  these proofs; authoring it changed no `OC-C3D-*` disposition.
- `OC-CUTOVER-001` — `PLANNED`; `OC-CUTOVER-PONR-001` — `PARTIALLY_SATISFIED`
  (real cutover unauthorized).
- `OC-C4-ADMIN-001` — `PLANNED`; `OC-C4-SUPPLIER-001` — `DEFERRED`;
  `OC-C5-EMISSION-001` — `PLANNED` (post-C4 emission gate).

## Blockers and debts (live)

- **`INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` — `ACTIVE PRODUCTION BLOCKER`:** the
  Documents Ingestor's Google OAuth token is expired (`invalid_grant`); no
  documents are entering the live system. Fix needs an interactive Google login
  (architect action); coupled to `CAMADA3-OAUTH-GRANT-COUPLING`.
- **`HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`** — nonblocking Phase-C debt.
- **No proven production backup** (`CAMADA3 BK5-BK8`), destructive-delete guard
  not on production (`DELETE-PROD-GUARD-A`), privilege-escalation debts
  (`A2-SERVER-SIDE-ENFORCEMENT`, `A2-CREATE-NIVEL-ACESSO-WIRING`, mitigated by
  the full-trust-admins-only constraint), and the remaining ranked items live in
  the `POST-LAUNCH DEBT REGISTER` in `PROJECT_STATE.md`.
- **Standing reminder:** flip the Supabase MCP back to read-only (still
  management-scoped/write-capable from `M2`/`M3`).

## Environment state

- **PRODUCTION (live since `M10`, 2026-07-18):** Supabase `gqmpsxkxynrjvidfmojk`
  ("Inttex"), served by Vercel at `inttracker-jade.vercel.app` from
  `inttexsystem/inttracker` (`main`).
- **DEVELOPMENT / legacy (formerly "staging"):** `ucrjtfswnfdlxwtmxnoo` —
  retained development database and historical record for the excluded audit
  trails/test rows per `M3`. Purchase-order phases through F3R1 were validated
  here; **`db/75` (C3C-A) and `db/76` (C3C-B DB prerequisites) are now applied
  (2026-07-20; versions `20260720234958`/`20260720235820`), installed inert —
  `legacy_active`/`flat`, both `db/76` functions returning only their inactive
  signals, zero business-data mutation** (contract §38; supervisor-**ACCEPTED**
  at §39). The `PHASE-C3C-B` JS application-adapter layer consuming these two
  functions is now implemented (see Phase status above) but remains
  unauthorized to route to `canonical_active`.
- **PROHIBITED / never accessed:** production `bhgifjrfagkzubpyqpew`.

## Push, remote, main and deployment limits

- **No push** is authorized by this handoff by default. The `M0` full-history
  push to `production` was single-use; the `PHASE-C3D-A` order separately
  authorized exactly one clean fast-forward push to `staging/dev` for this
  pass's single commit (`test: qualify C3D disposable rehearsal environment`)
  — that authorization does not extend to any future push.
- **Remotes:** `production` = `inttexsystem/inttracker` (fetch+push, `main`
  only); `origin` = `grupoterrabranca/controle-tapetes`; `staging` =
  `ravatexapps-dotcom/controle-tapetes-staging` (historical backup only). No
  branch other than `main` is pushed to `production`.
- **`main` is forbidden** as a working/target branch here; no push to
  `origin`/`staging` without separate express authorization.
- **Unauthorized (each a separate gate):** `PHASE-C3D-B`/`C3D-C`/`C3D-D`/
  `C3D-E`/`C3D-F`, staging application/validation of `db/76`, activation,
  deployment, real snapshot/import, fence transition, read switch, final
  ACL-closure invocation, cutover, C4, C5, production access, remote
  mutation beyond the one authorized `staging/dev` fast-forward above, and
  any further push. `PHASE-C3C-B` application implementation is complete
  (`IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`) but
  that acceptance itself remains a separate, not-yet-granted gate.
  `PHASE-C3D-A` is likewise `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR ACCEPTANCE` (§O) — its acceptance is a separate gate too.

## Canonical paths — RETRANSMIT ALL OF THESE IN EVERY FUTURE HANDOFF

1. `PROJECT_STATE.md`
2. `AGENT_HANDOFF.md`
3. `CLAUDE.md`
4. `docs/governance/AGENT_INSTRUCTIONS.md`
5. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
6. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
7. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
8. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
9. `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
10. `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
11. `docs/ledgers/G28_LEDGER.md`
12. `docs/DOCUMENTATION_INDEX.md`
13. `docs/governance/DOCUMENTATION_MODEL.md`
14. `docs/governance/SUPERVISION_PROTOCOL.md`
15. `docs/architecture/CODE_HEALTH_RULES.md`
16. `docs/reports/ORDEM_COMPRA_LEGACY_DIAGNOSIS_2026-07-18.md`
17. `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md` (historical handoff stack)
18. `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (historical state closeouts)
19. `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` (C3C-B material
    phase contract; application adaptation `CLOSED /
    ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED` at §36 — not active)
20. `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
    (C3C-B database prerequisites contract; `PHASE-C3C-B-DB-PREREQ` closed /
    technically accepted / local DB verified / not applied to staging
    database — §§35–37; `db/76` exists, DB-backed tests pass against an
    isolated disposable local cluster; not active)
21. `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (C3D material phase
    contract — inactive deployment & rehearsal; `ACCEPTED`, §0c; `PHASE-C3D-A`
    `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`, §O;
    active)

> Bootstrap first through `docs/governance/AGENT_INSTRUCTIONS.md` and the
> `SPEC_CUSTODY_BOOTSTRAP` block in `PROJECT_STATE.md`. Private conversation,
> memory, and tool caches do not establish state or authorization.
