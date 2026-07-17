# PRODUCTION-READINESS-DIAGNOSIS-R1 — REPORT

> **Date:** 2026-07-17
> **Type:** Read-only diagnostic. No file changes in this phase.
> **Classification:** Diagnostic/report — not normative by itself, does not alter state.
> **Precedent:** `docs/reports/BACKLOG_RECONCILIATION_R1_2026-07-15.md`.
> The architect's decisions made based on this report are recorded in
> `PROJECT_STATE.md` (amended publication criterion, backlog freeze, active
> migration track `M0-M10`, canonical residual risk register) and in
> `docs/ledgers/G28_LEDGER.md` (append-only entry). This document preserves the
> report, ratified as a reference report, as canonical evidence.

**Phase:** read-only. **File changes:** none in the diagnosis phase. **Access:**
read-only local Git + repo; **staging `ucrjtfswnfdlxwtmxnoo` read only via the
repo (no live queries issued in this phase)**; **production `bhgifjrfagkzubpyqpew`
not accessed**; no push. Three parallel read-only investigation agents gathered
the schema, config/functions/ingestor/backup, and git-state evidence below.

**Target environment (all newly created, empty):**
- GitHub: `inttexsystem/inttracker` (`https://github.com/inttexsystem/inttracker.git`)
- Supabase: `gqmpsxkxynrjvidfmojk` (`https://gqmpsxkxynrjvidfmojk.supabase.co`); the key supplied is the **new-format** publishable key (`sb_publishable_…`), not a legacy `anon` JWT — key-regime decision pending.
- Vercel: `vercel.com/inttex` (repo-linked).

---

## 1. MIGRATION INVENTORY

### 1.1 Schema — replay order and the authoritative path

**64 numbered migrations, `db/01`→`db/64`, contiguous, no gaps, no duplicate
prefixes.** Plus 5 read-only `*.verify.sql` companions (prefixes 44–48, do **not**
replay as schema) and one non-numbered `db/setup_completo.sql`.

**Authoritative reconstruction path = ordered replay of `db/01_*.sql` → `db/64_*.sql`**
(exclude the 5 `*.verify.sql`; run those afterward as post-checks). Both shortcuts
are traps:

- **`db/setup_completo.sql` is PARTIAL and STALE — do not use it.** Despite its
  header ("Faz tudo: schema + funções + RLS + GRANTs + seed"), it is a pre-Pedido
  baseline (~15 tables, roughly the `db/01–12` era), no date/version marker, and
  references none of the modern feature schemas (`nivel_acesso`, `backup_runs`,
  `documentos`, `document_scan`, `pedidos`, `op_latex`, `senha_temporaria`,
  `usuarios_eventos`). It reconstructs ≈1/5 of the current schema.
- **`supabase db push` / migration-replay is FORBIDDEN as the schema source**
  (CRITICAL FINDING). `supabase_migrations.schema_migrations` records **only 14 of
  63** (even `db/51` is absent), because the `db/01–48` baseline was applied via
  the SQL Editor and never recorded. Trusting the ledger would run ~14 migrations,
  **silently skip ~49**, and report success — a hollow schema.
  `docs/architecture/CAMADA3_BACKUP_CONTRACT.md:136-138` already bans this path.

No `supabase/migrations/` directory exists to port. The only non-`db/` SQL is
`services/documents-ingestor/src/storage/schema.sql` (local **SQLite**, out of
scope for the Postgres project).

### 1.2 Auth — migrate vs recreate

- **Recreate (fresh users):** every user gets a new `auth.uid()`; because
  `public.usuarios.id` FK-references `auth.users(id)`, any `public` data seeded
  from the old project would point at dead UUIDs — forcing a full re-seed with the
  new UUIDs. Passwords re-issued. Realistic only if `public` data also starts fresh.
- **Migrate (bundle restore):** the `BK4.2` exporter bundle already captures the
  **full `auth` schema, including `auth.identities`**, and the restore-smoke proved
  63/63 tables restore cleanly into scratch Postgres with 0 orphaned FK rows and
  intact password hashes. The bundle is therefore a ready-made auth+public vehicle
  that preserves every `auth.uid()` (FKs stay valid, passwords keep working) — the
  lower-risk path **if the current staging data is the intended production seed**.

**Stated plainly:** the restore has been proven **once, by hand, into a throwaway
cluster** — never into a real Supabase project, whose managed `auth` schema
(GoTrue-owned tables/triggers/`auth.schema_migrations`) may collide with a raw
restore. This is the single highest technical unknown (see §6).

### 1.3 Edge Functions — 5 functions, 3 secrets each

`supabase/functions/`: `admin-create-user`, `admin-delete-user`,
`admin-disable-user`, `admin-reactivate-user`, `admin-reset-user-password`
(+ non-secret `_shared/cors.ts`, `_shared/response.ts`). Each entry `index.ts`
reads the **same three** secrets via `Deno.env.get`: `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. **Re-set by hand** per function
in the new project. **Deploy order:** schema replay → set secrets → deploy all 5
(no inter-function dependency, but all touch `public.usuarios`/`auth.admin.*` and
enforce the `db/58` password policy). One README hardcodes the old `--project-ref`
in an example — update.

### 1.4 Client config — everything pointing at `ucrjtfswnfdlxwtmxnoo`

- **Single operational knob:** `js/config.js:30-31` (staging URL + anon key),
  consumed by `js/supabase-client.js:27-31`.
- **Environment-routing gotcha:** `detectAppEnvironment()` (`js/config.js:36-45`)
  routes **only** `grupoterrabranca.github.io` → `production`; **every other host,
  incl. any `*.vercel.app`, resolves to the `staging` block.** A Vercel deployment
  will read whatever is in the `staging` block. Interacts with the write-guard
  (`supabase-client.js:37-39`), which blocks writes only when URL == the
  `production` block URL.
- **Key-format decision:** supplied key is `sb_publishable_…` (new format); current
  config uses a legacy anon JWT. supabase-js v2 accepts both; a secret/service-role
  key for the new project is also needed (never pasted in chat / never committed).
- `index.html` cache-busting is **manual** `?v=<date-slug>` per `<script>` (no build
  step). Bump `js/config.js`'s tag after repointing.
- **~70 files** contain `ucrjtfswnfdlxwtmxnoo` (most docs/ledgers — leave per the
  immutability policy). Operational repoints beyond config.js:
  `scripts/backup/export-db.mjs:51` (`STAGING_REF`), every `scripts/staging/*.mjs`
  guard constant, and asserting tests (`tests/config.smoke.js`,
  `environment-banner.smoke.js`, `backup-export.smoke.js`,
  `controlled-delete.smoke.js`, `admin-disable-user-*e2e*`,
  `document-*-contract.test.js`). `supabase/.temp/*` is CLI cache, regenerated by
  `supabase link`.

### 1.5 Ingestor — what breaks the instant the project changes

`services/documents-ingestor/` needs, as a **matched set**, `SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_PROJECT_REF`:
`src/supabase/serviceRoleReaderClient.ts:30-49` throws
`supabase_project_ref_mismatch` if the URL's ref ≠ `SUPABASE_PROJECT_REF`. The
service-role key is project-specific and must be re-issued. Google OAuth config is
independent of the Supabase move (but see §4 coupling). A separate **standalone
twin** at `D:\OneDrive\Programação\Ravatex\documents-ingestor\` needs the same three
vars repointed.

### 1.6 Backup — history and credentials

- `backup_runs` history (2 rows in staging): **start fresh** in the new project —
  the history is small, staging-scoped, and its Drive uploads point at the old
  grant; `db/64` recreates the tables empty.
- Repoint: `PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD/PGSSLMODE` (new pooler host +
  password), `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (requires `db/64`
  present). Backup Google Drive OAuth (`BACKUP_GOOGLE_*`) is independent. Update the
  `STAGING_REF`/`PRODUCTION_REF` guard constants for the new ref.

### 1.7 Storage — 0 buckets, self-verifying

0 buckets today; document bytes live in Google Drive (`public.document_candidates`
holds only pointers; no `bytea`/base64 anywhere). The backup preflight **hard-fails
if bucket count ≠ 0**, so the new project must also start at 0 buckets — no
provisioning needed, self-verifying on the first backup run.

---

## 2. VERCEL + REPO-LINKED SUPABASE ASSESSMENT

- **Static-app pipeline:** no build step (`index.html` + `js/*.js` served directly)
  → zero-config Vercel static deploy. Config is **hardcoded in `js/config.js`, not
  read from env at runtime**, so Vercel's env-var machinery does not feed the client.
- **Does Vercel cron resolve `CAMADA3-TRIGGER-SELECTION`? — Largely NO.** The
  exporter shells out to **`pg_dump`/`psql` binaries** (`scripts/backup/lib/pg.mjs`).
  Vercel serverless/edge functions ship no Postgres client binaries and are
  time-limited (≤300s); Vercel Cron only invokes an HTTP endpoint. **GitHub Actions
  is the correct trigger** (can `apt-get install postgresql-client`, no wall-clock
  issue, native secret storage). Choosing Vercel for hosting does **not** settle the
  backup trigger.
- **Env-var handling:** Vercel env vars are inert for the static client unless a
  build step injects them; they are the right home for anything server-side added
  later. **Must NOT be committed / live only in Vercel env or `supabase secrets` or
  GitHub Actions secrets:** `SUPABASE_SERVICE_ROLE_KEY` (or new secret key),
  `PGPASSWORD`, `BACKUP_GOOGLE_*` tokens, ingestor service-role key, `.env`,
  `.ravatex-local/`, `backups/`.
- **Preview-deploy exposure of the DB — REAL RISK.** Repo-linked Vercel gives every
  branch/PR a publicly reachable preview URL; the static app ships the Supabase URL +
  anon key **inside committed `js/config.js`**, so every preview is a live public
  front-end gated only by RLS + the anon key. If the active config block points at
  the real production Supabase, **anyone with a preview URL reaches production data**
  through the app — amplified by §4's finding that a read-only admin has full API
  powers (RLS is the entire perimeter). The Vercel↔Supabase branching feature does
  not help (config is hardcoded, not per-branch-injected). **Mitigation:** disable or
  auth/password-protect preview deployments, and ensure the fallback (`staging`) block
  never points at production. Do not rely on URL obscurity.

---

## 3. NEW REPO — how the branch lands

- Branch `work/g28-document-qualification`, HEAD `4e5cce1`. **Real commit count =
  749** (the "~555" figure in prior docs is **stale** — corrected in canon).
  Existing remotes: `origin` → `grupoterrabranca/controle-tapetes`, `staging` →
  `ravatexapps-dotcom/controle-tapetes-staging`; **no upstream tracking** on the
  branch; neither remote is the new target.
- **SHA-citation exposure:** ~656 seven-hex tokens across 49 markdown files, mostly
  genuine commit citations in live governance docs (heaviest:
  `docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md` 109, `docs/ledgers/G28_LEDGER.md`
  51, `PROJECT_STATE.md` 46, `AGENT_HANDOFF.md` 29, ingestor handoff 28, closeouts).
  The governance model is evidence-anchored on these SHAs.
- **Recommendation: full-history push, preserving SHAs.** Add `inttexsystem/inttracker`
  as a new remote and push all 749 commits. Git SHAs are content-addressed and
  remote-independent, so **every citation stays valid** with zero remap work.
  **Squash / fresh-start (orphan) would invalidate all ~656 citations at once** and
  require a full SHA-remap across the ledgers — destroying the evidentiary chain that
  is this project's core governance asset. Rejected.
- **Worktrees & stale registrations:** the four worktrees (`controle-tapetes`
  [main, `work/app-next`], `controle-tapetes-controlled-delete-gate` [detached],
  `controle-tapetes-g27`, `controle-tapetes-g28` [this]) are local copies of the old
  `controle-tapetes/.git`; they do **not** travel over a `git push`. The two stale
  registrations (`baseline-check-a34`, `tapetes-baseline-check`, both confirmed
  prunable — "gitdir file does not exist") are local metadata in the old `.git` and
  **die here** — they never reach the new repo. **Recommendation:** after pushing,
  do a **fresh single-worktree clone** of the new repo as the new work home,
  abandoning the worktree sprawl.
- **Hygiene before the push:** `supabase/.temp/` was not gitignored (fixed by a
  separate technical commit before this ratification); no actual secrets are tracked.

---

## 4. RESIDUAL RISK REGISTER (canonical, ranked by production consequence)

| # | Risk | Concrete production consequence | Timing |
|---|------|--------------------------------|--------|
| **1** | **A2-SERVER-SIDE-ENFORCEMENT** | `somente_leitura` is UI-only; RLS + all 5 edge functions key on `tipo='admin'`; `is_admin_full()` (`db/62`) exists but no policy uses it. A "read-only" admin holds full write powers via direct API. | **BEFORE first real user** *if any read-only admin ships*; else first-week (by explicit ruling). |
| **2** | **DELETE-PROD-GUARD-A** | Destructive Pedido/OP ops are guarded by a staging-ref string check; the moment the new project is "production" holding real data, destructive ops have no environment backstop. | **BEFORE first real user** (data-loss class). |
| **3** | **Camada 3 incomplete — BK5/BK6/BK7/BK8 unbuilt** | No automated trigger, no retention, no runbook, no repeatable drill; restore proven once by hand into scratch, never into a real Supabase project. First real data loss = manual, unrehearsed recovery. | Trigger + BK7 runbook: BEFORE first real user. BK6/BK8: first week. |
| **4** | **CAMADA3-OAUTH-GRANT-COUPLING** | Backups authenticate with the Documents Ingestor's OAuth client; rotating/revoking it silently breaks backups — undocumented cross-subsystem SPOF. | First week (latent until a rotation); resolve while standing up backups in the new project. |
| **5** | **A2-CREATE-NIVEL-ACESSO-WIRING** | `admin-create-user` drops `nivel_acesso`; new admins land `completo`, need a follow-up edit. Subordinate to #1. | First week (paired with #1). |
| **6** | **IS-ADMIN-ACL-REVIEW** | `is_admin()` grants EXECUTE to PUBLIC/anon/service_role — broader than least-privilege; no active exposure (false for anon), but the RLS anchor is over-granted; tightening touches every policy. | First week / deferrable. |
| **7** | **A6-GLOBAL-AUDIT-VIEW** | `usuario_excluido` events unreachable from the per-user panel — a deleted user's audit trail is invisible. Forensics gap. | Deferrable (first month). |
| **8** | **AUDIT-ACTOR-SNAPSHOT** | Audit panel resolves actor identity by live join; a later-deleted acting admin blanks the actor line (subject's own snapshot survives via `db/61`). Audit-completeness gap. | Deferrable. |
| **9** | **UI-EL-BOOLEAN-ATTR-FIX** (active regression) | `el()`'s unconditional `setAttribute` renders `disabled:false`/`checked:false` as true; the "Excluir" button in `admin-usuarios.js` still carries the ternary pattern (suspect). A control can render disabled/checked when it shouldn't. | First week (UI-correctness, low blast radius). |
| **10** | **CODE-HEALTH-AUDIT-§18-R1** | Read-only tech-debt (`cadastros.js` decomposition, `cadastrosModalGrid` dead helper, stale test regexes). No runtime consequence. | Deferrable. |
| **11** | **DELETE-AUDIT-LOG-A** | Destructive actions not independently audit-logged. Forensics gap on deletions. | Deferrable / first month. |
| **12** | **G28-CAMADA-4** | Future scope, undefined. | Deferrable. |

The partial migration ledger (`DB30_NOT_RECORDED…`) is launch-blocking **only** if the wrong replay path is used; the correct ordered `db/*` path (§1.1) neutralizes it.

---

## 5. MINIMUM PRE-LAUNCH SET (recommendation; architect decides)

Judged must-close **before the first real user**:

1. **A2-SERVER-SIDE-ENFORCEMENT (#1)** — *conditionally mandatory.* Non-negotiable if
   the launch user model includes **any** read-only admin (the role is otherwise a
   lie and RLS is the whole perimeter, amplified by §2 preview exposure). If launch
   ships only full-trust admins it may drop to first-week — but as an **explicit
   architect ruling**, not an accident. Pairs with **A2-CREATE-NIVEL-ACESSO-WIRING (#5)**.
2. **A backup TRIGGER + a written restore RUNBOOK (part of #3)** — real customer data
   cannot sit behind a mechanism proven once by hand with no schedule and no runbook.
   Minimum: a GitHub Actions scheduled export + `BK7` runbook. `BK6`/`BK8` may be
   first-week.
3. **DELETE-PROD-GUARD-A (#2)** — the destructive-op guard must recognize the new
   production ref, or destructive ops run unguarded against live data. Small change,
   high consequence.
4. **One real end-to-end auth+restore rehearsal into a real (throwaway) Supabase
   project** — the single most valuable pre-launch de-risking action, because
   `auth`-schema restore into a live Supabase project has never been exercised (§1.2/§6).

**NOT recommended as pre-launch blockers:** IS-ADMIN-ACL-REVIEW, A6-GLOBAL-AUDIT-VIEW,
AUDIT-ACTOR-SNAPSHOT, CODE-HEALTH-AUDIT-§18-R1, DELETE-AUDIT-LOG-A, G28-CAMADA-4.

---

## 6. MIGRATION PLAN AS PROPOSED — `M0`-`M10` (each phase its own future order)

Nothing below is authorized by this diagnosis; each phase is a separate architect
order with a pass/fail gate.

- **M0 — New repo landing.** Add `inttexsystem/inttracker` remote; gitignore
  `supabase/.temp/` (done); **full-history push** of 749 commits to `main`; then a
  fresh single-worktree clone. **Gate:** new repo shows 749 commits, HEAD `4e5cce1`,
  clean tree, no secrets in history.
- **M1 — New Supabase project provisioning.** Confirm `gqmpsxkxynrjvidfmojk` empty;
  decide the **key regime** and obtain the secret/service-role key out of band.
  **Gate:** 0 buckets; project reachable; keys held securely.
- **M2 — Schema replay + verification.** Execute `db/01`→`db/64` in order (skip
  `*.verify.sql`), then run the 5 verifiers + a table/row-count assertion. **Gate:**
  inventory matches the staging fingerprint (≈40 `public` + 23 `auth` base tables);
  `nivel_acesso`, `is_admin_full()`, `backup_runs` present; **reject** any `db push`.
- **M3 — Auth migration.** Architect chooses recreate-fresh vs bundle-restore (§1.2);
  if restore, **rehearse into a throwaway Supabase project first**. **Gate:** login
  works; `auth.identities` populated; 0 orphaned FK rows. ⚠️ highest technical unknown.
- **M4 — Edge Functions + secrets.** Set 3 secrets per function; deploy all 5.
  **Gate:** a live `admin-*` call succeeds; service-role key absent from client assets.
- **M5 — Client config repoint.** Update `js/config.js` (new URL + key, correct
  environment block); bump `?v=` tags; update operational hardcoded refs + asserting
  tests. **Gate:** config/environment-banner tests green; smoke suite passes.
- **M6 — Vercel wiring.** Link the repo (framework "Other", static output); **decide
  preview-deploy policy** (disable / auth-protect); set server-side env vars in Vercel.
  **Gate:** production deploy renders; preview exposure policy enforced.
- **M7 — Smoke verification.** Drive the app on the Vercel URL (login, load a pedido,
  a read path). **Gate:** host resolves to the intended environment block; write-guard
  behaves; no console/network errors.
- **M8 — Ingestor repoint.** Update `SUPABASE_URL`/`SERVICE_ROLE_KEY`/`PROJECT_REF` as
  a matched set (in-repo + standalone twin). **Gate:** connects without
  `supabase_project_ref_mismatch`; a dry-run scan writes to the new project.
- **M9 — Backup repoint + first real run.** Repoint `PG*` + `SUPABASE_URL`/`SERVICE_ROLE_KEY`;
  update guard constants; run `export --confirm`; verify bundle SHA + `backup_runs` row
  + restore-smoke. Resolve `CAMADA3-OAUTH-GRANT-COUPLING`; stand up the **GitHub Actions
  trigger** and the **BK7 runbook**. **Gate:** one green backup + one restore-smoke in
  the new project; the scheduled trigger fires once.
- **M10 — Cutover.** Flip the primary URL to Vercel; first real user. **Gate:** the
  Minimum Pre-Launch Set (§5) is closed or explicitly waived by the architect.
- **Rollback path.** Until cutover, the old GitHub Pages + staging Supabase remain
  untouched — rollback = point users back at the old URL (no data unwind, since the
  new project is populated by replay/restore, not by moving the only copy). **After**
  M10 (real users writing to the new project), rollback means restoring the new
  project's latest backup into the old — which depends on M9's mechanism being solid.
  This asymmetry is why M9 must precede M10.

**What CANNOT be verified before going live:** (1) `auth`-schema restore into a
**live** Supabase project (only ever done into scratch); (2) real-user concurrency/RLS
behavior under the production key regime; (3) that the scheduled backup trigger fires
reliably over time (only the first invocation is testable); (4) preview-deploy exposure
under real branch/PR traffic; (5) backup→restore into the old project as a
post-cutover rollback.

---

## Summary judgment

The move is feasible and mostly mechanical for schema/config/functions; the one hard,
unverifiable-until-live piece is the **`auth`-schema restore into a real Supabase
project** (rehearse into a throwaway project first, M3). The three things that would
most hurt in production as-is: **read-only admin isn't real
(A2-SERVER-SIDE-ENFORCEMENT)**, **backups are proven once and un-runbooked (Camada 3)**,
and **destructive ops lose their environment guard the moment the new project is
production (DELETE-PROD-GUARD-A)**. Vercel does **not** resolve the backup trigger (use
GitHub Actions), and repo-linked preview deploys are a **real database-exposure vector**
for a static app that ships its Supabase key in-repo. Full-history push preserves the
ledger's SHA anchors and is the clear branch recommendation.

No changes were made in the diagnosis phase; nothing was pushed; production was not
accessed.
