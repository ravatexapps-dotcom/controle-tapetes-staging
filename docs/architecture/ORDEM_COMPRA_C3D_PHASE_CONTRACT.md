# PHASE-C3D Material Phase Contract — Inactive Deployment & Rehearsal

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: PHASE-C3D
<!-- MATERIAL_PHASE_CONTRACT:END -->
STATUS: CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED — accepted technical checkpoint 429aa3980c7027b9d872a1902e2f31f1a4a85a2a — PHASE-C3D-A: CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED (accepted checkpoint 096cd60325e4987010d328c856ee6a3a51ca66bf) — PHASE-C3D-B: CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED (accepted checkpoint 5441321014883c4e8149dc8b20da9d053a193699) — PHASE-C3D-C: CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED (accepted checkpoint 6fd63a56a123d6d006353c6ae629611cbc7c01e9, §U) — PHASE-C3D-D: CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED (accepted checkpoint 5a2be05c19a62346b906f7b3cbb0b89d07b3a571, §V corrected §W, supervisor acceptance §X) — PHASE-C3D-E: CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED (accepted checkpoint 429aa3980c7027b9d872a1902e2f31f1a4a85a2a, §Y evidence, §Z acceptance) — PHASE-C3D-F: CLOSED / ACCEPTED / DOCUMENTATION-ONLY (§Z) — OC-C3D-DEPLOY-001/OC-C3D-FENCE-001/OC-C3D-ACL-001/OC-C3D-LOCK-001: SATISFIED — ACTIVE_PHASE/ACTIVE_PHASE_CONTRACT: NONE (this contract is closed)

> **Material-contract identity (restored §Q.1).** The machine-readable
> `PHASE_ID` above is `PHASE-C3D` — the identity of the whole material phase
> contract governing sublots C3D-A…C3D-F. The `§P` change that set it (and
> `ACTIVE_PHASE`) to `PHASE-C3D-A` was a documentary identity error, corrected
> in `§Q.1`; the active **sublot** is tracked through this `STATUS` marker, the
> append-only sections below, `PROJECT_STATE.md`/`AGENT_HANDOFF.md` prose, and
> `NEXT_AUTHORIZABLE_ACTION`, not through `PHASE_ID`. No technical C3D-A
> evidence is invalidated by this restoration.

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

## 0. Supervisor forward correction R1 (verdict: CHANGES_REQUIRED)

> **Forward correction, authored under the "PHASE-C3D MATERIAL CONTRACT FORWARD
> CORRECTION" order (documentation-only, `FORWARD_CORRECTION` per
> `docs/governance/DOCUMENTATION_MODEL.md` §19).** The proposed contract
> committed at `fc53f9d43bbd28e47c3e84e3893082cc41c41fcf` (authored the same
> pass as the `PHASE-C3C-B` supervisor acceptance) received a read-only
> supervisor review that returned **`CHANGES_REQUIRED`** for four material
> contradictions. This is the first correction of this still-`PROPOSED`
> contract; no numbered historical section existed yet to preserve verbatim, so
> the four findings are corrected **in place** in §§A–N below (each corrected
> clause is identified in the section it lives in). Where any surviving
> pre-correction phrasing elsewhere in this file conflicts with the corrected
> text, **the corrected text governs**. This correction changes no `OC-C3D-*`
> disposition, activates no phase, and authorizes no implementation,
> migration, branch creation, deployment, or environment action.

**Finding 1 — requirement disposition (corrected in §C, §M).** The proposed
contract incorrectly stated or implied that no `OC-C3D-*` requirement may
become `SATISFIED` before the real cutover. Corrected: `OC-C3D-DEPLOY-001`,
`OC-C3D-FENCE-001`, `OC-C3D-ACL-001`, and `OC-C3D-LOCK-001` are each owned by
`PHASE-C3D` and may become `SATISFIED` by their own isolated-rehearsal
evidence, independent of the separately governed `OC-CUTOVER-001`/
`OC-CUTOVER-PONR-001`. No disposition is changed by this correction itself.

**Finding 2 — fence proof conflated real actor paths with all eight protected
tables (corrected in §C, §E, §G, §I).** The proposed contract required the
real admin and matching-supplier application paths to write directly to all
eight protected tables. Verified against `js/screens/op-writes.js`
(`registrarRecebimentoOrdemFio`, L92–99) and `js/screens/fornecedor.js`
(`screenFornecedorOrdens`'s writer, L523–524): both real application actor
paths write **only** `public.ordens_compra_fio`; neither has direct client
DML on the other seven protected tables (those are reachable only through
`SECURITY DEFINER` functions). Corrected: the fence proof is now two distinct
evidence classes — (A) a real actor-path proof confined to the real flat
receipt surface, and (B) an owner-level structural probe of all eight tables
in the disposable cluster only.

**Finding 3 — disposable-cluster PONR semantics (corrected in §A, §B, §H, §I,
§J, §L).** The proposed contract required a concurrent Component B proof where
a first successful increase commits and a second session observes it, while
simultaneously stating an unqualified "PONR = NONE" everywhere in C3D. A
successful Component B increase sets `productive_receipt_started_at` (the
PONR) — the two claims contradicted each other. **Architect decision,
recorded as resolved:** C3D may cross the receipt PONR only inside a
disposable, isolated rehearsal cluster, exclusively for the C3D-E concurrency
proof, followed by mandatory full cluster destruction. This is forbidden on
`ucrjtfswnfdlxwtmxnoo`, `gqmpsxkxynrjvidfmojk`, `bhgifjrfagkzubpyqpew`, and
any other persistent or shared environment.

**Finding 4 — open directory authorization (corrected in §I).** The proposed
`§I` manifest authorized the directory `scripts/c3d/` without an exact
filename, violating the no-wildcard rule. Corrected: replaced with the exact
proposed file `scripts/c3d/bootstrap-disposable-cluster.mjs` and an otherwise
unchanged exact-path list; **no wildcard or directory-level write
authorization exists** in this contract (wildcard notation survives only in
read-only/reference and prohibited-path descriptions — R2 wording correction
below).

## 0b. Supervisor forward correction R2 (verdict: CHANGES_REQUIRED)

> **Second forward correction, authored under the "PHASE-C3D CONTRACT FINAL
> FORWARD CORRECTION" order (documentation-only, `FORWARD_CORRECTION` per
> `docs/governance/DOCUMENTATION_MODEL.md` §19).** The R1-corrected contract
> committed at `6b7d48a238a5008e02168557b27bc27def3946d1` correctly resolved
> the four §0 (R1) findings but received a second read-only supervisor review
> that returned **`CHANGES_REQUIRED`** for two remaining operational
> contradictions, plus one wording correction. This section records that
> verdict; the two findings are corrected in place in the sections named below.
> Where any surviving pre-correction phrasing conflicts with the corrected
> text, **the corrected text governs**. This correction changes no `OC-C3D-*`
> disposition, activates no phase, does **not** reopen the accepted
> `PHASE-C3C-B` §36 closeout, and authorizes no implementation, migration,
> branch creation, deployment, or environment action.

**Finding 5 — no common documentary manifest for C3D-A…E (corrected in §C,
§I).** The R1 contract authorized canonical documentation writes only in
C3D-F, while stating C3D-A…E are separately authorized and independently
reviewable with only test/script technical artifacts in their manifests. That
would prevent each completed sublot from recording its technical checkpoint,
evidence and findings, requirement disposition, current active/next state,
handoff continuity, and the explicit hard stop before the next
separately-authorized sublot. Corrected: §I now defines an exact **common
documentary manifest** applicable to each of C3D-A, C3D-B, C3D-C, C3D-D, and
C3D-E; each such sublot's future authorization comprises (1) its exact
technical artifact manifest and (2) that common documentary manifest. C3D-F
remains the final aggregate closeout, but is no longer the first time
canonical evidence may be recorded. No wildcard, directory-level, or "related
documents" path is added.

**Finding 6 — C3D-C mislabeled as application/browser end-to-end (corrected in
§C, §E, §G.5A, §I, §M).** §G.5A described the C3D-C fence proof as an
"end-to-end real application-path proof" referencing the JavaScript writers,
while the exact C3D-C technical manifest authorizes only
`tests/ordem-compra-c3d-fence.integration.sql` — no JavaScript, browser,
PostgREST harness, or product modification. **Architect decision:** C3D-C does
not require execution of the browser or application JavaScript. Its required
proof classification is a **`DATABASE-FAITHFUL AUTHENTICATED ACTOR-CONTEXT
PROOF`** — a SQL test, in the disposable rehearsal cluster only, that
establishes the same authenticated database context the repository's existing
DB-backed authorization tests use (the authenticated role + the exact
JWT/`auth.uid()` claim mechanism the installed policies and `SECURITY DEFINER`
functions require), and reproduces exactly the two real application flat-table
`UPDATE public.ordens_compra_fio SET kg_recebido=…, data_recebimento=…,
status=… WHERE id=…` mutation shapes (admin shared writer,
`js/screens/op-writes.js` L92–99; matching-supplier independent writer,
`js/screens/fornecedor.js` L523–525) under the admin and matching-supplier
authenticated contexts, proving the database fence rejects both with
`legacy_receipt_fenced` / `SQLSTATE 55000`. The JavaScript files remain
**read-only evidence** identifying the mutation shape only; the contract makes
no claim that the application JavaScript, browser, PostgREST, or real UI was
executed. §G.5B remains the separate owner-level structural eight-table trigger
proof; the exact C3D-C technical manifest is unchanged
(`tests/ordem-compra-c3d-fence.integration.sql`, no additional harness).

**Wording correction — wildcard notation.** Wildcard notation is retained only
in **read-only/reference or prohibited-path** descriptions (e.g. `any
db/*.sql`, `any js/**`, `.codex/*`), which are prohibition/reference patterns,
**not** authorized write manifests. Every absolute "no wildcard exists
anywhere" claim is replaced by the precise invariant: **`NO WILDCARD OR
DIRECTORY-LEVEL WRITE AUTHORIZATION EXISTS`** (applied in the §I heading, the
§I intro, and §0 Finding 4).

## 0c. Supervisor acceptance and PHASE-C3D-A authorization (verdict: ACCEPTED)

> **Supervisor ruling, recorded under the "PHASE-C3D-A — ENVIRONMENT AND
> DEPLOYMENT-MANIFEST QUALIFICATION" order.** The R2-corrected contract
> committed at `ab30c5115bb79c8952cc5575b68f8b976497699d` (`docs: finalize
> C3D contract execution boundaries`) is **ACCEPTED**. The accepted execution
> strategy is **§D Option 2** (disposable isolated local PostgreSQL plus a
> separately-scoped read-only inspection of the shared development database).
> `PHASE-C3D-A` is explicitly authorized by this ruling. No later C3D sublot
> (`C3D-B`, `C3D-C`, `C3D-D`, `C3D-E`, `C3D-F`) chains automatically from this
> authorization — each remains its own, separately unauthorized gate per §J
> and `docs/governance/AGENT_INSTRUCTIONS.md` §3.

Entry baseline for this authorization: branch `dev`, HEAD
`ab30c5115bb79c8952cc5575b68f8b976497699d`, `staging/dev` equal to HEAD,
preserved residue exactly modified `.gitignore` (unstaged), untracked
`.mcp.json`, untracked `.codex/config.toml` — verified unchanged by §O below.
This acceptance changes no `OC-C3D-*` requirement disposition (§M) and
authorizes only the exact `PHASE-C3D-A` technical manifest and common
documentary manifest in §I.

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
irreversible final ACL closure, does **not** build UI, and does **not** cross
the PONR on any shared or real environment. (Correction §0 Finding 3: a
synthetic PONR crossing is permitted **only** inside a disposable, isolated
rehearsal cluster, exclusively for the C3D-E concurrency proof, followed by
mandatory full cluster destruction — §H/§L. No claim is made anywhere in this
contract that C3D crosses the PONR on any shared or real environment.) It
prepares and rehearses; it does not cut over.

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
- PONR crossing and any post-PONR operation **on any shared or real
  environment** (a synthetic PONR crossing is permitted only inside a
  disposable rehearsal cluster, exclusively for the C3D-E concurrency proof,
  followed by mandatory cluster destruction — §H/§L; Correction §0 Finding 3);
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
| **C3D-C** — Fence & rollback rehearsal (corrected, §0 Findings 2 & 6) | Two distinct evidence classes (§G.5A/§G.5B), a SQL-only proof in the disposable cluster (no JavaScript/browser/PostgREST execution): **(A)** a **database-faithful authenticated actor-context proof** — under a synthetic authenticated admin context and a synthetic matching-supplier context (the same role + `auth.uid()` claim mechanism the installed policies/functions require), reproduce exactly the two real application flat-table `UPDATE public.ordens_compra_fio SET kg_recebido=…, data_recebimento=…, status=… WHERE id=…` writer shapes (`ordens_compra_fio` only — neither real path has direct client DML on the other seven protected tables), each denied `legacy_receipt_fenced` (`55000`); **(B)** owner-level structural probes proving the installed guard denies mutation on all eight protected tables. Source/inventory hashes unchanged across both classes; rehearses pre-PONR rollback (this sublot never crosses the PONR). | `OC-C3D-FENCE-001` | Pre-PONR rollback + transaction rollback / environment reset. |
| **C3D-D** — ACL / role-matrix rehearsal | Rehearse the complete effective ACL closure (table/column/sequence/function/RLS) **without invoking** `ordem_compra_c3c_close_final_acl`; exercise the full role matrix (§G). | `OC-C3D-ACL-001` | No-op (inspection-only) / transaction rollback. |
| **C3D-E** — Concurrency / session / resource-lock rehearsal (corrected, §0 Finding 3) | Prove session advisory-lock exclusion, deterministic resource-lock order, short transactions, release/reacquire; concurrent Component B behavior under lock, including exactly one authorized synthetic-PONR-crossing sequence (§H) confined to a disposable cluster and followed by mandatory full cluster destruction. | `OC-C3D-LOCK-001` | Mandatory full disposable-cluster destruction after the synthetic PONR crossing (§H) — pre-PONR rollback is not used once the crossing has occurred; transaction rollback / environment reset for every pre-crossing probe. |
| **C3D-F** — Closeout & readiness disposition (corrected, §0 Finding 1) | Aggregate the evidence from C3D-A…E; for each `OC-C3D-*` requirement whose §M exit criteria were met, record it `SATISFIED`; prove zero business-data mutation on any shared environment; disposition the 13 unmapped rows for real cutover (§F). Does **not** satisfy, partially satisfy, or execute `OC-CUTOVER-001`/`OC-CUTOVER-PONR-001` — the real cutover window remains its own, separately authorized gate. | all four (closeout) | Documentation-only. |

`OC-C3D-DEPLOY-001` spans C3D-A and C3D-B; `OC-C3D-FENCE-001` is C3D-C;
`OC-C3D-ACL-001` is C3D-D; `OC-C3D-LOCK-001` is C3D-E; C3D-F is the closeout.
The order in which C3D-C/D/E run after C3D-B is a supervisor decision (§J); they
are independent given a clean rehearsal environment.

**Each of C3D-A…E records its own canonical evidence (corrected, §0 Finding
5).** Every one of C3D-A, C3D-B, C3D-C, C3D-D, and C3D-E, when separately
authorized, may write the exact **common documentary manifest** in §I — to
record its technical checkpoint, environment evidence and findings, the
requirement rows it materially affects, the current active/next state, handoff
continuity, and the explicit hard stop before the next separately-authorized
sublot. A completed sublot never self-accepts itself or the phase, and never
authorizes the next sublot. **C3D-F remains the final aggregate closeout, but
is no longer the first time canonical evidence may be recorded.**

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
  faithful corpus — including C3D-E's single authorized synthetic PONR
  crossing and its mandatory post-proof cluster destruction (§H/§L; §0
  Finding 3). A **separately-scoped, read-only** proof against the shared
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
    shared DB's cutover singleton or business fingerprints changed; a PONR
    crossing on any shared or real environment, or a synthetic PONR crossing
    (C3D-E only) not followed by mandatory full disposable-cluster destruction
    (§H/§L); a fence proof (§G.5A/§G.5B) that would require widening any
    client grant or RLS policy, or fabricating a non-existent admin/supplier
    client path; environment identity unproven.

**C3D-C-specific note (§0 Findings 2 & 6):** for C3D-C, gate 9 (mandatory
evidence) comprises both evidence classes in §G.5A (**database-faithful
authenticated actor-context proof**, SQL-only in the disposable cluster,
reproducing the exact application flat-`UPDATE` shape on `ordens_compra_fio`
under synthetic admin and matching-supplier authenticated contexts — no
JavaScript/browser/PostgREST execution) and §G.5B (structural eight-table
probe, disposable cluster only, owner-level); gates 6 (business-data
fingerprints) and 7 (active sessions/locks) apply identically to both classes.
The exact C3D-C technical manifest remains a single SQL file (§I).

**C3D-E-specific note (§0 Finding 3):** for C3D-E, gate 4 (cutover singleton
state) applies to the disposable cluster only for the synthetic-PONR-crossing
scenario — that scenario is never run against any shared environment, where
gate 4's `legacy_active`/`flat`/`not_started`/all-null invariant remains
absolute. Gate 8 (rollback boundary) for the post-crossing portion of C3D-E is
**full disposable-cluster destruction**, not pre-PONR rollback (§H).

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
4. **Admin & supplier authorization (role matrix)** — Component A/B RPC
   authorization matrix: admin unrestricted; matching supplier scoped to
   `usuarios.fornecedor_id = ordem_compra.fornecedor_id`; non-matching supplier
   sees zero rows / denied; authenticated-without-supplier denied; anon and
   unauthenticated denied (`sem_permissao`); `service_role` not granted. This
   proof is distinct from item 5 below: it exercises the two `db/76` RPCs
   directly (Component A read, Component B write), not the §G.5A
   database-faithful actor-context fence-denial proof or the §G.5B structural
   eight-table probe.
5. **Protected-table fence denial** (`OC-C3D-FENCE-001`, corrected — §0
   Finding 2) — two distinct evidence classes; neither substitutes for the
   other:
   - **5A. Database-faithful authenticated actor-context proof** (corrected —
     §0 Finding 6; **not** an application/browser/PostgREST/real-UI proof).
     A SQL test, in the disposable rehearsal cluster only, that:
     1. creates or uses synthetic, nonproductive fixture identities — one
        active admin user and one active supplier user whose `fornecedor_id`
        matches the target order;
     2. establishes the same authenticated database context the repository's
        existing DB-backed authorization tests use — the authenticated role
        plus the exact JWT/`auth.uid()` claim mechanism the installed RLS
        policies and `SECURITY DEFINER` functions require;
     3. reproduces exactly the two real application mutation shapes against the
        real flat receipt surface `ordens_compra_fio`:
        - **admin shared writer shape** (`js/screens/op-writes.js`
          `registrarRecebimentoOrdemFio`, L92–99):
          `UPDATE public.ordens_compra_fio SET kg_recebido = <v>,
          data_recebimento = <v>, status = <v> WHERE id = <v>;`
        - **matching-supplier independent writer shape**
          (`js/screens/fornecedor.js`, L523–525): the **same** flat-table
          `UPDATE` shape, executed under the matching-supplier authenticated
          context;
     4. runs both attempts while the disposable cluster is in
        `maintenance_fenced`;
     5. proves, for **both** actor contexts: the database returns
        `legacy_receipt_fenced` / `SQLSTATE 55000`; zero flat mutation; zero
        canonical receipt or ledger mutation; zero inventory mutation; source
        and inventory fingerprints unchanged;
     6. preserves RLS and grants exactly as installed — **no client grant is
        widened**, **no direct client DML is granted to any other protected
        table**, and **no fake admin or supplier client path is invented**.
     The `js/screens/op-writes.js` and `js/screens/fornecedor.js` files remain
     **read-only evidence** identifying the exact mutation shape; this proof
     makes **no claim** that the application JavaScript, browser, PostgREST, or
     real UI was executed. It exercises the fence at the database layer under
     the real authenticated actor classes, which is exactly what
     `OC-C3D-FENCE-001` requires.
   - **5B. Structural eight-table fence coverage.** Owner-level controlled
     probes in the disposable rehearsal cluster only: `INSERT`/`UPDATE`/
     `DELETE` probes sufficient to exercise the installed guard on each of the
     8 protected tables (`ordens_compra_fio`, `ordem_compra_item_compat_fio`,
     `necessidade_compra_fio`, `ordem_compra_item_alocacao`,
     `ordem_compra_item`, `ordem_compra`, `saldo_fios`, `saldo_fios_op`); each
     probe denied with `legacy_receipt_fenced` (`55000`) when the guard is
     expected to deny it; permitted internal trigger-depth exceptions (e.g.
     `saldo_fios`/`saldo_fios_op` mutation from inside an already-authorized
     `SECURITY DEFINER` function, `db/75` L163–166) are tested separately and
     never misreported as missing fence coverage; every probe runs inside a
     transaction that is rolled back or inside a disposable cluster that is
     reset; **no client grant or RLS policy is widened** to perform this
     proof; **no fake admin or supplier client path is invented.**
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
8. **Concurrent receipt/reversal behavior — disposable-cluster synthetic PONR
   crossing** (corrected — §0 Finding 3; full sequence in §H) — the exact
   C3D-E sequence: two real database sessions against the same compat-mapped
   item in a fresh disposable cluster placed in the required
   `canonical_active` test state; session T1 obtains the item `FOR UPDATE`
   lock, performs a successful Component B increase, and commits (this
   commit sets `productive_receipt_started_at` inside the disposable cluster
   only — the synthetic PONR crossing); session T2 waits, then reads the
   newly committed state under lock and re-evaluates the absolute-total delta
   fresh (no stale delta). Proves: distinct sessions/backend PIDs; actual
   wait/serialization; correct final ledger/header/item totals; no duplicate
   idempotency identity; no new deadlock (`pg_stat_database.deadlocks`
   unchanged); deterministic LIFO reversal and the imported-balance immutable
   floor behave as `db/76` specifies. **Transaction rollback alone cannot
   prove this required post-commit re-evaluation** — the proof requires a
   real commit, which is exactly why this is the one authorized synthetic
   PONR crossing in all of C3D, and why it is followed by mandatory full
   cluster destruction (§H), not by pre-PONR rollback.
9. **Failure injection & rollback (pre-PONR only, C3D-C)** — inject a
   mid-rehearsal failure **before** any successful Component B receipt and
   prove the pre-PONR rollback (`ordem_compra_c3c_pre_ponr_rollback`) restores
   **`flat` read authority only** while the cutover **remains
   `maintenance_fenced`** — it does **not** return to `legacy_active` — clears
   `canonical_activated_at` to `NULL`, keeps `productive_receipt_started_at`
   `NULL`, retains the recorded `cutover_generation` and the frozen source
   snapshot / inventory baseline / committed import-reconciliation history, and
   leaves the database-owned mutation fence active with grants and RLS policies
   **byte-identical to their immediate pre-rollback state** (it does **not**
   restore or widen flat mutation grants and does **not** restore any removed
   `PUBLIC`-targeted policy). Returning to `legacy_active` or re-enabling flat
   mutation would require a separately authorized recovery procedure with an
   explicit generation/idempotency plan (§R.29.6; db/75
   `public.ordem_compra_c3c_pre_ponr_rollback(BIGINT)`); no partial state. This
   proof is distinct from item 8:
   it never crosses the PONR, and `ordem_compra_c3c_pre_ponr_rollback` is
   **not** invoked after item 8's successful Component B receipt — it is no
   longer a valid rollback path once the PONR has been crossed (§H).
10. **Zero business-data mutation** — after every rehearsal, the seven business
    fingerprints and the receipt/ledger/movement tables on any shared
    environment are byte-for-byte identical to entry (§E.6).
11. **Exact pre/post fingerprints** — every proof records the §E fingerprints
    before and after; any drift on a shared environment is a HARD STOP.

## H. Recovery and PONR model (corrected — §0 Finding 3)

`PONR_ON_SHARED_OR_REAL_ENVIRONMENTS: NONE / FORBIDDEN IN C3D`
`PONR_IN_DISPOSABLE_REHEARSAL_CLUSTER: PERMITTED ONLY FOR C3D-E CONCURRENCY PROOF, FOLLOWED BY MANDATORY CLUSTER DESTRUCTION`

- **Pre-PONR reversible operations** (rehearsable, C3D-A/B/C/D and the
  pre-crossing portion of C3D-E): `fence_and_snapshot` (fence + frozen
  snapshot), `import_and_reconcile`, `set_canonical_read`, and the
  effective-ACL inspection — all reversible by
  `ordem_compra_c3c_pre_ponr_rollback` **so long as
  `productive_receipt_started_at IS NULL`**. The PONR is the first
  successfully committed **non-import** canonical/compat receipt after the
  read switch (§R.29.3). On any shared or real environment C3D must never
  reach it. `ordem_compra_c3c_pre_ponr_rollback` is **never** invoked after a
  successful Component B receipt (item 8, §G) — it is not a valid rollback
  path once the PONR has been crossed, synthetically or otherwise.
- **Operations requiring transaction rollback** — the ACL-closure *simulation*
  (§G.6), fence-denial probes (§G.5A/§G.5B), and any pre-crossing Component B
  write test in the disposable cluster run inside `BEGIN…ROLLBACK`/
  `SAVEPOINT` and are discarded.
- **The one authorized synthetic PONR crossing — C3D-E concurrency proof
  only.** Because a real committed receipt is required to prove the
  post-commit re-evaluation in §G item 8 (transaction rollback alone cannot
  prove it — nothing observable commits inside a rolled-back transaction),
  C3D-E is permitted to cross the receipt PONR **exclusively** inside a
  disposable, isolated rehearsal cluster, following this exact sequence:
  1. Create a fresh disposable cluster from the exact authorized database
     migration sequence (`db/01…db/76`).
  2. Load only the synthetic, classification-faithful fixture required for
     the target Component B concurrency scenario — no real historical data.
  3. Record entry fingerprints and prove the cluster contains no
     authoritative business data.
  4. Put the rehearsal cluster in the required `canonical_active` test state.
  5. Run two real database sessions against the same compat-mapped item.
  6. Session T1 obtains the relevant lock, performs a successful increase,
     and commits.
  7. Session T2 waits, then reads the newly committed state under lock and
     re-evaluates the absolute-total delta.
  8. Prove: distinct sessions/backend PIDs; actual wait/serialization; no
     stale delta; correct final ledger/header/item totals; no duplicate
     idempotency identity; no deadlock;
     `productive_receipt_started_at` was set **inside the disposable
     cluster**.
  9. Do **not** invoke pre-PONR rollback after the successful receipt — it is
     no longer a valid rollback path after this synthetic PONR.
  10. **Destroy the entire disposable cluster** — this is the recovery
      mechanism for this specific test, not a database-level rollback.
  11. Prove the cluster process/data directory no longer exists and no
      persistent database was changed.
  This sequence is forbidden on `ucrjtfswnfdlxwtmxnoo`, `gqmpsxkxynrjvidfmojk`,
  `bhgifjrfagkzubpyqpew`, and any other persistent or shared environment. No
  claim is made anywhere in this contract that C3D crosses the PONR on any
  real/shared environment.
- **Operations requiring a complete environment reset** — a real
  `import_and_reconcile` (mutating), a mistaken PONR crossing outside the
  exact C3D-E sequence above, or a corrupted fence state in the disposable
  cluster: tear the disposable cluster down and reinitialize from
  `db/01…db/76`. On the shared DB these operations are **forbidden** (§B), so
  no reset of the shared DB is ever required or authorized.
- **Operations forbidden before real cutover** — `ordem_compra_c3c_activate`,
  `ordem_compra_c3c_close_final_acl` (invocation), the real
  `set_canonical_read` on a shared environment, and any productive receipt on
  a shared or real environment.
- **Evidence that the shared database was restored exactly** — for every
  read-only shared-DB inspection: the §E cutover singleton state and the seven
  business fingerprints are recorded before and after and proven byte-identical;
  no advisory lock leaked; the final backend idle. Because §D confines all
  state-changing work (including the C3D-E synthetic PONR crossing) to the
  disposable cluster, the shared DB is expected to be **untouched**, and the
  fingerprints prove it.

## I. Exact authorized future manifests (corrected — §0 Findings 4, 5 & 6)

**`NO WILDCARD OR DIRECTORY-LEVEL WRITE AUTHORIZATION EXISTS.`** Each future
sublot may touch **only** the exact **files** listed for it. Wildcard notation
appears in this section **only** inside read-only/reference or prohibited-path
descriptions (e.g. `any db/*.sql`, `any js/**`, `.codex/*`) — those are
prohibition/reference patterns identifying what must **not** be written, never
an authorized write manifest. These are the paths a future,
separately-authorized C3D implementation order may act on; this contract
authorizes none of it now.

Each of **C3D-A, C3D-B, C3D-C, C3D-D, and C3D-E**, when separately authorized,
comprises **two exact manifests**: (1) its **technical artifact manifest**
(the exact test/script files listed per-sublot below) and (2) the **common
documentary manifest** (defined once below, applicable to each of them). C3D-F
is documentation-only (its manifest is the common documentary manifest plus
this contract's `STATUS` marker).

- **Read-only reference (never modified by any C3D sublot):**
  `db/75_ordem_compra_c3c_inactive_cutover.sql`,
  `db/76_ordem_compra_c3c_b_db_prerequisites.sql`, every other `db/*.sql`, every
  `js/**` product file, `index.html`, `js/router.js`, `js/boot.js`. The
  application deployment artifact is the accepted commit
  `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`; C3D deploys/rehearses it **as-is**
  and makes **no product change**.
- **C3D-A / C3D-B (`OC-C3D-DEPLOY-001`):** exactly three new files —
  `tests/ordem-compra-c3d-deploy.integration.sql`,
  `tests/ordem-compra-c3d-deploy.smoke.js`,
  `scripts/c3d/bootstrap-disposable-cluster.mjs`. Environment action: apply the
  accepted `db/01…db/76` to a **disposable** cluster and/or **read-only**
  inspect `ucrjtfswnfdlxwtmxnoo` (migration presence, inert signals,
  fingerprints).
- **C3D-C (`OC-C3D-FENCE-001`):** technical artifact manifest is exactly one
  new file — `tests/ordem-compra-c3d-fence.integration.sql`, covering both
  evidence classes: §G.5A the **database-faithful authenticated actor-context
  proof** (SQL-only; reproduces the exact application flat-`UPDATE` shape under
  synthetic admin and matching-supplier authenticated contexts) and §G.5B the
  owner-level structural eight-table probe, plus hash-invariance and pre-PONR
  rollback. **No additional JavaScript/MJS/browser/PostgREST harness is
  authorized** (§0 Finding 6). Environment action: disposable cluster only;
  shared-DB inspection read-only.
- **C3D-D (`OC-C3D-ACL-001`):** exactly one new file —
  `tests/ordem-compra-c3d-acl.integration.sql` (effective-closure simulation,
  rolled back; role matrix). Environment action: disposable cluster +
  read-only shared-DB ACL inspection; **no** `close_final_acl` invocation.
- **C3D-E (`OC-C3D-LOCK-001`):** exactly one new file —
  `tests/ordem-compra-c3d-lock-concurrency.mjs` (session/advisory locks,
  deterministic order, concurrent Component B, and the one authorized
  synthetic-PONR-crossing sequence, §H). Environment action: disposable
  cluster only, including its mandatory post-proof destruction.
- **Common documentary manifest (corrected — §0 Finding 5; applies to each of
  C3D-A, C3D-B, C3D-C, C3D-D, C3D-E, and to C3D-F).** When a sublot is
  separately authorized, its order may authorize — in addition to that
  sublot's exact technical artifact manifest — exactly these documentary
  paths:
  - `PROJECT_STATE.md`
  - `AGENT_HANDOFF.md`
  - `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`
  - `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  - `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  - `docs/ledgers/G28_LEDGER.md`
  - `docs/DOCUMENTATION_INDEX.md` — **only if** an indexed path or document
    status materially changes.

  The documentary updates for a completed C3D-A…E sublot must: append that
  sublot's implementation/evidence record to this contract; update current
  state (`PROJECT_STATE.md`) and handoff (`AGENT_HANDOFF.md`); update **only**
  the requirement rows materially affected by that sublot; record the exact
  technical checkpoint and environment evidence (append-only ledger entry);
  keep the next sublot **unauthorized** until a separate architect order; and
  **never self-accept** the sublot or the overall phase. No wildcard,
  directory-level, or "related documents" path may be added to this manifest.
- **C3D-F (closeout):** documentation only — the **common documentary
  manifest** above (its `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`
  entry being this contract's `STATUS` marker plus the aggregate closeout
  record). C3D-F is the final aggregate closeout, not the first time canonical
  evidence may be recorded.
- **Prohibited from modification by every C3D sublot:** any `db/*.sql`, any
  `js/**`/`index.html`/CSS product file, `scripts/validate-spec-custody.mjs` and
  `scripts/spec-custody/*`, `.claude/*`, `.mcp.json`, `.codex/*`,
  `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, `PEDIDO_OP_SCHEMA_CONTRACT.md`
  (normative anchors — a `NORMATIVE_CHANGE` phase only), and every production/
  prohibited Supabase project.

The file names above are **exact proposed future manifests**; they remain
proposed until the corresponding sublot is separately authorized. No sublot
may widen its manifest, add a directory-level authorization, add "and related
files," or add an implicit permission to create another script — any of these
requires a contract amendment, not a silent expansion.

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
8. **Disposable-cluster PONR crossing for C3D-E — RESOLVED by this correction,
   not pending.** The architect has decided: C3D may cross the receipt PONR
   only inside a disposable, isolated rehearsal cluster, exclusively for the
   C3D-E concurrency proof, followed by mandatory full cluster destruction
   (§H/§L). This crossing is forbidden on `ucrjtfswnfdlxwtmxnoo`,
   `gqmpsxkxynrjvidfmojk`, `bhgifjrfagkzubpyqpew`, and any other persistent or
   shared environment. Retained here as the historical decision record, not as
   a pending item — no future authorization needs to re-decide this point,
   only to confirm the C3D-E sublot itself.

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

## L. Point of no return (corrected — §0 Finding 3)

`PONR_ON_SHARED_OR_REAL_ENVIRONMENTS: NONE / FORBIDDEN IN C3D.` C3D performs
no committed state change on any shared or real environment; every rehearsal
there is reversible by §H (pre-PONR rollback, transaction rollback, or
disposable-cluster reset). The PONR defined by §R.29.3 (first productive
canonical/compat receipt after the read switch) remains owned by
`OC-CUTOVER-PONR-001` / real cutover; C3D must never reach it on any shared or
real environment.

`PONR_IN_DISPOSABLE_REHEARSAL_CLUSTER: PERMITTED ONLY FOR C3D-E CONCURRENCY
PROOF, FOLLOWED BY MANDATORY CLUSTER DESTRUCTION.` The one exception, exactly
scoped: C3D-E's concurrency proof (§G item 8, §H sequence) commits one
successful Component B increase inside a disposable, isolated rehearsal
cluster, which sets `productive_receipt_started_at` **inside that cluster
only**. This is not a claim that C3D crosses the real §R.29.3 PONR — the
disposable cluster is not a real cutover environment, holds no authoritative
business data, and is destroyed immediately after the proof (§H steps 9–11).
No requirement or disposition anywhere in this contract is advanced by this
synthetic crossing beyond what §M's exit criteria for `OC-C3D-LOCK-001`
already scope.

## M. Requirement disposition and future exit criteria (corrected — §0 Finding 1)

Authoring this contract (and this correction) marks **no** requirement
`SATISFIED` and changes **no** disposition. `OC-C3D-DEPLOY-001` remains
`PLANNED`; `OC-C3D-FENCE-001`, `OC-C3D-ACL-001`, `OC-C3D-LOCK-001` remain
`PARTIALLY_SATISFIED` (the `db/75` static/local foundation is in place; the
empirical isolated-rehearsal proofs this contract scopes remain pending). This
section defines the **future exit criteria only** — it authorizes nothing now.

Each `OC-C3D-*` requirement is owned by `PHASE-C3D` and **may become
`SATISFIED` by its own isolated-rehearsal evidence**, independent of the
separately governed real-cutover requirements:

1. **`OC-C3D-DEPLOY-001` may become `SATISFIED`** once C3D-A and C3D-B
   complete their accepted deployment-manifest, inactive-presence,
   idempotency, and fallback evidence (§G items 1–3).
2. **`OC-C3D-FENCE-001` may become `SATISFIED`** once C3D-C proves the
   database-faithful authenticated actor-context fence denial (§G.5A —
   SQL-only, no application/browser execution), the owner-level structural
   eight-table trigger coverage (§G.5B), unchanged source/inventory hashes,
   and the pre-PONR rollback/reset evidence (§G item 9).
3. **`OC-C3D-ACL-001` may become `SATISFIED`** once C3D-D proves the complete
   effective ACL matrix (§G item 6) in the isolated rehearsal environment
   without invoking the real irreversible closure on any shared or real
   environment.
4. **`OC-C3D-LOCK-001` may become `SATISFIED`** once C3D-E proves session
   exclusion, deterministic resource locking, short transactions,
   release/reacquisition, and the authorized concurrency behavior — including
   the one authorized synthetic-PONR-crossing sequence and its mandatory
   cluster destruction (§G item 8, §H).
5. **C3D-F aggregates and closes the phase.** It does **not** require the
   real cutover to mark an already-proven `OC-C3D-*` requirement `SATISFIED`
   (§C).
6. **C3D acceptance does not satisfy, partially satisfy, or execute the real
   cutover requirements** (`OC-CUTOVER-001`, `OC-CUTOVER-PONR-001`) merely
   because C3D rehearsal passed — those remain their own, separately
   authorized real-cutover window (§R.29.5), owned outside this contract.
7. **No requirement changes disposition during this documentation-only
   correction.** The text above defines the future exit criteria only; only a
   future, separately-authorized C3D implementation with the empirical
   evidence in §G may actually advance any `OC-C3D-*` disposition, sublot by
   sublot, as its own evidence closes.

## N. Status and next authorizable action

`STATUS`: **`ACCEPTED — PHASE-C3D-A: IMPLEMENTED / LOCALLY VERIFIED /
AWAITING SUPERVISOR ACCEPTANCE — C3D-B THROUGH C3D-F: NOT AUTHORIZED`**
(machine-readable marker at the head of this file). §0c records the
supervisor's acceptance of this contract and explicit authorization of
`PHASE-C3D-A` alone. `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` in
`PROJECT_STATE.md` are `PHASE-C3D-A` / this file's path, pending the
supervisor's review of §O below; neither is self-accepted by this pass.

`NEXT_AUTHORIZABLE_ACTION`: **read-only supervisor review of the `PHASE-C3D-A`
implementation evidence (§O)**. `PHASE-C3D-A` alone provides only the
environment and deployment-manifest portion of `OC-C3D-DEPLOY-001`; it does
not mark that requirement, or any other `OC-C3D-*` requirement, `SATISFIED`
(§M is unchanged by this pass). No `PHASE-C3D-B`/`C3D-C`/`C3D-D`/`C3D-E`/
`C3D-F` implementation, environment mutation, branch creation, migration
application to any persistent environment, activation, real snapshot/import,
fence transition, read switch, final ACL-closure invocation, cutover,
production access, or Supabase write is authorized by this pass. No phase
chains automatically; each remaining sublot in §C requires its own explicit
architect authorization and the resolution of the §J decisions it depends on.

## O. PHASE-C3D-A implementation and evidence

**Scope executed:** exactly the `PHASE-C3D-A` — "Environment and
deployment-manifest qualification" — subset of the combined C3D-A/C3D-B
technical manifest in §I: `scripts/c3d/bootstrap-disposable-cluster.mjs` and
`tests/ordem-compra-c3d-deploy.smoke.js`. `tests/ordem-compra-c3d-deploy.integration.sql`
(the remaining C3D-A/C3D-B manifest member) is **not** created by this pass —
migration application and inactive-function behavioral validation are
`PHASE-C3D-B` territory (§C), a separate, not-yet-authorized gate.

**Environment identity:** disposable, isolated local PostgreSQL cluster,
never the host's persistent scoop-installed cluster
(`C:\Users\<host-user>\scoop\apps\postgresql\*\data`, unused and untouched).
PostgreSQL version detected and used: **18.4** (`initdb --version`), matching
the version proven in `ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
§36.1. Binary directory resolved from `PATH`/`C3D_PG_BIN_DIR` at bootstrap
time; no path, credential, key, token, or connection string is printed or
persisted (the disposable cluster uses local trust authentication with no
password of any kind).

**Temporary-directory policy:** `fs.mkdtemp(os.tmpdir() + 'c3d-disposable-pg-<random>')`
— a fresh, uniquely-suffixed directory under the OS temp path, verified
outside the repository root on every bootstrap (`scripts/c3d/bootstrap-disposable-cluster.mjs`
throws `C3D_BOOTSTRAP_DATA_DIR_INSIDE_REPOSITORY` otherwise). Repeated
bootstraps never reuse a directory (`fs.mkdtemp` guarantees a fresh suffix);
proven empirically in `tests/ordem-compra-c3d-deploy.smoke.js` ("repeated
bootstrap runs do not reuse the same data directory").

**Port policy:** allocated via an OS ephemeral-port probe (bind to port 0,
read the assigned port, close), explicitly rejecting the conventional
default port 5432 if ever returned. Empirically distinct from 5432 on every
run (`tests/ordem-compra-c3d-deploy.smoke.js`, "the cluster uses a distinct
port" assertion inside the lifecycle test).

**Deployment manifest:** application artifact
`22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f` (confirmed an ancestor of the
current branch by `git merge-base --is-ancestor`); ordered database
migration sequence `db/01`…`db/76` (76 primary numbered migrations, `.verify.sql`
siblings and `setup_completo.sql` correctly excluded by the filename
pattern); exact terminal migrations `db/75_ordem_compra_c3c_inactive_cutover.sql`
and `db/76_ordem_compra_c3c_b_db_prerequisites.sql`; both files' working-tree
SHA-256 hashes proven byte-identical to their `git show HEAD:<path>` blob
content (i.e. unmodified relative to the repository checkpoint) and
byte-stable for the whole smoke-test run. The manifest resolver fails closed
(proven against synthetic fixtures only, never against the real `db/*.sql`
files) on: a duplicate migration number, a non-contiguous sequence, a
sequence not starting at 1, an unexpected migration after the expected
terminal, a hash diverging from the repository checkpoint, an application
artifact absent from branch ancestry, and a repository/branch identity
mismatch. `PHASE-C3D-A` does **not** apply `db/01`…`db/76` to any cluster or
database — this manifest is deployment-planning evidence only.

**Bootstrap and cleanup evidence:** `scripts/c3d/bootstrap-disposable-cluster.mjs`
resolves local PostgreSQL binaries, allocates the temp directory and port
above, runs `initdb`/`pg_ctl start` (reduced-shared-memory options mitigating
the Windows shared-memory reservation crash recorded in
`ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md` §35.5/§36.1), proves
readiness via `pg_isready` + a real `psql -c "SELECT 1"` connection, and
exposes a `stop()` that runs `pg_ctl stop -m fast`, waits for the port to
close, and removes the temporary directory with a bounded retry (absorbing a
observed Windows race where a still-exiting auxiliary worker process can
briefly keep the directory listed after `pg_ctl stop -w` already reports
success), failing closed (throwing `C3D_BOOTSTRAP_CLEANUP_INCOMPLETE`) if
removal cannot be proven. It never applies a migration, never loads a
fixture, never connects to Supabase or any shared/remote host, never writes
a repository file, and never uses `pg_ctl register` (no Windows service is
created).

**Tests and failure injection:** `tests/ordem-compra-c3d-deploy.smoke.js`,
19/19 passing, `node --test`, run three consecutive times with an explicit
post-run check for leftover `postgres.exe` processes and leftover
`c3d-disposable-pg-*` temp directories (none found on any of the three runs
after a bounded-retry cleanup fix — see §O's implementation-time finding
below). Covers: the full happy-path lifecycle (fresh directory outside the
repository, distinct port, readiness, real connection, clean shutdown,
process and directory gone); two repeated bootstraps proving no directory
reuse; and an explicit fault-injection hook
(`bootstrapCluster({ simulateReadinessFailure: true })`) that lets a real
cluster genuinely start and then forces the readiness step to fail, proving
cleanup still removes the real process and directory it created — a plain
short `readinessTimeoutMs` was tried first and found unreliable, because
`pg_ctl start -w` already waits for the server's own internal readiness, so
the first poll inside the timeout window usually still succeeds.

**Implementation-time finding (in-scope defect, corrected):** the first
cleanup implementation called `fs.rm(dataDir, { recursive: true, force: true })`
immediately after `pg_ctl stop` reported success and the listening port
closed. Empirically (three full smoke-test runs), this occasionally left a
`postgres.exe` auxiliary worker process alive and its data directory
undeleted for longer than the test run itself — a Windows-specific race
where `pg_ctl stop -w` returning success (the postmaster removed its PID
file) does not guarantee every auxiliary process has finished exiting and
released its open handles yet. Corrected with a 500 ms grace delay after the
port closes plus a bounded retry (`removeWithRetry`, up to 10 attempts at
300 ms) around the directory removal, failing closed if removal still cannot
be proven after all attempts. Re-verified clean (zero leftover process, zero
leftover directory) across three consecutive full smoke-test runs after the
fix.

**Read-only shared-development-database evidence
(`ucrjtfswnfdlxwtmxnoo`, via the repository's scoped read-only Supabase MCP
connection):**

- migration history confirmed ending at `75`/`76` with the exact recorded
  versions `20260720234958`/`20260720235820` (`list_migrations`);
- cutover singleton (`public.ordem_compra_cutover`, `id=1`):
  `status='legacy_active'`, `read_authority='flat'`,
  `reconciliation_status='not_started'`; `canonical_activated_at`,
  `snapshot_captured_at`, `import_started_at`, `import_completed_at`,
  `final_acl_closed_at`, `productive_receipt_started_at`,
  `source_snapshot_count`, `inventory_baseline_count` all `NULL`;
- business fingerprint (single read-only pass; no mutation was attempted, so
  no before/after drift is possible): `ordens_compra_fio=64`,
  `ordem_compra=51`, `ordem_compra_item=51`,
  `ordem_compra_item_alocacao=51`, `ordem_compra_item_compat_fio=51`,
  `necessidade_compra_fio=64`, `saldo_fios=5` — consistent with the fixed
  64-row/51-mapped corpus recorded elsewhere (§F).

No DDL, DML, or state-mutating RPC was invoked against this database. This
evidence is **not** `UNPROVEN` — the scoped read-only tooling performed it
cleanly without exposing any credential.

**Exact technical checkpoint:** entry HEAD
`ab30c5115bb79c8952cc5575b68f8b976497699d` (§0c); this section is appended,
and the single authorized commit `test: qualify C3D disposable rehearsal
environment` is created, on top of that checkpoint — see `PROJECT_STATE.md`
and `docs/ledgers/G28_LEDGER.md` for the exact resulting HEAD.

**Hard stop before C3D-B.** This section provides only the `PHASE-C3D-A`
evidence. `PHASE-C3D-B` (inactive migration/application presence validation
against a real applied `db/01`…`db/76` sequence) remains a separate,
not-yet-authorized gate; nothing in this pass applies a migration to any
cluster, activates canonical reads, or advances any `OC-C3D-*` disposition.

## P. Supervisor-review correction (verdict: CHANGES_REQUIRED at dd7f6739082d32dc5df849a9e69eaf1ee651f4cb)

> Correction, authored under the "PHASE-C3D-A TARGETED CORRECTION — CLEANUP
> PROOF, CANONICAL STATE, AND EXACT SUITE DIFFERENTIAL" order. The supervisor
> reviewed the `PHASE-C3D-A` evidence in §O, recorded at commit
> `dd7f6739082d32dc5df849a9e69eaf1ee651f4cb`, and returned **`CHANGES_REQUIRED`**
> for three findings, corrected below. `PHASE-C3D-A` remains `IMPLEMENTED /
> LOCALLY VERIFIED / CHANGES_REQUIRED / AWAITING SUPERVISOR ACCEPTANCE` — not
> self-accepted. This correction does not begin `PHASE-C3D-B` and changes no
> `OC-C3D-*` disposition.

**Finding 1 — canonical active-phase identity.** §O and `PROJECT_STATE.md`
recorded `ACTIVE_PHASE: PHASE-C3D` after `dd7f673`, but the authorization
explicitly required `ACTIVE_PHASE: PHASE-C3D-A` (the currently active
implementation sublot, distinct from the overall `PHASE-C3D` contract this
file continues to describe). Corrected: `PROJECT_STATE.md` and
`AGENT_HANDOFF.md` now record `ACTIVE_PHASE: PHASE-C3D-A` everywhere the
active operational phase is represented; `ACTIVE_PHASE_CONTRACT` remains this
file's path. This file's own machine-readable `PHASE_ID` marker (head of
file) is corrected from `PHASE-C3D` to `PHASE-C3D-A` to match — required by
`scripts/validate-spec-custody.mjs`'s exact-match rule between
`ACTIVE_PHASE` and the active contract's `PHASE_ID`, confirmed by rerunning
the validator after the correction (`PASS`). This file's title and prose
continue to describe the full `PHASE-C3D` sublot family (A…F); only the
tracked "currently active" identity changed.

**Finding 2 — fail-closed PostgreSQL shutdown proof.**
`scripts/c3d/bootstrap-disposable-cluster.mjs`'s cleanup previously discarded
the boolean results of `runPgCtlStop()` and `waitForPortClosed()`, and
inferred process death only from directory removal succeeding — never from
proving the actual postmaster process was gone. Corrected:

1. **Captured PID.** `readPostmasterPid(dataDir)` reads the disposable
   cluster's own `postmaster.pid` immediately after `pg_ctl start -w`
   returns successfully — never from process-name enumeration, which could
   match an unrelated PostgreSQL installation on the host.
2. **Shutdown result captured.** `runPgCtlStop()` now returns
   `{ ok, status, diagnostic }` (exit status, spawn error, or stderr/stdout
   text) instead of a discarded boolean; a non-`ok` result throws
   `C3D_BOOTSTRAP_STOP_FAILED` with that diagnostic attached.
3. **Port closure is a hard gate.** `waitForPortClosed()` returning `false`
   now throws `C3D_BOOTSTRAP_PORT_STILL_OPEN` instead of being silently
   discarded via a swallowed rejection handler.
4. **Process exit is proven, not inferred.** `isPidAlive(pid)` uses the
   cross-platform `process.kill(pid, 0)` existence probe (works on this
   Windows host and on POSIX); `waitForPidExit()` polls it with a bounded
   timeout. A still-alive PID throws `C3D_BOOTSTRAP_PROCESS_STILL_ALIVE`.
5. **Ordering enforced.** Directory removal (`removeWithRetry`, bounded
   retry, unchanged) now runs only after shutdown, port-closure, and
   process-exit are all independently proven — never before, never inferred
   from one another.
6. **Combined proof required for success.** `stop()` resolves only once
   `{ stopResult.ok, portClosed, pidAbsent, dirAbsent }` are all true; any
   failed step rejects with a stable `C3D_BOOTSTRAP_*` error carrying the
   partial proof, never silently reporting success.
7. **Bootstrap-failure path preserves both facts.** The `init`/`start`/
   `readiness` catch path now wraps its own cleanup attempt in its own
   `try`/`catch`; if cleanup also fails, the thrown error's message and
   `.cleanupError` property carry both the original failure and the cleanup
   failure — neither discards the other.
8. **Idempotent and retry-safe.** `started`/`postmasterPid` are only cleared
   once a step is genuinely proven; a failed `stop()` attempt never sets the
   `cleanedUp` flag, so a later real retry re-examines exactly what still
   needs proving (skipping a re-`pg_ctl stop` call only when the PID is
   independently confirmed already dead) and completes the job. A second
   `stop()` call after genuine success returns the cached proof without
   re-running anything.

Narrowly-scoped fault injection (`stop({ forceStopFailure })`,
`stop({ forcePortStillOpen })`, `stop({ forceProcessStillAlive })`) was added
to `bootstrapCluster`'s existing `stop()` for deterministic test coverage of
each failure path — no new file was created.

**Finding 3 — exact full-suite failure-name differential.** The prior pass
compared only failure *counts* (122 baseline vs. 122 current) inherited from
an earlier commit's (`22bfb192`) historical record, never verified directly
against the `ab30c511` entry checkpoint, and never disambiguated same-named
tests across different files. Corrected: a detached Git worktree was created
outside the repository at `ab30c5115bb79c8952cc5575b68f8b976497699d`; the
identical mandatory suite command (`node --test tests/**/*.js`) was run in
that worktree and in the corrected current workspace; every failing test's
identity was captured as `<repo-relative file path>:<line>:<col>\t<full test
name>` (tab-separated, taken from each TAP record's own `location:` field,
which disambiguates identically-named tests in different files); both lists
were sorted and compared byte-for-byte. Result: baseline **137** failing
identities, current **122** failing identities, **added = 0** (empty — no
new failing identity), **removed = 15** (present at baseline, absent now).
The 15 removed identities span `tests/documents-ingestor-ui-smoke.test.js`,
`tests/pedido-detail-linked-ops.smoke.js`, `tests/pedido-detail.smoke.js`,
and `tests/tec-to-acabamento-flow.smoke.js` — none of which, nor any file
they depend on, was touched by this pass or the prior one (this pass's
manifest is exactly `scripts/c3d/bootstrap-disposable-cluster.mjs`,
`tests/ordem-compra-c3d-deploy.smoke.js`, and the documentary paths listed
in §I). Reported as pre-existing test-suite non-determinism (consistent with
this repository's already-documented `:8765`-fixed-port and test-fidelity
debt classes), not claimed as a fix. The temporary worktree and the scratch
differential-capture script were both created outside the repository and
removed after use; neither is part of any commit.

**Documentary record location.** Full technical evidence for all three
findings — exact commands, exact counts, the full added/removed lists, and
the worktree-removal proof — is recorded in the
`docs/ledgers/G28_LEDGER.md` entry dated 2026-07-21 for this correction pass
(commit `fix: prove C3D disposable cluster cleanup`).

**Status after this correction.** `PHASE-C3D-A` remains `IMPLEMENTED /
LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE` (the `CHANGES_REQUIRED`
verdict is resolved by this correction, not by a new self-acceptance).
`OC-C3D-DEPLOY-001` remains `PLANNED`; `OC-C3D-FENCE-001`, `OC-C3D-ACL-001`,
`OC-C3D-LOCK-001` remain `PARTIALLY_SATISFIED` — unchanged by this
correction. **Hard stop before `PHASE-C3D-B`.**

## Q. Material-contract identity restoration and PHASE-C3D-B implementation

> Authored under the "PHASE-C3D-B — INACTIVE MIGRATION AND APPLICATION-PRESENCE
> VALIDATION" order (a combined material-contract identity correction plus the
> `PHASE-C3D-B` implementation). Entry checkpoint
> `096cd60325e4987010d328c856ee6a3a51ca66bf` — the supervisor-accepted
> `PHASE-C3D-A` technical checkpoint. This section restores a documentary
> identity error and records the `PHASE-C3D-B` evidence; it advances **no**
> `OC-C3D-*` disposition and self-accepts nothing.

### Q.1 Material-contract identity restored to PHASE-C3D (STEP 1)

The material contract for the entire `PHASE-C3D` family (sublots C3D-A…C3D-F)
is this file. Its machine-readable `PHASE_ID` marker (head of file) and the
canonical `ACTIVE_PHASE` (`PROJECT_STATE.md` `SPEC_CUSTODY_BOOTSTRAP`) are
restored to **`PHASE-C3D`**; `ACTIVE_PHASE_CONTRACT` remains this file's path.
The `§P` Finding 1 change that set both to `PHASE-C3D-A` was a **documentary
identity error** — the active *sublot* is tracked through the `STATUS` marker,
this contract's append-only sections, `PROJECT_STATE.md`/`AGENT_HANDOFF.md`
prose, and `NEXT_AUTHORIZABLE_ACTION`, not through the material contract's
`PHASE_ID`. No technical `PHASE-C3D-A` evidence (`§O`, `§P`) is invalidated by
restoring the `PHASE-C3D` identity; `scripts/validate-spec-custody.mjs` passes
with `PHASE_ID: PHASE-C3D` / `ACTIVE_PHASE: PHASE-C3D`. `PHASE-C3D-A` is
recorded **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED**; accepted
technical checkpoint `096cd60325e4987010d328c856ee6a3a51ca66bf`.

### Q.2 PHASE-C3D-B implementation and evidence (STEP 2)

**Scope executed:** exactly the `PHASE-C3D-B` — "Inactive migration/application
presence validation" — sublot (`§C`). One authorized new technical file,
`tests/ordem-compra-c3d-deploy.integration.sql`, plus the common documentary
manifest (`§I`). No `db/*.sql`, product file, validator, or accepted C3D-A
technical file (`scripts/c3d/bootstrap-disposable-cluster.mjs`,
`tests/ordem-compra-c3d-deploy.smoke.js`) was modified.

**Isolated environment:** two fresh, disposable, isolated local PostgreSQL
**18.4** clusters (`scripts/c3d/bootstrap-disposable-cluster.mjs`), each in its
own temp directory outside the repository, on a distinct non-default port
(runs observed on 64228 and 60491); no real or copied business data; no
Supabase branch; no shared/persistent database mutated. Each cluster held
**zero** public application tables before migration
(`to_regclass('public.ordem_compra_cutover')` NULL). The Supabase platform
objects the migrations assume the host provides (roles
`anon`/`authenticated`/`service_role`; schema `auth` with
`auth.uid()`/`auth.role()`/`auth.users`; schema `extensions` with `pgcrypto`
for `extensions.digest`) were supplied by an ephemeral, outside-repository
rehearsal shim — the same class of preamble the accepted
`PHASE-C3C-B-DB-PREREQ` `§36` disposable-cluster run relied on; it modifies no
`db/*.sql` and is not committed.

**Full ordered migration application:** the exact `db/01`…`db/76` sequence (76
primary numbered migrations; `db/75`/`db/76` terminal) applied cleanly to each
disposable cluster; all 76 completed. `db/67`'s REFUND-A migration-time
self-check requires the ratified classification counts (64/27/12/13/12/0) and
51 converted headers, so a **classification-shape-only synthetic corpus** of 64
legacy `ordens_compra_fio` rows (27 A / 12 B / 13 C / 12 D — synthetic values
only; `§D` known-limitation: the exact-total/51-mapping proofs are **not**
attempted against a synthetic corpus) was loaded before `db/67`; `db/67`'s own
reconciliation then confirmed `needs=64 headers=51 items=51 mappings=51`. No
migration was applied to `ucrjtfswnfdlxwtmxnoo`, `gqmpsxkxynrjvidfmojk`,
`bhgifjrfagkzubpyqpew`, or any persistent cluster.

**Object inventory (both runs):** Component A
`listar_ordens_compra_fio_compat(uuid,bigint)` and Component B
`registrar_recebimento_ordem_compra_fio_compat(bigint,numeric,date,text,text,text)`
present (SECURITY DEFINER, owner `postgres`); the additive
`ordem_compra_recebimentos_c3a_namespace_check` and
`ordem_compra_recebimentos_c3c_hash_check` both admit `legacy_compat_receipt_v1`
(32-hex); 17 `ordem_compra_c3c_*` cutover functions; the
`trg_c3c_protected_mutation_guard` fence on all eight protected tables and the
`trg_c3c_command_state_guard`; the two snapshot/baseline tables and the cutover
state/singleton CHECK constraints.

**Initial cutover singleton:** `id=1`, `status=legacy_active`,
`read_authority=flat`, `reconciliation_status=not_started`; every
snapshot/import/read-switch/final-ACL/activation/`productive_receipt_started_at`
marker and both baseline counts NULL.

**Inactive Component A:** raises SQLSTATE **55000**, message
**`listar_compat_inativo`**. **Inactive Component B:** returns
**`{"ok": false, "codigo": "recebimento_compat_inativo", "erro": "Legacy-compat
receipt adapter is inactive"}`**. Both under `legacy_active`/`flat`, synthetic
identifiers only.

**Zero mutation / locks:** an explicit before/after fingerprint (the cutover
singleton `md5` plus counts of every receipt/ledger/movement/business table)
was byte-identical across all probes; `productive_receipt_started_at` stayed
NULL; zero advisory locks held; no open transaction left. The authorized
`tests/ordem-compra-c3d-deploy.integration.sql` (its own internal before/after
fingerprint, PONR-null and no-lock-leak checks) emitted `PASS[1..5]` and
`C3D_B_DEPLOY_INTEGRATION_PASS` in both runs.

**db/76 reapplication / idempotency:** reapplying `db/76` against the
already-migrated cluster succeeded with no error; Component A/B function
definitions and both CHECK definitions were byte-identical before/after; each
constraint occurs exactly once (no duplicate); the integration SQL still
PASSED. **db/75 reapplication classification — SINGLE-APPLICATION (ordered).**
From the actual SQL, `db/75` DROPs and re-ADDs
`ordem_compra_recebimentos_c3c_hash_check` with the two-branch definition
(native + `legacy_initial_balance_v1` only); `db/76` later extends it to admit
`legacy_compat_receipt_v1`. A full standalone `db/75` reapply after `db/76`
would therefore **revert** `db/76`'s additive extension — a predictable
ordered-sequence divergence, not idempotent convergence — so `db/75` is **not**
reapplied in full; migration-history presence and object convergence (all 17
`db/75` objects present and stable) are its valid proof, exactly as the order
provides for a single-application migration.

**Two fresh-cluster runs + cleanup:** both runs produced identical inactive
results and zero mutation; after each, the bootstrap module's audited `stop()`
**proved** (never inferred) the captured postmaster PID absent, the port
closed, and the temp directory removed — independently re-confirmed
(`process.kill(pid,0)` false, port probe closed, directory absent). No
disposable process or `c3d-disposable-pg-*` directory remained.

**Application fallback evidence (existing tests + static/hash):** the accepted
application artifact remains `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`.
`git diff --stat 22bfb192 HEAD -- js/ index.html` and `-- '*.css'` are
**empty** — no product file, and specifically not the adapter
`js/screens/ordem-compra-receipt-cutover.js`, changed after the accepted
checkpoint; the flat read/write query shapes remain byte-identical to the
accepted C3C-B implementation. The adapter routes the inactive Component A
signal (55000 + `listar_compat_inativo`) and the exact `42883` interval to the
flat reader, and the inactive Component B envelope to exactly one flat writer;
only exact `42883` triggers the missing-function fallback; deterministic
database/server failures (a real HTTP status) and transport-ambiguous failures
(`status===0`) do **not** fall back; canonical success performs zero flat
writes — proven by the unmodified existing tests
(`tests/ordem-compra-receipt-cutover.smoke.js` 43/43, plus the call-site
routers in `tests/op-writes.smoke.js`, `tests/fornecedor-screens.smoke.js`,
`tests/op-nova.smoke.js`, `tests/pedido-detail.smoke.js`). No new JavaScript
harness was created; no existing application or C3C-B test file was modified.

**Shared development database (`ucrjtfswnfdlxwtmxnoo`) read-only evidence (not
UNPROVEN):** via the repository's scoped read-only Supabase MCP,
`list_migrations` confirms the history ends at `75` (`20260720234958`) / `76`
(`20260720235820`); the cutover singleton is `legacy_active` / `flat` /
`not_started` with every snapshot/import/read-switch/final-ACL/activation/
`productive_receipt_started_at` marker and both baseline counts NULL; business
fingerprint `ordens_compra_fio=64`, `ordem_compra=51`, `ordem_compra_item=51`,
`ordem_compra_item_alocacao=51`, `ordem_compra_item_compat_fio=51`,
`necessidade_compra_fio=64`, `saldo_fios=5`, `ordem_compra_recebimentos=0`,
`ordem_compra_fio_lancamentos=0` — identical to the `PHASE-C3D-A` `§O` reading.
No DDL, DML, or mutating RPC was issued; a single read-only pass, so no
before/after drift is possible.

### Q.3 Documentary state after this pass

`PHASE_ID: PHASE-C3D`; `ACTIVE_PHASE: PHASE-C3D`; `ACTIVE_PHASE_CONTRACT:
docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`. `PHASE-C3D-A` = CLOSED /
TECHNICALLY ACCEPTED / LOCALLY VERIFIED (accepted checkpoint
`096cd60325e4987010d328c856ee6a3a51ca66bf`). `PHASE-C3D-B` = IMPLEMENTED /
LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE. `OC-C3D-DEPLOY-001` remains
`PLANNED`; `OC-C3D-FENCE-001`, `OC-C3D-ACL-001`, `OC-C3D-LOCK-001` remain
`PARTIALLY_SATISFIED` — unchanged (the traceability matrix is intentionally
untouched: no disposition materially changes, and `OC-C3D-DEPLOY-001` may be
advanced only by the supervisor after accepting the combined C3D-A + C3D-B
evidence). **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the
`PHASE-C3D-B` evidence; `PHASE-C3D-C` and every later sublot remain
unauthorized. **Hard stop before `PHASE-C3D-C`.**

## R. Supervisor acceptance of PHASE-C3D-B and pre-PONR rollback correction

> Authored under the "PHASE-C3D-B SUPERVISOR ACCEPTANCE AND DOCUMENTARY
> RECONCILIATION" order (documentation-only). Entry checkpoint
> `5441321014883c4e8149dc8b20da9d053a193699`. This section records the
> supervisor's acceptance of `PHASE-C3D-A` + `PHASE-C3D-B`, advances
> `OC-C3D-DEPLOY-001` to `SATISFIED`, corrects the pre-PONR rollback semantics
> (§R.2), and records `PHASE-C3D-C` as separately authorized but NOT STARTED.
> No product, test, script, migration, database, Supabase, or environment
> action is taken.

### R.1 Acceptance record

- `PHASE-C3D-A`: **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** —
  accepted technical checkpoint `096cd60325e4987010d328c856ee6a3a51ca66bf`.
- `PHASE-C3D-B`: **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** —
  accepted technical checkpoint `5441321014883c4e8149dc8b20da9d053a193699`.

The combined accepted C3D-A + C3D-B evidence satisfies `OC-C3D-DEPLOY-001`
(now `SATISFIED`; traceability matrix updated). Accepted evidence: the exact
`db/01`…`db/76` application in two fresh disposable PostgreSQL 18.4 clusters;
`db/75`/`db/76` terminal; `db/75` correctly classified as ordered
single-application; `db/76` deterministic reapplication with no drift; the exact
inactive Component A (`listar_compat_inativo`/`55000`) and Component B
(`recebimento_compat_inativo`) results; zero mutation and zero lock leakage;
application flat-fallback compatibility evidence; zero newly failing full-suite
identity; shared-development migrations/state/fingerprints re-confirmed
read-only; and no persistent database mutation. `OC-C3D-FENCE-001`,
`OC-C3D-ACL-001`, `OC-C3D-LOCK-001`, `OC-CUTOVER-001`, and `OC-CUTOVER-PONR-001`
dispositions are **unchanged**.

### R.2 Pre-PONR rollback semantics correction

The prior §G item 9 wording that pre-PONR rollback "restores
`flat`/`legacy_active`" was **incorrect**. The normative and implemented result
(spec §R.29.6; db/75 `public.ordem_compra_c3c_pre_ponr_rollback(BIGINT)`,
`SET read_authority='flat', status='maintenance_fenced',
canonical_activated_at=NULL WHERE … productive_receipt_started_at IS NULL`) is:

- pre-PONR rollback restores **`flat` read authority only**;
- the database-owned mutation fence **remains active**;
- `status` **remains `maintenance_fenced`** — it does **not** return to
  `legacy_active`;
- it does **not** restore or widen flat mutation grants;
- it does **not** restore removed `PUBLIC`-targeted policies;
- grants and RLS policies remain **byte-identical to their immediate
  pre-rollback state**;
- `cutover_generation` remains recorded;
- the frozen source snapshot and inventory-baseline records remain;
- committed import/reconciliation history remains;
- `productive_receipt_started_at` remains `NULL`;
- `canonical_activated_at` is cleared to `NULL`;
- returning to `legacy_active` or re-enabling flat mutation would require a
  separately authorized recovery procedure with an explicit
  generation/idempotency plan.

§G item 9 is corrected in place accordingly; the normative specification and
`db/75` are read-only references and were not modified.

### R.3 Next sublot authorization

- `PHASE-C3D-C`: **AUTHORIZED / NOT STARTED**. **Execution context: a fresh
  Claude session is required**, beginning only after this documentation-only
  checkpoint is committed and confirmed on `staging/dev`, using its final HEAD
  as the exact Git baseline. The authorization permits only the separately
  supplied `PHASE-C3D-C` execution order.
- `PHASE-C3D-D` through `PHASE-C3D-F`: **NOT AUTHORIZED**.

No `PHASE-C3D-C` command, test file, PostgreSQL start, Supabase access, or fence
transition is performed in this pass.

### R.4 Documentary state after this pass

`PHASE_ID: PHASE-C3D`; `ACTIVE_PHASE: PHASE-C3D`; `ACTIVE_PHASE_CONTRACT:
docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`; `LAST_ACCEPTED_PHASE:
PHASE-C3C-B`; `ACCEPTED_CHECKPOINT: 5441321014883c4e8149dc8b20da9d053a193699`.
`PHASE-C3D-A` = CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED; `PHASE-C3D-B`
= CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED; `OC-C3D-DEPLOY-001` =
SATISFIED; `PHASE-C3D-C` = AUTHORIZED / NOT STARTED.
**NEXT_AUTHORIZABLE_ACTION:** execute `PHASE-C3D-C` from a fresh Claude session
at the final documentation-only HEAD produced by this pass; `PHASE-C3D-D` and
every later sublot remain unauthorized. **Hard stop; `PHASE-C3D-C` is not begun
in this session.**

## S. PHASE-C3D-C implementation — fence and pre-PONR rollback rehearsal

> Authored under the "PHASE-C3D-C — FENCE AND PRE-PONR ROLLBACK REHEARSAL"
> order, executed from a fresh Claude session at entry checkpoint
> `7f73b4d8210da249ddd5b085c7c3b59244afd72b` (`§R.3`/`§R.4`). Implements the
> single authorized technical artifact
> `tests/ordem-compra-c3d-fence.integration.sql` (§I). No `db/*.sql`,
> `scripts/c3d/bootstrap-disposable-cluster.mjs`, `tests/ordem-compra-c3d-deploy.smoke.js`,
> `tests/ordem-compra-c3d-deploy.integration.sql`, or product file was
> modified.

### S.1 Environment

Two separate fresh disposable, isolated local PostgreSQL 18.4 clusters
(`scripts/c3d/bootstrap-disposable-cluster.mjs`, unmodified), each carrying
the exact ordered `db/01`…`db/76` sequence plus an ephemeral, uncommitted
rehearsal preamble reproducing the Supabase platform objects the migrations
assume (roles `anon`/`authenticated`/`service_role`; schema `auth` with
`auth.uid()`/`auth.users`; schema `extensions` with `pgcrypto`) and an
ephemeral, uncommitted classification-shape-only synthetic 64-row
`ordens_compra_fio` corpus loaded before `db/67` (27 Class A / 12 Class B /
13 Class C / 12 Class D; `db/67`'s own migration-time self-check and
reconciliation confirmed `64/51/51/51/51`), including the reserved synthetic
identities specified by the order (admin UUID
`00000000-0000-4000-8000-00000000c3a1`; matching-supplier UUID
`00000000-0000-4000-8000-00000000c3b1`; fornecedor `930000301`; target flat
row `930000311`, Class B, `kg_pedido=15.500`, one of the 51 mapped rows;
cutover generation `930003001`). Neither the preamble nor the corpus is
committed (mirrors the same ephemeral-preamble class the accepted
`PHASE-C3C-B-DB-PREREQ`/`PHASE-C3D-B` disposable-cluster rehearsals relied
on). A separately-scoped read-only inspection of the shared development
database `ucrjtfswnfdlxwtmxnoo` was performed before and after the local
rehearsals — zero DDL/DML/mutating RPC; migrations `75`/`76` present; cutover
singleton `legacy_active`/`flat`/`not_started`/all-null; business/receipt/
ledger/movement/inventory fingerprint (`64/51/51/51/51/64/0/0/0/5/0`, zero
advisory locks) byte-identical before and after.

### S.2 Evidence

- **Pre-fence authorization controls:** for the admin and matching-supplier
  synthetic identities independently, a rolled-back transaction proved
  `auth.uid()` resolved to the intended actor and the exact real writer-shape
  `UPDATE public.ordens_compra_fio SET kg_recebido=…, data_recebimento=…,
  status=… WHERE id=930000311` affected exactly one row with no `42501`/RLS/
  grant failure; the target row returned byte-identical to its initial state
  after rollback.
- **Fence entry:** `ordem_compra_c3c_fence_and_snapshot(930003001)` (session
  advisory lock acquired first) transitioned
  `legacy_active/flat/not_started/all-null` to
  `maintenance_fenced/flat/previewed`, `cutover_generation=930003001`,
  `source_snapshot_count=51`, non-null source/inventory hashes,
  `productive_receipt_started_at` NULL, session lock held, live
  source/inventory row counts matching the frozen counts.
- **Evidence Class 5A (database-faithful authenticated actor-context fence
  proof):** the same real flat-table UPDATE shape, under authenticated admin
  and matching-supplier contexts independently, was denied with exact
  `SQLSTATE 55000` / message `legacy_receipt_fenced` (never `42501`, never a
  silent zero-row result); zero mutation across every business/cutover
  fingerprint; `auth.uid()` still resolved to the intended actor after the
  caught exception. Database-only proof — no JavaScript, browser, or
  PostgREST execution (contract §0 Finding 6); the `js/screens/op-writes.js`
  and `js/screens/fornecedor.js` UPDATE shapes were read-only references for
  the exact reproduced shape.
- **Evidence Class 5B (eight-table structural fence):** all eight
  `trg_c3c_protected_mutation_guard` installations confirmed
  `BEFORE INSERT OR UPDATE OR DELETE`; the full 8-table × 3-operation matrix
  (24 controlled, savepoint-isolated probes) each returned exact
  `legacy_receipt_fenced`/`55000`; zero mutation across every fingerprint.
  Internal trigger-depth exception (`saldo_fios`/`saldo_fios_op`,
  `pg_trigger_depth() > 1 AND status = canonical_active`): the direct
  depth-1 owner-probe denial is proven by the 24-probe matrix; no
  `SECURITY DEFINER` function was fabricated to synthesize a nested caller,
  and the legitimate nested-path runtime is recorded as belonging to
  `PHASE-C3D-E`, not claimed as covered here (per the order's explicit
  instruction).
- **Pre-PONR rollback rehearsal:** a test-only owner-level fixture set
  `read_authority='canonical'`, `reconciliation_status='reconciled'`
  (`productive_receipt_started_at`/`canonical_activated_at`/
  `final_acl_closed_at` remained NULL — not a claim of real
  import/reconciliation, the real historical totals being unavailable to
  this synthetic corpus). `ordem_compra_c3c_pre_ponr_rollback(930003001)`
  then produced `status=maintenance_fenced`, `read_authority=flat`,
  `canonical_activated_at` NULL, `productive_receipt_started_at` NULL,
  `cutover_generation` unchanged, snapshot/inventory-baseline row counts and
  effective grants/policies byte-identical before/after, no transition to
  `legacy_active`, direct protected-table writes still fenced after the
  rollback. The session advisory lock was then released and proven absent
  (`pg_locks` count 0); the script issues no unterminated `BEGIN`, leaving no
  open transaction.

### S.3 Two-cluster reproducibility and cleanup

The complete proof (fence entry, both evidence classes, rollback rehearsal)
was executed twice, each against a separately bootstrapped fresh disposable
cluster, with identical `C3D_C_FENCE_INTEGRATION_PASS` results. After each
run, `scripts/c3d/bootstrap-disposable-cluster.mjs`'s own `stop()` proved
postmaster-PID absence, port closure, and data-directory removal (all
`true`) before the next bootstrap.

### S.4 Full-suite differential and validator self-test

A detached temporary worktree at this pass's entry checkpoint
(`7f73b4d8210da249ddd5b085c7c3b59244afd72b`, identical to
`DOC_CLOSEOUT_HEAD`) ran the full mandatory Node suite
(`node --test tests/**/*.js`): baseline 141 failing identities, this
workspace 122 failing identities, **final minus baseline = empty** (zero
newly failing identity; the 19 baseline-only identities are pre-existing
non-determinism, not claimed as a fix). The worktree was removed and its
directory proven absent. `node scripts/validate-spec-custody.mjs --self-test`
produced the identical pre-existing `R1: ACTIVE_PHASE_CONTRACT is not an
existing file` active-contract fixture-harness failure against both the
baseline worktree and this workspace — no new validator/self-test failure.
`node scripts/validate-spec-custody.mjs` (non-self-test): PASS. `git diff
--check` / `git diff --cached --check`: clean.

### S.5 Disposition

- `PHASE-C3D-C`: **IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
  ACCEPTANCE**. Not self-accepted.
- `OC-C3D-FENCE-001`: remains **`PARTIALLY_SATISFIED`** — this pass supplies
  the database-faithful actor-context and structural-fence evidence; only
  the supervisor may advance it after review.
- `OC-C3D-ACL-001` / `OC-C3D-LOCK-001`: **unchanged**
  (`PARTIALLY_SATISFIED`).
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the
  `PHASE-C3D-C` evidence; `PHASE-C3D-D` and every later sublot remain
  unauthorized. No real cutover, activation, productive receipt, Supabase
  write, deployment, `main`, `origin`, or unauthorized remote action was
  performed.

## T. PHASE-C3D-C targeted evidence correction

> Authored under the "PHASE-C3D-C TARGETED EVIDENCE CORRECTION" order at
> entry checkpoint `a4b2e13bf0d9fb19b0ee69196f21d86f4904961e` (§S). Corrects
> exactly four incomplete-evidence findings in the already-implemented
> `tests/ordem-compra-c3d-fence.integration.sql`; does not redesign or
> repeat the already-passing actor-context, 24-probe, fence, or rollback
> behavior recorded in §S.

**Finding 1 — exact live-versus-frozen hash evidence.** Added four
invocations of `public.ordem_compra_c3c_assert_snapshot_and_live(930003001)`
(post-fence, post-Evidence-5A, post-24-probe-matrix, post-rollback), each
requiring success. Added a session `TEMP` evidence anchor
(`source_snapshot_count`/`_total_kg`/`_serialization`, `snapshot_hash`,
`inventory_baseline_count`/`_total_kg`/`_serialization`, `inventory_baseline_hash`,
plus a full-row hash of `ordem_compra_cutover_source_snapshot` and
`ordem_compra_cutover_inventory_baseline`, both ordered by
`stable_position`) captured once post-fence and compared byte-for-byte at
every later checkpoint. Added a full-content business fingerprint (row-cast
hashes, deterministic primary-key ordering, not row counts) for all eleven
listed tables, captured pre-Evidence-5A and re-verified after 5A, after the
24-probe matrix, and after rollback. The cutover singleton itself is
excluded from that fingerprint and from the snapshot/inventory anchor — its
exact expected state (including the intentional
`reconciliation_status`-stays-`reconciled` /
`read_authority` canonical→flat rollback transition) is asserted
field-by-field by the existing per-checkpoint state checks, not compared as
if those differences should disappear.

**Finding 2 — installed trigger-depth exception.** Added an empirical
catalog assertion against `pg_get_functiondef('public.trg_c3c_protected_mutation_guard()'::regprocedure)`:
exactly one `saldo_fios`/`saldo_fios_op` branch; exactly one
`pg_trigger_depth() > 1 AND v_state = 'canonical_active'` gate; the gate,
pass-through `RETURN`, and `ELSE`-path `RAISE EXCEPTION 'legacy_receipt_fenced'`
appear as one contiguous normalized-whitespace block; `'canonical_active'`
referenced exactly once in the whole guard body (no broader pass-through);
the literal `maintenance_fenced` never referenced (proving `maintenance_fenced`
cannot satisfy the gate regardless of depth). Combined with the direct
depth-1 denial already proven by the 24-probe matrix, this closes the
finding without fabricating a `SECURITY DEFINER` nested caller; the
legitimate nested-path runtime remains `PHASE-C3D-E` scope.

**Finding 3 — test-backend termination proof.** Removed the prior
overstated in-session "idle" claim. The test file now emits its own
`pg_backend_pid()` in a stable, greppable `NOTICE` (`TEST_BACKEND_PID=<n>`)
and in its final result row. The ephemeral orchestration runner (scratch,
outside the repository, removed after validation) captures that PID, and
only *after* the `psql` test process has exited opens a **separate**
connection to prove the PID is absent from `pg_stat_activity` and holds
zero advisory locks, before any cluster teardown.

**Finding 4 — traceability correction.** `OC-C3D-FENCE-001`'s residual-debt
column no longer states that a real, non-disposable-local admin/supplier
fence rehearsal is pending. It now records: Option 2 (disposable local
PostgreSQL + read-only shared-DB inspection) is the selected and sole
environment strategy for this requirement; every state-changing fence
exercise is confined to disposable local PostgreSQL 18.4; the shared
development database is read-only only; no remote/shared
`maintenance_fenced` exercise is required or authorized by `PHASE-C3D-C`;
only supervisor acceptance of the corrected evidence remains pending.
Disposition remains `PARTIALLY_SATISFIED` — not advanced by this pass.

**Validation (this pass):** the complete corrected proof
(`tests/ordem-compra-c3d-fence.integration.sql`) ran clean, including all
four new evidence classes, against two separate fresh disposable local
PostgreSQL 18.4 clusters; both proved `assert_snapshot_and_live` success at
all four checkpoints, byte-identical evidence anchors throughout, the
trigger-depth catalog proof, byte-identical full-content business
fingerprints from before Evidence 5A through after rollback, and the
separate-connection post-exit backend-absence proof (zero
`pg_stat_activity` rows, zero advisory locks for the captured test-backend
PID). Both runs proved full postmaster-PID/port/directory cleanup. `node
--check`/`node --test` on the unmodified bootstrap script and existing
smoke tests: unchanged, PASS. `node scripts/validate-spec-custody.mjs`
PASS. `git diff --check`/`git diff --cached --check`: clean. Full-suite
differential (detached temporary worktree at entry checkpoint
`a4b2e13bf0d9fb19b0ee69196f21d86f4904961e`, `node --test tests/**/*.js`):
final minus baseline = empty. `node scripts/validate-spec-custody.mjs
--self-test`: identical pre-existing active-contract fixture-harness
failure both sides, no new failure; validator not modified. Worktree and
every scratch runner removed and proven absent.

**Disposition (this pass):** `PHASE-C3D-C` = **IMPLEMENTED / LOCALLY
VERIFIED / CHANGES_REQUIRED RESOLVED / AWAITING SUPERVISOR ACCEPTANCE** —
not self-accepted. `OC-C3D-FENCE-001` remains `PARTIALLY_SATISFIED`;
`OC-C3D-ACL-001`/`OC-C3D-LOCK-001` unchanged. `PHASE-C3D-D` through
`PHASE-C3D-F` remain **NOT AUTHORIZED**.
**NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the corrected
`PHASE-C3D-C` evidence (this section). No further product/db migration
modification, persistent database mutation, Supabase branch/write,
deployment, activation, productive receipt, real cutover, `main`, `origin`,
or unauthorized remote action was performed.

## U. Supervisor acceptance of PHASE-C3D-C

> Authored under the "PHASE-C3D-D — EFFECTIVE ACL AND ROLE-MATRIX REHEARSAL"
> order (which opens by recording the supervisor's ruling on `PHASE-C3D-C`).
> Entry checkpoint `6fd63a56a123d6d006353c6ae629611cbc7c01e9`. This section
> records the supervisor's acceptance of `PHASE-C3D-C`, advances
> `OC-C3D-FENCE-001` to `SATISFIED`, and authorizes `PHASE-C3D-D` (executed and
> recorded in §V). No `db/*.sql`, product, script, migration, or normative file
> was modified by the acceptance itself.

### U.1 Acceptance record

- `PHASE-C3D-C` (fence and pre-PONR rollback rehearsal, §S corrected §T):
  **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** — accepted checkpoint
  `6fd63a56a123d6d006353c6ae629611cbc7c01e9`.

The accepted `PHASE-C3D-C` evidence satisfies `OC-C3D-FENCE-001` (now
`SATISFIED`; traceability matrix updated). Accepted evidence includes: the
database-faithful authenticated admin and matching-supplier actor-context fence
denials (exact `SQLSTATE 55000` / `legacy_receipt_fenced`, never `42501`, zero
mutation, `auth.uid()` still resolving); the 8 protected tables ×
INSERT/UPDATE/DELETE = 24 exact structural fence probes; the four
`ordem_compra_c3c_assert_snapshot_and_live` checkpoints and the byte-identical
frozen snapshot/inventory evidence anchor; full-content fingerprints for all
eleven business/receipt/ledger/movement tables; the installed
trigger-depth-exception catalog proof; the pre-PONR rollback to
`maintenance_fenced`/`flat` with no return to `legacy_active` and unchanged
grants/policies; the captured test-backend termination proof and advisory-lock
cleanup; two fresh disposable-cluster runs; and the read-only shared-development
invariance. `OC-C3D-ACL-001`, `OC-C3D-LOCK-001`, `OC-CUTOVER-001`, and
`OC-CUTOVER-PONR-001` dispositions are **unchanged** by this acceptance.

### U.2 Residual debt (recorded, non-blocking to this acceptance)

- the legitimate nested canonical-active `saldo_fios`/`saldo_fios_op` runtime
  remains owned by `PHASE-C3D-E`;
- the real cutover remains separately unauthorized;
- the 13 unmapped rows remain a real-cutover completeness item;
- the validator self-test active-contract fixture limitation remains a
  governance-harness debt.

### U.3 Next sublot authorization

- `PHASE-C3D-D` (effective ACL and role-matrix rehearsal): **AUTHORIZED**;
  executed and recorded in §V.
- `PHASE-C3D-E` and `PHASE-C3D-F`: **NOT AUTHORIZED**.

## V. PHASE-C3D-D implementation — effective ACL and role-matrix rehearsal

> Authored under the "PHASE-C3D-D — EFFECTIVE ACL AND ROLE-MATRIX REHEARSAL"
> order, executed at entry checkpoint
> `6fd63a56a123d6d006353c6ae629611cbc7c01e9` (§U). Implements the single
> authorized technical artifact `tests/ordem-compra-c3d-acl.integration.sql`
> (§I). No `db/*.sql`, `scripts/c3d/bootstrap-disposable-cluster.mjs`,
> `tests/ordem-compra-c3d-fence.integration.sql`, any other existing test, or
> product file was modified. Primary requirement: `OC-C3D-ACL-001` (§13.15.2).

### V.1 Environment

Two separate fresh disposable, isolated local PostgreSQL 18.4 clusters
(`scripts/c3d/bootstrap-disposable-cluster.mjs`, unmodified), each carrying the
exact ordered `db/01`…`db/76` sequence plus an ephemeral, uncommitted rehearsal
preamble reproducing the Supabase platform objects the migrations assume (roles
`anon`/`authenticated`/`service_role`; schema `auth` with `auth.uid()`/
`auth.users`; schema `extensions` with `pgcrypto`) and an ephemeral, uncommitted
classification-shape-only synthetic 64-row `ordens_compra_fio` corpus loaded
before `db/67` (27 Class A / 12 Class B / 13 Class C / 12 Class D; `db/67`'s own
self-check and reconciliation confirmed `64/51/51/51/51`), including the reserved
synthetic identities: admin UUID `00000000-0000-4000-8000-00000000c3a1`;
matching-supplier UUID `00000000-0000-4000-8000-00000000c3b1`; non-matching
supplier UUID `00000000-0000-4000-8000-00000000c3b2`; without-supplier UUID
`00000000-0000-4000-8000-00000000c3b3` (schema-valid active `tipo='cliente'`,
`fornecedor_id` NULL, `cliente_id` bound — the installed domain's canonical
neither-admin-nor-fornecedor classification); matching fornecedor `930000301`;
non-matching fornecedor `930000302`; target flat row `930000311` (Class B,
`fornecedor 930000301`, `kg_pedido=15.500`, mapped); a second Class B row
`930000312` owned only by fornecedor `930000302`; cutover generation `930004001`.
Neither the preamble nor the corpus is committed (same ephemeral-preamble class
the accepted `PHASE-C3D-B`/`PHASE-C3D-C` disposable-cluster rehearsals relied
on). A separately-scoped read-only inspection of the shared development database
`ucrjtfswnfdlxwtmxnoo` before and after the local rehearsals was byte-identical
(migrations `75`/`76` present/terminal; cutover singleton
`legacy_active`/`flat`/`not_started`/all-null; business fingerprint
`64/51/51/51/51/64/5/0/0/0`; ACL/policy/function fingerprint `md5`
`a73a5c2a1f8389e3b3227b741fe6d5e3` over 370 lines; zero advisory locks) — zero
DDL/DML/mutating RPC.

### V.2 Evidence

- **Protected-object inventories:** exactly the 14-table protected list, the 7
  closure-targeted sequences, and the 11 `ordens_compra_fio` columns; a function
  inventory (24 catalogued) proving every owner-only `ordem_compra_c3c_*` command
  and both guards are postgres-owned, empty `search_path`, and expose no EXECUTE,
  while Component A/B and the canonical receipt/reversal/history RPCs are
  authenticated-only EXECUTE.
- **Empirical closure-command proof:** an assertion against
  `pg_get_functiondef(ordem_compra_c3c_close_final_acl(bigint))` that the
  installed body embeds the exact db/75 14-table array, the exact
  `ordens_compra_fio` 7-privilege + 11-column revokes, its own sequence revoke,
  the six-table/six-sequence `REVOKE ALL`, and the `0::oid = ANY (p.polroles)`
  PUBLIC-policy drop loop.
- **Simulated closure (never invoked):** inside one explicit rolled-back
  transaction the closure ACL effects were reproduced manually and exactly
  (table/column/sequence revokes + PUBLIC-policy drop of 11 policies) WITHOUT
  calling `ordem_compra_c3c_close_final_acl`, without setting
  `final_acl_closed_at` (proven NULL at start and end), without activate/import/
  commit. Post-simulation matrices: the 7 grant-revoked protected tables expose
  zero SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER to
  public/anon/authenticated/service_role while the 7 retained canonical tables'
  direct grants are byte-identical (canonical direct-read authority not silently
  removed — §13.15.2); no effective UPDATE on any of the 11 columns nor an
  equivalent table-level UPDATE; no USAGE/SELECT/UPDATE on any of the 7
  sequences; zero PUBLIC-targeted policy remains on the 14 tables and every
  non-PUBLIC policy is byte-identical; owner-only commands expose no EXECUTE,
  Component A/B keep authenticated-only EXECUTE, and no owner/security-definer/
  `search_path` drift occurred. Four authenticated actors were denied (42501) on
  direct INSERT/UPDATE/DELETE of protected tables post-simulation (12/12), no
  temporary grant manufactured. `ROLLBACK` restored the ACL/policy/function
  fingerprint, business-data fingerprint, and cutover singleton byte-for-byte.
- **Runtime role matrix (TEST-ONLY canonical_active fixture):** Component A —
  admin sees the target order and all 51 mapped orders (unrestricted); matching
  supplier sees the target and zero orders belonging only to another supplier;
  non-matching supplier sees zero rows for the target; without-supplier
  (`cliente`) is denied with exact `sem_permissao`/`42501`; anon and
  service_role are denied by function EXECUTE privilege; PUBLIC has no EXECUTE
  (catalog proof). Component B — admin and matching supplier absolute-total
  no-ops return `sem_alteracao` (rolled-back savepoints, unique idempotency
  keys); non-matching supplier and without-supplier are denied `sem_permissao`
  with zero mutation; anon and service_role are denied by function privilege;
  PUBLIC has no EXECUTE. No successful increase/decrease committed;
  `productive_receipt_started_at` remained NULL throughout; the fixture was
  rolled back and the cutover singleton returned to
  `legacy_active`/`flat`/`not_started`.

### V.3 Reported deviation (canonical_active fixture vs. final_acl_closed_at NULL)

Making Component A/B active requires the cutover singleton at
`status='canonical_active'`. The installed db/75
`ordem_compra_cutover_c3c_state_check` makes `canonical_active` unrepresentable
unless `final_acl_closed_at IS NOT NULL AND canonical_activated_at IS NOT NULL`,
so the TEST-ONLY runtime fixture cannot literally keep `final_acl_closed_at`
NULL; it sets synthetic non-null `final_acl_closed_at`/`canonical_activated_at`
ONLY to satisfy that CHECK. This is not a real closure:
`ordem_compra_c3c_close_final_acl`/`_activate` are never invoked, no ACL is
revoked in that fixture, and the whole fixture is rolled back. The
closure-simulation section (where `final_acl_closed_at` must remain NULL) uses
`legacy_active` state and keeps it NULL throughout, and the post-test cutover is
`legacy_active`/`flat`/`not_started` with `final_acl_closed_at` NULL. This
deviation is classified DOCUMENTARY.

### V.4 Two-cluster reproducibility, cleanup, and full-suite differential

The complete proof executed twice against two independently bootstrapped fresh
disposable clusters, identical `C3D_D_ACL_INTEGRATION_PASS` results. After each
run the bootstrap's own `stop()` proved postmaster-PID absence, port closure, and
data-directory removal (all `true`); a separate connection after `psql` exit
proved the captured test-backend PID absent from `pg_stat_activity` and zero
advisory locks. `node --check` on `scripts/c3d/bootstrap-disposable-cluster.mjs`
and `tests/ordem-compra-c3d-deploy.smoke.js` (unmodified); `node --test
tests/ordem-compra-c3d-deploy.smoke.js` and
`tests/ordem-compra-receipt-cutover.smoke.js` PASS; `node
scripts/validate-spec-custody.mjs` PASS; `git diff --check` / `git diff --cached
--check` clean. Full mandatory Node suite differential (detached temporary
worktree at entry checkpoint `6fd63a56a123d6d006353c6ae629611cbc7c01e9`, `node
--test tests/**/*.js`): final minus baseline = empty. `node
scripts/validate-spec-custody.mjs --self-test`: identical pre-existing
active-contract fixture-harness failure both sides, no new failure; validator
not modified. The temporary worktree and every scratch orchestrator/preamble/
corpus artifact were removed and proven absent before commit.

### V.5 Disposition

- `PHASE-C3D-D`: **IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
  ACCEPTANCE** at this pass. A subsequent read-only supervisor review returned
  `CHANGES_REQUIRED` on one blocking evidence defect — the runtime role matrix
  (§V.2 fourth bullet) ran in a transaction **separate** from the simulated ACL
  closure (§V.2 third bullet), so it did not execute under the active closure —
  resolved by the forward correction in **§W**, which now carries the standing
  disposition. Not self-accepted.
- `OC-C3D-ACL-001`: remains **`PARTIALLY_SATISFIED`** — this pass supplies the
  complete disposable-local effective-ACL and role-matrix rehearsal evidence
  (table/column/sequence/function/policy matrices + Component A/B runtime + direct
  probes + byte-identical rollback); only the supervisor may advance it after
  review. Option 2 (disposable local PostgreSQL + read-only shared-DB inspection)
  is the selected and sole environment strategy for this requirement; no
  state-changing ACL simulation ran against any shared or production database.
- `OC-C3D-FENCE-001`: `SATISFIED` (advanced by §U); `OC-C3D-LOCK-001`,
  `OC-CUTOVER-001`, `OC-CUTOVER-PONR-001`: **unchanged**.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the
  `PHASE-C3D-D` evidence; `PHASE-C3D-E` and `PHASE-C3D-F` remain unauthorized.
  No real cutover, activation, productive receipt, real closure invocation,
  migration/product modification, Supabase branch/write, deployment, `main`,
  `origin`, or unauthorized remote action was performed.

## W. PHASE-C3D-D targeted evidence correction — bind the runtime role matrix to the simulated ACL closure

> Authored under the "PHASE-C3D-D — TARGETED CORRECTION — BIND RUNTIME ROLE
> MATRIX TO THE SIMULATED ACL CLOSURE" order, executed at entry checkpoint
> `b808a5ea832b5038495afe80e492de724835cae6` (the §V produced HEAD). Modifies
> exactly the single authorized test artifact
> `tests/ordem-compra-c3d-acl.integration.sql` (§I). No `db/*.sql` (db/75/db/76
> unchanged), `scripts/c3d/bootstrap-disposable-cluster.mjs`, any other test,
> script, validator, fixture, or product file was modified. Primary requirement:
> `OC-C3D-ACL-001` (§13.15.2). The accepted ACL model is not redesigned.

### W.1 CHANGES_REQUIRED finding (one blocking evidence defect)

A read-only supervisor review of the §V evidence at checkpoint `b808a5e` found
one blocking evidence defect. The §V implementation **proved the catalog
post-closure matrix** (table/column/sequence/policy/function matrices + the
four-actor direct-table `42501` probes) and **proved the Component A/B runtime
role matrix**, but did **not** prove the runtime matrix **under** the simulated
closure: the catalog simulation ran inside one `BEGIN … ROLLBACK` block and the
runtime fixture/matrix ran inside a **second, independent** `BEGIN … ROLLBACK`
block afterward. The simulated ACL closure had therefore **already been rolled
back** before the runtime matrix executed, so the runtime matrix did not run
while the revokes and PUBLIC-policy drops were in force. Finding classification:
**BLOCKING**.

### W.2 Corrected transaction structure

The two-transaction separation is replaced by exactly one logical structure in
`tests/ordem-compra-c3d-acl.integration.sql`:

- **one outer closure-simulation transaction** (`BEGIN`) that asserts
  `final_acl_closed_at` NULL, reproduces the exact db/75 closure ACL effects (the
  `ordens_compra_fio` seven-privilege table revoke, the 11-column `UPDATE`
  revoke, the seven closure-targeted sequence revokes, the six-table `REVOKE
  ALL`, and the PUBLIC-policy removal on the 14 protected tables), and re-runs
  every already-passing post-closure catalog proof (table / column / sequence /
  policy / function matrices + the four-actor direct-table probes);
- a **pre-runtime proof** (before the runtime matrix) that the simulated closure
  is still materially active: zero PUBLIC-targeted policy on the 14 tables, no
  targeted direct table/sequence privilege for any principal, Component A/B
  authenticated-only EXECUTE, and `final_acl_closed_at` still NULL;
- **one nested synthetic canonical-active savepoint** (`SAVEPOINT
  c3dd_runtime_fixture`) that sets the minimum valid state the installed db/75
  `ordem_compra_cutover_c3c_state_check` requires for `canonical_active`
  (`status=canonical_active`, `read_authority=canonical`,
  `reconciliation_status=reconciled`, `cutover_generation=930004001`, synthetic
  `final_acl_closed_at`/`canonical_activated_at`, `productive_receipt_started_at`
  NULL) **without invoking** `ordem_compra_c3c_close_final_acl` or
  `ordem_compra_c3c_activate`;
- the **complete Component A and Component B runtime role matrix executed while
  the simulated closure effects remain active** (admin / matching supplier /
  non-matching supplier / authenticated-without-supplier / anon / PUBLIC /
  service_role), with a **mid-runtime re-assertion** that the simulated
  ACL/policy/grant state is still active (not relying only on the earlier catalog
  checks) and a **no-drift proof** that no business / receipt / ledger / movement
  / inventory / grant / function-metadata / policy changed during the runtime
  matrix — the only change being the intended synthetic cutover fields inside the
  savepoint;
- **`ROLLBACK TO SAVEPOINT c3dd_runtime_fixture`** — restoring the synthetic
  markers (`final_acl_closed_at`/`canonical_activated_at`/
  `productive_receipt_started_at` NULL again, cutover byte-identical to its
  pre-fixture state) while **preserving the simulated ACL** (zero PUBLIC policy,
  no targeted direct privilege, Component A/B authenticated-only, business
  fingerprints unchanged) — then `RELEASE SAVEPOINT`;
- the **outer `ROLLBACK`** — restoring, byte-for-byte, the pre-simulation table /
  column / sequence / function grants+metadata, all RLS policies, the 14
  protected tables, business / receipt / ledger / movement data, and the cutover
  singleton (`legacy_active`/`flat`/`not_started`; `final_acl_closed_at` /
  `canonical_activated_at` / `productive_receipt_started_at` NULL).

`ordem_compra_c3c_close_final_acl` and `ordem_compra_c3c_activate` are still
never invoked; the reported §V.3 `canonical_active`-vs-`final_acl_closed_at`
deviation is unchanged (the synthetic markers now live entirely inside the nested
savepoint and are proven NULL again after the savepoint rollback). db/75 and
db/76 are byte-unchanged.

### W.3 Evidence (two fresh clusters)

Executed twice against two independently bootstrapped fresh disposable, isolated
local PostgreSQL 18.4 clusters (`scripts/c3d/bootstrap-disposable-cluster.mjs`,
unmodified), each carrying the exact ordered `db/01`…`db/76` sequence plus the
same ephemeral, uncommitted Supabase-platform preamble and
classification-shape-only synthetic 64-row corpus described in §V.1 (`db/67`
self-check `64/27/12/13/12`; reconciliation `64/51/51/51/51`). Both runs emitted
`C3D_D_ACL_INTEGRATION_PASS` under the corrected structure — including the new
pre-runtime, mid-runtime, no-drift, post-savepoint-rollback, and
post-outer-rollback restoration proofs. After each run the bootstrap's own
`stop()` proved postmaster-PID absence, port closure, and data-directory removal
(all `true`); a separate connection after `psql` exit proved the captured
test-backend PID absent from `pg_stat_activity` with zero advisory locks.
`node --check` on `scripts/c3d/bootstrap-disposable-cluster.mjs` and
`tests/ordem-compra-c3d-deploy.smoke.js`; `node --test
tests/ordem-compra-c3d-deploy.smoke.js` (24/24) and
`tests/ordem-compra-receipt-cutover.smoke.js` (43/43) PASS; `node
scripts/validate-spec-custody.mjs` PASS; `git diff --check` / `git diff --cached
--check` clean. Full mandatory Node suite differential (detached temporary
worktree at entry checkpoint `b808a5ea832b5038495afe80e492de724835cae6`, `node
--test tests/**/*.js`): final failing identities minus baseline failing
identities = empty (the corrected artifact is a `.sql` file, never executed by
the Node suite). The temporary worktree and every scratch
orchestrator/preamble/corpus artifact were removed and proven absent before
commit.

### W.4 Disposition

- `PHASE-C3D-D`: **IMPLEMENTED / LOCALLY VERIFIED / CHANGES_REQUIRED RESOLVED /
  AWAITING SUPERVISOR ACCEPTANCE**. Not self-accepted. §V.1–V.4 stands as the
  prior record; §W is the forward correction binding the runtime role matrix to
  the active simulated closure.
- `OC-C3D-ACL-001`: remains **`PARTIALLY_SATISFIED`** — not advanced to
  `SATISFIED` by this pass; only the supervisor may advance it after review.
- `OC-C3D-FENCE-001`: `SATISFIED` (via §U); `OC-C3D-LOCK-001`, `OC-CUTOVER-001`,
  `OC-CUTOVER-PONR-001`: **unchanged**.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the corrected
  `PHASE-C3D-D` evidence; `PHASE-C3D-E` and `PHASE-C3D-F` remain **NOT
  AUTHORIZED**. No real cutover, activation, productive receipt, real closure
  invocation, migration/product modification, Supabase branch/write, deployment,
  `main`, `origin`, or unauthorized remote action was performed.

## X. Supervisor acceptance of PHASE-C3D-D and PHASE-C3D-E authorization

> Authored under the "PHASE-C3D-E — SESSION LOCK, RESOURCE LOCK AND CONCURRENCY
> REHEARSAL" order, which opens by recording the supervisor's ruling on
> `PHASE-C3D-D`. Entry checkpoint `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`
> (the corrected `PHASE-C3D-D` evidence checkpoint, §W). This section records the
> supervisor's acceptance of `PHASE-C3D-D`, advances `OC-C3D-ACL-001` to
> `SATISFIED`, and authorizes `PHASE-C3D-E` (executed and recorded in §Y). No
> `db/*.sql`, product, script, migration, or normative file was modified by the
> acceptance itself.

### X.1 Acceptance record

- `PHASE-C3D-D` (effective ACL and role-matrix rehearsal, §V corrected §W):
  **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** — accepted checkpoint
  `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`. Original C3D-D evidence checkpoint
  `b808a5ea832b5038495afe80e492de724835cae6`; targeted transaction-binding
  correction `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`.
- The accepted C3D-D evidence advances **`OC-C3D-ACL-001` to `SATISFIED`**
  (traceability matrix updated): the exact 14-table / 11-column / seven-sequence
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
  and business state byte-for-byte; no invocation of
  `ordem_compra_c3c_close_final_acl` or `ordem_compra_c3c_activate`; two fresh
  disposable-cluster runs; read-only shared-development invariance; zero
  persistent database mutation.

### X.2 Residual debt (recorded, non-blocking to this acceptance)

- The real `close_final_acl` invocation, real activation, and real cutover remain
  separately unauthorized.
- The 13 unmapped historical rows remain a real-cutover completeness item.
- The validator active-contract self-test fixture-harness limitation remains
  governance-harness debt.
- Concurrency, session/resource locking, legitimate nested
  `saldo_fios`/`saldo_fios_op` runtime, LIFO reversal, and the imported-balance
  floor are owned by `PHASE-C3D-E` (§Y), not by C3D-D.

### X.3 Next sublot authorization

- `PHASE-C3D-E` (session advisory lock, deterministic resource locking,
  Component B concurrency, idempotency, LIFO reversal, imported-balance floor,
  and the one authorized synthetic PONR crossing per disposable cluster):
  **AUTHORIZED**; executed and recorded in §Y.
- `PHASE-C3D-F`: **NOT AUTHORIZED**.

## Y. PHASE-C3D-E implementation — session lock, resource lock, and Component B concurrency rehearsal

> Authored under the "PHASE-C3D-E — SESSION LOCK, RESOURCE LOCK AND CONCURRENCY
> REHEARSAL" order, executed at entry checkpoint
> `5a2be05c19a62346b906f7b3cbb0b89d07b3a571` (§X). Implements the single
> authorized technical artifact `tests/ordem-compra-c3d-lock-concurrency.mjs`
> (§I). No `db/*.sql`, `scripts/c3d/bootstrap-disposable-cluster.mjs`, any other
> existing test, validator, fixture, or product file was modified. Primary
> requirement: `OC-C3D-LOCK-001` (§R.29.5).

### Y.1 Environment

Two independently bootstrapped fresh disposable, isolated local PostgreSQL 18.4
clusters (`scripts/c3d/bootstrap-disposable-cluster.mjs`, distinct random ports,
fresh temp data directories outside the repository), each applying the exact
ordered `db/01`…`db/76` over the same ephemeral uncommitted Supabase-platform
preamble (roles `anon`/`authenticated`/`service_role`; schema `auth` with
`auth.uid()`/`auth.users`; schema `extensions` with `pgcrypto`) and the
classification-faithful synthetic 64-row corpus (loaded after db/66, before
db/67; `db/67` self-check `64/27/12/13/12`; reconciliation `64/51/51/51/51`;
target flat row 930000311 = Class B / fornecedor 930000301 / `kg_pedido` 15.500 /
`kg_recebido` 5.000 / one allocation `kg_alocado` 15.500). The preamble, corpus,
and actor fixtures live only in OS temp files created by the test and
deterministically removed before process exit; the test never connects to any
shared/remote/managed host and contains no credential, token, or project URL.
Each cluster crosses the synthetic PONR exactly once and is then destroyed
(§H/§L).

### Y.2 Evidence (both runs, `C3D_E_LOCK_CONCURRENCY_PASS`)

- **Session advisory-lock matrix (Part C).** Deterministic `lock_key` stable
  across connections, distinct per generation; NULL/0/negative rejected by the
  owner acquire command (`owner_only_cutover_command`/42501); same-generation
  exclusion (L2 acquire FALSE while L1 holds it; the granted lock is bound to
  L1's backend PID); different-generation independence (930005002 acquired
  concurrently, both visible under their PIDs); release + immediate reacquisition
  + FALSE on a second release; backend-disconnect auto-release (L3's captured
  backend PID and its advisory lock proven absent after an abrupt client kill,
  L4 reacquires); owner-only boundary (no EXECUTE for authenticated/anon/
  service_role on either session-lock command); zero leaked advisory lock.
- **Installed resource-lock order (Part D + D.1).** The installed Component B
  definition locks order row → item row → actor-scoped idempotency advisory →
  idempotency-header lookup → allocation rows (asc id) → ledger rows (asc id) →
  inventory advisory, with the idempotency advisory lock proven to precede the
  header lookup (empirical `pg_get_functiondef` positional proof — the installed
  database definition is the execution authority). A real staged blocker holds
  the target order row; a real Component B worker blocks on it
  (`pg_blocking_pids` contains the blocker, `wait_event_type=Lock`,
  `wait_event=transactionid`), creates no header while blocked, advances when the
  blocker releases, and is rolled back pre-PONR with zero mutation and no leaked
  lock.
- **Pre-PONR cutover preparation (Part E).** The preparation session acquires and
  holds the real cutover session lock; the real `fence_and_snapshot(930005001)`
  fences to `maintenance_fenced` and freezes the 51-mapping snapshot; the accepted
  synthetic equivalent of `import_and_reconcile` — the real per-snapshot-row
  `import_snapshot_row` loop over every kg>0 row (40 import headers) plus the real
  `assert_snapshot_and_live` reconciliation — establishes the target's 5.000 kg
  received quantity as exactly one immutable imported opening-balance ledger line
  (`import_saldo_inicial`, `kg_recebido` cache = 5.000), leaving
  `productive_receipt_started_at` NULL and `final_acl_closed_at` NULL. The
  corpus-specific 39/44/20221.280/405.980 `assert_import_reconciled` totals gate
  is deliberately not invoked (the recorded, accepted C3C-A fixture debt,
  unexecutable on a synthetic corpus). The minimum valid TEST-ONLY
  `canonical_active` state is then set MANUALLY (`status=canonical_active`,
  `read_authority=canonical`, `reconciliation_status=reconciled`,
  `cutover_generation=930005001`, synthetic `final_acl_closed_at` /
  `canonical_activated_at`, `productive_receipt_started_at` NULL);
  `ordem_compra_c3c_close_final_acl` and `ordem_compra_c3c_activate` are NEVER
  invoked (the synthetic markers exist only because the installed db/75
  `canonical_active` CHECK requires them). Component A resolves target flat row
  930000311 to its native order/item; the session lock is released with none
  remaining.
- **Two-session Component B concurrency and the one synthetic PONR crossing
  (Part F).** Two real matching-supplier sessions on target flat row 930000311:
  T1 (distinct backend PID) increases to an absolute 10.000 kg and holds its
  transaction open; T2 (distinct backend PID) increases to 15.000 kg and enters a
  real row-lock wait (`pg_blocking_pids(T2)` contains T1, `wait_event_type=Lock`,
  no header created, no deadlock, observable nonzero wait). Committing T1 sets
  `productive_receipt_started_at` non-NULL — the one authorized synthetic PONR
  crossing in this disposable cluster. T2 then resumes, re-reads the committed
  10.000 kg total under lock, re-evaluates its absolute-total delta as a fresh
  +5.000 kg (never the stale +10.000 → 20.000), and commits. Final: imported
  5.000 + T1 5.000 + T2 5.000 = item `kg_recebido` 15.000; exactly two productive
  compat receipt headers and two `tipo=recebimento` ledger lines; imported line
  untouched at 5.000; `pg_stat_database.deadlocks` unchanged.
- **Idempotency (Part G).** Same key + same payload deterministically replays the
  existing result with no new header/ledger line and no item/PONR change; same
  key + different payload returns `idempotencia_conflitante` with zero mutation;
  identity is scoped as `(idempotency_namespace='legacy_compat_receipt_v1',
  ator_tipo, ator_id, idempotency_key)`.
- **Legitimate nested canonical-active path (Part H).** Each productive receipt/
  reversal mutates `ordem_compra_item.kg_recebido` through the SECURITY DEFINER
  Component B path at `pg_trigger_depth()>1` (a direct depth-1 client UPDATE of
  `ordem_compra_item` and of `saldo_fios` is denied `legacy_receipt_fenced`/
  `55000`) and writes exactly one inventory movement row per line; item, ledger,
  and movement totals reconcile exactly. The installed protected guard gates the
  `saldo_fios`/`saldo_fios_op` exception on exactly
  `pg_trigger_depth()>1 AND v_state='canonical_active'` (empirical catalog proof).
  `saldo_fios` is **not empirically mutated** by this fixture — the target
  allocation capacity (`kg_alocado`=15.500) exceeds the maximum total (15.000),
  so no excess line is ever produced and `derive_state`'s `saldo_fios` branch
  (conditional on `kg_excesso<>0`) is never reached; the exception is therefore
  proven structurally and by the depth-1 denial probe. `saldo_fios_op` is
  **`NOT_APPLICABLE`** — no receipt/reversal/import path writes it (the installed
  trigger topology writes only `saldo_fios`); proven from the installed trigger
  definitions and the zero `saldo_fios_op` row count after the scenario. No
  trigger bypass broader than the accepted installed exception was observed.
- **Deterministic LIFO reversal (Part I).** An admin reduction to an absolute
  8.000 kg (delta −7.000) reverses all 5.000 kg of T2's latest productive receipt
  first, then exactly 2.000 kg of T1's earlier receipt, leaving 3.000 kg of T1
  unreversed and the imported 5.000 kg opening balance untouched (no reversal
  references the import line); reversal source ordering is id-descending
  deterministic (no earlier line reversed before a later reversible line);
  header/ledger/item/movement totals reconcile; the reduction key replays
  idempotently with zero extra mutation; `productive_receipt_started_at` stays
  non-NULL; no deadlock.
- **Imported-balance immutable floor (Part J).** An admin reduction to an
  absolute 4.000 kg is rejected with `reducao_abaixo_saldo_importado` reporting
  the installed 5.000 kg floor; zero mutation of headers, ledger lines, item
  total, inventory movements, the imported line, `productive_receipt_started_at`,
  or idempotency identities; the item total remains 8.000 kg.
- **Post-PONR compliance (Part K) and destruction (Part L).**
  `productive_receipt_started_at` remains non-NULL; the cluster stays
  `canonical_active` with the source/inventory snapshots present;
  `ordem_compra_c3c_pre_ponr_rollback` is never invoked and no `legacy_active`
  regression is attempted; no advisory lock remains; no backend is idle in
  transaction; `pg_stat_database.deadlocks` unchanged; every T1/T2/observer/
  administrative client session is explicitly closed. The bootstrap `stop()`
  then proves postmaster-PID absence, port closure, and data-directory removal
  (all `true`), with the captured postmaster PID and the TCP port independently
  proven absent/closed, and no `c3d-disposable-pg-*` directory or scratch
  SQL/preamble/corpus file from the run remaining.

### Y.3 Validation

`node --check` on `scripts/c3d/bootstrap-disposable-cluster.mjs` and
`tests/ordem-compra-c3d-lock-concurrency.mjs`; `node
tests/ordem-compra-c3d-lock-concurrency.mjs` (two complete fresh-cluster proofs,
`C3D_E_LOCK_CONCURRENCY_PASS`, exit 0); `node --test
tests/ordem-compra-c3d-deploy.smoke.js` and
`tests/ordem-compra-receipt-cutover.smoke.js` PASS; `node
scripts/validate-spec-custody.mjs` PASS; `git diff --check` / `git diff --cached
--check` clean. Full mandatory Node suite differential (detached temporary
worktree at entry checkpoint `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`, `node
--test tests/**/*.js`): final failing identities minus baseline failing
identities = empty (the new artifact is a `.mjs` file, never executed by the
`tests/**/*.js` Node suite). Validator self-test: the known active-contract
fixture-harness failure only, identical on both sides. The read-only
`ucrjtfswnfdlxwtmxnoo` inspection was byte-identical before/after this pass; the
temporary worktree and every scratch artifact were removed and proven absent
before commit.

### Y.4 Disposition

- `PHASE-C3D-E`: **IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
  ACCEPTANCE**. Not self-accepted.
- `OC-C3D-LOCK-001`: remains **`PARTIALLY_SATISFIED`** — proven by the
  isolated-rehearsal evidence above, not advanced to `SATISFIED` by this pass;
  only the supervisor may advance it after review (§M item 4).
- `OC-C3D-ACL-001`: `SATISFIED` (via §X); `OC-C3D-DEPLOY-001` /
  `OC-C3D-FENCE-001`: `SATISFIED`; `OC-CUTOVER-001` / `OC-CUTOVER-PONR-001` /
  `OC-C4-ADMIN-001` / `OC-C4-SUPPLIER-001` / `OC-C5-EMISSION-001`: **unchanged**.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the `PHASE-C3D-E`
  evidence; `PHASE-C3D-F` remains **NOT AUTHORIZED**. No `PHASE-C3D-F`, real
  `close_final_acl` invocation, real activation, real cutover, shared-database
  write, migration/product/existing-test modification, persistent receipt,
  deployment, `main`, `origin`/`production` remote mutation, or any push beyond
  the one authorized `staging/dev` fast-forward for this pass was performed.

## Z. PHASE-C3D-E supervisor acceptance and PHASE-C3D-F aggregate closeout

> Authored under the "PHASE-C3D-F — AGGREGATE CLOSEOUT AND READINESS
> DISPOSITION" order (documentation-only closeout). Entry checkpoint
> `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`, branch `dev`, `staging/dev` equal
> to HEAD at entry; preserved protected residue untouched (`M .gitignore`,
> `?? .codex/config.toml`, `?? .mcp.json`). This section records the supervisor's
> acceptance of `PHASE-C3D-E`, executes `PHASE-C3D-F` (aggregate closeout of the
> `PHASE-C3D` material phase), dispositions the remaining debts and the readiness
> boundaries, and leaves the repository ready for a separately authorized
> `PHASE-C4`. **No `PHASE-C4`, no `PHASE-C5`, and no `REAL_CUTOVER` is begun,
> authorized, or executed. No technical file is created or modified; every
> accepted technical artifact is byte-identical.**

### Z.1 PHASE-C3D-E supervisor acceptance (STEP 1)

- `PHASE-C3D-E` (session lock, resource lock, and Component B concurrency
  rehearsal, §Y): **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** — accepted
  checkpoint `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`.
- The accepted `PHASE-C3D-E` evidence satisfies **`OC-C3D-LOCK-001`** (its §M
  item 4 exit criteria — session exclusion, deterministic resource locking, short
  transactions, release/reacquisition, and the authorized concurrency behavior
  including the one authorized synthetic-PONR-crossing sequence and its mandatory
  cluster destruction — are met). `OC-C3D-LOCK-001` is advanced from
  `PARTIALLY_SATISFIED` to **`SATISFIED`** (traceability matrix updated; accepted
  checkpoint recorded as `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`).
- **Accepted evidence** includes: two independently bootstrapped fresh disposable
  PostgreSQL 18.4 clusters; exact ordered `db/01` through `db/76` application;
  classification-faithful 64-row synthetic corpus; deterministic session
  advisory-lock key; same-generation exclusion; different-generation
  independence; release and reacquisition; automatic advisory-lock release on
  backend disconnect; owner-only lock-command boundary; zero advisory-lock
  leakage; the installed Component B resource-lock order; a real staged blocker
  and `pg_blocking_pids` evidence; two real T1/T2 sessions with a real PostgreSQL
  lock wait; T2's fresh post-commit absolute-total delta re-evaluation; no
  stale-delta result; unchanged deadlock counter; exactly one synthetic PONR
  crossing per disposable cluster; idempotent replay; idempotency-conflict
  rejection; deterministic LIFO reversal; the immutable imported-balance floor;
  direct depth-1 fence denial; the legitimate nested `ordem_compra_item` and
  movement runtime; mandatory destruction of both post-PONR clusters; read-only
  shared-development invariance; zero persistent database mutation.
- **Traceability row updated** (`OC-C3D-LOCK-001`): `IMPLEMENTATION_ARTIFACT` =
  `db/75_ordem_compra_c3c_inactive_cutover.sql` + `tests/ordem-compra-c3d-lock-concurrency.mjs`;
  `TEST_OR_EVIDENCE` = the session advisory-lock matrix, installed deterministic
  Component B resource-lock order, staged blocker and independent observer-query
  evidence, two real T1/T2 sessions, real PostgreSQL lock wait, fresh post-commit
  absolute-total delta, no stale delta, idempotent replay and idempotency
  conflict, deterministic LIFO reversal, imported-balance floor, depth-1 denial,
  nested item/movement runtime, one synthetic PONR crossing per cluster,
  mandatory complete cluster destruction, two fresh-cluster passes, read-only
  shared-development invariance; `ENVIRONMENT` = `DISPOSABLE_LOCAL_POSTGRES_18_4 +
  DEVELOPMENT_DB_UCRJTFSWNFDLXWTMXNOO_READ_ONLY`; `ACCEPTED_CHECKPOINT` =
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`.

**Z.1.a Documentary precision correction (non-blocking).** The `PHASE-C3D-E`
two-session blocking evidence was **not** produced by one fixed observer backend
running every blocking query. The test:

- creates and captures a backend PID labelled *observer*;
- **closes that marker session**;
- performs the actual `pg_blocking_pids` / `pg_stat_activity` observations
  through independent transient observer queries.

Recorded accurately as: **INDEPENDENT OBSERVER CONNECTIONS CONFIRMED THE T1/T2
BLOCKING RELATIONSHIP.** This is a non-blocking documentary precision correction;
the accepted technical artifact (`tests/ordem-compra-c3d-lock-concurrency.mjs`)
is **not** changed.

**Z.1.b `saldo_fios` / `saldo_fios_op` disposition.**

- `ordem_compra_item` and inventory-movement runtime were empirically exercised;
- direct depth-1 `saldo_fios` mutation was denied with `55000`;
- the installed `saldo_fios`/`saldo_fios_op` exception was structurally proven to
  require `pg_trigger_depth() > 1 AND canonical_active`;
- the fixed target scenario produced no excess because `kg_alocado` 15.500 was
  greater than the maximum tested total 15.000;
- therefore `saldo_fios`'s excess branch was **not empirically executed** in this
  scenario (proven structurally and by the direct depth-1 denial, not claimed as
  a mutation that did not occur);
- `saldo_fios_op` is **`NOT_APPLICABLE`** to the installed receipt/reversal/import
  write topology;
- this does **not** block `OC-C3D-LOCK-001`, whose accepted §M exit criteria are
  session exclusion, deterministic locking, short transactions,
  release/reacquisition, authorized concurrency, synthetic PONR crossing, and
  cluster destruction.

### Z.2 Aggregate PHASE-C3D closeout (STEP 2)

All accepted sublots:

- `PHASE-C3D-A`: **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** — accepted
  checkpoint `096cd60325e4987010d328c856ee6a3a51ca66bf`.
- `PHASE-C3D-B`: **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** — accepted
  checkpoint `5441321014883c4e8149dc8b20da9d053a193699`.
- `PHASE-C3D-C`: **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** — accepted
  checkpoint `6fd63a56a123d6d006353c6ae629611cbc7c01e9`.
- `PHASE-C3D-D`: **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** — accepted
  checkpoint `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`.
- `PHASE-C3D-E`: **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED** — accepted
  checkpoint `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`.

All `PHASE-C3D` requirements:

- `OC-C3D-DEPLOY-001`: **SATISFIED**.
- `OC-C3D-FENCE-001`: **SATISFIED**.
- `OC-C3D-ACL-001`: **SATISFIED**.
- `OC-C3D-LOCK-001`: **SATISFIED**.

- `PHASE-C3D-F` (aggregate closeout & readiness disposition): **CLOSED / ACCEPTED
  / DOCUMENTATION-ONLY**. The final `PHASE-C3D-F` documentation commit is the
  **closeout-documentation checkpoint, not a new technical evidence checkpoint**.
- Aggregate material phase — `PHASE-C3D`: **CLOSED /
  ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED**. `ACCEPTED_TECHNICAL_CHECKPOINT`:
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`.

`PHASE-C3D` did **not** execute a real cutover. This closeout does **not** advance
or satisfy `OC-CUTOVER-001`, `OC-CUTOVER-PONR-001`, `OC-C4-ADMIN-001`,
`OC-C4-SUPPLIER-001`, or `OC-C5-EMISSION-001`; each remains as previously
dispositioned (`PLANNED` / `PARTIALLY_SATISFIED` / `PLANNED` / `DEFERRED` /
`PLANNED` respectively) and separately governed.

### Z.3 Thirteen unmapped rows — supervisor disposition (STEP 3)

**Supervisor decision: the 13 unmapped legacy rows are DEFERRED to the
`REAL_CUTOVER` readiness gate. They do not block `PHASE-C3D` closeout.**

- exact ids: **`153` through `165`**;
- all are `rascunho` / `pendente` / `nao_recebido`;
- `kg_recebido` is NULL;
- they remained outside the 51-row mapped/frozen canonical corpus;
- Component A cannot project them;
- Component B must fail `mapeamento_compat_ausente` if invoked for them;
- `PHASE-C3D` creates **no** mapping, bridge, migration, backfill, or exclusion
  record for them.

Before `REAL_CUTOVER` may be authorized, a separate read-only completeness
diagnosis must disposition **every one** of the 13 rows by exactly one of:

1. authorized mapping/backfill and re-baseline;
2. documented exclusion from the cutover corpus with business-owner approval;
3. cancellation/removal through a separately authorized business-data action.

`REAL_CUTOVER` remains **BLOCKED from authorization** until that disposition is
recorded. This is a binding prerequisite and hard authorization gate recorded in
`PROJECT_STATE.md` (open items), `AGENT_HANDOFF.md`,
`docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this contract closeout, the
`OC-CUTOVER-001` traceability residual debt, and `docs/ledgers/G28_LEDGER.md`.
`OC-CUTOVER-001` is **not** marked `BLOCKED` — its canonical allowed disposition
remains `PLANNED` and the gate is recorded as a residual-debt authorization
prerequisite (the governance model prefers residual-debt gating over a
disposition change).

### Z.4 Residual debt (STEP 4)

Non-blocking `PHASE-C3D` debts:

1. The 13 unmapped rows are a binding `REAL_CUTOVER` completeness gate.
2. The exact real historical reconciliation totals remain real-cutover evidence:
   39 headers; 44 entries; 20,221.280 kg; 405.980 kg excess.
3. The synthetic corpus does not substitute for the real-cutover totals proof.
4. Real `close_final_acl` invocation remains unauthorized.
5. Real activation remains unauthorized.
6. Real read-authority switch remains unauthorized.
7. Any productive receipt on a shared or real environment remains unauthorized.
8. The validator active-contract self-test fixture limitation remains
   governance-harness debt.
9. The mandatory Node suite retains pre-existing nondeterminism; no accepted C3D
   pass introduced a new failing identity.
10. The C3D-E fixed scenario did not produce an excess line and therefore did not
    empirically mutate `saldo_fios`; the installed exception and direct denial
    were proven, and this is not an `OC-C3D-LOCK-001` exit criterion.
11. `saldo_fios_op` is not part of the installed receipt/reversal/import write
    topology and is `NOT_APPLICABLE` to C3D-E.

Separately governed real-cutover work is **not** described as incomplete C3D
implementation.

### Z.5 Final canonical state (STEP 5)

- `LAST_ACCEPTED_PHASE`: **PHASE-C3D**.
- `ACTIVE_PHASE`: **NONE**.
- `ACTIVE_PHASE_CONTRACT`: **NONE**.
- `ACTIVE_TRACK`: **PURCHASE_ORDER_PHASE_C**.
- `ACCEPTED_CHECKPOINT`: **429aa3980c7027b9d872a1902e2f31f1a4a85a2a**.
- `PHASE-C3D`: **CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED**.
- `NEXT_AUTHORIZABLE_ACTION`: **architect authorization decision for `PHASE-C4` —
  ADMIN RECEIPT UI**.

`PHASE-C4` is not authorized by this pass; `PHASE-C5` is not authorized;
`REAL_CUTOVER` is not authorized. The next chat must re-read the canonical
repository before authoring or executing any `PHASE-C4` order.

### Z.6 Read-only shared-development closeout check

Using SELECT-only access to `ucrjtfswnfdlxwtmxnoo`, confirmed once during this
pass (no DDL, no DML, no mutating RPC, no role/policy mutation, no remote fence/
activation/receipt/cutover action):

- migrations `75` (`20260720234958`) and `76` (`20260720235820`) present;
- cutover singleton `legacy_active` / `flat` / `not_started`; every
  snapshot/import/final-ACL/activation/PONR/generation/count marker NULL;
- business counts: `ordens_compra_fio` = 64; `ordem_compra` = 51;
  `ordem_compra_item` = 51; `ordem_compra_item_alocacao` = 51;
  `ordem_compra_item_compat_fio` = 51; `necessidade_compra_fio` = 64;
  `saldo_fios` = 5; `saldo_fios_op` = 0; `ordem_compra_recebimentos` = 0;
  `ordem_compra_fio_lancamentos` = 0; `ordem_compra_fio_movimentos_estoque` = 0;
- advisory locks = 0.

### Z.7 Validation and custody

Documentation-only closeout. `node scripts/validate-spec-custody.mjs` PASS;
`git diff --check` and `git diff --cached --check` clean; the known
active-contract self-test fixture-harness limitation surfaced only at the baseline
checkpoint `429aa3980c7027b9d872a1902e2f31f1a4a85a2a` as `R1: ACTIVE_PHASE_CONTRACT is not an existing file` and no longer triggers at final (`ACTIVE_PHASE_CONTRACT` is `NONE`) — a baseline-only artifact, not a new self-test failure and not a claimed fix. Full mandatory Node-suite failing-identity
differential (detached temporary worktree at
`429aa3980c7027b9d872a1902e2f31f1a4a85a2a`, `node --test tests/**/*.js`): final
failing identities minus baseline failing identities = empty (no new failing
identity). Exactly seven authorized documents changed
(`PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`, this
contract, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
`docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
`docs/ledgers/G28_LEDGER.md`); zero technical file changed; zero new/deleted file;
every accepted technical artifact byte-identical. The single closeout commit is
`docs: close C3D purchase-order rehearsal`; one clean fast-forward push to
`staging/dev` is authorized for it.

### Z.8 Disposition

- `PHASE-C3D-E`: **CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED**
  (`429aa3980c7027b9d872a1902e2f31f1a4a85a2a`).
- `PHASE-C3D-F`: **CLOSED / ACCEPTED / DOCUMENTATION-ONLY**.
- `PHASE-C3D` (aggregate): **CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY
  VERIFIED**; accepted technical checkpoint
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`.
- `OC-C3D-DEPLOY-001` / `OC-C3D-FENCE-001` / `OC-C3D-ACL-001` /
  `OC-C3D-LOCK-001`: all **SATISFIED**.
- `OC-CUTOVER-001` (`PLANNED`), `OC-CUTOVER-PONR-001` (`PARTIALLY_SATISFIED`),
  `OC-C4-ADMIN-001` (`PLANNED`), `OC-C4-SUPPLIER-001` (`DEFERRED`),
  `OC-C5-EMISSION-001` (`PLANNED`): **unchanged**.
- **NEXT_AUTHORIZABLE_ACTION:** architect authorization decision for `PHASE-C4` —
  ADMIN RECEIPT UI. `PHASE-C4`, `PHASE-C5`, and `REAL_CUTOVER` are not authorized;
  the `REAL_CUTOVER` window stays BLOCKED from authorization until the 13-row
  completeness disposition is recorded. **HARD STOP — `PHASE-C4` is not begun in
  this pass.**
