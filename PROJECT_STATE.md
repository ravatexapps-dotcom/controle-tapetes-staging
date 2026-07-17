# CANONICAL CURRENT STATE

This file is the single source of the **current** operational state per front:
active phase, next authorizable action, binding decisions in force, live debts,
environment facts and an index of closed phases. It does **not** hold historical
closeout narratives — those were moved by `PROJECT-STATE-COMPACTION-A`
(2026-07-16) and `PROJECT-STATE-COMPACTION-B` (2026-07-17) to
`docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`, verbatim and in their original
order, and are indexed under "Closed phases" below. Full per-phase closeouts also
live in `docs/ledgers/G28_LEDGER.md`.

HEAD, working tree, staging and divergence must be consulted directly in Git
(`git rev-parse HEAD`, `git status --short --untracked-files=all`).

## Active phase and next action

- **Active track:** `PRODUCTION-MIGRATION-M0-M10` — the ordered migration plan
  (new repo + new Supabase project + Vercel) proposed by
  `PRODUCTION-READINESS-DIAGNOSIS-R1` (`ACCEPTED`, 2026-07-17;
  `docs/reports/PRODUCTION_READINESS_DIAGNOSIS_R1_2026-07-17.md`) and registered as
  the **active track** by the ratification order of the same date. All ten phases
  (`M0`-`M10`) are `NOT AUTHORIZED`, each pending its own individual order; phases
  do not chain automatically.
- **`BACKLOG FREEZE` in force (2026-07-17):** **no NEW fronts** until after cutover
  (`M10`). Only the **`M0`-`M10` migration plan** and the **canonical residual risk
  register** (12 items, ranked — see "Live debts and candidates") are authorizable
  work. All pre-existing candidate fronts are frozen-in-place as `POST-LAUNCH DEBT`.
- **Next authorizable action:** an individual order for `M0` (new repo landing —
  full-history push of 749 commits to `inttexsystem/inttracker`), or any other
  `M0`-`M10` phase. Target coordinates: GitHub `inttexsystem/inttracker`, Supabase
  `gqmpsxkxynrjvidfmojk`, Vercel `vercel.com/inttex`.
- **Post-launch debt pointer (frozen):** the former Camada-3 subphases (`BK5`
  read-only UI panel — mockup gate first; `BK6` retention; `BK7` restore runbook;
  `BK8` formalized drill; `CAMADA3-TRIGGER-SELECTION`) and the two ex-`PRE-PUBLICATION`
  asterisks (`A2-SERVER-SIDE-ENFORCEMENT`, `A2-CREATE-NIVEL-ACESSO-WIRING`), plus
  `A6-GLOBAL-AUDIT-VIEW` / `AUDIT-ACTOR-SNAPSHOT`, are now entries in the canonical
  residual risk register. **`G28-CAMADA-2` — TRACK `COMPLETE` / `CLOSED / ACCEPTED`**
  in staging (full scope `A1-A7` + password policy; all `A2`/`A3`/`A4`/`A5`/`A6`
  subphases `CLOSED / ACCEPTED`, rows in "Closed phases", full narratives archived +
  in the ledger).
- **Open architect decisions:** `NONE` blocking the active migration track. Part-1
  decisions of this order (key regime, launch user model, standing pre-launch items)
  are ruled and recorded under "Binding decisions in force".
- **Workspace:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`.
  **Branch:** `work/g28-document-qualification`. **Allowed remote:** none — no push
  without express authorization in this chain.

## Binding decisions in force

Condensed statements of the rulings that constrain future work. Full recorded
decisions (verbatim) are in `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`
(Architect Decision + `PROJECT-STATE-COMPACTION-B` sections) and in
`docs/archive/pt-BR/PROJECT_STATE.md`.

### Pre-migration decisions (`PROJECT-STATE-COMPACTION-B` order, 2026-07-17)

- **Key regime — new format (binding):** the new project standardizes on the
  **new-format keys** (`sb_publishable_…` + a matching secret key). No legacy
  `anon`/`service_role` JWTs. The regime is applied consistently across
  `js/config.js`, `scripts/backup/*`, `scripts/staging/*`, the Ingestor (both the
  in-repo `services/documents-ingestor/` copy and the standalone twin at
  `D:\OneDrive\Programação\Ravatex\documents-ingestor\`), and the asserting tests.
  **The secret key never appears in chat or the repo** — `supabase secrets` /
  Vercel env / GitHub Actions secrets only.
- **Launch user model — full-trust admins only (binding):** **no `somente_leitura`
  admin may be created in production** until `A2-SERVER-SIDE-ENFORCEMENT` closes.
  The constraint **is** the mitigation — the underlying risk is unchanged; exposure
  is zero **only while the constraint holds**. Consequently
  `A2-SERVER-SIDE-ENFORCEMENT` and `A2-CREATE-NIVEL-ACESSO-WIRING` rank **FIRST-WEEK**
  (not before-first-user) in the residual risk register.
- **Standing PRE-LAUNCH items (ratified from the diagnosis):** `DELETE-PROD-GUARD-A`;
  the backup trigger via **GitHub Actions** + the **`BK7` restore runbook**; and the
  **auth-restore rehearsal into a throwaway Supabase project before `M3`**. These are
  the before-first-user set the architect holds standing; the register's other
  before-first-user framings are advisory.

### Migration governance

- **`PRODUCTION-READINESS-DIAGNOSIS-R1` — `ACCEPTED` / ratified reference report
  (2026-07-17):** `docs/reports/PRODUCTION_READINESS_DIAGNOSIS_R1_2026-07-17.md`
  (precedent `BACKLOG_RECONCILIATION_R1`). Its residual risk register (12 items,
  ranked) is canonical (restated under "Live debts and candidates"); its `M0`-`M10`
  plan is the active track. Read-only — authorizes no implementation by itself.
- **Amended publication criterion (2026-07-17 — amends and supersedes
  `G28-GOVERNANCE-CONSOLIDATION-A`):** publication no longer waits on the full
  `G28-CAMADA-3` track — **it proceeds with Camada 3 at `BK4.2`** (exporter proven +
  restore-smoke passed). Remaining Camada-3 scope + the two ex-asterisks
  (`A2-SERVER-SIDE-ENFORCEMENT`, `A2-CREATE-NIVEL-ACESSO-WIRING`) become
  `POST-LAUNCH DEBT` with production consequences (residual register). The reviewer
  objection (recommended minimum pre-launch set) is **recorded and overruled** — the
  architect decides which items close before cutover (see "Standing PRE-LAUNCH
  items"). The superseded original criterion (`both` Camada-2 and full Camada-3
  CLOSED in staging) is preserved **verbatim** in the archive
  (`PROJECT-STATE-COMPACTION-B` batch) and the ledger; in any wording divergence, the
  archive is authoritative.
- **`BACKLOG FREEZE` (2026-07-17, binding):** no NEW fronts authorizable until after
  cutover (`M10`); only the `M0`-`M10` plan and the residual register survive.
- **Canon correction (2026-07-17):** branch `work/g28-document-qualification` commit
  count is **749** (`git rev-list --count HEAD`), not "~555". Governs the `M0` push.
- **Staging-only execution boundary (`STAGING-ONLY-EXECUTION-BOUNDARY-A`,
  2026-07-15, partially superseded):** the current operational environment is the
  staging Supabase `ucrjtfswnfdlxwtmxnoo`; the protected project
  `bhgifjrfagkzubpyqpew` is `OUT OF SCOPE` and must not be accessed. Its item (7)
  ("Vercel may be evaluated later, not selected now") and its production-migration
  postponement are **superseded** by the amended publication criterion and the
  active `M0`-`M10` track — the new project `gqmpsxkxynrjvidfmojk` (not the protected
  project) is the sanctioned migration target. The don't-touch rule for
  `bhgifjrfagkzubpyqpew` remains fully in force. Full original text in the archive.

### Standing product / process rulings

- **`G28-CAMADA-3` status:** at `BK4.2` — `BK4.1` (`backup_runs` schema, `d39a848`)
  and `BK4.2` (exporter, `4831ca3` + fixes; real staging run
  `ae55e714-…`, bundle `83378` bytes, restore-smoke 63/63 tables incl.
  `auth.identities=8`) both `CLOSED / ACCEPTED` in staging. Remaining subphases +
  trigger are `POST-LAUNCH DEBT`. A live `CAMADA3-OAUTH-GRANT-COUPLING` debt is
  registered (see below). Full BK narrative archived; contract at
  `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`.
- **`G28-CAMADA-2` classification — `CLOSED / ACCEPTED`, track `COMPLETE`
  (2026-07-17):** entered classified `PRE-EXISTING PARTIAL CAPABILITY + FULL SCOPE
  A1-A7 DEFERRED` (`G28-RECONCILIATION-DECISIONS-A`); exits `CLOSED / ACCEPTED` with
  full `A1-A7` + password policy delivered. Functional reference during the build:
  `D:\OneDrive\Programação\SGAA_clean_baseline`. Full narrative archived.
- **`G28-C`:** `CLOSED / TECHNICALLY ACCEPTED — ARCHITECT PRODUCT VALIDATION
  PENDING`; `G28-B8` `TECHNICALLY COMPLETED / ACCEPTANCE SUBSUMED BY G28-C`.
- **`PROJECT-CONTROL-BASELINE-R1` (ChatGPT):** `REJECTED / NOT RATIFIED`; its
  correction `CANCELLED / ABSORBED / SUPERSEDED` by
  `BACKLOG-RECONCILIATION-READONLY-R1` (the adopted reference baseline).
- **Supervision governance:** progress/continuity/scope/authorizations/phases/
  documentation are held by Claude (chat) + Claude Code (resident); ChatGPT is a
  process consultant **without state custody and without authority to issue orders**.
  The supervision protocol (`docs/governance/SUPERVISION_PROTOCOL.md`) requires a
  `STRUCTURAL POLICY COMPLIANCE` section in every implementation phase report.
- **Admin password auto-reset BLOCKED (`A5.1-A5.2`):** an admin cannot reset their
  own password (`SELF_RESET_FORBIDDEN`) — they use the normal self-service change
  flow (`A4.2`).
- **User audit trail design (`A6.1`/`A6.1-B`/`A6.2`, canonical):**
  `public.usuarios_eventos` has two mutually-exclusive write paths keyed on
  `auth.uid()` — `trg_usuario_evento` (`db/60`) for authenticated-admin direct
  `UPDATE`s, and each of the five admin Edge Functions (under `service_role`,
  `auth.uid() IS NULL`) recording its own action. Both populate the identity-snapshot
  columns (`db/61`); `usuario_id` is `ON DELETE SET NULL` (`db/61`) so events survive
  `admin-delete-user`. Detail: `docs/DOCUMENTATION_INDEX.md` §4.
- **`UI-EL-BOOLEAN-ATTR-FIX` — OPEN active regression (`A5.3-A5.4` closeout,
  2026-07-16; residual register #9):** `js/ui.js`'s `el()` calls `setAttribute(k, v)`
  unconditionally for boolean attrs, so `setAttribute('checked'/'disabled', false)`
  still renders true. The `A5.3-A5.4` rewrite dropped the vulnerable pattern for the
  Desativar/Reativar control; the Excluir button in `admin-usuarios.js` still carries
  it (suspect, unconfirmed). Same root cause as the residue already fixed in
  `expedicao-admin.js`. Not yet fixed. Full narrative archived.
- **`TEST-MOCK-FIDELITY-AUDIT` — `CLOSED / ACCEPTED` (read-only, 2026-07-17):** zero
  confirmed (c) structurally-blind doubles masking a live bug; shared-double
  `tests/_doubles.js` `APPROVED`, `§20` added to `CODE_HEALTH_RULES.md`, lots
  `L1`/`L2` `AUTHORIZED` (both since `CLOSED / ACCEPTED`). Report
  `docs/reports/TEST_MOCK_FIDELITY_AUDIT_2026-07-17.md`; full narrative archived.
- **Controlled Delete × document history:** physical deletion of Pedido/OP is
  blocked when canonical document history exists (`document_link_revisions`/
  `document_link_revision_ops`, append-only, never deleted); permanent contract in
  `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`.
- **Language policy:** English for canonical state documents, reports and new
  code/comments/commit messages; pt-BR for user-facing UI text; architect orders may
  be issued in Portuguese but are recorded in English (original preserved in the
  ledger/archive); phase IDs and embedded terms (e.g. `Camada N` ↔ `G28-CAMADA-N`)
  never translated. Homes: `docs/governance/DOCUMENTATION_MODEL.md` §18,
  `docs/architecture/CODE_HEALTH_RULES.md` §19,
  `docs/governance/SUPERVISION_PROTOCOL.md` §3; `CLAUDE.md` pointer-summary.

## Live debts and candidates

- **CANONICAL RESIDUAL RISK REGISTER (12 items, ranked — `PRODUCTION-READINESS-
  DIAGNOSIS-R1` §4, 2026-07-17):** authoritative list with per-item consequence in
  the report §4. Ranked, timing as amended by this order's Part-1 decisions:
  (1) `A2-SERVER-SIDE-ENFORCEMENT` — FIRST-WEEK; (2) `DELETE-PROD-GUARD-A` —
  **BEFORE-FIRST-USER** (data-loss); (3) Camada 3 incomplete (`BK5`-`BK8`, no
  trigger/retention/runbook/drill) — **trigger (GitHub Actions) + `BK7` runbook
  BEFORE-FIRST-USER**, rest first-week; (4) `CAMADA3-OAUTH-GRANT-COUPLING` —
  first-week; (5) `A2-CREATE-NIVEL-ACESSO-WIRING` — FIRST-WEEK;
  (6) `IS-ADMIN-ACL-REVIEW`; (7) `A6-GLOBAL-AUDIT-VIEW`; (8) `AUDIT-ACTOR-SNAPSHOT`;
  (9) `UI-EL-BOOLEAN-ATTR-FIX` (active regression) — first-week;
  (10) `CODE-HEALTH-AUDIT-§18-R1`; (11) `DELETE-AUDIT-LOG-A`; (12) `G28-CAMADA-4`
  (6-12 deferrable except where noted). All 12 are `POST-LAUNCH DEBT` under the
  amended criterion. **Standing before-first-user set** (Part 1c):
  `DELETE-PROD-GUARD-A` (#2), the #3 trigger + `BK7` runbook, and the auth-restore
  rehearsal into a throwaway Supabase project before `M3`.
- **`NOT AUTHORIZED` candidate fronts (all frozen by the backlog freeze):**
  `CODE-HEALTH-AUDIT-§18-R1` (read-only §18 audit; `cadastros.js` decomposition +
  baseline test-debt triage); `PUBLICATION-TRACK-REVIEW`; `UI-EL-BOOLEAN-ATTR-FIX`
  (`CONFIRMED — ACTIVE REGRESSION`, not fixed); `G28-D` publication;
  `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE` (superseded by the active
  `M0`-`M10` track); `DELETE-PROD-GUARD-A`; `DELETE-AUDIT-LOG-A`; `G28-CAMADA-4`;
  `A4.3` (email/SMTP invites).
- **`CAMADA3-TRIGGER-SELECTION` — `NOT AUTHORIZED` (registered `BK3`, 2026-07-17):**
  the automated-backup scheduler; the diagnosis resolved the mechanism —
  **GitHub Actions, not Vercel cron** (the exporter shells out to `pg_dump`/`psql`,
  which Vercel serverless cannot run). Part of residual register #3. Contract:
  `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`.
- **`CAMADA3-OAUTH-GRANT-COUPLING` — `NOT AUTHORIZED`, live debt (`BK4.2`,
  2026-07-17; register #4):** the exporter's first real run used the **Documents
  Ingestor's own OAuth client** (confirmed via Google's `tokeninfo`), not a dedicated
  grant; rotating/revoking that grant would also break backups. Decision: formalize
  the reuse (contract §4) or build a separate client. Detail:
  `docs/architecture/CAMADA3_BACKUP_CONTRACT.md` §4 amendment.
- **`CAMADA3-DRIVE-ACTIVATION` — partially exercised, `NOT AUTHORIZED` as a standing
  capability (`BK4.2`):** one real manual `google_drive` upload succeeded in staging
  (`ae55e714-…`); not yet repeated/scheduled/production-standing.
- **`A2-SERVER-SIDE-ENFORCEMENT` (#1) + `A2-CREATE-NIVEL-ACESSO-WIRING` (#5) —
  `NOT AUTHORIZED`, `POST-LAUNCH DEBT` / FIRST-WEEK:** RLS and the admin Edge
  Functions key exclusively on `usuarios.tipo`; `nivel_acesso='somente_leitura'` is
  client-side only, bypassable via direct API from a `tipo='admin'` JWT;
  `is_admin_full()` (`db/62`) exists and is unused; `admin-create-user`'s fixed
  column list drops `nivel_acesso` (new admins land `completo`; wiring needs an Edge
  Function change). **Both moot at launch** under the full-trust-admins-only
  constraint (no `somente_leitura` admin in production until #1 closes).
- **`IS-ADMIN-ACL-REVIEW` — `NOT AUTHORIZED` (registered `A2.1-B`, 2026-07-17;
  register #6):** `public.is_admin()` grants `EXECUTE` to
  `PUBLIC`/`anon`/`authenticated`/`service_role` — broader than the db/54/57
  least-privilege standard; tightening touches every RLS policy that calls it, so it
  needs its own read-only diagnosis. Not a current exposure (`is_admin()` is `false`
  for anon via `auth.uid()`).
- **Small code-health debts (frozen, folded into `CODE-HEALTH-AUDIT-§18-R1`):**
  `cadastrosModalGrid` dead helper in `js/screens/cadastros.js` (zero call sites);
  6 tests in `tests/auth.smoke.js` with an outdated `<script src="js/auth.js">`
  regex; `js/screens/admin-usuarios-modal.js` at 576 lines (decomposition candidate);
  `tec-to-acabamento-flow`'s 2 stale static-slice assertions (false-red brittle
  regexes; source content present); legacy `docs/AI_AGENT_RULES.md` review (stale
  counts/context).
- **Stale git-worktree registrations (2, `NOT AUTHORIZED` cleanup):**
  `tapetes-baseline-check` and `baseline-check-a34` under
  `controle-tapetes/.git/worktrees/` — empty/missing `gitdir`, prunable; auto-prune
  fails with `Permission denied` (OneDrive/AV lock), a harmless recurring warning
  that does not affect commits. Await one authorized `git worktree prune`.
- **Open non-blocking debts:** `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED` /
  `AUTHENTICATED_BROWSER_SMOKE_BLOCKED_BY_TOOLING` (G28-C/D/B7/Client Portal);
  `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY` (applied+verified in staging, no
  drift, no history row fabricated); production application of the staging-only stack
  (`db/12`, `db/21`, `db/30`, `db/49`–`db/57`).
- **UI tracks — `CLOSED / ACCEPTED` in their authorized scope, full narratives
  archived:** `UI-ACTION-BUTTON` (phases i/ii, lots 1/2 + `UI-USERS-GRID-TEXT-
  OVERFLOW`; lot 3 `cadastros.js` frozen; frozen candidates `MODAL-BUTTON-CSS-CHECK`,
  `fornecedor.js` redesign) and `UI-GRID-TEXT-OVERFLOW` (contract + helper + Lots
  A/B/C; frozen candidate `UI-FIXED-FORMAT-COLUMN-WIDTHS` — §7 CNPJ/date/phone column
  wrap; `UI-DOCUMENTOS-RECEBIDOS-LAYOUT-FIX` already `CLOSED / ACCEPTED`, `90726dd`).
- **Test baseline (RESOLVED, historical):** the "~87 / 11 failures" figures were
  stale artifacts (fixed-port `:8765` + removed inline `<script>` assertions), fixed
  by `L2` (`2c9a4c2`). Full note archived.

## Environment and worktree standing facts

- **Staging Supabase:** `ucrjtfswnfdlxwtmxnoo` (authorized). **Protected/other:**
  `bhgifjrfagkzubpyqpew` (`OUT OF SCOPE`, never accessed).
- **Migration targets (all newly created, empty):** GitHub `inttexsystem/inttracker`;
  Supabase `gqmpsxkxynrjvidfmojk` (new-format publishable key supplied; matching
  secret key to be obtained out of band); Vercel `vercel.com/inttex` (repo-linked).
  Wiring `NOT AUTHORIZED` until the relevant `M0`-`M10` order.
- **Publication provider:** **Vercel selected** (per the amended publication
  criterion, 2026-07-17); GitHub Pages remains the live provider until cutover.
- **Branch commit count:** `work/g28-document-qualification` = **749** commits.
- **Migrations 49 and 50 (and the staging-only stack):** applied and verified in
  staging; not applied in production by this chain.
- **Worktree topology:** `controle-tapetes-g28` is a linked worktree of
  `controle-tapetes/.git` (alongside `controle-tapetes-g27`,
  `controle-tapetes-controlled-delete-gate`, and the main `work/app-next`).
  `work/app-next` is divergent from `staging/work/app-next` and dirty. Two stale
  worktree registrations remain (see "Live debts").
- **Push:** not authorized in this chain. **Production:** never accessed.
- **`supabase/.temp/`:** local Supabase CLI cache, **gitignored** since commit
  `be6f081` (was leaking the project ref + pooler URL).

## Closed phases

Full closeout narratives are archived, verbatim, in
`docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (compaction A + B batches, same
order as below) and in `docs/ledgers/G28_LEDGER.md`. Commit SHAs are the accepted
technical commits; documentation-only phases show `(docs)`. Consult HEAD with
`git rev-parse HEAD`.

| Phase | Status | Date | Commit(s) |
|---|---|---|---|
| Ratify Production Readiness Diagnosis + Backlog Freeze — `PRODUCTION-READINESS-DIAGNOSIS-R1` (ratification) | `CLOSED / ACCEPTED` | 2026-07-17 | `be6f081`, `9566837` (docs) |
| Production Readiness Diagnosis (read-only) — `PRODUCTION-READINESS-DIAGNOSIS-R1` | `ACCEPTED` | 2026-07-17 | (report) |
| Camada 3 — Exporter First Real Run + Restore-Smoke — `BK4.2` | `CLOSED / ACCEPTED` | 2026-07-17 | `4831ca3`, `75f8ff9`, `153b2a2`, `51c4633`, `e11d05e` |
| Camada 3 — Backup Runs Schema — `BK4.1` | `CLOSED / ACCEPTED` | 2026-07-17 | `d39a848` |
| Camada 3 — Backup Diagnosis (read-only) + Backup Contract — `G28-CAMADA-3-DIAGNOSIS-R1` + `BK3` | `CLOSED / ACCEPTED` | 2026-07-17 | (docs) |
| Camada 2 — Legacy User Screen Removal — `A3.4` (closes `G28-CAMADA-2` track) | `CLOSED / ACCEPTED` | 2026-07-17 | `32e466a` |
| Camada 2 — Admin Access Level Modal Wiring + Pilot Enforcement — `A2.2` + `A2.3` | `CLOSED / ACCEPTED` | 2026-07-17 | `09eb2a0` |
| Camada 2 — Admin Access Level Schema + ACL Correction — `A2.1` + `A2.1-B` | `CLOSED / ACCEPTED` | 2026-07-17 | `f108c45` |
| Test-Double Shared Module + Stale-Assertion Cleanup — `L1` + `L2` | `CLOSED / ACCEPTED` | 2026-07-17 | `54ee8aa`,`4d2f304`,`520c9a6`,`2c9a4c2` |
| Test Mock Fidelity Audit (read-only) — `TEST-MOCK-FIDELITY-AUDIT` | `CLOSED / ACCEPTED` | 2026-07-17 | (docs) |
| Admin Edge Function Response Envelope Fix — `UI-INVOKE-ENVELOPE-FIX` | `CLOSED / ACCEPTED` | 2026-07-17 | `7b37e8e` |
| Camada 2 — User Audit Panel (read-only) — `A6.3` | `CLOSED / ACCEPTED` | 2026-07-17 | `e31f269` |
| Camada 2 — Audit Trail Wiring (Edge Functions) — `A6.2` | `CLOSED / ACCEPTED` | 2026-07-17 | `b67b126`, `7309349` |
| Camada 2 — Preserve User Audit Events on Profile Deletion — `A6.1-B` | `CLOSED / ACCEPTED` | 2026-07-16 | `fa8e1b9` |
| Camada 2 — User Audit Trail Schema + Trigger — `A6.1` | `CLOSED / ACCEPTED` | 2026-07-16 | `ee0e77b` |
| Users Grid — Text Overflow Ellipsis — `UI-USERS-GRID-TEXT-OVERFLOW` | `CLOSED / ACCEPTED` | 2026-07-16 | `3e95e86` |
| UI Action Button — Users and Ops Screens Migration — `UI-ACTION-BUTTON-MIGRATION-2` | `CLOSED / ACCEPTED` | 2026-07-16 | `abfb95e` |
| UI Action Button — Order Lists Migration — `UI-ACTION-BUTTON-MIGRATION-1` | `CLOSED / ACCEPTED` | 2026-07-16 | `31b66af` |
| UI Action Button — Helper Primitive — `UI-ACTION-BUTTON-HELPER` (phase ii) | `CLOSED / ACCEPTED` | 2026-07-16 | `bbfd58c` |
| UI Visual Contract — Row-Level Icon Button Amendment (phase i) | `CLOSED / ACCEPTED` | 2026-07-16 | (docs) |
| UI Grid Text Overflow — contract + helper + Lots A/B/C — `UI-GRID-TEXT-OVERFLOW` | `CLOSED / ACCEPTED` | 2026-07-16 | `0a1457b`, `cfa8b4b` |
| Documentos Recebidos Layout Fix — `UI-DOCUMENTOS-RECEBIDOS-LAYOUT-FIX` | `CLOSED / ACCEPTED` | 2026-07-16 | `90726dd` |
| `DOC-LANGUAGE-MIGRATION-L1` — Governance documents translated to English | `CLOSED / ACCEPTED` | 2026-07-16 | `cab741c`, `ce4b693` |
| Camada 2 — Administrative Password Reset — `A5.1-A5.2` | `CLOSED / ACCEPTED` | 2026-07-16 | `b726717` |
| Camada 2 — User Reactivation — `A5.3-A5.4` | `CLOSED / ACCEPTED` | 2026-07-16 | `f886e26` |
| Camada 2 — Last Access RPC Consumption in the UI — `CAMADA2-LAST-ACCESS-UI` | `CLOSED / ACCEPTED` | 2026-07-16 | `0aff22f` |
| Camada 2 — Mandatory Password Change Guard — `A4.2` | `CLOSED / ACCEPTED` | 2026-07-16 | `6c624ef` |
| Camada 2 — Temporary Password and Last Access Read Model — `A4.1 + CAMADA2-LAST-ACCESS-RPC` | `CLOSED / ACCEPTED` | 2026-07-16 | `bf0d522`, `c6289f8` |
| Architect Decision — Publication Criterion and Candidate Fronts — `G28-GOVERNANCE-CONSOLIDATION-A` | `CLOSED / ACCEPTED` (superseded 2026-07-17) | 2026-07-15 | (docs) |
| Architect Decision — Staging-Only Execution Boundary — `STAGING-ONLY-EXECUTION-BOUNDARY-A` | recorded (partially superseded) | 2026-07-15 | (docs) |
| Architect Decision — Backlog Reconciliation and Supervision Governance — `G28-RECONCILIATION-DECISIONS-A` | recorded | 2026-07-15 | (docs) |
| Camada 2 — User Administration — Proposed Spec — `CAMADA2-USUARIOS-SPEC-MATERIALIZE-R1` | `PROPOSED` | 2026-07-15 | (docs) |
| Camada 2 — User Screen Extraction — `CAMADA2-USUARIOS-A3-1` | `CLOSED / ACCEPTED` | 2026-07-15 | `4f01101` |
| Camada 2 — Summary Cards and Toolbar — `CAMADA2-USUARIOS-A3-2` | `CLOSED / ACCEPTED` | 2026-07-15 | `b4a6238`, `3198570` |
| Document Qualification / Documents Ingestor — G28 (G28-C / G28-D discovery) | `G28-C: CLOSED / TECHNICALLY ACCEPTED — ARCHITECT PRODUCT VALIDATION PENDING` | 2026-07 | `271761c`, `edaf0b4` |
| Controlled Delete × Document History (Pedido/OP) | `CLOSED / ACCEPTED` | 2026-07 | `707a37b` |
| Admin/Pedido — Static Residue of the Completion Button (Expedição) | `CLOSED / ACCEPTED` | 2026-07 | `7978e0a` |
| Client Portal — Order Detail Read Model — `CLIENTE-ORDER-SUMMARY-READMODEL-APPLY-STAGING-A` | `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBTS` | 2026-07-15 | (verification-only) |
| Canonical Documentation — Consistency Backfill — `DOCS-CANONICAL-CONSISTENCY-BACKFILL-A` | `CLOSED / ACCEPTED` | 2026-07-15 | (docs) |
| Client Portal — ACL Grants Hardening — `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` | `CLOSED / ACCEPTED` | 2026-07-15 | `82f5ba7` |
| Canonical Documentation — Status Consistency of the Legacy Pedido↔OP Plans — `DOCS-PEDIDO-OP-LEGACY-PLAN-STATUS-CONSISTENCY-R1` | `CLOSED / ACCEPTED` | 2026-07-15 | (docs) |

> `DOC-LANGUAGE-MIGRATION-L2` (`632f103`), `PROJECT-STATE-COMPACTION-A` and
> `PROJECT-STATE-COMPACTION-B` (this phase) are recorded in
> `docs/ledgers/G28_LEDGER.md`, not as blocks here.

## Relevant standing debts (Documents front)

- Migrations 49 and 50 — applied and verified in staging; not applied in production
  by this chain.
- Later UI/runtime evolutions, the destination of the legacy RPC and any linking/
  revocation require a new architectural decision.
- Push — not authorized in this chain.

## Mandatory links

- Documentation governance model: `docs/governance/DOCUMENTATION_MODEL.md`
- Documentation authority arbiter: `docs/DOCUMENTATION_INDEX.md`
- Migration diagnosis (active track): `docs/reports/PRODUCTION_READINESS_DIAGNOSIS_R1_2026-07-17.md`
- Backup contract: `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`
- G28 master plan: `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
- Pedido/OP/Movimentação/Documentos plan: `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
- Ingestor local state (technical context): `services/documents-ingestor/PROJECT_STATE.md`
- Closed-phase closeouts (archive): `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`

## Historical reference

- Pre-model preservation: `docs/legacy/pre-model/MANIFEST.md`
- G28 front ledger: `docs/ledgers/G28_LEDGER.md`
- Archived PROJECT_STATE closeouts (2026-07): `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`
- pt-BR pre-translation original: `docs/archive/pt-BR/PROJECT_STATE.md`

The complete historical content that existed in this file before the first
compaction was preserved, byte for byte, in
`docs/legacy/pre-model/PROJECT_STATE_FULL_SNAPSHOT.md` (integrity manifest
`docs/legacy/pre-model/MANIFEST.md`; snapshot origin commit
`08b9af5e251de48e938600e5e4b4214e4d1e824e`; SHA-256
`7cacddd59c5b2fe9bae1add1a54a3433c370ccdad713bbd4010a1d11f1b39a98`). That snapshot
is not a source of current state and must not be edited nor receive new closeouts.
