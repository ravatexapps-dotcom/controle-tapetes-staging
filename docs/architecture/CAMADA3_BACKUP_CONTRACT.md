# CAMADA 3 — Backup Contract (BK3)

> **Status:** `PROPOSED` — this contract states the binding premises for
> every later `G28-CAMADA-3` subphase (`BK4.1`-`BK8`); it does not itself
> authorize implementation. Ratification of this document is a distinct
> act from authorization of any subphase — each subphase still requires
> its own explicit architect order (permanent project rule: phases do
> not chain automatically).
> **Origin phase:** `G28-CAMADA-3-DIAGNOSIS-R1` (read-only diagnosis,
> 2026-07-17) — `ACCEPTED as reported` by the architect, together with
> three scope/trigger/destination decisions incorporated below.
> **Precedent:** `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`
> (spec format, subphase/gate table, module-plan style).
> **Not a source of current state.** Operational state lives in
> `PROJECT_STATE.md`; continuity in `AGENT_HANDOFF.md`; history in
> `docs/ledgers/G28_LEDGER.md`.

---

## CRITICAL CAVEAT — SGAA is not a backup engine reference

The diagnosis (`G28-CAMADA-3-DIAGNOSIS-R1`) mapped SGAA_clean_baseline's
backup subsystem (Flask + SQLite) for information architecture and UX
only. Its **engine and I/O assumptions are REJECTED, not adapted**: the
SQLite online-backup API and atomic file-swap restore (Postgres has no
single file to swap); the `@app.after_request` opportunistic
pseudo-scheduler with in-process, non-persisted cooldown state (a static
browser app has no request lifecycle to hook — this is the fact that
drives the trigger-agnostic design in §5); server-side OAuth token
storage Fernet-encrypted in the app DB (a static GitHub-Pages app holds
no server secret); and SGAA's absent tested-restore drill, which
directly violates this project's own master-plan rule ("a backup
without a tested restoration is not reliable",
`DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md:772`).

**Correctly borrowed (kept in this contract):** the GFS multi-window
retention model (§2), "manual backups never expire" (§2), SHA-256 +
essential-table verification of restore inputs (§3), the per-destination
upload log with last-error surfacing (§4), and the principle that
restore is the product, not an afterthought (§6).

---

## Architect decisions incorporated (2026-07-17)

These decisions replace the ranked options raised in the diagnosis —
they are no longer open choices, they are premises of this contract:

1. **Scope (ratified):** backup = the database — `public` schema data +
   the **full `auth` schema** (not just `auth.users`; the diagnosis's
   `auth.identities` finding is accepted — a restore without it cannot
   log in). Document bytes are **out of scope by design** — they live in
   Google Drive (Drive-first architecture); this contract states that
   explicitly so no future reader assumes otherwise. Supabase Storage:
   0 buckets today; each cycle re-verifies this and fails loudly if a
   bucket ever appears.
2. **Trigger:** `DEFERRED BY ARCHITECT`. Likely GitHub Actions or Vercel
   cron, decided when hosting is decided. Consequence for design: the
   exporter must be **trigger-agnostic** — a self-contained, idempotent,
   parameterized job invokable by GH Actions, Vercel cron, or an
   operator by hand, with no logic living in the trigger itself.
   Registered: `CAMADA3-TRIGGER-SELECTION`, `NOT AUTHORIZED`, blocks the
   "automated" half of the publication criterion.
3. **Destinations:** multi-destination by design, SGAA's per-provider
   pattern. Google Drive = primary, implemented now (reuses the
   Ingestor's OAuth pattern). OneDrive = second destination,
   **interface-ready, not configured** — the contract, the schema
   (`backup_runs` records destination per upload), and the exporter must
   support N destinations from day one; OneDrive ships disabled with its
   wiring in place. No hardcoded single-target assumption anywhere.

---

## 1. Scope

### In scope

- **`public` schema** — full row data across all tables currently
  defined in `db/01`-`db/63` (≈40 tables; live staging count confirmed
  38 base tables), plus a schema DDL dump for restore-into-scratch
  convenience (the repo's `db/*.sql` remains the authoritative schema
  *source*; the bundle's DDL is a convenience snapshot, not a
  replacement for it — see the migration-ledger exclusion below).
- **Full `auth` schema** — not just `auth.users`. Includes
  `auth.identities`, `auth.sessions`, `auth.refresh_tokens`,
  `auth.mfa_factors`, and every other `auth.*` base table (23 confirmed
  live). **Rationale (ratified):** `public.usuarios.id` is 1:1 with
  `auth.users.id` (`CODE_HEALTH_RULES.md` §11), but a real login also
  requires `auth.identities` (the row that stores the password
  credential linkage) — a restore of `auth.users` alone produces
  accounts that exist but cannot authenticate. This is exactly the kind
  of restore-fidelity gap §6's drill exists to catch.
- **A manifest per bundle** — SHA-256 (§3), per-table row counts (§3),
  timestamp, source project ref, and (informational only, not
  authoritative — see exclusion below) the migration count recorded in
  `supabase_migrations.schema_migrations` at backup time.

### Explicitly out of scope (by design, not by omission)

- **Document bytes** (PDF/XML). Canonical store is **Google Drive**
  (`services/documents-ingestor/README.md` — "Drive-first" architectural
  decision). `public.document_candidates` and related tables hold only
  pointers (`drive_file_id`, `drive_web_view_link`, `sha256`) — never
  the bytes themselves (confirmed: no `bytea`/base64 column anywhere in
  `db/*.sql`). This contract does not back up Drive content; Drive's own
  durability/versioning is the protection for those bytes. **This must
  be stated explicitly in every downstream artifact (runbook, UI panel)
  so no future reader assumes the database backup covers documents.**
- **Supabase Storage.** 0 buckets / 0 objects confirmed live as of this
  contract's ratification. Each backup run **must re-verify bucket count
  as a pre-flight check**; if a bucket is ever found, the run **fails
  loudly** — non-zero exit, `backup_runs.status='failed'`,
  `error_message` naming the exact gap (`storage_bucket_appeared`) —
  rather than silently producing an incomplete backup that looks
  successful.
- **Documents Ingestor local state**
  (`services/documents-ingestor/data/app.db`, outbox JSONL, exports,
  cache, `google-token.json`). Lives on the operator's machine,
  gitignored, out of this contract's scope. Partly rebuildable from the
  `public.document_candidates`/`document_events` projection already
  covered by the in-scope `public` dump; partly independent (Gmail
  scan-dedup state, local cache). Registered as a residual local-backup
  responsibility for the operator — not solved by this contract.
- **Edge Function deployed secrets**
  (`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_URL`/`SUPABASE_ANON_KEY`, set
  via `supabase secrets`, read via `Deno.env.get` — identical pattern
  across all 5 admin functions). **Inventory only, never backed up in
  plaintext.** Function source is already versioned
  (`supabase/functions/*/index.ts`); the deployed secret *values* are
  dashboard-only and must be re-set by hand during any full-project
  recovery. The manifest may record *which* secrets a function expects
  (already documented per-function README), never their values.
- **Migration ledger** (`supabase_migrations.schema_migrations`).
  Confirmed live as a **partial, unreliable** record (14 of 63
  migrations present; even `db/51` is absent). This contract does not
  attempt to back up or reconstruct it, and no restore procedure may
  rely on `supabase db push`/migration replay as the schema source of
  truth. **The repo's `db/*.sql` remains authoritative** for any
  from-scratch schema rebuild.

---

## 2. Cadence and retention

Adopts SGAA's GFS (Grandfather-Father-Son) multi-window model,
re-scaled for this project's size and for a trigger-agnostic exporter —
cadence is a property of whichever trigger is eventually selected
(§5), not of the exporter itself.

| Window | Period | Suggested capture interval | Suggested slots kept |
|---|---|---|---|
| W0 — Last 24h | 24h | every run (minimum daily) | 2 |
| W1 — Last 7 days | 7d | daily | 7 |
| W2 — Last 4 weeks | 4wk | weekly | 4 |
| W3 — Last 12 months | 12mo | monthly | 12 |

- **Manual backups never expire** (SGAA's rule, ratified) — any run
  with `triggered_by='manual'` is exempt from retention pruning and
  never consumes a GFS slot. This explicitly includes pre-migration and
  pre-restore-drill manual runs.
- Retention pruning applies **per destination independently** — a
  bundle may be pruned from one destination on a different schedule
  than from another; there is never a single global prune shared across
  destinations.
- The exact interval/slot *values* above are configurable (mirrors
  SGAA's editable retention policy); the **4-tier GFS window structure**
  is the ratified default shape.
- **Minimum cadence: at least daily** once the app is live and the
  trigger is wired — this bounds the restore SLO's data-loss window
  (§6).

---

## 3. Integrity

- **SHA-256** computed over each backup bundle (or per constituent file
  — `schema_public`, `data_public`, `auth_full`) at creation time,
  **stored** in the run's manifest and in `backup_runs` — never
  recomputed-on-faith later without a persisted value to compare
  against. (SGAA computes a ZIP SHA-256 but never persists it for later
  re-verification — a gap this contract deliberately closes.)
- **Per-table row counts**, captured at backup time for every in-scope
  table, persisted in the manifest. This is the **restore assertion
  baseline** (§6) — a restore counts as proven only once every table's
  row count on the restored target matches the manifest exactly, with
  the **append-only canonical history tables**
  (`document_link_revisions`, `document_link_revision_ops`,
  `usuarios_eventos`, `op_eventos`, `pedido_eventos`) treated as a
  **hard failure on any mismatch**, never a warning.
- **Essential-table presence check** (SGAA precedent, adapted): at
  minimum `usuarios`, `pedidos`, `ops`, `document_candidates`, and
  `document_link_revisions` must exist and be non-empty-or-intentionally
  -empty per the manifest before a restore is considered structurally
  valid.
- Exact bundle format and per-file hashing scheme are an implementation
  decision reserved for `BK4.2` (the exporter); this contract only binds
  that a hash **must** be computed and **must** be persisted alongside
  the row-count baseline, both queryable from `backup_runs` without
  reopening the bundle.

---

## 4. Destinations — N-destination contract

- `backup_runs` (or a child table keyed to it) records **one row per
  (backup attempt, destination)** pair, so a single logical backup run
  carries independent per-destination status — SGAA's per-provider
  pattern, ratified.
- **Google Drive — primary, implemented now.** Reuses the Documents
  Ingestor's existing OAuth pattern
  (`services/documents-ingestor/src/connectors/oauth.ts`/`drive.ts`) and
  scope discipline (`drive.file`, never the broad `drive` scope) — a
  **new, dedicated OAuth grant and folder for backups**, separate from
  the Ingestor's document folder, so a backup-bundle exposure is a
  distinguishable surface from a documents exposure. Folder convention:
  a dedicated root (e.g. `Ravatex Backups`), not nested inside the
  Ingestor's `Ravatex Documents Ingestor` root.
- **OneDrive — second destination, interface-ready, NOT configured.**
  The `backup_runs` schema, the exporter's destination abstraction, and
  this contract itself must not hardcode "Drive" as the only possible
  value — `destination` is an enumerated/extensible field
  (`google_drive`, `onedrive`, future values), and the exporter's upload
  step must be a pluggable per-destination adapter from day one.
  OneDrive **ships disabled** (no credentials configured, no scheduled
  upload attempted) until a separate order enables it — no `BK4`+
  subphase may hardcode a single-destination assumption that would need
  rework to add OneDrive later.
- Each destination independently records: last successful upload
  timestamp, last error (sanitized, truncated — SGAA's
  `backup_logs`/last-error pattern), and its own retention state (§2).
- **Known limit, registered explicitly:** the multi-destination contract
  exists so a single Drive-account incident does not equal total backup
  loss — but **as of this contract, with only Drive implemented, a
  Drive-account incident IS still a full-backup-loss risk.** This
  remains true until a second destination is actually turned on, not
  merely interface-ready.

---

## 5. Trigger-agnostic exporter contract

Per the architect's ruling (§ "Architect decisions incorporated", item
2), the trigger mechanism is deferred; the exporter must not assume or
depend on any one of them.

- **Invocation:** a single, self-contained, parameterized
  command/script (e.g. `npm run backup:export -- --confirm`), runnable
  identically from a GH Actions step, a Vercel cron function, or an
  operator's terminal. No branching logic keyed on "which trigger called
  me."
- **Inputs:** DB connection credentials via **environment variables
  only** (never CLI arguments, which can leak into process listings/
  logs); an explicit `--confirm` (or equivalent) intent flag mirroring
  the Ingestor's `--confirm-real-google` safety pattern (dry-run is the
  default — matching this repo's established convention); per-destination
  credentials/tokens likewise via environment/secret store — **never
  committed to the repo, never hardcoded**, matching the existing Edge
  Function (`Deno.env.get`) and Ingestor (`.env`, gitignored) precedents.
- **Outputs:** the bundle (schema + `public` data + full `auth` dump) at
  a defined local/temp path; the manifest (SHA-256 + row counts +
  timestamp, §3); and a structured result envelope (mirrors the
  Ingestor's `watch:scan-requests` envelope shape:
  `{ok, dry_run, destinations: [{name, status, error}], manifest: {...}}`).
- **Exit codes:** `0` only on full success (dump + manifest + at least
  the primary destination upload succeeded); non-zero on any failure,
  with the specific failure classified in the result envelope (dump
  failure vs. upload failure vs. the storage-bucket-appeared pre-flight
  failure of §1).
- **Idempotency:** a re-run for the same logical period must not corrupt
  or duplicate `backup_runs` history — each invocation creates its own
  new row(s). The exporter does not need the claim/lock concurrency
  pattern of `document_scan_runs` (that pattern exists for a queue
  consumer; a backup export does not mutate app data and has no queue to
  consume).
- **Recording:** every invocation (dry-run or real) writes a
  `backup_runs` row via a dedicated `service_role` writer RPC (mirrors
  the `document_scan_runs`/`db/38` precedent) —
  `status IN ('running','completed','failed')`,
  `triggered_by` (`manual`|`scheduled`|the eventual trigger's own
  label), timestamps, manifest fields, one row per destination attempt
  (§4).
- **Never in the trigger:** retention pruning logic (§2), destination-
  adapter logic (§4), and manifest/hash computation (§3) all live in the
  exporter itself, never in whatever schedules it — so selecting or
  switching triggers later requires zero change to the exporter.

---

## 6. Restore SLO and drill contract

- **Restore SLO:** recovery point objective (RPO) bounded by the backup
  cadence (§2, minimum daily) — worst-case data loss is under 24h once
  the automated trigger is live. Recovery time objective (RTO) is not
  yet committed — it depends on the restore tooling built in `BK7`;
  registered as an open parameter for that subphase.
- **Drill cadence:** **at least monthly, and mandatorily after every
  schema migration** (a new `db/NN_*.sql` file merged). A schema change
  is exactly the scenario most likely to silently break a restore (a new
  table missed by the exporter, a new constraint the restore order
  violates, etc.).
- **Drill target:** a **scratch Supabase project or local Postgres
  instance — never the live/staging DB, never production.** Same
  discipline already established in `docs/BACKUP_AND_RESTORE.md`
  ("Nunca 'testar restore' na base viva").
- **Drill procedure (binding, mechanical):**
  1. Take the most recent bundle from the primary destination.
  2. Verify its SHA-256 against the manifest.
  3. Restore schema DDL, then the **full `auth` schema**, then `public`
     data in FK-safe order, into the scratch target.
  4. Assert every table's row count against the manifest baseline (§3)
     — any mismatch fails the drill.
  5. **Attempt a real login** with a known test credential against the
     restored `auth` schema — the proof that `auth.identities` (not
     just `auth.users`) restored correctly. A schema-only or
     `auth.users`-only restore that "looks complete" but cannot
     authenticate a real user **fails the drill.**
  6. Confirm the append-only canonical history tables are present and
     non-empty where the manifest says they should be
     (`document_link_revisions`, `usuarios_eventos`, etc.).
  7. Record the drill's dated result (pass/fail, counts, evidence). This
     record's permanent home is formalized structurally by `BK8`; this
     contract only binds that the drill must happen and must produce
     dated evidence.
- **Disqualification rule** (already applied in the diagnosis, restated
  here as binding): any backup mechanism whose restore path cannot be
  exercised by this drill in staging is disqualified from being the
  primary mechanism.

---

## 7. Explicit limits

- **Production restore is never rehearsed against production.** The
  drill (§6) proves the mechanism into a scratch target; a real recovery
  of the live production project is not, and cannot be, a staging
  exercise. This is a structural limit of this contract, not a gap for a
  future `BK` to close — it must be flagged every time backup readiness
  is discussed for a production go-live.
- **Account/vendor loss is out of scope.** Total loss of the Google
  account holding the Drive destination (or, later, the Microsoft
  account for OneDrive), or of the GitHub organization/repo hosting the
  exporter and its eventual trigger, is not mitigated by this contract
  beyond the multi-destination design (§4). Single-destination operation
  (the current state — Drive only) is a known, accepted risk until a
  second destination is actually enabled, not merely interface-ready.
- **The automated trigger is deferred** (architect decision 2) — until a
  trigger is selected and wired, this system is **exporter-ready but not
  yet automatically scheduled.** The publication criterion's "automated"
  half (`G28-GOVERNANCE-CONSOLIDATION-A`) is not satisfied by `BK3`/`BK4`
  alone; it requires `CAMADA3-TRIGGER-SELECTION` (registered
  `NOT AUTHORIZED`) to close.
- **Storage-object backup is not covered** beyond the pre-flight
  zero-bucket check (§1). If Storage usage is ever introduced, this
  contract must be revised through a new `BK` — not a silent scope-creep
  into the exporter.

---

## 8. Stale-docs finding (registered, not fixed here)

`docs/BACKUP_AND_RESTORE.md` and `docs/STAGING_BASELINE.md` both
describe a pre-Documents-feature world: "16 tabelas", "0 buckets" (still
factually true today, but now unverified-by-process rather than a
one-time snapshot fact), and a restore procedure that dumps only
`auth.users` — not the full `auth` schema this contract now requires.
Both documents are **stale relative to this contract** as of its
ratification. **Their refresh is registered as part of `BK7`**
(controlled-restore runbook) — not performed in this docs-only `BK3`
phase, to keep this phase's single scope intact
(`CODE_HEALTH_RULES.md` §14).

---

## BK sequence recap (status as of this contract)

| BK | Title | Status |
|---|---|---|
| BK1 | Audit existing app | `CLOSED / ACCEPTED` (docs) — delivered by `G28-CAMADA-3-DIAGNOSIS-R1` |
| BK2 | Map to Ravatex | `CLOSED / ACCEPTED` (docs) — delivered by `G28-CAMADA-3-DIAGNOSIS-R1` |
| **BK3** | **Backup contract** | **`CLOSED / ACCEPTED` (docs) — this document** |
| BK4.1 | `backup_runs` schema + service_role writer RPC | `NOT AUTHORIZED` — pending its own order |
| BK4.2 | The exporter (trigger-agnostic, §5) | `NOT AUTHORIZED` — pending its own order; **own risk gate** (DB credential + `auth` schema handling) |
| BK5 | Read-only UI panel + manual-trigger write | `NOT AUTHORIZED` — pending its own order; mockup gate before build |
| BK6 | Retention and history (GFS pruning, §2) | `NOT AUTHORIZED` — pending its own order |
| BK7 | Controlled-restore runbook + stale-docs refresh (§8) | `NOT AUTHORIZED` — pending its own order; **own risk gate** (data-restore) |
| BK8 | Real recovery test (the drill, §6) | `NOT AUTHORIZED` — pending its own order; **own risk gate** |
| — | `CAMADA3-TRIGGER-SELECTION` | `NOT AUTHORIZED` — blocks the "automated" half of the publication criterion |
| — | Production wiring (secrets, schedule, restore rehearsal) | `NOT AUTHORIZED` — **staging-only boundary in force** |

None of `BK4.1`-`BK8` or `CAMADA3-TRIGGER-SELECTION` are authorized by
this contract — each requires its own explicit, individual architect
order (permanent project rule: phases do not chain automatically).

---

## STRUCTURAL POLICY COMPLIANCE

- **Canonical files read:** `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  (CAMADA 3 §, `L732-796`), `docs/BACKUP_AND_RESTORE.md`,
  `docs/STAGING_BASELINE.md`, `docs/architecture/CODE_HEALTH_RULES.md`
  (in full), `PROJECT_STATE.md`/`AGENT_HANDOFF.md`,
  `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` (format
  precedent), plus the read-only diagnosis's full evidence base (live
  staging schema/extension/storage/migration-ledger queries, Ingestor
  source, Edge Function source).
- **Applicable invariants:** staging-only execution boundary
  (`STAGING-ONLY-EXECUTION-BOUNDARY-A`) — every subphase this contract
  premises builds/verifies against staging only, production wiring
  explicitly deferred (§7); `auth.users.id = public.usuarios.id` (§11)
  — unaffected, this contract only concerns backup/restore of both
  schemas together, never a schema change; single-scope-per-phase (§14)
  — this contract stays docs-only, no code/SQL/staging/production
  touched; language policy (§19) — English throughout, ready for pt-BR
  UI strings once `BK5` builds the panel.
- **Rejected proposals:** SGAA's SQLite-backup engine, atomic file-swap
  restore, Flask `after_request` pseudo-scheduler, server-side
  OAuth+Fernet token storage, and SGAA's absent restore drill (see
  Critical Caveat above).
- **Conflicts found:** none among the Tapetes canonical documents; one
  practice conflict between SGAA and the master plan (no tested restore)
  — resolved in favor of the master plan's stricter rule (§6). One
  stale-doc finding (§8) — registered for `BK7`, not fixed here.
- **Decisions reserved for the architect:** authorization of each `BK4.1`
  -`BK8` subphase individually; the mockup gate before `BK5`; the
  trigger selection (`CAMADA3-TRIGGER-SELECTION`); enabling the second
  (OneDrive) destination; any future revision of this contract if
  Storage usage is introduced (§7).

---

**PROPOSED — no subphase authorized; each one requires explicit,
individual architect authorization.**
