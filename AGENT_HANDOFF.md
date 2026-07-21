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

- **Last accepted product phase:** `PHASE-C3C-B-DB-PREREQ` — `CLOSED /
  TECHNICALLY ACCEPTED / LOCAL DB VERIFIED / NOT APPLIED TO STAGING DATABASE`
  (2026-07-20), technical checkpoint `34d7d231d0875093bc2091f385c61cf35fa0b5cb`
  (contract §37). Validation occurred only in a disposable local PostgreSQL
  18.4 cluster; `db/76` is not applied to any staging database.
- **Prior accepted product phase:** `PHASE-C3C-A` — `CLOSED / TECHNICALLY
  ACCEPTED — LOCALLY VERIFIED / INACTIVE / NOT APPLIED TO STAGING` (2026-07-20),
  technical checkpoint `89123729b3529fff6e4a2336bfec2907c4b94b4c`.
- **Active product phase:** `NONE`.
- **Active phase contract:** `NONE`.
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
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md` §38 as
  `APPLIED / DEVELOPMENT DB VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`.
- **Next authorizable action:** **supervisor review/acceptance of that applied
  `db/75`+`db/76` development-database stack** (no existing canonical
  phase/action ID names this environment step; recorded descriptively). Only
  after supervisor acceptance does the later `PHASE-C3C-B` application-adaptation
  lot become authorizable. **C3C-B application implementation remains
  UNAUTHORIZED and has no ACTIVE phase contract**
  (`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`); no product phase
  chains automatically; the current product phase remains `NONE`.

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

- `OC-C3-READ-001`, `OC-C3-WRITE-001`, `OC-C3-NOUI-001` — `PARTIALLY_SATISFIED`
  (owning phase C3C-B; inactive `db/75`, `LOCAL_POSTGRES_18_4_ONLY`; application
  consumers/routing not migrated).
- `OC-C3-COMPAT-001` — `BLOCKED`. The database prerequisites are now
  **CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED / NOT APPLIED TO STAGING
  DATABASE** in `db/76`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  §§35–37; `§R.29.7`/`§13.18` applied); the requirement remains blocked pending
  separately authorized staging validation/application of `db/76` and the later
  C3C-B application adaptation.
- `OC-C3D-DEPLOY-001` — `PLANNED`; `OC-C3D-FENCE-001`, `OC-C3D-ACL-001`,
  `OC-C3D-LOCK-001` — `PARTIALLY_SATISFIED` (C3D; inactive staging rehearsal /
  role matrix pending).
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
  signals, zero business-data mutation** (contract §38; `APPLIED / DEVELOPMENT
  DB VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`).
- **PROHIBITED / never accessed:** production `bhgifjrfagkzubpyqpew`.

## Push, remote, main and deployment limits

- **No push** is authorized by this handoff. The `M0` full-history push to
  `production` was single-use.
- **Remotes:** `production` = `inttexsystem/inttracker` (fetch+push, `main`
  only); `origin` = `grupoterrabranca/controle-tapetes`; `staging` =
  `ravatexapps-dotcom/controle-tapetes-staging` (historical backup only). No
  branch other than `main` is pushed to `production`.
- **`main` is forbidden** as a working/target branch here; no push to
  `origin`/`staging` without separate express authorization.
- **Unauthorized (each a separate gate):** C3C-B implementation, C3D, staging
  application/validation, activation, deployment, real snapshot/import, fence
  transition, read switch, final ACL-closure invocation, cutover, C4, C5,
  production access, remote mutation, and push.

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
    phase contract, accepted with blocking database prerequisites — not active)
20. `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
    (C3C-B database prerequisites contract; `PHASE-C3C-B-DB-PREREQ` closed /
    technically accepted / local DB verified / not applied to staging
    database — §§35–37; `db/76` exists, DB-backed tests pass against an
    isolated disposable local cluster; not active)

> Bootstrap first through `docs/governance/AGENT_INSTRUCTIONS.md` and the
> `SPEC_CUSTODY_BOOTSTRAP` block in `PROJECT_STATE.md`. Private conversation,
> memory, and tool caches do not establish state or authorization.
