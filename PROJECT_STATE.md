# CANONICAL CURRENT STATE

This file is the **single owner of the current operational state**: active phase,
next authorizable action, binding decisions in force, live debts, environment
facts, and a concise index of closed phases. It does **not** hold historical
closeout narratives. Those are preserved, verbatim, in:

- the append-only ledger `docs/ledgers/G28_LEDGER.md` (full per-phase closeouts);
- `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (state closeouts moved by
  `PROJECT-STATE-COMPACTION-A`/`-B`, 2026-07-16/17);
- `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md` (the operational-handoff
  stack moved by `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1`, 2026-07-20).

HEAD / working tree / index / staging / divergence are live facts — consult Git
directly (`git rev-parse HEAD`, `git status --short --untracked-files=all`).

<!-- SPEC_CUSTODY_BOOTSTRAP:BEGIN -->
```text
LAST_ACCEPTED_PHASE: PHASE-C3C-A
ACTIVE_PHASE: NONE
ACTIVE_PHASE_CONTRACT: NONE
ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C
NEXT_AUTHORIZABLE_ACTION: PHASE-C3C-B-DB-PREREQ-SUPERVISOR-REVIEW
GOVERNING_SPEC: docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md
TECHNICAL_CONTRACT: docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md
SEQUENCE_AUTHORITY: docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md
TRACEABILITY: docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md
LEDGER: docs/ledgers/G28_LEDGER.md
HANDOFF: AGENT_HANDOFF.md
ACCEPTED_CHECKPOINT: dd631299f410027ebb23b006aa5e380ad460aefa
```
<!-- SPEC_CUSTODY_BOOTSTRAP:END -->

## Active phase and next action

- **Last accepted product phase:** `PHASE-C3C-A` — `CLOSED / TECHNICALLY
  ACCEPTED — LOCALLY VERIFIED / INACTIVE / NOT APPLIED TO STAGING` (2026-07-20),
  technical checkpoint `89123729b3529fff6e4a2336bfec2907c4b94b4c`. It supplies
  the inactive C3C database contract (state/fence, canonical snapshot/import/
  reconciliation, nullable normalized reader, receipt/reversal gates, session/
  resource locks, ACL-closure command, recovery boundaries). Lifecycle §R.29 and
  schema §13.15 are unchanged. Local technical acceptance only — no staging
  validation/application, deployment, activation, cutover, or product acceptance.
- **Active product phase:** `NONE`. **Active phase contract:** `NONE`.
- **Governance status:**
  - `GOVERNANCE-SPEC-CUSTODY-FOUNDATION-R1`: **ACCEPTED**.
  - `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1`: **ACCEPTED** by the supervisor at
    commit `1157b9e71bc629903c5940ab50d4b370964e560e` (`PROJECT_STATE.md`
    compacted to a current-state hub, `AGENT_HANDOFF.md` to a concise derived
    handoff, historical content preserved in tracked archives and the append-only
    ledger, no unique canonical evidence lost, validator PASS, self-tests 47/47
    PASS). Documentation-only: no product semantics, database, environment,
    deployment, remote, or push change.
  - `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1-CLOSEOUT`: this closeout records that
    acceptance and advances the next authorizable action.
  - `C3C-B-MATERIAL-PHASE-CONTRACT-R1`: a read-only supervisor review returned
    `CHANGES_REQUIRED`; the resulting forward correction (two database hard
    stops, a unified error policy, a supplier-reader disposition, and
    exact-manifest wording — recorded in
    `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §§0, 25–30) was
    **ACCEPTED** by the supervisor as `ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES
    / IMPLEMENTATION NOT AUTHORIZED` (§31 of that file). `PHASE-C3C-B`
    implementation remains unauthorized and is now additionally blocked pending
    a separate database-prerequisites contract.
  - `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT` (ratification closeout / R3
    documentary forward correction): an independent read-only premise audit
    confirmed the R2 architecture against the installed `db/67`–`db/75` objects
    and the live `js/screens/*` writers; the supervisor **ACCEPTED** it as
    `ACCEPTED_WITH_NONBLOCKING_DOCUMENTARY_DEBT / IMPLEMENTATION NOT YET
    AUTHORIZED` (§34 of
    `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`).
    Stale proposed-delta/rollback/requirement wording (authored in R1,
    superseded by R2) was reconciled append-only; the proposed
    mandatory-`UNMAPPED=0`-gate interpretation was **not** adopted (out of this
    contract's scope — a real-cutover/C3D completeness precondition). No SQL,
    implementation, migration, environment action, or normative-file change was
    made. `PHASE-C3C-B-DB-PREREQ` implementation remains a separate
    authorization.
  - `PHASE-C3C-B-DB-PREREQ` (implementation): **IMPLEMENTED / LOCALLY VERIFIED /
    AWAITING SUPERVISOR ACCEPTANCE** (2026-07-20). The architect authorized
    implementation; `db/76_ordem_compra_c3c_b_db_prerequisites.sql` now exists —
    Component A (`listar_ordens_compra_fio_compat`) and Component B
    (`registrar_recebimento_ordem_compra_fio_compat`), both **installed inert and
    active only under `canonical_active`**, plus one additive
    `idempotency_namespace` `CHECK` extension (no bridge, no backfill, no
    `db/67`/`db/75` change). The corrected `§R.29.7`/`§13.18` normative deltas
    (contract §34.2/§34.3) were applied. An implementation-time material finding —
    the installed `trg_native_lancamento_shape_guard` couples `comando_tipo` to
    each ledger line's `tipo` — was resolved by an **architect ruling (contract
    §35)**: legacy-compat receipts reuse the native command types
    (`recebimento`/`estorno`), carry compat identity solely in
    `idempotency_namespace='legacy_compat_receipt_v1'`, introduce no
    `recebimento_compat`, and leave the `comando_tipo` `CHECK` and the shape guard
    unchanged. Local verification: the new static smoke suite plus the static-smoke
    regressions PASS (49/49); the validator and `git diff --check`s are clean. The
    two DB-backed tests (`…integration.sql`, `…concurrency.mjs`) and the DB-backed
    C3C-A regressions are authored to §34.4 but **not executed** — the local
    PostgreSQL 18.4 cluster crash-loops on startup (Windows shared-memory
    reservation failure), reported as unavailable, not inferred. Supabase was not
    used (out of this phase's `LOCAL_ONLY` scope). The phase is **not accepted**;
    no dependent C3C-B requirement is `SATISFIED`; `ACTIVE_PHASE`/
    `ACTIVE_PHASE_CONTRACT` remain `NONE`.
- **NEXT_AUTHORIZABLE_ACTION:** `PHASE-C3C-B-DB-PREREQ-SUPERVISOR-REVIEW`.
  A read-only supervisor review of the implemented `PHASE-C3C-B-DB-PREREQ`
  (migration `db/76`, three tests, applied `§R.29.7`/`§13.18`, contract §35
  ruling, closeout) precedes any acceptance. Only after supervisor acceptance —
  and separately authorized staging validation/application — does the later
  `PHASE-C3C-B` application-adaptation lot become authorizable. **No product
  phase chains automatically**; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain
  `NONE`. Staging application, deployment, activation, real snapshot/import,
  cutover, and push beyond the authorized `staging/dev` fast-forward remain
  unauthorized.

## Workspace and Git boundaries

- **Workspace:** `D:\Programação\controle-tapetes-g28`.
- **Standalone git directory:** `D:\Programação\controle-tapetes-g28\.git`
  (a normal repository — not a linked worktree; the earlier "linked worktree of
  controle-tapetes/.git" and `D:\OneDrive\...` topology facts are superseded).
- **Branch:** `dev`. **Allowed remote:** `production`, `dev` branch push is a
  standing remote-backup authorization from `ORDEM-COMPRA-PHASE-A`; `main`
  remains forbidden; no push to `origin`/`staging` without separate express
  authorization. **No push is authorized by the current action.**
- **Current Git residue:** modified `.gitignore` only (pre-existing, preserved,
  unstaged).

## Environment and production/staging state

- **PRODUCTION (live since `M10`, 2026-07-18):** Supabase `gqmpsxkxynrjvidfmojk`
  ("Inttex"), served by Vercel at `inttracker-jade.vercel.app` from
  `inttexsystem/inttracker` (`main`). Schema (`db/01→64`), migrated data,
  deployed Edge Functions, repointed `js/config.js`, and repointed Ingestor are
  in place.
- **DEVELOPMENT / legacy (formerly "staging"):** `ucrjtfswnfdlxwtmxnoo` —
  retained development database; historical record for the audit trails/test
  rows excluded at `M3` (must not be pruned without a separate architect
  decision). Purchase-order phases through F3R1 were validated here.
- **PROHIBITED / never accessed:** production `bhgifjrfagkzubpyqpew`.
- **Migrations `db/71`–`db/74`** applied and verified in `ucrjtfswnfdlxwtmxnoo`;
  **`db/75` (C3C-A)** is locally verified only, **inactive, not applied to
  staging**. The staging-only stack (`db/12`/`21`/`30`/`49`–`57`) is not applied
  in production by this chain.
- **Supabase MCP:** verified read-only against `gqmpsxkxynrjvidfmojk`; the
  legacy management-scoped credential is still write-capable from `M2`/`M3` —
  **standing reminder: flip back to read-only.**
- **Remotes:** `production` = `inttexsystem/inttracker` (fetch+push, `main`
  only); `origin` = `grupoterrabranca/controle-tapetes`; `staging` =
  `ravatexapps-dotcom/controle-tapetes-staging` (historical backup only).

## POST-LAUNCH DEBT REGISTER (ranked; each `NOT AUTHORIZED` until its own order)

The system is live; every item is `POST-LAUNCH DEBT`. Ranked by production
consequence (1 = most consequential). Full narratives: ledger and archives.

1. **`INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` — `ACTIVE PRODUCTION BLOCKER`.**
   Ingestor Google OAuth token expired (`invalid_grant`); no documents enter the
   live system. Fix = interactive Google login (architect action); coupled to #7.
2. **`CAMADA3 BK5-BK8` — no proven production backup.** Exporter manual, proven
   once in staging (`BK4.2`); `M9` never executed; no trigger/retention/restore
   drill. Includes `CAMADA3-TRIGGER-SELECTION` (mechanism: GitHub Actions).
3. **`DELETE-PROD-GUARD-A`** — destructive-delete guard not deployed to production.
4. **`A2-SERVER-SIDE-ENFORCEMENT`** — `nivel_acesso` is client-side only.
   **Binding mitigation:** no `somente_leitura` admin may exist in production
   until this closes.
5. **`A2-CREATE-NIVEL-ACESSO-WIRING`** — `admin-create-user` drops `nivel_acesso`
   (companion to #4; moot only under #4's constraint).
6. **`ANON-GRANT-DEFENSE-IN-DEPTH`** — 27 non-document tables carry raw anon DML
   grants, inert only because RLS evaluates false for anon. Distinct from #8.
7. **`CAMADA3-OAUTH-GRANT-COUPLING`** — backup exporter reuses the Ingestor OAuth
   client; interacts with #1.
8. **`IS-ADMIN-ACL-REVIEW`** — over-broad `EXECUTE` on `public.is_admin()`; not a
   live exposure; needs its own read-only diagnosis.
9. **`CODE-HEALTH-AUDIT-§18-R1`** — accumulated small code-health debts; also
   tracks `UI-EL-BOOLEAN-ATTR-FIX` (active `js/ui.js` `el()` boolean-attr regression).
10. **`TEST-MOCK-FIDELITY`** — residual lots beyond `L1`/`L2` (audit `CLOSED`).
11-13. Cosmetic/frozen UI items: `UI-FIXED-FORMAT-COLUMN-WIDTHS`,
    `UI-ACTION-BUTTON` lot 3, `MODAL-BUTTON-CSS-CHECK`.
14. **Two stale git-worktree registrations** (`tapetes-baseline-check`,
    `baseline-check-a34`) — prunable; auto-prune blocked by an OneDrive/AV lock;
    await one authorized `git worktree prune`.

- **Purchase-order Phase-C open items:** `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`
  (nonblocking); `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`; native
  emission inactive/ungranted; a contemporaneous read-only production
  `ordens_compra_fio` diagnosis is mandatory before any production promotion.
- **Registered for review (read-only):** `production` remote branch
  `v0/administrativointtex-9166-cf89b1d8` — a strict ancestor of `main` with zero
  unique commits (Vercel/v0 import artifact); safe to leave or delete.

## Binding decisions in force (condensed; verbatim in archive/ledger)

Full recorded rulings are verbatim in `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`
and `docs/ledgers/G28_LEDGER.md`; in any wording divergence the archive/ledger win.

- **Key regime:** new-format keys only (`sb_publishable_…` + matching secret);
  the secret key never appears in chat or the repo.
- **Launch user model:** full-trust admins only — no `somente_leitura` admin in
  production until `A2-SERVER-SIDE-ENFORCEMENT` closes (the constraint IS the
  mitigation).
- **`PRODUCTION-READINESS-DIAGNOSIS-R1`** accepted (2026-07-17); its `M0`-`M10`
  plan was executed and the migration track is `COMPLETE / CLOSED` (2026-07-18);
  the backlog freeze is `LIFTED` — new fronts are authorizable, each by its own order.
- **Supervision governance:** state/authorizations held by Claude (chat) + Claude
  Code (resident); reviewers hold no state custody. Every implementation-phase
  report includes `STRUCTURAL POLICY COMPLIANCE` (`SUPERVISION_PROTOCOL.md`).
- **Controlled Delete × document history:** physical Pedido/OP deletion is blocked
  when canonical document history exists (`PEDIDO_OP_SCHEMA_CONTRACT.md`).
- **Language policy:** English for canonical docs/reports/new code + commit
  messages; pt-BR for UI text; architect orders may be issued in Portuguese and
  recorded in English (original preserved in ledger/archive); phase IDs never
  translated. Homes: `DOCUMENTATION_MODEL.md` §18, `CODE_HEALTH_RULES.md` §19,
  `SUPERVISION_PROTOCOL.md` §3.
- **Standing product decision (open):** `YARN-MANTER-PEDIDO-REDUNDANCY` — architect
  to decide keep-or-remove of the `Manter pedido` button; non-blocking.

## Product and environment prohibitions

`PHASE-C3C-B-DB-PREREQ` implementation (migration `db/76`, three tests, applied
`§R.29.7`/`§13.18`, contract §35) is **done and locally verified but not
accepted** — it awaits `PHASE-C3C-B-DB-PREREQ-SUPERVISOR-REVIEW`. Beyond that
single authorized implementation and its one authorized fast-forward push to
`staging/dev`, no product implementation, migration, application, validator,
lifecycle/schema semantic, or traceability change is authorized. C3C-B
application implementation, C3D, staging application/validation, activation,
deployment, real snapshot/import, fence transition, read switch, final
ACL-closure invocation, cutover, C4, C5, production access, Supabase writes,
`main`, `origin`/`production` remote mutation, and any further push all remain
**UNAUTHORIZED**. Production `bhgifjrfagkzubpyqpew` must not be accessed.

## Accepted-phase index (concise)

Full closeout narratives are in `docs/ledgers/G28_LEDGER.md` and the archives.
Commit SHAs there are the accepted technical commits; consult HEAD via Git.

### Purchase-order refoundation + Phase-C + governance track

| Phase | Status | Date |
|---|---|---|
| `PHASE-C3C-B-DB-PREREQ` (implementation, `db/76` + 3 tests + `§R.29.7`/`§13.18` + contract §35 ruling) | `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE` | 2026-07-20 |
| `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT` (ratification closeout / R3 documentary forward correction, §34) | `ACCEPTED_WITH_NONBLOCKING_DOCUMENTARY_DEBT / IMPLEMENTATION NOT YET AUTHORIZED` | 2026-07-20 |
| `C3C-B-MATERIAL-PHASE-CONTRACT-R1` (forward correction, commit `6585a6c`) | `ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES / IMPLEMENTATION NOT AUTHORIZED` | 2026-07-20 |
| `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1` (accepted commit `1157b9e`) | `CLOSED / ACCEPTED` | 2026-07-20 |
| `GOVERNANCE-SPEC-CUSTODY-FOUNDATION-R1` | `CLOSED / ACCEPTED` | 2026-07-20 |
| `PHASE-C3C-A` (inactive impl. documentary closeout R1, `db/75`, R2-R4) | `CLOSED / TECHNICALLY ACCEPTED — LOCALLY VERIFIED / INACTIVE / NOT APPLIED TO STAGING` | 2026-07-20 |
| `PHASE-C3B` executable contract closure R1 (§R.29 / §13.15) | `CLOSED / ACCEPTED` | 2026-07-19 |
| Hybrid Origin — `F3R1` staging DB/API validation + Phase-C revalidation (`db/74`) | `CLOSED / ACCEPTED_WITH_SCOPED_COMMITTED_CONCURRENCY_FIXTURE_WAIVER` | 2026-07-19 |
| Hybrid Origin — `F2` Pedido/Insumos UI cutover R1 | `CLOSED / ACCEPTED_LOCALLY_WITH_INTEGRATED_STAGING_VALIDATION_REQUIRED` | 2026-07-19 |
| Hybrid Origin — `F1` forward correction implementation R1 (`db/74`) | `CLOSED / ACCEPTED_WITH_NONBLOCKING_BASELINE_TEST_DEBT` | 2026-07-19 |
| Hybrid Origin — `F1` executable contract closure R1 (§R.28 / §13) | `CLOSED / ACCEPTED` | 2026-07-19 |
| Hybrid Origin — Canonical Documentation Correction R2 (§R.27) | `CLOSED / ACCEPTED` | 2026-07-19 |
| `PHASE-C3A` (inactive cutover foundation + import, `db/71`-`db/73`) | `CLOSED / TECHNICALLY ACCEPTED` | 2026-07-19 |
| `PHASE-C2` native receipt foundation (`db/70`, §R.25) | `CLOSED / ACCEPTED` | 2026-07-19 |
| `PHASE-C1` native receipt authority contract (§R.24) | `CLOSED / ACCEPTED` | 2026-07-19 |
| `PRE-PROD-A-R1` native needs/allocation + live concurrency (`db/69`, §R.23) | `CLOSED / ACCEPTED_WITH_NONBLOCKING_ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT` | 2026-07-19 |
| `REFUND-B1` native draft admin (`db/68`, §R.22) | `CLOSED / ACCEPTED_WITH_RECORDED_FUTURE_GATES` | 2026-07-19 |
| `REFUND-B1-CONTRACT-R2` (authorized) / `-R1` (not accepted, superseded) | `AUTHORIZED` / `SUPERSEDED` | 2026-07-19 |
| `REFUND-A` four-layer refoundation schema + conversion (`db/67`) | `CLOSED / ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT` | 2026-07-19 |
| `ORDEM-COMPRA REFOUNDATION` — Part R (four-layer model) | `RATIFIED / ACCEPTED` | 2026-07-18 |

### Earlier tracks (indexed; full detail in ledger/archives)

| Track | Status | Date |
|---|---|---|
| Purchase Order Lifecycle (flat) — Phases `A` (`db/65`) + `B1` (`db/66`) + Spec Amendment | `CLOSED / ACCEPTED` (persistence superseded by REFUND-A) | 2026-07-18 |
| `ORDEM-COMPRA-LIFECYCLE-SPEC-RATIFICATION-R1` | `RATIFIED` | 2026-07-18 |
| `YARN-BUTTONS-PHASE-1` (+ corrections) | `CLOSED / ACCEPTED` | 2026-07-18 |
| `G28-MIGRATION-TRACK` `M0`-`M10` (live at Vercel/`gqmpsxkxynrjvidfmojk`) | `COMPLETE / CLOSED`; `M7`/`M9` `SUPERSEDED BY REALITY` | 2026-07-17/18 |
| `PRODUCTION-READINESS-DIAGNOSIS-R1` (ratified reference report) | `ACCEPTED` | 2026-07-17 |
| `G28-CAMADA-3` (`BK1`-`BK4.2`; `BK5`-`BK8` = post-launch debt) | `CLOSED / ACCEPTED` at `BK4.2` | 2026-07-17 |
| `G28-CAMADA-2` (`A1`-`A7` + password policy) | `TRACK COMPLETE / CLOSED / ACCEPTED` | 2026-07-17 |
| `TEST-MOCK-FIDELITY-AUDIT`, `L1`/`L2` | `CLOSED / ACCEPTED` | 2026-07-17 |
| `DOC-LANGUAGE-MIGRATION-L1`/`L2`/`L3`, `PROJECT-STATE-COMPACTION-A`/`B` | `CLOSED / ACCEPTED` | 2026-07-16/17 |
| `G28-C` (documents front) | `CLOSED / TECHNICALLY ACCEPTED — PRODUCT VALIDATION PENDING` | 2026-07-15 |
| Client Portal read-model + ACL grants (`db/30`/`db/57`), Controlled Delete guard (`db/53`-`db/56`) | `CLOSED / ACCEPTED` | 2026-07-15 |
| `PROJECT-CONTROL-BASELINE-R1` (ChatGPT) | `REJECTED / NOT RATIFIED` | 2026-07-15 |
| 2026-07-16 and earlier phases (Camada-2 subphases, UI tracks, docs) | mixed `CLOSED / ACCEPTED` — see ledger/archives | 2026-07 |

## Governing specifications and canonical paths

- Governing spec (Phase-C3 §R.29 core unchanged; `§R.29.7` legacy-compat DB prerequisites applied 2026-07-20): `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
- Technical contract (§13.15 unchanged; `§13.18` legacy-compat receipt-adapter schema applied 2026-07-20): `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
- Sequence authority: `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
- Active-track traceability: `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
- C3C-B material phase contract (accepted with blocking database prerequisites,
  not active): `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`
- C3C-B database prerequisites contract (implemented / locally verified / awaiting supervisor acceptance; §35 records the implementation closeout, not active): `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
- Append-only ledger: `docs/ledgers/G28_LEDGER.md`
- Derived operational handoff: `AGENT_HANDOFF.md`
- Documentation authority arbiter: `docs/DOCUMENTATION_INDEX.md`
- Documentation governance model: `docs/governance/DOCUMENTATION_MODEL.md`
- Supervision protocol: `docs/governance/SUPERVISION_PROTOCOL.md`
- Shared agent instructions: `docs/governance/AGENT_INSTRUCTIONS.md`
- Master plan (documents front): `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
- Pedido/OP/Movimentação/Documentos plan: `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
- Migration diagnosis (accepted reference): `docs/reports/PRODUCTION_READINESS_DIAGNOSIS_R1_2026-07-17.md`
- Backup contract: `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`
- Ingestor local state (technical context): `services/documents-ingestor/PROJECT_STATE.md`

## Historical reference (not sources of current state)

- Handoff stack archive: `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md`
- State closeout archive: `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`
- Pre-model preservation: `docs/legacy/pre-model/MANIFEST.md`
- pt-BR pre-translation original: `docs/archive/pt-BR/PROJECT_STATE.md`

The complete pre-first-compaction content is preserved byte-for-byte in
`docs/legacy/pre-model/PROJECT_STATE_FULL_SNAPSHOT.md` (manifest
`docs/legacy/pre-model/MANIFEST.md`; origin commit
`08b9af5e251de48e938600e5e4b4214e4d1e824e`; SHA-256
`7cacddd59c5b2fe9bae1add1a54a3433c370ccdad713bbd4010a1d11f1b39a98`). That
snapshot is not a source of current state and must not be edited.
