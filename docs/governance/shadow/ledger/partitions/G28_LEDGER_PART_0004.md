<!-- GENERATED NON-CANONICAL SHADOW LEDGER PARTITION — DO NOT EDIT -->
<!-- partition_id: G28-LEDGER-PART-0004 -->
<!-- canonical_source: docs/ledgers/G28_LEDGER.md -->
<!-- source_unit_interval: G28-LEDGER-UNIT-0092..G28-LEDGER-UNIT-0103 -->
<!-- canonical_byte_interval: 385599..466053 -->
<!-- canonical_line_interval: 1820..2813 -->
<!-- payload_sha256: 9585870fda7671edab3646f69b413313f17765019d01a88dc3e08b0a0adf33f6 -->
<!-- oversized_single_unit: false -->
<!-- partition_status: CLOSED -->
<!-- G28_LEDGER_SHADOW_PAYLOAD_BEGIN_7b9d4e3a -->
## 2026-07-18 — M8 (Documents Ingestor repoint → gqmpsxkxynrjvidfmojk) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — explicit single-use architect order ("ARCHITECT AUTHORIZATION — M8 (Ingestor repoint)", Sonnet 5 → Opus 4.8 / medium effort). Configuration phase: no schema changes, no Supabase writes issued by Claude, no production data manipulation. Executed **out of numeric sequence** (ahead of `M4`-`M7`) by direct architect order — phases do not chain automatically; the architect may order any phase.
- **Front:** `PRODUCTION-MIGRATION-M0-M10`, phase `M8` (Ingestor repoint).
- **Problem:** the Documents Ingestor (two installations — the in-repo `services/documents-ingestor/` copy and the standalone operational twin at `D:\OneDrive\Programação\Ravatex\documents-ingestor\`) still wrote to legacy `ucrjtfswnfdlxwtmxnoo`; the live production project `gqmpsxkxynrjvidfmojk` was receiving no documents.
- **STEP 1 diagnosis (read-only) — config surfaces found:**
  - Two `.env` files (both gitignored, both held the legacy service-role JWT): in-repo (Supabase vars only, no Google creds) and the standalone twin (full Google OAuth creds + `INGEST_REAL_GOOGLE=true` — the copy the scheduled task actually runs).
  - **Windows Task Scheduler entry confirmed live** (read-only `Get-ScheduledTask`): task `Ravatex-DocumentScanWatcher-Staging`, logon trigger (user `klebe`), runs `powershell -File …\documents-ingestor\ops\watcher\Start-DocumentScanWatcher.ps1` → the **standalone twin**, confirming it as the real entry point.
  - **Hard-coded guard (not in the order, surfaced by diagnosis):** both `Start-DocumentScanWatcher.ps1` copies pin `$ExpectedProjectRef = 'ucrjtfswnfdlxwtmxnoo'` and refuse to start on mismatch — repointing `.env` alone would have bricked the scheduled watcher. Brought into scope.
  - Docs: both `docs/SUPABASE_WRITER_RUNBOOK.md` copies hardcoded "Staging Only / `ucrjtfswnfdlxwtmxnoo`".
  - Hermetic tests (`scan.test.ts`, `service-role-reader-client.test.ts`) reference the legacy ref only as fixture values — left untouched (test-double fidelity, `§20`).
- **Schema verification (live, read-only against `gqmpsxkxynrjvidfmojk`):** all tables the Ingestor writes exist (`document_candidates` 37 rows all with `drive_file_id`/`drive_web_view_link` populated, `document_scan_runs`, `document_scan_requests`, `document_events`, `document_decisions`, `document_technical_evidences`, `document_link_revisions`/`_ops`); all required RPCs present with `service_role EXECUTE` (`claim_next_document_scan_request`, `mark_document_scan_request_running`, `finish_document_scan_request`, `recuperar_document_scan_runs_travados`, `upsert_document_candidate_ingestor_state`, `iniciar_document_scan_run`, `finalizar_document_scan_run`, `solicitar_document_scan`). Nothing the Ingestor needs is missing.
- **Drive/OAuth (ruling #4, unchanged):** Drive folder resolution is by name (`GOOGLE_DRIVE_ROOT_FOLDER_ID` blank, create-missing=true) — independent of the Supabase project; repoint does not affect it. `CAMADA3-OAUTH-GRANT-COUPLING` debt stands unaffected.
- **Two order claims corrected against live evidence (both architect-withdrawn):**
  - **CI workflow:** the named `.github/workflows/ingestor-ci.yml` does **not exist** in either repo; no workflow references the prohibited production ref `bhgifjrfagkzubpyqpew` or any project ref (the only Ingestor CI is hermetic `npm test`, zero secrets). Nothing deleted. Architect withdrew ruling #2.
  - **`PRODUCTION-SECURITY-01` (`document_scan_runs` RLS-off / anon-INSERT):** premise **disproven live** — `document_scan_runs` has RLS enabled, one `is_admin()`-gated `ALL` policy, zero anon grants; all `document_*` siblings share that safe shape. Not registered (refused to record a canonical entry on a false premise). Architect withdrew ruling #3 and affirmed the refusal as the standard.
- **`ANON-GRANT-DEFENSE-IN-DEPTH` — registered (ruling #3b, the real finding):** the sibling sweep found **27 non-document `public` tables** carrying raw table-level `anon INSERT/UPDATE/DELETE` grants, inert today only because RLS policies (`is_admin()`/`meu_fornecedor_id()`/`meu_cliente_id()`) evaluate false for unauthenticated sessions. Not a live hole; the defect is that grants and policies disagree (no second line of defence). Pre-existing, faithfully migrated from the `db/*` grants. Registered as a **separate** `NOT AUTHORIZED` first-week candidate, cross-referenced to `IS-ADMIN-ACL-REVIEW` (table-grant scope vs anchor-function-ACL scope) — **not merged**. Full list in `PROJECT_STATE.md` "Live debts and candidates".
- **STEP 2 repoint applied — config surfaces changed (both installations):**
  - Both `.env` (gitignored): `SUPABASE_URL` + `SUPABASE_PROJECT_REF` → `gqmpsxkxynrjvidfmojk`; `SUPABASE_SERVICE_ROLE_KEY` → the new-format `sb_secret_` key **pasted by the architect directly** (never seen/logged/committed by Claude). Standalone twin's Google creds + `RAVATEX_CNPJS` preserved untouched. In-place `.*`-pattern substitution used deliberately so no byte of the old legacy secret (or the twin's Google client secret) was ever echoed into a tool call; even a 3-char key-prefix print was correctly blocked by the auto-mode classifier and abandoned.
  - Both `Start-DocumentScanWatcher.ps1`: `$ExpectedProjectRef` → `gqmpsxkxynrjvidfmojk`; guard message "authorized staging project" → "authorized target project".
  - Both `SUPABASE_WRITER_RUNBOOK.md`: "Staging Only / `ucrjtfswnfdlxwtmxnoo`" → "Sanctioned Target Project Only / `gqmpsxkxynrjvidfmojk`", worded to survive `M10` cutover without a second edit; adds the legacy + protected refs to the never-use list and notes the new-format key regime (same env-var name, new value format).
- **STEP 2 verification — real watcher cycle against `gqmpsxkxynrjvidfmojk` (`--once --confirm-real-google --confirm-supabase-write`):** the watcher claimed the one pre-existing active `gmail` request (`f3c3647e`, a migrated legacy intent), created scan run `e9287e0e` (`triggered_by=service_role_cli`), marked the request running, then **failed at the Gmail scan with `invalid_grant`** (expired Google OAuth token — the pre-flagged operational caveat, same failure mode as `BK4.2`'s earlier attempt), finalizing both run and request as `failed` (0 documents). **Repoint proven at the Supabase layer, confirmed live:** the Ingestor authenticated to the new project with the new `sb_secret_` key and all five writes landed (`request f3c3647e` requested→claimed→running→failed linked to `scan_run e9287e0e`); **schema compatible** — zero `migration_XX_required`/`PGRST202`/schema-cache errors, service_role writer gates fired. The legacy project was never contacted; the queue is left clean (no stuck `running` lock).
- **Architect decision at closeout (M8 close):** **accept the Supabase-layer proof** (new-key auth + schema compatibility + real writes landed) and **defer** the full Gmail→Drive→DB document demonstration as a follow-up gated on the Google OAuth token refresh — an interactive login that is the architect's action (credential/OAuth) and coupled to `CAMADA3-OAUTH-GRANT-COUPLING` (same client the backup exporter reuses).
- **`INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` — registered follow-up (`NOT AUTHORIZED`):** demonstrate one real document processed end to end into `gqmpsxkxynrjvidfmojk` with its Drive file resolving; gated on the Google OAuth token refresh; tie to `CAMADA3-OAUTH-GRANT-COUPLING`. A fresh scan request must be seeded (the migrated one was consumed as `failed` during verification).
- **Record (this commit):** `PROJECT_STATE.md` (`M8` `CLOSED / ACCEPTED` + environment facts + Closed-phases row; `ANON-GRANT-DEFENSE-IN-DEPTH` + `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` registered); `AGENT_HANDOFF.md` top entry; this ledger entry. Repoint edits to the two `.env` files are gitignored (not committed); the two `.ps1` guards + two runbooks in the standalone twin live in that separate repo (not this repo's history).
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — configuration + documentation only, no schema/db, no Supabase writes issued by Claude (the watcher's writes went through the Ingestor's own service_role key, not the MCP; all Claude MCP calls were read-only `SELECT`); `§15` (Git) — selective staging by literal path, no push in this order (architect acceptance required before any push); `§19` — English throughout. Secret hygiene held: the `sb_secret_` key never appeared in repo/logs/chat. Production `bhgifjrfagkzubpyqpew` not accessed; legacy `ucrjtfswnfdlxwtmxnoo` not written.
- **Standing reminder (unchanged):** flip the Supabase MCP back to read-only — it remains management-scoped/write-capable from `M2`/`M3`; M8 used it read-only only.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed (not authorized by this order).
- **Next phase indicated at closeout:** an individual order for `M4` (Edge Functions + secrets) or any other `M5`-`M10` phase; plus the deferred `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` once the Google token is refreshed. Backlog freeze holds until after cutover (`M10`).

## 2026-07-18 — M10 CUTOVER CLOSEOUT — G28-MIGRATION-TRACK (M0-M10) COMPLETE / CLOSED — backlog freeze LIFTED

- **Gate:** `CLOSED / ACCEPTED` — explicit architect order ("ORDER — M10 CUTOVER CLOSEOUT", Sonnet 5 / low effort). Docs-only phase: no code, SQL, Supabase, or Vercel action by Claude; records an already-accomplished cutover. Push authorized for the docs commit (M-track authorization).
- **Front:** `PRODUCTION-MIGRATION-M0-M10`, final closeout — records `M4`/`M5`/`M6`/`M10` `CLOSED / ACCEPTED`, `M7`/`M9` `SUPERSEDED BY REALITY`, and marks the track `COMPLETE`.
- **Accomplished fact (recorded, not performed here):** the system is **LIVE IN PRODUCTION** at `inttracker-jade.vercel.app`, served by Vercel from `inttexsystem/inttracker` (`main`), running against Supabase `gqmpsxkxynrjvidfmojk` with migrated data, deployed Edge Functions, repointed client config, and a repointed Ingestor.
- **Phase records:**
  - **`M4` (Edge Functions + secrets) — `CLOSED / ACCEPTED`:** the five admin Edge Functions deployed to `gqmpsxkxynrjvidfmojk` by the architect with per-function secrets (new-format key regime); out-of-band deploy, no repo artifact; exercised by the live app.
  - **`M5` (client config repoint) — `CLOSED / ACCEPTED`:** `js/config.js` repointed (`75c4ab6` "Repoint config to new Supabase project"), environment split restored (`1e17087` "Restore environment split in config") so host detection routes production vs. development, banner fixed (`f369964`). New-format publishable key committed (RLS-gated, public by design). On `production/main`.
  - **`M6` (Vercel wiring) — `CLOSED / ACCEPTED`:** repo linked, static deploy configured (`5416128` "Trigger first Vercel deploy", `aa77612` "Configure Vercel static deployment"); live at `inttracker-jade.vercel.app`. A **Root Directory defect** was found during wiring and **cleared**.
  - **`M7` (smoke verification) — `SUPERSEDED BY REALITY`:** no separate scoped smoke phase ran; superseded by the live-and-serving production system (login/pedido/admin exercised by real use). Recorded honestly as not-run-as-scoped — no fabricated smoke closeout.
  - **`M9` (backup repoint + first real run) — `SUPERSEDED BY REALITY` / `NOT EXECUTED AS SCOPED`:** the production backup mechanism was never stood up (no `PG*`/`SUPABASE_*` repoint, no automated trigger, no first production run). The exporter was proven once, manually, in staging (`BK4.2`). Folded into the `CAMADA3 BK5-BK8` post-launch debt — **no proven production backup exists.** No fabricated run.
  - **`M10` (cutover) — `CLOSED / ACCEPTED`:** primary URL is Vercel; live against `gqmpsxkxynrjvidfmojk` with real use; performed by the architect. This entry records it.
- **`G28-MIGRATION-TRACK` — `COMPLETE / CLOSED`.** Final state: **production = `gqmpsxkxynrjvidfmojk` on `inttexsystem/inttracker`, served by Vercel (`inttracker-jade.vercel.app`); development/legacy = `ucrjtfswnfdlxwtmxnoo` (retained, now the development database, historical record for excluded audit trails/test rows); `bhgifjrfagkzubpyqpew` remains PROHIBITED and unused, never accessed.**
- **`BACKLOG FREEZE` — `LIFTED` (2026-07-18):** the freeze was scoped "until after cutover (`M10`)"; cutover is done. New fronts are authorizable again, each by its own order.
- **`POST-LAUNCH DEBT REGISTER` — consolidated + ranked** into a single list in `PROJECT_STATE.md` (was scattered across entries and the former "residual risk register (12 items)"). Ranked by production consequence: (1) `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` — **ACTIVE PRODUCTION BLOCKER** (expired Google token; no documents entering the live system); (2) `CAMADA3 BK5-BK8` — no proven production backup (`M9` never ran; exporter manual, proven once); (3) `DELETE-PROD-GUARD-A` — delete guard not on production; (4) `A2-SERVER-SIDE-ENFORCEMENT` — with binding mitigation (no `somente_leitura` admin may exist in production until it closes); (5) `A2-CREATE-NIVEL-ACESSO-WIRING`; (6) `ANON-GRANT-DEFENSE-IN-DEPTH`; (7) `CAMADA3-OAUTH-GRANT-COUPLING` (interacts with #1 — shared OAuth client); (8) `IS-ADMIN-ACL-REVIEW`; (9) `CODE-HEALTH-AUDIT-§18-R1` (incl. `UI-EL-BOOLEAN-ATTR-FIX`); (10) `TEST-MOCK-FIDELITY` remaining lots; (11) `UI-FIXED-FORMAT-COLUMN-WIDTHS`; (12) `UI-ACTION-BUTTON` lot 3; (13) `MODAL-BUTTON-CSS-CHECK`; (14) two stale git-worktrees.
- **Mystery branch — registered for review, investigated read-only (no delete):** `v0/administrativointtex-9166-cf89b1d8` on the `production` remote points at our own commit `75c4ab6` ("Repoint config to new Supabase project"), carries **zero commits not already in `production/main`** (`git rev-list --left-right --count production/main...` = `5 0`), and is a **strict ancestor of `main`** — an older snapshot of this branch's history, not foreign content. Consistent with a **Vercel/v0 import artifact** (branch auto-created at the HEAD commit when the repo was connected). No code-review concern; safe to leave or delete at the architect's discretion.
- **Record (this commit):** `PROJECT_STATE.md` (Active phase → track COMPLETE + freeze LIFTED; `M4`-`M10` governance entries; consolidated ranked `POST-LAUNCH DEBT REGISTER` + mystery-branch registration; environment facts → production live / legacy = dev DB; publication provider → Vercel live; Closed-phases rows); `AGENT_HANDOFF.md` top entry; this ledger entry.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — documentation only, no code/schema/Supabase/Vercel action by Claude; `§15` (Git) — selective staging by literal path, push to `production/main` under M-track authorization; `§19` — English throughout. Production `bhgifjrfagkzubpyqpew` not accessed.
- **Push:** authorized and executed — `production/main`, docs commit "Close migration track and lift backlog freeze".
- **Next authorizable action:** any new front by its own order; the standing highest-priority item is `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` (active production blocker). Standing reminder: flip the Supabase MCP back to read-only.

## 2026-07-18 — ORDEM-COMPRA-SPEC (Purchase Order Lifecycle Spec) — SPEC DELIVERED / PENDING RATIFICATION

- **Gate:** docs-only phase, explicit architect order ("ARCHITECT AUTHORIZATION —
  ORDEM-COMPRA-SPEC (docs-only)", Sonnet 5 / high effort), per the accepted
  `PURCHASE-ORDER-FOUNDATION-AUDIT` and a consolidated set of architect decisions
  carried in the order itself. No code, SQL, staging, or production action authorized
  or taken.
- **Front:** new track, `ORDEM-COMPRA-LIFECYCLE` (purchase-order / `ordens_compra_fio`
  lifecycle rework).
- **Deliverable:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` —
  `PROPOSED`, for architect ratification. Specifies, against an evidenced read-only
  inventory of the current code (`ordens_compra_fio` schema in `db/01_schema.sql`,
  generation at Abrir OP in `op-persistir.js:218-236`, the single shared receipt
  writer `registrarRecebimentoOrdemFio` in `op-writes.js:29-43` called from
  `op-nova.js`'s `buildBlocoFios`/`buildOrdemPendenteRow` and from
  `pedido-detail-events.js`'s `buildInsumosTransferForm` inside the `insumos`
  stepper-stage transition modal, and the unguarded client-side
  `iniciarProducaoOP`/`snapshotSaldoEIniciarProducao` production-start writer in
  `op-recalculo.js:108-163`):
  - **Three orthogonal dimensions**, not a linear state machine — administrative
    cycle (`rascunho`/`emitida`/`cancelada`), acceptance
    (`nao_aplicavel`/`pendente`/`aceita`/`rejeitada`), and receipt (derived,
    `nao_recebido`/`parcial`/`recebido`, computed from a new append-only
    `ordem_compra_fio_lancamentos` physical-registration ledger against
    `kg_pedido` — never set directly).
  - **Schema (PROPOSED, additive only):** new columns on `ordens_compra_fio`
    (`status_administrativo`, `status_aceite`, `aceite_exigido_na_emissao` snapshot,
    `emitida_em`/`_por`, `cancelada_em`/`_por`, `aceite_decidida_em`/`_por`,
    `aceite_motivo`, `status_recebimento`, `legado_recebimento_automatico`); new
    tables `ordem_compra_fio_lancamentos` (receipt ledger), `ordem_compra_eventos`
    (transition audit, `op_eventos`/`usuarios_eventos` pattern), and
    `ordem_compra_config` (singleton, `exige_aceite BOOLEAN DEFAULT FALSE`,
    deliberately not a generic config/feature-flag engine per the ratified Rule 7);
    a one-time legacy-marking backfill for every pre-existing row
    (`status_administrativo='emitida'`, `legado_recebimento_automatico=TRUE`, no
    retroactive `kg_recebido` rewrite).
  - **Config freeze rule:** emission snapshots the live `ordem_compra_config` value
    into `aceite_exigido_na_emissao`; toggling the global config only affects orders
    emitted afterward — no retroactive blocking/unblocking.
  - **Production gate (Phase D, specified only):** two independent queries for
    "Iniciar produção" — cotton per-OP, polyester per-pedido (shared PRETO/BRANCO
    orders gate all the pedido's OPs together, per architect decision (a) in the
    order), joined via `ordens_compra_fio.op_id → ops.lote_id → lotes.pedido_id`.
    Flagged, not resolved: the current gate attach point
    (`op-recalculo.js:108-163`) is a direct client-side `ops` update with no RPC in
    front of it — wiring the gate only in the UI would repeat the shape of the
    already-registered `A2-SERVER-SIDE-ENFORCEMENT` debt; Phase D should enforce
    server-side.
  - **7 open architect decisions** (a)-(g) — supplier-accepts-own-order precedence,
    admin-accepts-on-behalf, admin-override-of-rejection, undo-acceptance,
    acceptance-after-partial-receipt, order-modification-after-emission (recommended:
    emission locks quantities), cancellation-with-partial-receipts (recommended:
    ledger entries are never reversed) — each with a recommendation, none ratified
    by this document.
  - **UI surface (conceptual, no mockup):** new affordances render as a sub-panel
    inside the existing `insumos` transition-modal host
    (`buildInsumosTransferForm`/`buildBlocoFios`), reusing existing control-panel
    visual tokens — not a new pedido stage, not a detached CRUD screen. Mockup gate
    (Supervision Protocol) is explicitly deferred to after ratification, by the
    architect's reviewer.
  - **Phasing, each independently shippable:** `A` schema+config (additive,
    zero behavior change) → `B` panel visibility + administrative writes
    (behavior change flagged: newly opened OPs require explicit "Emitir" before
    receipt) → `C` receipt rework via the single shared writer (internal
    implementation swap behind an unchanged RPC signature) → `D` gate activation
    (behavior change flagged: production-start can now block on insufficient yarn)
    → `E` dormant-acceptance verification checkpoint (no code, read-only). Blast
    radius stated per phase in the spec; none authorized by this record.
- **Record (this commit):** `PROJECT_STATE.md` (`ORDEM-COMPRA-LIFECYCLE` track
  `OPENED`, spec `PROPOSED`, all phases `NOT AUTHORIZED` — Active phase block,
  `NOT AUTHORIZED` candidate fronts, Closed-phases row, Mandatory links); this
  ledger entry. `AGENT_HANDOFF.md` not touched (not in this order's REGISTER scope).
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — documentation only, no
  code/schema/Supabase action; `§16` (documentation) — new architectural contract
  doc, registered in `PROJECT_STATE.md` + this ledger per the order's explicit
  REGISTER instruction (`docs/DOCUMENTATION_INDEX.md` classification not touched —
  out of this order's scope); `§19` — English throughout, matching the canonical
  state/report language policy. No staging/production access; no schema, RPC, or
  frontend file created or modified.
- **Push:** authorized by the order for this docs commit only ("Add purchase order
  lifecycle spec").
- **Next authorizable action:** architect ratification of
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, including a ruling on
  open decisions (a)-(g); then Phase `A` (schema + config), its own order, per the
  phasing in §8 of the spec.

## 2026-07-18 — ORDEM-COMPRA-LIFECYCLE-SPEC-RATIFICATION-R1 — RATIFIED

- **Gate:** docs-only phase. Two-step order: (1) an independent read-only
  architecture review (Sonnet 5 / high effort) of commit `0859124`
  ("Add purchase order lifecycle spec") against the ratified model; (2) the
  architect's explicit ruling on the review's findings ("ARCHITECT
  RATIFICATION — ORDEM_COMPRA_LIFECYCLE_SPEC"). No code, schema, staging, or
  production action authorized or taken.
- **Front:** `ORDEM-COMPRA-LIFECYCLE` track (opened `ORDEM-COMPRA-SPEC`,
  2026-07-18).
- **Review findings (step 1):** validated the spec against all ten ratified
  model points (§1 of the spec) — nine matched; one **confirmed defect**
  (Finding 1): the receipt precondition in §4/§6 read
  `status_aceite != 'pendente'`, which is also true for `rejeitada` — a
  rejected purchase order would have passed the precondition and been able
  to register a receipt, contradicting the ratified rule that receipt is
  blocked until `aceita`. Also surfaced, unprompted: (i) `ordem_compra_eventos`
  payload completeness (minor, non-blocking) and (ii) an RLS-enforcement gap
  — nothing in the original spec revoked direct `UPDATE` on the four
  dimension-bearing columns from `authenticated`, so "single shared writer"
  was a convention, not an enforced invariant (same shape as this project's
  own registered `ANON-GRANT-DEFENSE-IN-DEPTH` debt). Confirmed: all five
  phases (A-E) independently shippable (with a one-transaction caveat on
  Phase A's backfill), Phase C preserves the single shared writer's external
  signature, Phase D's gate correctly relies on the persisted per-order
  policy snapshot rather than the live config (by construction, since the
  receipt-registration writer is the only path `kg_recebido` can move
  through). Verified exact push target: commit
  `0859124060994c4bb29a38a742363d52aaa258e7` on `production`
  (`https://github.com/inttexsystem/inttracker.git`), branch `main`.
  **Re-confirmed, exhaustively, that no `PURCHASE-ORDER-FOUNDATION-AUDIT`
  document exists** anywhere in this repository, any branch, or this ledger
  — the executor hard-stopped rather than fabricate a reconstruction when
  first asked to persist it verbatim, per the architect's own instruction
  ("if the exact source is unavailable, hard stop and request it").
- **Architect ruling (step 2), applied to the spec this commit:**
  - **Finding 1 — `CONFIRMED DEFECT`, corrected.** §4 and §6 of
    `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` corrected to
    `status_aceite IN ('nao_aplicavel', 'aceita')`; §7(e)'s citation
    corrected to match.
  - **Decisions (a)-(g) — all ratified**, annotated inline in the spec's §7,
    summarized in its new §11: (a) deferral confirmed, future precedent
    recorded as guidance only; (b) ratified **YES, unconditionally** —
    100%-admin-authored acceptance until supplier self-service ships is
    correct, not a smell; (c) ratified as recommended (`aceite_override_admin`
    event, mandatory `aceite_motivo`); (d) ratified as recommended (no undo
    path, cancel + new draft); (e) ratified as recommended, contingent on
    Finding 1 (satisfied); (f) ratified as recommended, **decided now rather
    than deferred** — emission locks `kg_pedido`, since changing this after
    Phase B ships would break the `emitir` RPC's contract; (g) ratified as
    recommended — ledger entries never reverse, `saldo_fios` reflects
    physically received kg regardless of administrative state, with the
    `saldo_fios` write-path confirmation folded into the Phase C order as an
    explicit verification step.
  - **Two new implementation gaps, both accepted, folded into §8's phasing
    table as binding requirements:** (1) Phase A's migration must apply the
    `ALTER TABLE` and the legacy backfill in one transaction (closing the
    window for a live draft to be mislabeled); (2) Phase B/C's migration must
    revoke direct `UPDATE` on `kg_recebido`/`status_recebimento`/
    `status_administrativo`/`status_aceite` from `authenticated`, making the
    four `SECURITY DEFINER` RPCs the sole writers.
  - **Phantom-audit governance item — NOT resolved by this ratification,
    explicitly carried forward.** The architect confirmed the prior hard stop
    was correct and is retrieving the original source for verbatim
    persistence as `docs/reports/PURCHASE_ORDER_FOUNDATION_AUDIT_R1_2026-07-18.md`;
    if reported unrecoverable, the fallback is an honest citation correction
    (spec banner + `PROJECT_STATE.md` cite the architect's in-chat
    authorization directly). Neither branch has executed yet.
- **Status change:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  moves from `PROPOSED` to `RATIFIED` (filename unchanged — same convention
  as `CAMADA2_USUARIOS_SPEC_PROPOSED.md`, which also kept its `_PROPOSED`
  suffix after full delivery). **Ratification authorizes no implementation.**
  Phase `A` (and every other phase) remains `NOT AUTHORIZED`, pending its own
  order.
- **Record (this commit):** `PROJECT_STATE.md` (`ORDEM-COMPRA-LIFECYCLE`
  track block updated to `RATIFIED`, phases still `NOT AUTHORIZED`;
  `NOT AUTHORIZED` candidate fronts line updated; Closed-phases row added;
  Mandatory links line updated); this ledger entry;
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (status banner,
  §4/§6/§7(e) correction, §7(a)-(g) ratification annotations, §8 binding
  requirements, new §11 ratification record, §10 updated).
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — documentation
  only, no code/schema/Supabase action; `§15` (Git) — selective staging by
  literal path, single commit, push authorized by this order; `§19` —
  English throughout. No staging/production access; no schema, RPC, or
  frontend file created or modified.
- **Push:** authorized by this order — single commit "Ratify purchase order
  lifecycle spec".
- **Next authorizable action:** Phase `A` (schema + config), its own order,
  per the ratified phasing in §8 of the spec — subject to the two binding
  requirements above. Separately: resolution of the phantom-audit governance
  item (source retrieval or the fallback citation correction), whenever the
  architect reports which branch applies.

## 2026-07-18 — ORDEM-COMPRA-LIFECYCLE Phase A (schema + config) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — explicit architect order ("ARCHITECT
  AUTHORIZATION — ORDEM-COMPRA-PHASE-A (schema + config)"), Sonnet 5 / medium
  effort, scoped to Phase `A` exclusively per `ORDEM_COMPRA_LIFECYCLE_SPEC_
  PROPOSED.md` §11 — Phases `B`-`E` each require their own order.
- **Front:** `ORDEM-COMPRA-LIFECYCLE`, Phase `A`, per
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (`RATIFIED`,
  `ORDEM-COMPRA-LIFECYCLE-SPEC-RATIFICATION-R1`).
- **Branch discipline (new, binding for all implementation work going
  forward per this order):** branch `dev` created from `work/g28-document-
  qualification`'s HEAD (`84e2a07`); all implementation commits for this
  phase land on `dev`. `git push production dev` is separately authorized
  (remote backup) — see Push below. Push to `main` remains forbidden
  (auto-deploys to production).
- **Technical commit:** `fb0e6cb` — "Add ordem de compra lifecycle schema
  (Phase A)" (`db/65_ordem_compra_lifecycle_schema.sql`,
  `tests/ordem-compra-lifecycle-schema.smoke.js`). Documentation closeout:
  this entry, in a separate commit after staging verification.
- **Scope resolution (asked and answered before writing SQL):** the order's
  own bullet enumeration named only three schema elements (dimension
  columns, `ordem_compra_eventos`, config storage) but its SCOPE header
  cited spec §8's Phase A row as authoritative, and that row explicitly
  includes a fourth element — the `ordem_compra_fio_lancamentos` ledger
  table (empty, no trigger, Phase C's job to wire). Flagged to the architect
  before implementation; **architect selected "include it, per §8's Phase A
  row"** — included in `db/65`, documented here rather than silently
  resolved either way.
- **Four schema additions, all additive/forward-only/idempotent:**
  1. **`public.ordens_compra_fio`** gains 12 new columns (§3.1):
     `status_administrativo` (`rascunho|emitida|cancelada`, default
     `rascunho`), `status_aceite` (`nao_aplicavel|pendente|aceita|
     rejeitada`, default `nao_aplicavel`), `status_recebimento`
     (`nao_recebido|parcial|recebido`, default `nao_recebido`) — the three
     orthogonal dimensions — plus `aceite_exigido_na_emissao` (nullable
     freeze-snapshot), `emitida_em`/`emitida_por`, `cancelada_em`/
     `cancelada_por`, `aceite_decidida_em`/`aceite_decidida_por`,
     `aceite_motivo`, `legado_recebimento_automatico` (default `FALSE`).
     Every column additive/nullable-or-defaulted; the existing `status`/
     `kg_recebido` columns untouched (confirmed by static test — no `DROP`,
     no `ALTER COLUMN` on either).
  2. **`public.ordem_compra_fio_lancamentos`** (new, §3.2) — physical
     receipt ledger, `kg_recebido NUMERIC(10,3) CHECK (> 0)`, indexed on
     `ordem_compra_fio_id`. Shipped empty/unused: no trigger (Phase C's
     job), no writer RPC.
  3. **`public.ordem_compra_eventos`** (new, §3.4) — transition audit,
     `op_eventos` (`db/21`) / `usuarios_eventos` (`db/60`) pattern:
     `dimensao CHECK IN (administrativo, aceite, recebimento)`,
     `tipo_evento`, `valor_anterior`/`valor_novo`, `payload JSONB`. No
     writer exists yet (every write path in spec §4 is Phase B/C).
  4. **`public.ordem_compra_config`** (new, §3.5) — singleton
     (`id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1)`),
     `exige_aceite BOOLEAN NOT NULL DEFAULT FALSE`, seeded via
     `INSERT ... ON CONFLICT (id) DO NOTHING`. Dedicated one-row table, not
     a generic key-value store (Rule 7).
- **RLS/ACL — db/57/63 standard, admin-only read, no client writes, stated
  complete (not a delta) on all three new tables:** `ENABLE ROW LEVEL
  SECURITY`; `REVOKE ALL FROM PUBLIC, anon, authenticated`; `GRANT SELECT TO
  authenticated`; single `FOR SELECT USING (is_admin())` policy; no
  `INSERT`/`UPDATE`/`DELETE` policy for any client role on any of the three
  — every future writer (Phase B/C's `SECURITY DEFINER` RPCs) writes as
  table owner, bypassing RLS by ownership, never by a permissive policy.
- **Binding gap 1 honored (single transaction):** the `ALTER TABLE` and the
  §3.6 legacy-marking `UPDATE` execute inside one explicit `BEGIN`/`COMMIT`
  block in `db/65` — no window exists for a live draft row to be mislabeled
  by the backfill's own `WHERE status_administrativo = 'rascunho'` clause.
  Binding gap 2 (revoking direct `UPDATE` on the four dimension columns from
  `authenticated`) is explicitly Phase B/C scope, per the spec — not applied
  here; confirmed absent by static test (`scope guard` test).
- **Legacy backfill (§3.6):** every pre-existing row (39 total, all at the
  column default `status_administrativo='rascunho'` immediately after the
  `ALTER TABLE`) marked `status_administrativo='emitida'`,
  `status_aceite='nao_aplicavel'`, `legado_recebimento_automatico=TRUE`,
  `status_recebimento` derived from the legacy `status` column
  (`pendente→nao_recebido`, `recebido_parcial→parcial`,
  `recebido_total→recebido`). No `kg_recebido` value rewritten.
- **HARD STOP ZERO passed before any write:** the order required confirming
  the MCP ref before writing. The project-scoped `supabase-legacy` MCP
  (distinct from the management-scoped, production-pinned, read-only MCP
  already connected this session) was fingerprinted via row counts unique
  to the legacy/development database per the `M3` closeout record —
  `usuarios_eventos=9` and `document_link_revisions=8` — both matched
  exactly, confirming `supabase-legacy` is pinned to `ucrjtfswnfdlxwtmxnoo`
  (development, formerly "staging"), not `gqmpsxkxynrjvidfmojk`
  (production). No write issued before this confirmation.
- **Staging (`ucrjtfswnfdlxwtmxnoo`) apply:** applied via `supabase-legacy`
  MCP `apply_migration`. **Migrations registry — before/after:** before —
  highest recorded `64_backup_runs_schema` (`20260717125153`); after —
  `65_ordem_compra_lifecycle_schema` recorded at `20260718110246`,
  immediately following `64` with no gap. **Pre-state:** 39
  `ordens_compra_fio` rows (12 `pendente`, 0 `recebido_parcial`, 27
  `recebido_total`); none of the four new tables/columns existed.
  **Post-state:** same 39 rows, all backfilled correctly (12→
  `nao_recebido`, 27→`recebido`, 0 bad-mapping rows in either group,
  confirmed live); `ordem_compra_fio_lancamentos`/`ordem_compra_eventos`
  both empty (0 rows, as designed); `ordem_compra_config` = 1 row,
  `exige_aceite=false`.
- **Verification matrix (`BEGIN…ROLLBACK`, synthetic, cleanup confirmed
  zero), 14/14 checks, all `OK`:**
  1. Legacy marking: both groups (27 `recebido_total`→`recebido`, 12
     `pendente`→`nao_recebido`) map correctly, zero bad-mapping rows, zero
     `NULL kg_recebido` on a `recebido_total` row.
  2. New order defaults: a synthetic draft lands `status_administrativo=
     rascunho`, `status_aceite=nao_aplicavel`, `status_recebimento=
     nao_recebido`, `aceite_exigido_na_emissao=NULL`,
     `legado_recebimento_automatico=false` — exactly the column defaults,
     no legacy contamination.
  3. `ordem_compra_config`: exactly 1 row, `exige_aceite=false`.
  4. Events-table role matrix: `anon` `SELECT` → `42501` (table `GRANT`
     boundary, before RLS even evaluates); non-admin `authenticated`
     (`auth.uid()` resolved to a random UUID with no matching admin row) →
     `0` rows visible (RLS filters); admin `authenticated` (real admin
     `auth.uid()`) → `1` row visible (the synthetic event, correctly
     surfaced).
  5. Dimension `CHECK` constraints reject invalid values on all four
     enum-bearing columns: `status_administrativo`, `status_aceite`,
     `status_recebimento` (all `23514 check_violation` on an out-of-set
     `UPDATE`), `ordem_compra_eventos.dimensao` (same), and the
     `ordem_compra_config` singleton `CHECK (id = 1)` (rejects a second row
     with `id=2`).
  **Cleanup verified zero:** post-rollback live counts —
  `ordens_compra_fio=39` (unchanged), `ordem_compra_fio_lancamentos=0`,
  `ordem_compra_eventos=0`, `ordem_compra_config=1` (the real seed row
  only) — no synthetic residue survived the `ROLLBACK`.
- **Tests:** `tests/ordem-compra-lifecycle-schema.smoke.js`, 12/12 (static
  source assertions — every new column/default/`CHECK`, all three new
  tables' shape/index/RLS/grants, the single-transaction wrapper, the
  backfill mapping, and a scope guard confirming no RPC/trigger/
  dimension-column `REVOKE` — all explicitly Phase B/C/D territory — leaked
  into this file). **Regression — file-swap method** (purely additive
  change, one new SQL file + one new test file, zero existing files
  modified — regression is guaranteed by construction, verified anyway):
  the new test file moved aside, full suite run (`before`: `3830` tests /
  `3690` pass / `140` fail), file restored and re-run (`after`: `3842` /
  `3702` pass / `140` fail) — exactly the `+12` new tests added, all
  passing; the 140 failing test names confirmed byte-identical between
  runs (`comm -13`/`comm -23` both empty — pre-existing, unrelated
  flakiness class, e.g. `write-guard.smoke.js`'s `ECONNREFUSED
  127.0.0.1:8765` against a local `http.server` not running in this
  session).
- **Forbidden scope honored:** no RPC (`emitir`/`cancelar`/`decidir_aceite`/
  `registrar_recebimento_ordem_compra_fio` — all Phase B), no UI, no
  `.js` file touched, no trigger on `ordem_compra_fio_lancamentos` (Phase
  C), no `REVOKE` of the dimension columns' `authenticated` write access
  (Phase B/C, binding gap 2), no production access, no push to `main`.
- **Hard stops:** none encountered. MCP ref confirmed before any write (see
  above); the one scope ambiguity (ledger table inclusion) was surfaced to
  the architect and resolved before implementation, not guessed.
- **STRUCTURAL POLICY COMPLIANCE:** `§7` (size) — both new files well under
  the acceptable ceiling; `§9` (Supabase writes) — no JS write module
  touched (schema-only phase); `§13` (tests) — migration smoke proportional
  to risk, static allow-list-style assertions, full staging role-matrix via
  `BEGIN…ROLLBACK` as the real gate; `§14` (single scope) — schema/config
  only, no RPC/UI/trigger/gate mixed in; `§15` (Git) — selective staging by
  literal path (`db/65` + the new test file only — the pre-existing
  uncommitted `op-nova.js`/`op-recalculo.js`/test changes on this worktree
  from before this phase began were never staged or touched), technical
  commit then a separate docs commit, both on `dev`, no `add -A`/`reset`/
  `rebase`/force-push/`merge`/`tag`/`amend`; `§19` — English throughout new
  code/comments/commit messages. No production access
  (`gqmpsxkxynrjvidfmojk` not accessed by this phase — confirmed via the
  fingerprint check above); push to `main` never attempted.
- **Production:** `gqmpsxkxynrjvidfmojk` not accessed. **Push:** `git push
  production dev` authorized by this order (remote backup only — `dev`
  branch, not `main`).
- **Record (this commit):** `PROJECT_STATE.md` (`ORDEM-COMPRA-LIFECYCLE`
  track block: Phase `A` moved from `NOT AUTHORIZED` to `CLOSED /
  ACCEPTED`; Closed-phases row added; `NOT AUTHORIZED` candidate fronts line
  updated to show Phases `B`-`E` remaining); `AGENT_HANDOFF.md` (new top
  entry); this ledger entry; `docs/DOCUMENTATION_INDEX.md` §4 (new `db/65`
  row + new smoke-test row); `docs/reports/ORDEM_COMPRA_PHASE_A_2026-07-
  18.md` (new phase report — guide format + verification matrix +
  registry before/after).
- **Next phase indicated at closeout:** Phase `B` (panel visibility +
  administrative writes — `emitir_ordem_compra_fio`/
  `cancelar_ordem_compra_fio` RPCs, a precondition-guarded
  `registrar_recebimento_ordem_compra_fio`, UI badges, and binding gap 2's
  `REVOKE`), pending its own architect order per spec §8. Phases `C`
  (receipt rework via the ledger trigger), `D` (gate activation), and `E`
  (dormant-acceptance checkpoint) remain `NOT AUTHORIZED`, each pending its
  own order.

## 2026-07-18 — YARN-BUTTONS-PHASE-1 (+ corrections) — Shared Distribution Builder — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — architect visual validation on staging
  local of BOTH surfaces (OP screen Preparação block + Pedido hub transition
  modal). Order `CLOSEOUT YARN-BUTTONS-SHARED-BUILDER` (docs-only, Sonnet 5 /
  low effort).
- **Front:** `YARN-BUTTONS-PHASE-1` and its two corrections
  (`YARN-BUTTONS-PHASE-1-CORRECTION`, `YARN-BUTTONS-FINAL-CONTRACT`). UI-only,
  branch `dev`.
- **Final contract (recorded, binding):**
  - The proposal/distribution modal footer is EXACTLY two buttons —
    **`Manter pedido`** and **`Salvar distribuição`** — both **save-only**:
    they persist `op_itens.metros_ajustados` via `salvarDistribuicaoOP` and
    NEVER start production, change status, or snapshot saldo. `Manter pedido`
    persists the pedido metrage; `Salvar distribuição` persists the slider
    distribution (enabled only when the current distribution differs from the
    last saved one, and no yarn is exceeded).
  - **`Iniciar produção`** is the ONLY production-start path (saldo snapshot
    + `status → em_producao`, via `iniciarProducaoOP`). It is present on BOTH
    surfaces — the OP screen Preparação block and the Pedido hub transition
    surface — and is enabled only when a saved distribution exists AND the
    received yarn covers it; otherwise disabled with an explanatory `title`.
  - `Aceitar proposta` removed entirely (both surfaces). The dead
    `aplicarRecalculo` wrapper in `op-nova.js` removed.
- **ROOT CAUSE (why the earlier corrections regressed):** TWO parallel modal
  builders existed — `op-nova.js` (`buildProposta`) and
  `pedido-detail-events.js` (`buildTecAcceptanceProposalBlock` /
  `openTecAcceptanceModal`). The first two corrections edited only the OP
  screen, so the removed `Aceitar proposta` button (and a live
  production-start path) kept returning from the Pedido-side twin whenever an
  OP was accepted from the Pedido panel. It was not dead code — it was a
  deliberately-built, separately-tested parallel implementation.
- **Resolution:** new shared module **`js/screens/op-distribuicao-ui.js`** —
  `buildDistribuicaoBlock` (sliders + live consumption + `[Manter pedido,
  Salvar distribuição]`, save-only) and `buildIniciarProducaoButton` (the
  single production-start). Both surfaces now CONSUME these builders; the two
  duplicated implementations were deleted. Duplication eliminated.
- **Files:** new `js/screens/op-distribuicao-ui.js`; `js/screens/op-nova.js`
  (buildProposta → shared block; Preparação rail → shared button; dead
  wrapper removed); `js/screens/pedido-detail-events.js` (twin builders →
  shared block + shared button; hub `Aceitar OP` → `Distribuição` opening the
  save-only modal + `Iniciar produção`); `index.html` (script tag); smokes
  `op-nova`/`op-recalculo`/`pedido-detail`/`op-latex-admin`/`op-writes`/
  `op-persistir`.
- **Verification:** in-browser against the real production code (running
  static app) — modal footer proven to be exactly `[Manter pedido, Salvar
  distribuição]`; `Salvar` click calls ONLY `salvarDistribuicaoOP` (never
  `iniciarProducaoOP`); `Iniciar produção` disabled without a saved
  distribution (with title) and enabled with one, click → `iniciarProducaoOP`.
  Grep-confirmed the only Tecelagem production-start is `iniciarProducaoOP`,
  called from one place (the shared button). Full suite `3710` pass / `132`
  fail — **zero new failures vs baseline** (`134`); the net `-2` are the two
  previously-updated OP smokes now green. All remaining failures pre-existing
  (CRLF slice-regex + `http.server` `:8765` not running).
- **Technical commits (branch `dev`):** `02679f9` (Fix Iniciar produção
  button placement — the first correction) and `2388d39` (Unify yarn
  distribution UI into one shared builder — this closeout+s subject). This
  ledger entry + `PROJECT_STATE.md` + `AGENT_HANDOFF.md` recorded in a
  separate docs commit.
- **Open PRODUCT DECISION (registered, NOT a defect):** `Manter pedido` may
  now be redundant with `Salvar distribuição` (both are save-only; `Manter`
  just seeds the pedido metrage). Architect to decide keep-or-remove; if
  removed, can fold into a future `YARN-BUTTONS Phase B`.
- **LESSON (standing governance/process note):** UI position must be
  specified by NAMED block/screen, never by relative reference; and every
  UI order must require verifying ALL surfaces that render the component —
  this app has documented modal duplication (OP screen ↔ Pedido hub) and a
  single-surface edit silently leaves the twin stale.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — UI-only, one
  coherent change (extract-and-consume); `§7` (size) — shared module small,
  both screens shrank (net `-183` lines across the code files); `§15` (Git)
  — selective staging by literal path (the pre-existing uncommitted
  `.gitignore` change left untouched/unstaged), single docs commit on `dev`,
  no `add -A`/`reset`/`rebase`/force-push/`merge`/`tag`/`amend`; `§19` —
  English for new code/comments/commit messages, pt-BR preserved for
  user-facing UI labels. No production access; no push to `main`.
- **Next indicated at closeout:** await the architect+s keep/remove ruling on
  `Manter pedido` (the registered product decision). No further YARN-BUTTONS
  work authorized otherwise.

---

## 2026-07-18 — ORDEM-COMPRA SPEC AMENDMENT (Part 1) — CLOSED / ACCEPTED — + PHASE B1 AUTHORIZED, DB-execution HARD-STOPPED

- **Gate:** `CLOSED / ACCEPTED` for **Part 1 (spec amendment, docs-only)** of
  the order "ARCHITECT ORDER — ORDEM-COMPRA SPEC AMENDMENT + PHASE B1"
  (Sonnet 5 / medium effort as ordered; executed by the resident executor).
  **Part 2 (Phase `B1`) is AUTHORIZED but `HARD-STOPPED` this session** — see
  the hard-stop record below. No code, schema, staging, or production action
  taken.
- **Front:** `ORDEM-COMPRA-LIFECYCLE` track. Branch `dev`.
- **Part 1 — what was amended** (`docs/architecture/ORDEM_COMPRA_LIFECYCLE_
  SPEC_PROPOSED.md`), recording the architect's 2026-07-18 decision:
  - **Separation of responsibilities (the ruling):** receipt registration
    (`lançamentos`: quantity, date, partial) lives on the purchase order's own
    detail screen (receipt is a fact about the *purchase*, not the production;
    also future-proofs supplier acceptance and multi-OP/`saldo` sharing). The
    OP screen's section becomes a **reader** (linked orders + dimension badges +
    available yarn per color; registers nothing). Distribution sliders +
    `Salvar distribuição` + `Iniciar produção` stay on the OP screen; the
    Phase D gate reads availability from the orders' received totals.
  - **§6 (UI surface):** the single-section description is superseded by a
    dated amendment block describing **three surfaces** — (a) OP detail screen
    section (reader + admin-cycle actions) → Phase `B1`; (b) purchase order
    detail screen (route `#/ordens-compra/:id`, the entity's home) → Phase
    `B2`, receipt UI present but wired in Phase C; (c) purchase orders list
    screen (sidebar, filterable) → Phase `B3`. Original bullets retained for
    provenance; the amendment block governs on conflict.
  - **§8 (phasing):** the single Phase `B` row is superseded by `B1`/`B2`/`B3`
    plus a clarified Phase `C` (receipt entry point = the order detail screen;
    OP section reflects totals automatically). Phases `D`/`E` unchanged.
    `B1`'s `emitir` carries an additional **fornecedor-assigned precondition**,
    recorded as *additive* to §4's `status_administrativo = 'rascunho'`
    precondition, not a change to the ratified §4 contract.
  - **Ratified content untouched:** the three-dimension model (§1), the
    write-path contracts (§4), the gate definition (§5), and the freeze rule
    (§2.3) are unchanged — the order's escalate-on-conflict condition did not
    trigger (the amendment is confined to §6/§8, which the order authorized).
- **Part 2 — Phase `B1`: HARD STOP (`ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH`).**
  The order routes all DB work through the `supabase-legacy` MCP against
  staging `ucrjtfswnfdlxwtmxnoo`, with "confirm ref, HARD STOP on mismatch" as
  a pre-step. That MCP is **unauthenticated** this session and its OAuth flow
  **cannot be completed non-interactively** (session-start notice; its tools
  are absent from the tool registry, verified via ToolSearch — neither
  `mcp__supabase-legacy__*` nor `mcp__supabase__*` resolvable). Consequently
  the mandated ref-confirmation itself cannot run, and neither can: the
  `emitir_ordem_compra_fio` / `cancelar_ordem_compra_fio` RPCs, the RLS-revoke
  migration `db/66`, the RPC role-matrix tests, or the final-ACL catalog
  verification. Per the Supervision Protocol, a phase that cannot meet its
  test/verification gate is **not** closed with unverified artifacts; the
  executor stopped and reported rather than commit unapplied RPCs/RLS/UI as a
  false `B1` closeout. **To unblock:** authorize the `supabase-legacy` MCP in
  an interactive session, then resume/re-issue Part 2.
- **Validação:** docs-only Part 1 — `git diff --check` clean; the three spec
  edits + `PROJECT_STATE.md` + this ledger entry are the whole change set. No
  schema/RPC/JS file created or modified. MCP unavailability confirmed by
  ToolSearch returning no `supabase*` tools.
- **Record (this commit):** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_
  PROPOSED.md` (top-banner amendment pointer, §6 amendment block, §8 amendment
  block); `PROJECT_STATE.md` (ORDEM-COMPRA track note updated with the
  amendment + `B1` authorization + hard stop; the ratification-era "all phases
  NOT AUTHORIZED" sentence cross-referenced; `ORDEM-COMPRA-B1-BLOCKED-BY-MCP-
  AUTH` live debt added; candidate-fronts line → `B2`-`E`; Closed-phases row
  added); this ledger entry.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — docs-only, one
  coherent amendment; `§15` (Git) — selective staging by literal path, single
  docs commit on `dev`, the pre-existing uncommitted `.gitignore` change left
  untouched/unstaged, no `add -A`/`reset`/`rebase`/force-push/`merge`/`tag`/
  `amend`; `§19` — English throughout (spec is a canonical doc; no UI text
  touched). No staging/production access; no push authorized by this order
  segment.
- **Next indicated at closeout:** resolve `ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH`
  (authorize the `supabase-legacy` MCP interactively), then execute Phase `B1`
  Part 2 under its authorization. Amendment Part 1 requires nothing further.

---

## 2026-07-18 — ORDEM-COMPRA-LIFECYCLE Phase B1 — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` (Sonnet 5 / low effort, docs-only closeout,
  branch `dev`). Supersedes the hard-stop recorded in the prior entry
  (`ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH`) — the `supabase-legacy` MCP
  authenticated this session.
- **Front:** `ORDEM-COMPRA-LIFECYCLE` track, Phase `B1`.
- **What closes:** both halves of Phase `B1`.
  - **UI reader** (`buildOrdensReaderSection`, `js/screens/op-nova.js`,
    commit `b0c3f27`): one row per linked order, material—cor · fornecedor ·
    qtd · three dimension badges · Emitir/Cancelar admin actions per state,
    config chip, frozen-at-emission note, no receipt inputs; defensive
    extended-select-with-fallback so a pre-`db/65` database degrades safely.
  - **DB half** (`db/66_ordem_compra_emitir_cancelar.sql`, commit `5a2cde7`,
    applied to staging `ucrjtfswnfdlxwtmxnoo` in an earlier session):
    `emitir_ordem_compra_fio`/`cancelar_ordem_compra_fio` RPCs (admin-only via
    `is_admin()`; emit requires `status_administrativo='rascunho'` AND
    `fornecedor_id IS NOT NULL`; cancel requires `rascunho`|`emitida`; each
    writes one `ordem_compra_eventos` row) + partial ACL hardening (`REVOKE
    UPDATE` on `ordens_compra_fio` from `authenticated`, restored
    column-by-column except the three dimension columns).
- **Verification this session (read-only diagnosis → seed → verify →
  fix, four sub-steps):**
  1. **Staging seed:** HARD STOP fingerprint (`usuarios_eventos=9`,
     `document_link_revisions=8`) confirmed the MCP pinned to
     `ucrjtfswnfdlxwtmxnoo` before any write. Seeded `fornecedor_id` on 4
     `rascunho` orders (OP nº36/2026, ids 137-140) via direct `UPDATE` (not
     the broken UI selects) so the architect could walk both admin actions.
  2. **Bug report reconciliation:** the architect observed an Emitir click
     on a null-fornecedor order show a success toast and appear to move to
     `emitida`. A full scan of every non-legacy `ordens_compra_fio` row
     showed **100% still `rascunho`, zero real `emitida_em`, zero
     `ordem_compra_eventos` rows** — no order had ever actually transitioned
     via this RPC. A first re-test attempt (CTEs joined only by a constant)
     gave a false "no effect" reading — Postgres does not guarantee CTE
     execution order without a real data dependency; corrected with a
     PL/pgSQL `DO` block (guaranteed sequential statements) in a scoped
     `BEGIN…ROLLBACK` transaction simulating the admin JWT
     (`request.jwt.claims`): null-fornecedor emit → `{ok:false,erro:'Ordem
     sem fornecedor atribuido nao pode ser emitida'}`, row unchanged;
     fornecedor-assigned emit → `{ok:true,...}`, row genuinely transitions +
     1 `ordem_compra_eventos` row. **The RPC and db/66's matrix are correct
     in both directions** — the discrepancy was entirely client-side.
  3. **Root cause + fix:** `emitirOrdemCompra`/`cancelarOrdemCompra`
     (`js/screens/op-nova.js:1073-1091`, pre-fix) checked only `res.error`
     (transport-level); the RPCs return HTTP 200 with `{ok:false,erro:...}`
     on business-logic rejection, so `res.error` stays falsy and the code
     fell through to an unconditional success toast + `reloadOrdens()`.
     Fixed (commit `275ede2`) to also check `res.data.ok !== true`,
     surfacing `res.data.erro` on rejection; identical fix applied to
     `cancelarOrdemCompra` (same latent defect, not yet observed live —
     double-cancel would have false-succeeded identically).
  4. **Sweep (no systemic debt):** every other `supa.rpc(...)` call site
     checked — `alterar_status_op`, `concluir_pedido_se_pronto`,
     `cliente_pedido_summary`, `registrar_entrega_expedicao`,
     `liberar_expedicao`/`liberar_expedicao_latex_parcial`, the
     `documents-supabase-*` adapters, `delete-helpers.js`'s
     `normalizeResult` already check `res.data.ok === false` correctly;
     `gerar_op_latex`/`gerar_op_latex_split` (`RAISE EXCEPTION`, no
     `{ok,erro}` envelope), `proximo_numero_op`/`admin_usuarios_last_sign_in`
     (plain scalar/read, no envelope) correctly use error-only checks. This
     was an isolated defect in the two new B1 handlers, not a pattern.
  5. **Architect visual re-walk (staging):** error path — Emitir on the
     "— não atribuído" order → error toast, row stays Rascunho; success
     path — Emitir on a fornecedor-seeded order → success toast, badge
     flips to Emitida. **Both confirmed OK.**
- **Tests:** 2 new render-harness smokes (`tests/op-nova.smoke.js` #77-78)
  assert the error path (rejected emit/cancel → error toast with the RPC's
  own message, not the false success toast, correct `bg-red-600` class).
  Harness extended with an optional `rpcImpl` hook on
  `buildFakeSupa`/`makeRenderSandbox`/`renderNovaOpForTest` (default
  preserves prior no-op behavior, zero impact on existing tests) and an
  exposed `sandbox.__toastsNode`. `tests/op-nova.smoke.js` 83/83 pass; full
  suite `132` pre-existing failures unchanged, zero regression.
- **Ratified supplier-assignment decision (this closeout, binding):**
  fornecedor assignment is a **per-order** property of `ordens_compra_fio`.
  The schema already supports it fully — nullable `fornecedor_id` FK, one
  row per material+color already generated at Abrir OP
  (`montarOrdensCompraFio`), already the row-level RLS ownership key
  (`ocf_fornecedor_read`/`ocf_fornecedor_update`) and already the `emitir`
  RPC's own precondition — **no schema change needed**, this is UI-relocation
  work. Assignment **moves to the future Phase `B2` order-detail screen**.
  The OP-screen's legacy fornecedor selects (`buildAtrib` in `op-nova.js`,
  which bulk-assigns one fornecedor per material type across an entire OP
  via `atribuirFornecedorFioOp`, collapsing what the schema already models
  as independent per-color orders) are **removed only after `B2` is
  functional** — no gap where assignment becomes impossible in the UI.
  `op_fornecedores` (the OP-level `etapa`-keyed bookkeeping table) is
  **kept synchronized as a compatibility projection, not cosmetic** —
  `ops_fornecedor_read`/`op_itens_fornecedor_read` RLS key on it for
  supplier visibility into the OP, and `screenFornecedorOrdens`'s embedded
  `ops(numero,ano)` join silently degrades to `—` without it; `B2`'s
  fornecedor-assignment writer must also upsert the matching
  `op_fornecedores` row. **Reassignment after `emitida` is BLOCKED** — the
  correction path is cancel + open a new draft order, not an in-place swap
  on an already-emitted order (keeps the `ordem_compra_eventos` audit trail
  honest, consistent with the ratified "emission locks quantities"
  precedent). The empty-dropdown bug (`fornecedores.tipo` domain
  `fio_algodao`/`fio_poliester`/`tecelagem`/`latex` vs
  `ordens_compra_fio.tipo` domain `algodao`/`poliester`, collided under the
  shared variable name `tipo` in `buildAtrib`, `op-nova.js:1185-1188`) is
  **recorded as noted-not-fixed** — those selects are slated for removal at
  `B2`, so patching a soon-to-be-deleted path is not worthwhile.
- **Debts registered (canonical, verbatim):**
  - `ORDEM-COMPRA-B1-KG-RECEBIDO-ACL-GAP` — `kg_recebido` remains directly
    writable by `authenticated` after `db/66` (both
    `registrarRecebimentoOrdemFio`, `op-writes.js:29-43`, and
    `screenFornecedorOrdens`, `fornecedor.js:461-463`, keep writing it
    directly, the latter gated by the pre-existing `ocf_fornecedor_update`
    RLS policy); PostgreSQL column-level `REVOKE` cannot narrow an
    already-existing table-level grant without breaking both live
    consumers immediately, with no replacement RPC. **Closes only when
    Phase C ships the ledger-based `registrar_recebimento_ordem_compra_fio`
    RPC in the same migration that revokes `kg_recebido` from
    `authenticated`.**
  - `SUPPLIER_RECEIPT_WRITE_PATH_DISCOVERED` — `js/screens/fornecedor.js:461`
    (`screenFornecedorOrdens`) is a live, independent supplier-facing direct
    `UPDATE` of `kg_recebido`/`data_recebimento`/`status` on
    `ordens_compra_fio`; not mentioned in the spec's §0 evidenced-inventory
    (which asserted suppliers have no existing write path on this table).
    Flagged here in the provenance trail — **§0 of
    `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` is
    deliberately NOT rewritten**; the discovery is recorded as a correction
    trail, not folded silently into the ratified inventory text.
  - **Phase C scope AMENDED (binding):** the ledger-based
    `registrar_recebimento_ordem_compra_fio` RPC and rewrite must serve
    **both** live consumers — `op-writes.js`'s `registrarRecebimentoOrdemFio`
    **and** `fornecedor.js`'s `screenFornecedorOrdens` (previously scoped
    only around the admin writer) — `screenFornecedorOrdens` must be
    rewritten to call the ledger RPC instead of updating
    `ordens_compra_fio` directly.
- **Record (this commit):** `PROJECT_STATE.md` (Phase `B1` marked `CLOSED /
  ACCEPTED`, `ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH` marked `RESOLVED`, the
  three debts registered, the supplier-assignment decision recorded,
  Closed-phases row added); `AGENT_HANDOFF.md` (new entry, prepended); this
  ledger entry.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — docs-only
  closeout, one coherent record of an already-verified phase; `§15` (Git) —
  selective staging by literal path, single docs commit on `dev`, the
  pre-existing uncommitted `.gitignore` change left untouched/unstaged, no
  `add -A`/`reset`/`rebase`/force-push/`merge`/`tag`/`amend`; `§19` —
  English throughout (canonical docs; no UI text touched). No DB/schema
  action this commit (the RPCs/ACL were already live from an earlier
  session, re-verified read-only + via a rolled-back synthetic matrix); no
  production access; no push to `main`.
- **Next indicated at closeout:** Phase `B2` (order detail screen, route
  `#/ordens-compra/:id`), its own order — scope must include the per-order
  fornecedor-assignment UI per the ratified decision above, and must
  preserve the `op_fornecedores` compatibility-projection write.

## 2026-07-18 — ORDEM-COMPRA REFOUNDATION — Legacy Diagnosis + PART 1 refounded spec — PROPOSED / AWAITING RATIFICATION

- **Gate:** documentation-only phase (Opus 4.8 / high effort). Multi-order chain:
  (1) "ORDEM-COMPRA REFOUNDATION SPEC" (docs + read-only diagnosis), (2)
  "HEADER-COUNT RECONCILIATION" (read-only), (3) "RATIFY 51-HEADER LEGACY MODEL"
  (diagnosis correction + commit), (4) "CONTEXT SUPPLEMENT SUPPLIED / PART 1
  UNBLOCKED". No implementation, no schema/RPC, no production access, no push,
  `main` untouched.
- **Front:** `ORDEM-COMPRA-LIFECYCLE`, refoundation of the purchase-order model.
- **Read-only legacy diagnosis (staging `ucrjtfswnfdlxwtmxnoo`, HARD STOP ZERO
  passed — `usuarios_eventos=9`/`document_link_revisions=8`):** full-table
  classification of all 64 `ordens_compra_fio` rows into four classes (A 27 legacy
  emitted+received; B 12 legacy emitted-unreceived; C 13 clean drafts; D 12 draft
  but physically-received via the direct-write path). Facts: `ordem_compra_eventos`
  and `ordem_compra_fio_lancamentos` both **empty**; 60/64 rows `fornecedor_id`
  NULL; OP36 splits one OP across suppliers 4/5/22; over-receipt +405.98 kg; 0
  cancelled, 0 partial receipts. `docs/reports/ORDEM_COMPRA_LEGACY_DIAGNOSIS_
  2026-07-18.md`.
- **Header-count reconciliation → architect ruling:** a first preview reported 14
  headers (grouped NULL suppliers by pedido — **rejected**, fabricates commercial
  identity); a 50-header alternative merged `(pedido,fornecedor)` (**rejected** —
  proves future draft-accumulation, not historical order identity). **Architect
  ratified the 1:1 model:** every header-bearing legacy row → its own legacy
  header, no auto-merge, Class C → needs-only. **Ratified counts: 64 needs / 51
  headers / 51 items / 51 allocations** (A 27/27/27/27, B 12/12/12/12, C 13/0/0/0,
  D 12/12/12/12). OP36 = **4 legacy headers** (vs 3 future-native). Diagnosis
  corrected to the ratified model and committed **alone** as `de62b16` — "Add
  purchase-order legacy diagnosis" (1 file, 259 insertions; `.gitignore` not
  staged).
- **CONTEXT SUPPLEMENT blocker (four structural flaws):** referenced across orders
  but absent from the session and the repository (exhaustive search). Executor
  **hard-stopped twice** rather than fabricate; the architect confirmed the stop
  correct and supplied the authoritative CONTEXT SUPPLEMENT, unblocking PART 1.
- **PART 1 — refounded spec (`Part R`, PROPOSED):**
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` amended (status →
  `PROPOSED / AWAITING ARCHITECT RATIFICATION`) with the four-layer model
  (`necessidade_compra_fio → ordem_compra → ordem_compra_item →
  ordem_compra_item_alocacao`): domain ownership (Pedido owns header, OP-origin at
  allocation), the three internal acts of the Insumos stage, allocation invariants
  making **double distribution structurally impossible**, native accumulator
  (Rule 1: one active draft per pedido+fornecedor; new draft after emission; native
  supplier required), issuance freeze + immutable emitted order + cancel-and-
  replace, acceptance lifecycle, item-level immutable receipt ledger + derived
  state (Rule 2: snapshot→ledger transition), over-receipt→`saldo_fios`, legacy
  1:1 conversion (A/B/C/D, 64/51/51/51, supplier-null exception, Class-D
  received-without-emission provenance, OP36 legacy-vs-native), coexistence with
  `ordens_compra_fio` (**both** receipt writers `registrarRecebimentoOrdemFio` +
  `screenFornecedorOrdens` live until Phase C; `KG-RECEBIDO-ACL-GAP` closes only
  after both migrate and direct UPDATE is revoked), immutable events, native-vs-
  legacy identity semantics, production-diagnosis precondition, migration
  safety/rollback boundaries, and permanent UI governance. **Explicit verification
  against the four flaws (§R.18) and the two additional rules (§R.19).** Rephased
  track `REFUND-A → REFUND-B1 → PRE-PROD → B2 → C → D → E` with per-phase
  responsibility + exit gate (§R.17). The flat foundation of Phase `A` (`db/65`) /
  `B1` (`db/66`) is **superseded on the persistence model**; §0–§11 retained for
  provenance; **historical acceptance of A/B1 preserved, not erased.**
- **Canonical reconciliation (§8, 11 docs — no material contradiction):**
  `AGENT_HANDOFF`, `PROJECT_STATE`, `PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO`
  (orthogonal), `PEDIDO_PRODUCTION_FLOW_BACKLOG` (confirms two-writer reality +
  transition-modal/dedicated-screen UI), `DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO`
  (orthogonal), `PEDIDO_OP_SCHEMA_CONTRACT` (confirms ownership: `lotes.pedido_id`
  grouping, no `ops.pedido_id`/`pedidos.op_id`, OP-origin chain), the current spec,
  the ledger (append-only), `DOCUMENTATION_INDEX`, `DOCUMENTATION_MODEL`,
  `SUPERVISION_PROTOCOL`. **Follow-ups flagged (outside this pass's allowed
  files):** `PEDIDO_OP_SCHEMA_CONTRACT.md §6.2` (Insumos source names
  `ordens_compra_fio` — will need the four-layer model post-cutover) and
  `DOCUMENTATION_INDEX.md` (register the new diagnosis report + refounded spec) —
  each a separate documentation phase.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — documentation only, no
  code/schema/Supabase action; `§15` (Git) — selective staging by literal path,
  two commits on `dev` (diagnosis alone, then spec + state/continuity), pre-existing
  `.gitignore` change left untouched/unstaged, no `add -A`/`reset`/`rebase`/
  force-push/`merge`/`tag`/`amend`; `§16` (documentation) — spec amended, state +
  ledger updated, `DOCUMENTATION_INDEX` registration deferred as a flagged
  follow-up (out of allowed-file scope); `§19` — English throughout. Read-only DB
  access was limited to legacy `ucrjtfswnfdlxwtmxnoo` (fingerprint-confirmed);
  production `gqmpsxkxynrjvidfmojk` and prohibited `bhgifjrfagkzubpyqpew` **not
  accessed**.
- **Production:** UNKNOWN for migration; not accessed. A contemporaneous read-only
  production diagnosis is a **binding precondition** before any production
  promotion/migration in this track (§R.14). **Push:** none (prohibited by order).
- **Record:** diagnosis commit `de62b16` ("Add purchase-order legacy diagnosis");
  PART 1 commit "Propose purchase-order refoundation specification"
  (`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry).
- **Next authorizable action:** architect review + explicit ratification of Part R.
  `REFUND-A` and every phase remain `NOT AUTHORIZED`.

## 2026-07-18 — ORDEM-COMPRA REFOUNDATION — Part R DESIGN-GATE PATCH — PROPOSED / AWAITING RATIFICATION

- **Gate:** documentation-only patch (Opus 4.8 / high effort). Order chain: (1)
  "PART R RATIFICATION AUDIT" (read-only) → verdict
  `REQUIRES_SPEC_PATCH_BEFORE_RATIFICATION`; (2) "PART R DESIGN-GATE PATCH" —
  architect accepted the verdict and supplied design rulings 1–7. No
  implementation, no DB access, no production, no push, `main` untouched.
- **Front:** `ORDEM-COMPRA-LIFECYCLE` refoundation, Part R design-gate correction.
- **Audit findings (accepted):** Part R had three flagged `DESIGN` alternatives
  (need-origin model; double-distribution enforcement; consolidation granularity)
  plus a UNIQUE-key defect, an opening-balance-vs-ledger contradiction, incomplete
  concurrency control (write skew), and a coexistence dual-write gap. Active-draft
  uniqueness and Class-D representability were passed as adequate.
- **Rulings applied (Part R patched, no alternatives remain):**
  - **R1 atomic need (Model A):** dropped `necessidade_compra_fio_origem` + rejected
    JSONB; each `necessidade_compra_fio` row carries its own origin
    (`origem_tipo`∈{op,pedido}, `op_id` set iff 'op'); no parent/child total
    invariant.
  - **R2 identity/granularity:** cotton = one need per (pedido, op, color); shared
    polyester = one per (pedido, color), `op_id` NULL; **NULL-safe separate partial
    unique indexes** (not one UNIQUE over nullable columns); recalculation
    reconciles the same logical need and is rejected if it would drop
    `kg_necessario` below `kg_alocado`. **64 needs unchanged.**
  - **R3 double-distribution:** single design — canonical `SECURITY DEFINER`
    allocation RPCs (direct DML revoked), trigger-maintained
    `necessidade.kg_alocado` cache with `CHECK (>=0 AND <=kg_necessario)`,
    `SELECT … FOR UPDATE` on the need row, INSERT/reversal coverage, deterministic
    lock order; the **T1/T2 write-skew race is documented and defeated**; bare-SUM
    and app-only designs rejected; drift is a blocking audit invariant.
  - **R4 Class-D:** constrained `legado_provenance` domain (CHECK) + table invariant
    `ordem_compra_no_native_anomaly` (native row cannot be rascunho+received);
    Class C has no header/provenance.
  - **R5 ledger + opening balance:** single ledger-derived model post-Phase-C, **no
    `kg_recebido_inicial`**; append-only ledger with `tipo`∈{recebimento,
    import_saldo_inicial, estorno}, `idempotency_key UNIQUE`, compensating negative
    `estorno`, no UPDATE/DELETE; no opening entry during REFUND-A (reads flat);
    8-step Phase-C cutover creates exactly one idempotent import entry per nonzero
    balance, reconciles, then revokes — no double-count.
  - **R6 over-receipt:** attributable = min(received, allocations); surplus =
    max(received − attributable, 0) → `saldo_fios`; idempotency/no-double-count
    fixed now.
  - **R7 coexistence authority (per dimension):** authority matrix per phase (admin
    → new at REFUND-B1; receipt → flat until Phase C; ledger after C); **one-to-one**
    compatibility mapping; flat admin columns are mirrors, not competing authority —
    **no equal-authority split-brain**; both flat receipt writers live until Phase C.
  - **Phase gates (R.17):** each phase states admin/receipt authority, bridge state,
    writers, rollback, entry/exit gates, migration-auth-required, UI-validation-
    required; no premature revoke, no unapproved production migration, no
    auto-authorization.
  - **Null-Pedido legacy edge (OP1/OP2):** `pedido_id` nullable-for-legacy (CHECK
    `necessidade_pedido_native`) so the 11 orphan rows import without a Pedido;
    native needs always have a Pedido (§R.10.7). Analogous to the ratified
    supplier-null exception; flagged for ratification.
- **Validation gates (all pass):** no `necessidade_compra_fio_origem`/JSONB origin
  store (only negated); one concurrency design; T1/T2 addressed; ledger derivation
  non-contradictory; idempotency + compensation present; coexistence authority per
  dimension; no REFUND-B1→C split-brain; Class-D representable; active-draft rule
  intact; **conversion remains 64/51/51/51**. Search for open-alternative language
  (`TBD`/`TODO`/`to decide`/`alternative`/`option`/`recommend`/`DESIGN:`) → **all
  matches in the superseded §0–§11** (ratified decisions / historical flat model);
  **none in Part R.**
- **Canonical reconciliation:** no material contradiction; the two known follow-ups
  (`PEDIDO_OP_SCHEMA_CONTRACT.md §6.2`, `DOCUMENTATION_INDEX.md` registration)
  remain **non-blocking documentation follow-ups**, not edited in this pass.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` docs-only; `§15` selective staging by
  literal path, one commit on `dev`, `.gitignore` untouched/unstaged, no
  `add -A`/`reset`/`rebase`/force/`merge`/`tag`/`amend`; `§16` spec + state + this
  ledger; `§19` English. No DB access, no production, no prohibited-project access.
- **Record:** commit "Resolve purchase-order refoundation design gates"
  (`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry).
- **Next authorizable action:** a **final read-only ratification audit** of the
  patched Part R; then architect ratification; then `REFUND-A`, its own order.
  `REFUND-A` remains `NOT AUTHORIZED`.

## 2026-07-18 — ORDEM-COMPRA REFOUNDATION — Part R FINAL STRUCTURAL PATCH — PROPOSED / AWAITING RATIFICATION

- **Gate:** documentation-only patch (Opus 4.8 / high effort). Order chain: (1)
  "FINAL PART R RATIFICATION AUDIT" (read-only) → `REQUIRES_SPEC_PATCH_BEFORE_
  RATIFICATION`; (2) "PART R FINAL STRUCTURAL PATCH" — architect accepted the
  verdict and supplied structural rulings. No implementation, no DB access, no
  production, no push, `main` untouched.
- **Front:** `ORDEM-COMPRA-LIFECYCLE` refoundation, Part R final structural
  correction.
- **Audit findings (accepted):** design-gate patch was language-clean but had
  structural gaps — four material/origin combinations permitted where only two are
  native-canonical; NULL-pedido legacy uniqueness hole; missing legacy source-row
  identity; RPC-only OP/Pedido ownership; ledger sign/over-reversal unspecified;
  compatibility mapping prose-only; saldo stale-after-estorno. Class-D and
  active-draft uniqueness passed.
- **Rulings applied (Part R patched):**
  - **Legacy need identity (§2):** added `legado_origem_ordem_compra_fio_id`
    (NOT NULL iff legado; UNIQUE among legacy; source-row identity, **not**
    COALESCE/nullable-Pedido). Two historical rows sharing OP/material/color/
    supplier/state are not merged.
  - **Material/origin domain (§3):** `necessidade_material_origem` CHECK — exactly
    **two native combos** (cotton=OP-origin, polyester=Pedido-origin); **OP-origin
    polyester = legacy-only**; **Pedido-origin cotton forbidden** (native + legacy).
  - **Partial uniqueness (§4):** three separate indexes — native cotton
    `(pedido,op,cor)`, native shared polyester `(pedido,cor_poliester)`, legacy
    import `(legado_origem_ordem_compra_fio_id)`; no native index for OP-origin
    polyester / Pedido-origin cotton; legacy dedup by source row, not nullable-Pedido.
  - **Need write authority + ownership (§5):** revoke direct DML on
    `necessidade_compra_fio`; sole `SECURITY DEFINER` writers; constraint trigger
    enforcing `op_id → ops.lote_id → lotes.pedido_id = pedido_id` on every write
    regardless of caller (RPC-only insufficient); legacy exception carved.
  - **Allocation writer order (§6):** RPC (lock need `FOR UPDATE` → verify parent
    native active draft → mutate allocation) vs trigger (sole `kg_alocado`
    maintainer, does not touch allocation row) — no double-maintenance.
  - **Receipt ledger (§7-8):** sign CHECKs (`recebimento`/`import` kg>0,
    `estorno` kg<0 + `estorno_de_id` to a positive same-item entry); two-way
    append-only (`REVOKE UPDATE/DELETE` + mutation guard); partial/repeated
    reversals with `SUM(ABS(estornos)) <= original`, over-reversal rejected,
    cumulative `kg_recebido` cannot go negative; idempotency_key UNIQUE.
  - **Compatibility mapping (§9):** explicit `ordem_compra_item_compat_fio` table,
    two `UNIQUE` FKs (one-to-one both directions), immutable, `origem` ∈
    {imported_legacy, native_bridge}; creation timing per phase; Class C → no
    mapping; writers locate the flat row via the mapping, not inference.
  - **Opening import + recovery (§10):** one controlled maintenance window, fence
    verified by write-denial, one import entry per nonzero mapped balance
    (idempotency = mapping+item+cutover), **point of no return = first canonical
    receipt write after read switch**; before = rollback to flat; after =
    forward-only.
  - **Saldo reconciliation (§11):** event-derived `surplus_delta` per ledger entry;
    movement UNIQUE by (ledger entry, movement type); estorno → negative movement
    (stale surplus corrected); transactional/outbox; reconciles to derived surplus.
  - **Native receipt gate (§12):** receipt only when `emitida` + `status_aceite IN
    (nao_aplicavel,aceita)`; **receipt-before-issuance prohibited**; Class-D is a
    legacy import exception.
- **Validation gates (all pass):** source-row legacy identity; separate
  native/legacy uniqueness; two native combos only; OP-origin polyester legacy-only;
  Pedido-origin cotton forbidden; need DML revoked; ownership DB guard; sole
  `kg_alocado` maintainer; ledger sign + partial/over-reversal + non-negative
  cumulative + append-only; explicit mapping table + two-way uniqueness; Class C no
  mapping; bridge item mapped before receivable; idempotent import; cutover
  rollback + point-of-no-return; event-derived idempotent saldo; explicit receipt
  lifecycle states; **conversion remains 64/51/51/51**; **no open-alternative
  language in Part R** (the one `either` at the mapping-timing bullet is natural
  language; all other matches are in the superseded §0–§11).
- **Canonical reconciliation:** no material contradiction; the two documentation
  follow-ups (`PEDIDO_OP_SCHEMA_CONTRACT.md §6.2`, `DOCUMENTATION_INDEX.md`
  registration) remain **non-blocking** and untouched.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` docs-only; `§15` selective staging by
  literal path, one commit on `dev`, `.gitignore` untouched/unstaged, no
  `add -A`/`reset`/`rebase`/force/`merge`/`tag`/`amend`; `§16` spec + state + this
  ledger; `§19` English. No DB access, no production, no prohibited-project access.
- **Record:** commit "Complete purchase-order refoundation structural contract"
  (`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry).
- **Next authorizable action:** one final read-only verification of the patched
  structural clauses; then architect ratification; then `REFUND-A`, its own order.
  `REFUND-A` remains `NOT AUTHORIZED`.

## 2026-07-18 — ORDEM-COMPRA REFOUNDATION — Part R RATIFICATION CLOSEOUT — RATIFIED / ACCEPTED

- **Architect ruling:** Part R is `RATIFIED / ACCEPTED`. Acceptance baseline:
  `f2261ec`. The final read-only verification returned `RATIFIABLE` and found no
  migration-critical contradiction, omission, ambiguity, or unresolved choice.
- **Acceptance chain:** legacy diagnosis commit `de62b16`; initial proposed-spec
  commit `c49f369`; design-gate commit `c10e959`; final structural-contract commit
  and acceptance baseline `f2261ec`.
- **Conversion confirmed:** **64 needs / 51 headers / 51 items / 51 allocations**.
  Every header-bearing legacy source row remains 1:1; Class C remains needs-only.
- **Persistence ruling:** the four-layer Part R model is governing. Historical
  acceptance of old Phase `A` and `B1` is preserved; their flat persistence
  foundation is superseded, not erased.
- **Authorization boundary:** acceptance authorizes no implementation. No
  implementation has begun. `REFUND-A` remains `NOT AUTHORIZED` and requires its
  own architect order. A contemporaneous read-only production diagnosis remains a
  binding precondition before any production promotion or migration in this track.
- **Pending non-blocking documentation follow-ups:** update
  `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 and register the refounded spec/diagnosis in
  `DOCUMENTATION_INDEX.md`; neither changes or blocks the ratified structural model.
- **Local instruction-file classification:** untracked root `AGENTS.md` was present
  before this closeout and is byte-identical to tracked `CLAUDE.md`, the authority-
  none agent-tooling pointer. It has no repository references or Git history,
  introduces no conflicting instruction, and was left untouched and uncommitted.
  Pre-existing `.gitignore` changes were also left untouched and unstaged.
- **Scope:** documentation-only closeout. Only the governing spec, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, and this append-only ledger were changed. No code, migration,
  database, production, prohibited project, push, or `main` action occurred.
- **Next authorizable action:** `REFUND-A`, by a separate explicit architect order.
  `REFUND-A` remains `NOT AUTHORIZED`.

---


<!-- G28_LEDGER_SHADOW_PAYLOAD_END_7b9d4e3a -->
