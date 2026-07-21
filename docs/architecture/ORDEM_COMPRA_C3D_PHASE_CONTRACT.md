# PHASE-C3D Material Phase Contract — Inactive Deployment & Rehearsal

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: PHASE-C3D
<!-- MATERIAL_PHASE_CONTRACT:END -->
STATUS: PROPOSED / AWAITING SUPERVISOR ACCEPTANCE / IMPLEMENTATION NOT AUTHORIZED

> **Role of this document.** This is a **material phase contract**, authored
> under `docs/governance/DOCUMENTATION_MODEL.md` §19 and
> `docs/governance/AGENT_INSTRUCTIONS.md` §3/§6, by architect order
> `docs: accept C3C-B and define C3D contract` (documentation-only + read-only
> diagnosis). It binds the four already-ratified `PHASE-C3D` requirement IDs
> (`OC-C3D-DEPLOY-001`, `OC-C3D-FENCE-001`, `OC-C3D-ACL-001`, `OC-C3D-LOCK-001`)
> to an exact rehearsal scope, sublot sequence, environment strategy, entry/exit
> gates, test matrix, recovery model, future manifests, and mandatory supervisor
> decisions. It **creates no new requirement**, changes **no normative anchor**,
> and authorizes **no implementation, no migration, no environment mutation, no
> deployment, no activation, and no cutover**. `PROJECT_STATE.md` remains the
> sole owner of `ACTIVE_PHASE` / `ACTIVE_PHASE_CONTRACT`; both remain `NONE`
> after this document is committed. This contract becomes actionable only when
> the architect separately authorizes `PHASE-C3D` (or one of its sublots) and
> sets `ACTIVE_PHASE_CONTRACT` to this file's path.

## 1. Authorization source and entry checkpoint

- **Authorization source for this authoring pass:** architect order
  `docs: accept C3C-B and define C3D contract`, executed as a
  documentation-only + read-only-diagnosis pass under
  `docs/governance/AGENT_INSTRUCTIONS.md`. This order authorizes recording
  `PHASE-C3C-B` supervisor acceptance and **authoring** this contract; it does
  **not** authorize `PHASE-C3D` implementation, any migration, branch creation,
  deployment, or environment action.
- **Entry checkpoint (Git):** branch `dev`, HEAD at authoring time
  `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`, `staging/dev` equal to HEAD,
  preserved residue exactly: modified `.gitignore` (unstaged), untracked
  `.mcp.json`, untracked `.codex/config.toml` — none touched by this pass.
- **Last accepted product phase:** `PHASE-C3C-B` —
  `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`, accepted
  checkpoint `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §36).
- **Active product phase at authoring time:** `NONE`. **Active phase contract at
  authoring time:** `NONE`. This document changes neither.

## 2. Dependencies (documents and objects this contract reads and binds to)

- `docs/governance/AGENT_INSTRUCTIONS.md` — bootstrap/evidence/safety authority.
- `PROJECT_STATE.md` — `SPEC_CUSTODY_BOOTSTRAP` block; current-state owner.
- `docs/DOCUMENTATION_INDEX.md`, `docs/governance/DOCUMENTATION_MODEL.md`,
  `docs/governance/SUPERVISION_PROTOCOL.md` — documentary/supervision authority.
- `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` §R.29 (governing
  spec, unchanged) and §R.31 (requirement registry, unchanged).
- `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` §13.15 (executable contract,
  unchanged), §13.15.2 (effective ACL closure — `OC-C3D-ACL-001` anchor), and
  §13.17 (schema requirement registry, unchanged).
- `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` — active-track
  traceability (derived; updated by the acceptance pass, no architecture
  created).
- `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` — the accepted
  application-adapter layer whose canonical branches C3D rehearses.
- `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md` — the
  accepted `db/76` design and the applied-inert development-database record
  (§§35–39).
- `db/75_ordem_compra_c3c_inactive_cutover.sql` — the inactive C3C-A database
  contract this phase rehearses (cutover singleton, fence, snapshot/import/
  reconciliation, locks, ACL-closure command, recovery). **Read-only reference;
  not modified or reasoned about as pending by this contract.**
- `db/76_ordem_compra_c3c_b_db_prerequisites.sql` — Component A/B, inert until
  `canonical_active`. **Read-only reference; not modified.**
- `tests/ordem-compra-c3c-inactive.integration.sql`,
  `tests/ordem-compra-c3c-inactive-concurrency.mjs`,
  `tests/ordem-compra-c3c-b-db-prerequisites.integration.sql`,
  `tests/ordem-compra-c3c-b-db-prerequisites-concurrency.mjs` — the DB-backed
  test shapes C3D's rehearsal test matrix extends.

## 3. Governing specifications and normative anchors (no new requirement)

This contract binds **exactly** four already-ratified requirement IDs and
creates none. Anchors are quoted from the ratified registries
(`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` §R.31,
`PEDIDO_OP_SCHEMA_CONTRACT.md` §13.17) and are unchanged by this contract:

| REQUIREMENT_ID | NORMATIVE_ANCHOR | OWNING_PHASE | RATIFIED REQUIREMENT TEXT |
|---|---|---|---|
| `OC-C3D-DEPLOY-001` | `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29` | `C3D` | Limit C3D to rehearsal and inactive staging deployment preparation. |
| `OC-C3D-FENCE-001` | `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.3` | `C3D` | Prove admin and matching-supplier fence denial with unchanged hashes. |
| `OC-C3D-ACL-001` | `PEDIDO_OP_SCHEMA_CONTRACT.md::13.15.2` | `C3D` | Rehearse the complete effective ACL closure across table privileges, column privileges, sequences, functions, and RLS policies without invoking the real final closure. |
| `OC-C3D-LOCK-001` | `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.5` | `C3D` | Prove session exclusion, deterministic resource locks, short transactions, and release. |

Additional governing clauses (read, not amended): §R.29 package table (C3D =
"Deployment manifest, rehearsal procedures and empirical fence/role-matrix proof
against isolated rehearsal scope; no real cutover state change, import, or ACL
closure"); §R.29.4 (snapshot/import/reconciliation — **real-cutover territory,
excluded here**); §R.29.6 (rollback/recovery/UI boundary — "C3 creates no visual
UI"); §R.29.7 (legacy-compat DB prerequisites, applied). §R.30/§13.16 record the
C3C-A local acceptance whose objects C3D rehearses.

## A. Objective

Prove, in an **isolated rehearsal environment**, that the accepted inactive
stack — application artifact `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f` plus
`db/75` plus `db/76` — deploys and behaves correctly with respect to
**deployment presence/idempotency**, the **database-owned fence**, the
**effective ACL closure**, and the **session/resource lock discipline**, **without
performing a real cutover**. The empirical results are the missing evidence for
the four `OC-C3D-*` requirements that `db/75`/`db/76` static/local acceptance
could not by themselves supply.

C3D does **not** flip the shared production or development database to
`canonical_active`, does **not** import real data, does **not** invoke the
irreversible final ACL closure, does **not** cross the PONR, and does **not**
build UI. It prepares and rehearses; it does not cut over.

## B. Explicit exclusions

`PHASE-C3D` **excludes** (each remains its own, separately unauthorized gate):

- canonical activation (`ordem_compra_c3c_activate`) of any real environment;
- real snapshot/import/reconciliation (`ordem_compra_c3c_fence_and_snapshot`,
  `ordem_compra_c3c_import_and_reconcile`) against real data;
- the real read-authority switch (`ordem_compra_c3c_set_canonical_read`) on a
  real environment;
- productive receipts (any successful non-import
  `registrar_recebimento_ordem_compra` /
  `registrar_recebimento_ordem_compra_fio_compat` on a real environment) — these
  set `productive_receipt_started_at` (the PONR);
- **invocation** of the final ACL closure `ordem_compra_c3c_close_final_acl`
  (irreversible) — C3D **rehearses** the effective closure by non-invoking
  inspection only (§G/§H);
- PONR crossing and any post-PONR operation;
- C4 UI (`#/ordens-compra/:id` admin receipt UI, `OC-C4-ADMIN-001`);
- C5 native emission (`OC-C5-EMISSION-001`);
- production deployment or any access to production `gqmpsxkxynrjvidfmojk` or
  prohibited `bhgifjrfagkzubpyqpew`;
- the real cutover window (`OC-CUTOVER-001` / `OC-CUTOVER-PONR-001`).

## C. Exact phase decomposition (smallest independently reviewable sublots)

Reconciled against the §R.29 package model and the four requirements, the
smallest justified sequence is **six sublots**. Each is independently
reviewable, independently reversible (§H), and maps to a specific requirement or
to the deployment/closeout envelope. The proposed labels below are **proposals
for supervisor ratification**, not self-authorized phases; no sublot chains
automatically.

| Sublot | Scope | Primary requirement(s) | Independently reversible by |
|---|---|---|---|
| **C3D-A** — Environment & deployment-manifest qualification | Establish and prove the isolated rehearsal environment (§D); assemble the exact inactive deployment manifest (app artifact `22bfb192` + `db/75` + `db/76`); no state change. | `OC-C3D-DEPLOY-001` | Environment teardown (disposable cluster) / no-op (read-only shared-DB inspection). |
| **C3D-B** — Inactive migration/application presence validation | Prove `db/75`/`db/76` present and idempotent in the rehearsal environment; prove both new functions inert (inactive signals) while `legacy_active`; prove the application adapter's flat fallback path is byte-identical to pre-phase. | `OC-C3D-DEPLOY-001` | Transaction rollback / environment teardown. |
| **C3D-C** — Fence & rollback rehearsal | Empirically prove protected-table fence denial (`legacy_receipt_fenced`) via the real authorized admin path and a matching-supplier path, with unchanged source/inventory hashes; rehearse pre-PONR rollback. | `OC-C3D-FENCE-001` | Pre-PONR rollback + transaction rollback / environment reset. |
| **C3D-D** — ACL / role-matrix rehearsal | Rehearse the complete effective ACL closure (table/column/sequence/function/RLS) **without invoking** `ordem_compra_c3c_close_final_acl`; exercise the full role matrix (§G). | `OC-C3D-ACL-001` | No-op (inspection-only) / transaction rollback. |
| **C3D-E** — Concurrency / session / resource-lock rehearsal | Prove session advisory-lock exclusion, deterministic resource-lock order, short transactions, release/reacquire; concurrent receipt/reversal behavior of Component B under lock. | `OC-C3D-LOCK-001` | Transaction rollback / environment reset. |
| **C3D-F** — Closeout & readiness disposition | Aggregate evidence, prove zero business-data mutation on any shared environment, disposition the 13 unmapped rows for real cutover (§F), record readiness; mark no requirement `SATISFIED` beyond empirical proof. | all four (closeout) | Documentation-only. |

`OC-C3D-DEPLOY-001` spans C3D-A and C3D-B; `OC-C3D-FENCE-001` is C3D-C;
`OC-C3D-ACL-001` is C3D-D; `OC-C3D-LOCK-001` is C3D-E; C3D-F is the closeout.
The order in which C3D-C/D/E run after C3D-B is a supervisor decision (§J); they
are independent given a clean rehearsal environment.

## D. Exact environment strategy (mandatory supervisor decision — §J)

**No true staging database exists.** The real environment taxonomy (§ Environment
taxonomy, `PROJECT_STATE.md`, `docs/operations/PARALLEL_ENVIRONMENT_RECONCILIATION.md`)
is: production `gqmpsxkxynrjvidfmojk` (live, Vercel; `db/75`/`db/76` **not
applied**; excluded, §B); development/legacy `ucrjtfswnfdlxwtmxnoo` (formerly
"staging"; `db/75`/`db/76` applied **inert**; a **shared** database holding the
real historical corpus); prohibited/legacy `bhgifjrfagkzubpyqpew` (never
accessed). The Git remote named `staging`
(`ravatexapps-dotcom/controle-tapetes-staging`) is a **code backup remote, not a
database staging environment** — the terminology must not be conflated.

Because the only real database carrying `db/75`/`db/76` is the **shared**
development database, and because `db/75`'s fence/snapshot/import/activation/
ACL-closure commands mutate shared business data and cross the PONR, **this
contract does not authorize any state-changing rehearsal against
`ucrjtfswnfdlxwtmxnoo`.** Presence of migrations 75/76 there is not a license to
rehearse there.

The proposed strategy (for supervisor selection) is **Option 2 (recommended)**:

- **Option 1 — isolated Supabase development branch.** A branch of
  `ucrjtfswnfdlxwtmxnoo` would give a Supabase-faithful, disposable copy for
  state-changing rehearsals. **Branch existence is `UNPROVEN`** (§ Supabase
  read-only diagnostics): neither authorized read-only MCP path could enumerate
  branches. This contract does **not** assume a branch exists and does **not**
  create one. Electing Option 1 requires a **separate architect authorization to
  create a branch** (a paid, mutating operation) — a mandatory supervisor
  decision (§J), not granted here.
- **Option 2 (recommended) — disposable isolated local PostgreSQL, plus a
  separately-scoped read-only proof against `ucrjtfswnfdlxwtmxnoo`.** A
  disposable local PostgreSQL 18.4 cluster (initdb/pg_ctl into a fresh temp data
  directory, distinct port, outside the repository and the host's broken
  cluster) is the **proven-available** isolated environment — it successfully
  ran the C3C-B DB-backed tests, a persisted rollback rehearsal, and reapply
  (`ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md` §36). All
  **state-changing** C3D rehearsals (fence denial, ACL rehearsal, lock/
  concurrency, pre-PONR rollback, Component B under `canonical_active`) run
  **only** in this disposable cluster against a synthetic-but-classification-
  faithful corpus. A **separately-scoped, read-only** proof against the shared
  `ucrjtfswnfdlxwtmxnoo` is limited to **non-mutating inspection** (migration
  presence, inert-signal confirmation, pre/post fingerprints) and never runs
  fence/snapshot/import/activation/ACL-closure there.
  - **Known limitation (bind explicitly):** the exact-totals reconciliation
    proof (`§R.29.4`: 39 headers / 44 lines / 20,221.280 kg / 405.980 kg excess)
    and `db/75`'s `IF v_source_count <> 51` fence guard depend on the **real
    historical corpus** and cannot be reproduced by a classification-shape-only
    synthetic fixture (`§36.6`). Those specific proofs are **real-cutover
    rehearsal** items, not C3D-authorizable against a synthetic corpus, and are
    reported as **unavailable** rather than inferred if attempted locally.
- **Option 3 — another already-existing isolated environment.** None is proven
  to exist. If the supervisor names one, its identity and isolation must be
  proven before any state-changing rehearsal.
- **Option 4 — HARD STOP pending creation of a safe environment.** If neither a
  disposable local cluster nor an authorized isolated Supabase branch can be
  established, C3D implementation **stops** pending an explicit environment
  authorization.

## E. Entry and exit gates for every sublot

Each sublot's implementation order must, at **entry**, capture and, at **exit**,
re-verify and record:

1. **Git checkpoint** — branch `dev`, exact HEAD, index empty, and the exact
   preserved residue (`.gitignore` modified, `.mcp.json` untracked,
   `.codex/config.toml` untracked); HARD STOP on any divergence.
2. **Migration-history checkpoint** — the rehearsal environment's migration
   history ends `74 → 75 → 76` (or, for a fresh disposable cluster, the full
   applied `db/01…db/76` sequence); no unexpected version.
3. **Database-state fingerprint** — schema object inventory (functions,
   triggers, constraints, policies) of the rehearsal environment before and
   after.
4. **Cutover singleton state** — `ordem_compra_cutover` (id=1): `status`,
   `read_authority`, `reconciliation_status`, `cutover_generation`, and every
   snapshot/import/final-ACL/activation/`productive_receipt_started_at` marker.
   On any **shared**-DB inspection this must read `legacy_active` / `flat` /
   `not_started` / all-null before and after (zero change); HARD STOP otherwise.
5. **Role/ACL state** — the effective grants/policies on the protected tables,
   sequences, and functions (§13.15.2 matrix) before and after.
6. **Business-data fingerprints** — the seven business-table fingerprints
   (`ordens_compra_fio`, `ordem_compra`, `ordem_compra_item`,
   `ordem_compra_item_alocacao`, `ordem_compra_item_compat_fio`,
   `necessidade_compra_fio`, `saldo_fios`) plus the receipt/ledger/movement
   tables; on any shared environment these must be byte-for-byte identical
   before and after (zero mutation); HARD STOP otherwise.
7. **Active sessions/locks** — `pg_locks`/`pg_stat_activity` advisory-lock and
   blocking-pid snapshot; no leaked advisory lock, no open transaction across
   probes, an idle final backend.
8. **Rollback boundary** — the exact reversal the sublot relies on (§H): pre-PONR
   rollback, transaction rollback, or environment reset; proven available before
   any state change.
9. **Mandatory evidence** — the specific proofs in §G for that sublot.
10. **Hard stops** — §J's decisions unresolved; any exclusion (§B) reached; the
    shared DB's cutover singleton or business fingerprints changed; PONR
    approached; environment identity unproven.

## F. Fixed-corpus disposition (51 mapped / 13 unmapped) by stage

The development database holds **64** legacy `ordens_compra_fio` rows: **51**
carry a `ordem_compra_item_compat_fio` mapping (the frozen REFUND-A corpus the
`db/75` cutover migrates), **13** are unmapped (ids **153–165**, all
`rascunho`/`pendente`/`nao_recebido`, `kg_recebido` null, OPs 97/98/99;
empirically re-confirmed by read-only SELECT during this pass). The 13 are bound
explicitly and are **not** treated as uniformly blocking nor uniformly harmless:

| Stage | 51 mapped | 13 unmapped disposition |
|---|---|---|
| **Inactive deployment rehearsal** (C3D-A/B) | Deployed inert; Component A projects only mapped rows. | **Not blocking.** Already deployed inert with the 13 present; the 13 remain visible only through the flat fallback while `legacy_active`; Component A never returns them (no mapping). |
| **Maintenance-fence rehearsal** (C3D-C) | Snapshot anchors on the 51 mappings; `db/75`'s `IF v_source_count <> 51` guard passes. | **Not blocking the fence transition** (the guard counts the 51 mappings, not flat rows), but the 13 would be **outside** the frozen canonical corpus — a completeness gap surfaced here, not resolved here. |
| **Canonical-active rehearsal** (C3D-C/E, disposable cluster only) | Component A/B operate on mapped rows. | **Invisible to Component A** (unmapped) — a `mapeamento_compat_ausente` on any attempted compat write. Surfaced as a completeness finding; does not block the fence/lock/ACL proofs. |
| **Real-cutover completeness** (owned by real cutover, **not C3D**) | — | **Must be dispositioned before real cutover**: an authorized backfill/re-baseline that maps them, or a documented exclusion, based on the future read-only `ordens_compra_fio` diagnosis (`PROJECT_STATE.md` Phase-C open items; `ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md` §34.6). C3D creates no bridge, backfill, or mapping row. |

Classification for C3D: **DOCUMENTARY** (a real-cutover/C3D completeness finding,
consistent with `§34.5`/`§34.6`/`§38.5`/`§39.3`). Whether C3D's closeout (C3D-F)
must additionally require the completeness disposition, or defer it entirely to
real cutover, is a mandatory supervisor decision (§J).

## G. Test matrix

Each proof runs in the isolated environment selected in §D (state-changing
proofs never on the shared DB). The rehearsal test files are named in §I.

1. **Migration presence & idempotency** — `db/75`/`db/76` present; reapply of
   `db/76` (additive `CHECK` `DROP/ADD`, no function `CREATE OR REPLACE` clash)
   converges with no error, no duplicate constraint.
2. **Inactive reader/writer signals** — while `legacy_active`/`flat`:
   `listar_ordens_compra_fio_compat` raises `listar_compat_inativo` (`55000`);
   `registrar_recebimento_ordem_compra_fio_compat` returns
   `{ok:false,codigo:'recebimento_compat_inativo'}`; zero mutation.
3. **Application fallback** — the accepted adapter (artifact `22bfb192`) takes
   the flat fallback branch on the inactive signals and on the bounded exact
   `42883` interval; byte-identical flat query/mutation; no double write.
4. **Admin & supplier authorization** — Component A/B authorization matrix:
   admin unrestricted; matching supplier scoped to
   `usuarios.fornecedor_id = ordem_compra.fornecedor_id`; non-matching supplier
   sees zero rows / denied; authenticated-without-supplier denied; anon and
   unauthenticated denied (`sem_permissao`); `service_role` not granted (§ Role
   matrix).
5. **Protected-table fence denial** (`OC-C3D-FENCE-001`) — in
   `maintenance_fenced` (rehearsal cluster only), a direct write to each of the
   8 protected tables (`ordens_compra_fio`, `ordem_compra_item_compat_fio`,
   `necessidade_compra_fio`, `ordem_compra_item_alocacao`, `ordem_compra_item`,
   `ordem_compra`, `saldo_fios`, `saldo_fios_op`) via the **real authorized
   admin path** and a **matching-supplier path** is denied with
   `legacy_receipt_fenced` (`55000`); source and inventory SHA-256 hashes are
   **unchanged** across the fenced interval.
6. **ACL closure rehearsal without invoking the irreversible step**
   (`OC-C3D-ACL-001`) — inspect the effective post-closure authority the
   `ordem_compra_c3c_close_final_acl` command *would* produce (the §13.15.2
   matrix: `PUBLIC`/`anon`/`authenticated`/`service_role`/`admin`/`supplier`
   privileges across the 14 protected tables, their sequences, the
   `SECURITY DEFINER` functions, and RLS policies), by reading the command's
   revoke/policy-drop set and simulating it in a throwaway transaction that is
   **rolled back** — **never** calling `ordem_compra_c3c_close_final_acl` for
   real (it is irreversible and sets `final_acl_closed_at`).
7. **Session & advisory locks** (`OC-C3D-LOCK-001`) — session advisory lock
   (`ordem_compra_c3c_lock_key(gen)` via
   `ordem_compra_c3c_acquire_session_lock`) is exclusive; the deterministic
   resource-lock order (cutover row → frozen source/mapping → inventory baseline
   → canonical header/allocation → order rows) holds; every transaction is
   short; the lock is released and can be reacquired; final backend idle, zero
   leaked locks.
8. **Concurrent receipt/reversal behavior** — two concurrent Component B calls
   against the same legacy-compat item serialize on the item `FOR UPDATE` lock;
   the second re-evaluates the current total fresh after its lock is granted
   (no stale delta); no new deadlock (`pg_stat_database.deadlocks` unchanged);
   deterministic LIFO reversal and the imported-balance immutable floor behave
   as `db/76` specifies.
9. **Failure injection & rollback** — inject a mid-rehearsal failure and prove
   the pre-PONR rollback (`ordem_compra_c3c_pre_ponr_rollback`) restores
   `flat`/`legacy_active` while retaining the fence and **not** restoring flat
   grants (§R.29.6); no partial state.
10. **Zero business-data mutation** — after every rehearsal, the seven business
    fingerprints and the receipt/ledger/movement tables on any shared
    environment are byte-for-byte identical to entry (§E.6).
11. **Exact pre/post fingerprints** — every proof records the §E fingerprints
    before and after; any drift on a shared environment is a HARD STOP.

## H. Recovery and PONR model

- **Pre-PONR reversible operations** (rehearsable): `fence_and_snapshot`
  (fence + frozen snapshot), `import_and_reconcile`, `set_canonical_read`, and
  the effective-ACL inspection — all reversible by
  `ordem_compra_c3c_pre_ponr_rollback` **so long as
  `productive_receipt_started_at IS NULL`**. The PONR is the first successfully
  committed **non-import** canonical/compat receipt after the read switch
  (§R.29.3); C3D must never reach it.
- **Operations requiring transaction rollback** — the ACL-closure *simulation*
  (§G.6), fence-denial probes, and any Component B write test in the disposable
  cluster run inside `BEGIN…ROLLBACK`/`SAVEPOINT` and are discarded.
- **Operations requiring a complete environment reset** — a real
  `import_and_reconcile` (mutating), a mistaken PONR crossing, or a corrupted
  fence state in the disposable cluster: tear the disposable cluster down and
  reinitialize from `db/01…db/76`. On the shared DB these operations are
  **forbidden** (§B), so no reset of the shared DB is ever required or
  authorized.
- **Operations forbidden before real cutover** — `ordem_compra_c3c_activate`,
  `ordem_compra_c3c_close_final_acl` (invocation), the real
  `set_canonical_read` on a shared environment, and any productive receipt.
- **Evidence that the shared database was restored exactly** — for every
  read-only shared-DB inspection: the §E cutover singleton state and the seven
  business fingerprints are recorded before and after and proven byte-identical;
  no advisory lock leaked; the final backend idle. Because §D confines all
  state-changing work to the disposable cluster, the shared DB is expected to be
  **untouched**, and the fingerprints prove it.

## I. Exact authorized future manifests (no wildcards)

Each future sublot may touch **only** the exact paths listed for it. These are
the paths a future, separately-authorized C3D implementation order may act on;
this contract authorizes none of it now.

- **Read-only reference (never modified by any C3D sublot):**
  `db/75_ordem_compra_c3c_inactive_cutover.sql`,
  `db/76_ordem_compra_c3c_b_db_prerequisites.sql`, every other `db/*.sql`, every
  `js/**` product file, `index.html`, `js/router.js`, `js/boot.js`. The
  application deployment artifact is the accepted commit
  `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`; C3D deploys/rehearses it **as-is**
  and makes **no product change**.
- **C3D-A / C3D-B (`OC-C3D-DEPLOY-001`):** new rehearsal artifacts only —
  `tests/ordem-compra-c3d-deploy.integration.sql`,
  `tests/ordem-compra-c3d-deploy.smoke.js`, and, if a disposable-cluster
  bootstrap script is needed, `scripts/c3d/` (new directory, rehearsal-only, no
  product/migration content). Environment action: apply the accepted
  `db/01…db/76` to a **disposable** cluster and/or **read-only** inspect
  `ucrjtfswnfdlxwtmxnoo` (migration presence, inert signals, fingerprints).
- **C3D-C (`OC-C3D-FENCE-001`):** `tests/ordem-compra-c3d-fence.integration.sql`
  (fence-denial + hash-invariance + pre-PONR rollback). Environment action:
  disposable cluster only; shared-DB inspection read-only.
- **C3D-D (`OC-C3D-ACL-001`):** `tests/ordem-compra-c3d-acl.integration.sql`
  (effective-closure simulation, rolled back; role matrix). Environment action:
  disposable cluster + read-only shared-DB ACL inspection; **no**
  `close_final_acl` invocation.
- **C3D-E (`OC-C3D-LOCK-001`):**
  `tests/ordem-compra-c3d-lock-concurrency.mjs` (session/advisory locks,
  deterministic order, concurrent Component B). Environment action: disposable
  cluster only.
- **C3D-F (closeout):** documentation only —
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, `docs/ledgers/G28_LEDGER.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this contract's
  `STATUS` marker, and `docs/DOCUMENTATION_INDEX.md` if a path changes.
- **Prohibited from modification by every C3D sublot:** any `db/*.sql`, any
  `js/**`/`index.html`/CSS product file, `scripts/validate-spec-custody.mjs` and
  `scripts/spec-custody/*`, `.claude/*`, `.mcp.json`, `.codex/*`,
  `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, `PEDIDO_OP_SCHEMA_CONTRACT.md`
  (normative anchors — a `NORMATIVE_CHANGE` phase only), and every production/
  prohibited Supabase project.

New rehearsal test/script file names above are **proposals**; the exact names
are ratified when each sublot is authorized. No sublot may widen its manifest
without a contract amendment.

## J. Mandatory supervisor decisions

None of the following may be delegated to the executor; each must be an explicit
architect decision before the affected sublot is authorized:

1. **Isolated environment selection** — Option 1 (Supabase branch), Option 2
   (disposable local PostgreSQL + read-only shared-DB proof, recommended),
   Option 3 (another named isolated environment), or Option 4 (HARD STOP). §D.
2. **Whether a Supabase branch must be created** — a paid, mutating operation;
   branch existence is `UNPROVEN` and this contract creates none. §D Option 1.
3. **Treatment of the 13 unmapped rows** (ids 153–165) — whether C3D-F must
   require a completeness disposition (backfill/re-baseline or documented
   exclusion) or defer it entirely to real cutover. §F.
4. **Whether `maintenance_fenced` may be exercised remotely** — the default
   binds all fence/state-change rehearsal to the disposable cluster; any remote
   exercise (even on a branch) requires explicit authorization and must never
   touch the shared `ucrjtfswnfdlxwtmxnoo` productively. §D/§B.
5. **Role identities used for ACL/role-matrix tests** — the exact admin,
   matching-supplier, non-matching-supplier, authenticated-without-supplier,
   anon, unauthenticated, and `service_role` identities/fixtures used, so no
   real productive user is impersonated. § Role matrix.
6. **Rollback/reset authority** — confirmation that disposable-cluster teardown
   and `BEGIN…ROLLBACK`/`SAVEPOINT` discipline are the only reset mechanisms, and
   that no shared-DB reset is ever authorized. §H.
7. **Whether deployment and DB rehearsal may share one window** — or must be
   separate authorizations (deployment presence vs. state-changing fence/lock/ACL
   rehearsal are distinct evidence classes; §R.29.1's deployment-before-activation
   ordering is preserved regardless).

## K. Environment boundary and Git/commit rules (for future sublots)

- **Environment:** the isolated rehearsal environment selected in §D. **No**
  access to production `gqmpsxkxynrjvidfmojk` or prohibited
  `bhgifjrfagkzubpyqpew` under any authorization. Shared `ucrjtfswnfdlxwtmxnoo`
  access is **read-only inspection only**.
- **Git:** branch `dev` only; `main` forbidden; selective staging only
  (`git add <exact path>`, never `git add .`/`-A`); no `--amend`, `--no-verify`,
  rebase, or history rewrite; the three preserved residue paths (`.gitignore`,
  `.mcp.json`, `.codex/config.toml`) are never staged, restored, or cleaned.
- **Push:** each sublot's push authorization is a separate gate; nothing beyond a
  `staging/dev` fast-forward is authorized, and only when its own order grants
  it.

## L. Point of no return

**NONE in C3D.** C3D performs no committed real-cutover state change; every
rehearsal is reversible by §H (pre-PONR rollback, transaction rollback, or
disposable-cluster reset). The only PONR defined anywhere is §R.29.3's real
cutover PONR (first productive canonical receipt after the read switch), which
C3D must never reach and which remains owned by `OC-CUTOVER-PONR-001` / real
cutover.

## M. Requirement disposition (this contract authors no change)

Authoring this contract marks **no** requirement `SATISFIED` and changes **no**
disposition. `OC-C3D-DEPLOY-001` remains `PLANNED`; `OC-C3D-FENCE-001`,
`OC-C3D-ACL-001`, `OC-C3D-LOCK-001` remain `PARTIALLY_SATISFIED` (the `db/75`
static/local foundation is in place; the empirical isolated-rehearsal proofs
this contract scopes remain pending). Only a future, separately-authorized C3D
implementation with the empirical evidence in §G may advance any of them, and no
`OC-C3D-*` requirement reaches `SATISFIED` before real cutover where the ratified
text ties it to a real window.

## N. Status and next authorizable action

`STATUS`: **`PROPOSED / AWAITING SUPERVISOR ACCEPTANCE / IMPLEMENTATION NOT
AUTHORIZED`** (machine-readable marker at the head of this file).
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE` in `PROJECT_STATE.md`.

`NEXT_AUTHORIZABLE_ACTION`: **read-only supervisor review of this contract.** No
`PHASE-C3D` sublot implementation, environment mutation, branch creation,
deployment, staging validation/application of `db/76`, activation, real
snapshot/import, fence transition, read switch, final ACL-closure invocation,
cutover, C4, C5, production access, or Supabase write is authorized by this
authoring pass. No phase chains automatically; each sublot in §C requires its
own explicit architect authorization and the resolution of the §J decisions it
depends on.
