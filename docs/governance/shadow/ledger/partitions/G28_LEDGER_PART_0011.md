<!-- GENERATED NON-CANONICAL SHADOW LEDGER PARTITION — DO NOT EDIT -->
<!-- partition_id: G28-LEDGER-PART-0011 -->
<!-- canonical_source: docs/ledgers/G28_LEDGER.md -->
<!-- source_unit_interval: G28-LEDGER-UNIT-0179..G28-LEDGER-UNIT-0194 -->
<!-- canonical_byte_interval: 870694..972400 -->
<!-- canonical_line_interval: 8515..9509 -->
<!-- payload_sha256: 5ecc5342ebad7bc64bd93a521b13f42ffab01f04c0fb5ea15c05139eafc239e4 -->
<!-- oversized_single_unit: false -->
<!-- partition_status: CLOSED -->
<!-- G28_LEDGER_SHADOW_PAYLOAD_BEGIN_7b9d4e3a -->
## 2026-07-22 — C5A-DB77-SHARED-DEV-VALIDATION-R1 — PHASE-C5A shared development database apply + §14 evidence (shared-development verified)

- **Authorization:** `C5A-DB77-SHARED-DEV-VALIDATION-R1` — controlled apply of the
  already locally accepted `db/77_ordem_compra_c5a_emission_readiness.sql` to the
  explicitly authorized **shared development** Supabase project
  `ucrjtfswnfdlxwtmxnoo` (non-production), the complete contract §14
  shared-environment evidence, proportional documentation, and one local
  documentation-only evidence commit. **Not** a self-acceptance or closeout of
  `PHASE-C5A`; no `PHASE-C5` UI, no `PHASE-C5B`, no `REAL_CUTOVER`, no production
  access, no staging, no deployment, no push.
- **Entry baseline:** branch `dev`; `HEAD`
  `e7a8b76152f986c83e4ecfe9827346a4efa5ef08` (parent
  `27464520af2afa3c46d547ffaf76328df70b1889`); protected residue `M .gitignore`,
  `?? .codex/config.toml`, `?? .mcp.json` (untouched); `staging/dev`
  `0df4228f903ae68c7e8b240e69ff3b37df9ebd86` (0/11 behind local `dev` — expected,
  non-blocking).
- **Database identity gate (read-only):** connected via the project-scoped
  `supabase-dev-g28` MCP to Supabase **PostgreSQL 17.6** (role `postgres`,
  database `postgres`). The migration history matched the canonical dev-DB record
  exactly — terminal `db/76` = version `20260720235820`, the full `65..76`
  purchase-order stack, `db/75` = `20260720234958` — uniquely identifying
  `ucrjtfswnfdlxwtmxnoo`; production `gqmpsxkxynrjvidfmojk` and the forbidden
  project were never accessed (the management API `get_project` was
  permission-denied; no project ref GUC is exposed by Supabase). Pre-apply:
  cutover `legacy_active`/`flat`/`not_started` (nulls); grant matrix
  `emitir_ordem_compra` no application-role EXECUTE,
  `definir_alocacao_necessidade_compra_fio` authenticated-only,
  `alocar_necessidade_compra_fio` ungranted; pre-apply function md5s
  `emitir`=495692f2033cc4abdf9231fcf8c3f01f (db/68 body markers present, no
  read-model logic), `obter`=3a8032cd21a9eeb4e1d9e3e8e7338075,
  `listar`=8e67ce86ae28dcb8a39f9d1d9eafd1fd (db/69 terminal), guard
  `trg_c3c_protected_mutation_guard`=00ea8e9827dd53ca3b33cd5db2337b6b.
- **Apply:** `db/77` applied byte-identical to commit `e7a8b761…` (local SHA-256
  `9628a947ea930ad0f16c0135c9f9a5ef782c7c01e5d3fe71512f0c2fc0ab9919`, 16781 bytes,
  git-blob-verified; the transmitted migration string was hash-verified equal to
  the file before apply) via
  `apply_migration('77_ordem_compra_c5a_emission_readiness', …)` → success;
  resulting terminal migration `20260722055832`
  `77_ordem_compra_c5a_emission_readiness` (one record). Idempotent reapply
  (byte-identical DDL via `execute_sql`) → deterministic convergence: all function
  md5s identical, no duplicate overloads (emitir/obter/listar = 1 each), no broader
  grants, still exactly one `db/77` migration row.
- **Post-apply verification:** `emitir` md5 `495692f2…` **byte-unchanged**
  (grant-only; internal `is_admin()` gate intact); `definir` md5 `6dd5d945…` and
  `_distribuicao_completa_ordem` md5 `2e4ac3c4…` unchanged; read models updated to
  the readiness derivation (`obter`=36409f503cb03e1ce405a2856120b542,
  `listar`=4815373b1676a9f9ea394bfcd8759417; `exige_aceite` +
  `emissao_bloqueada_exige_aceite` present, old `recebimento_nativo_ainda_inativo`
  blocker gone); guard md5 `00ea8e98…` unchanged; grant matrix `emitir`→
  authenticated only (PUBLIC/anon/service_role revoked), obter/listar
  authenticated-only, definir authenticated, alocar revoked.
- **Shared-environment §14 behavioral evidence** (two atomic, self-planting,
  `ROLLBACK`'d transactions on PG 17.6; `execute_sql` cannot run the canonical psql
  script's meta-commands or superuser `session_replication_role`, so the transport
  was adapted — `SET ROLE` + custom-GUC capture, the deferred kg_pedido guard
  avoided by rollback — with every assertion preserved): `C5A_SCRIPT_A_PASS` —
  allocation-writer create `ok`, idempotent replay identical +
  `idempotencia_conflitante`, over-allocation `excede_saldo`; detail read model
  `acoes.emitir`/`pode_emitir`=true, `bloqueio_emissao`=NULL, `acoes.receber`=false;
  list read model `emitir`=true; authenticated non-admin `sem_permissao`; anon
  `42501`; authorized emission through the real `authenticated` grant `ok`/`emitida`,
  `status_aceite`='nao_aplicavel', duplicate `estado_invalido`, exactly one
  `administrativo/emitida` audit event, zero fabricated acceptance decision (writer
  carries no `aceita`/`rejeitada` literal); receipt writer ACL authenticated-only.
  `C5A_SCRIPT_B_PASS` — `sem_fornecedor`, `sem_itens`, wrong-state `estado_invalido`,
  `alocacao_incompleta` with atomic invariance (status stays `rascunho`, 0 events);
  `exige_aceite=TRUE` gates both projections off (`emissao_bloqueada_exige_aceite`)
  and restores; inert `emitir=false` for legacy/emitted/cancelled/incomplete
  (`distribuicao_necessidades_pendente`); cutover fence permits under `legacy_active`
  (all writes ran) and denies protected DML `55000` under `maintenance_fenced` and
  `canonical_active`, then restores `legacy_active`. The fence proof used only a
  non-persistent transactional mechanism (no triggers on `ordem_compra_cutover`),
  so **no `DEFERRED_TO_REAL_CUTOVER` classification was needed**.
- **Cleanup / zero residue (read-only closeout):** cutover unchanged
  `legacy_active`/`flat`/`not_started` (nulls) — **REAL_CUTOVER not activated**;
  zero validation-fixture residue (0 test auth.users/usuarios/clientes/fornecedores/
  needs); `ordem_compra_config.exige_aceite`=false; business data intact
  (`ordens_compra_fio`=64 incl. the 13 unmapped ids 153–165; 39 pre-existing
  emitida orders; `ordem_compra_eventos`=0 — none existed and `db/77` does no event
  DML); terminal `20260722055832` (one `db/77` row). Every validation transaction
  was `BEGIN…ROLLBACK`; sequence values advanced by the rolled-back inserts
  (harmless gaps; zero rows persisted).
- **Documentation:** proportional updates to this ledger,
  `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
  (§24), `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, and
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`. No product, test, script,
  migration, configuration, or protected-residue change; `db/77` remains
  byte-identical to `e7a8b761…`. `node scripts/validate-spec-custody.mjs` PASS;
  `--self-test` unchanged pre-existing active-contract fixture-harness identity
  only; `git diff --check` / `git diff --cached --check` clean.
- **Exact accounting subject:** `docs: record C5A shared development validation`
- **Canonical state after this validation:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C4
  ACTIVE_PHASE = PHASE-C5A-DB-EMISSION-READINESS
  ACTIVE_PHASE_CONTRACT = docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md

  PHASE-C5A IMPLEMENTATION = IMPLEMENTED / LOCALLY VERIFIED / SHARED-DEVELOPMENT VERIFIED / AWAITING SUPERVISOR CLOSEOUT
  OC-C5-EMISSION-001 = PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE
  PHASE-C5 UI = NOT AUTHORIZED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **NEXT_AUTHORIZABLE_ACTION:** supervisor review and acceptance/closeout of the
  now SHARED-DEVELOPMENT VERIFIED `PHASE-C5A` implementation (`db/77` applied to
  `ucrjtfswnfdlxwtmxnoo` + contract §14/§24 evidence). `PHASE-C5` UI
  implementation, `PHASE-C5B-ACCEPTANCE-DECISION`, `REAL_CUTOVER`, staging
  application of `db/76`/`db/77`, activation, deployment, production access, and
  any push remain unauthorized. **No push is authorized by this pass.**

## 2026-07-22 — C5A-CLOSEOUT-AND-C5-AUTHORIZATION-R1 — PHASE-C5A supervisor closeout; PHASE-C5 implementation authorized locally

- **Authorization:** `C5A-CLOSEOUT-AND-C5-AUTHORIZATION-R1` — documentation-only
  supervisor closeout of `PHASE-C5A-DB-EMISSION-READINESS`, plus
  local-implementation authorization of `PHASE-C5`, in the same commit. Type:
  docs-only; no product, test, script, migration, database, environment,
  deployment, or configuration change; no database or shared-environment
  access; no push. Does **not** implement `PHASE-C5` itself.
- **Entry baseline:** branch `dev`; `HEAD` `d17b353ed3eca04225a7decb55f84ccd5817d085`
  (parent `e7a8b76152f986c83e4ecfe9827346a4efa5ef08`); protected residue
  `M .gitignore`, `?? .codex/config.toml`, `?? .mcp.json` (untouched); `staging/dev`
  `0df4228f903ae68c7e8b240e69ff3b37df9ebd86` (0/12 behind local `dev` — expected,
  non-blocking).
- **`PHASE-C5A` closeout (final):** the supervisor **ACCEPTED and CLOSED**
  `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
  as final and binding: `STATUS: CLOSED / ACCEPTED / LOCALLY VERIFIED /
  SHARED-DEVELOPMENT VERIFIED` (contract §25), ratifying every disposition
  already recorded at §22/§23/§24 — the terminal grant matrix (`emitir_ordem_compra`
  → `authenticated` only, `is_admin()` gate unchanged, writer body byte-unchanged);
  the read-model readiness derivation for `obter_ordem_compra_admin`/
  `listar_ordens_compra_admin`; `definir_alocacao_necessidade_compra_fio` staying
  granted and `alocar_necessidade_compra_fio` staying superseded/ungranted;
  `EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE`; and the unmodified C3C
  protected-mutation guard — as final. Accepted commits:
  `a476df3191b914d62acd6718c06771cd1753ac6b` (proposed contract),
  `27464520af2afa3c46d547ffaf76328df70b1889` (contract acceptance),
  `e7a8b76152f986c83e4ecfe9827346a4efa5ef08` (`db/77` local implementation),
  `d17b353ed3eca04225a7decb55f84ccd5817d085` (shared-development validation
  evidence).
- **Evidence-method ruling (final):** the §24 shared-development §14 transport
  adaptation (`SET ROLE` + custom-GUC capture in place of the unavailable `psql`
  meta-commands and superuser `session_replication_role`) is **ratified as
  sufficient, non-blocking evidence** — every required assertion was preserved,
  real authenticated and anonymous authorization paths were exercised, every
  transaction was rolled back, zero persistent fixture residue was proven, no
  shared business record was modified, and no production or prohibited project
  was accessed.
- **Post-C5A debts (recorded, nonblocking, separately owned — not scheduled or
  implemented by this pass):** `PHASE-C5B-ACCEPTANCE-DECISION` gap; the
  `REAL_CUTOVER` mutation-fence alignment question; the active-contract
  self-test fixture-harness limitation; the 13 unmapped legacy
  `ordens_compra_fio` rows (ids 153–165); `SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT`;
  `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE`.
- **`PHASE-C5` implementation authorization (this pass):** with the database
  prerequisite resolved, `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md`
  is authorized for local implementation: `STATUS: ACCEPTED / IMPLEMENTATION
  AUTHORIZED LOCALLY` (contract §22). No ratified §21 decision is reopened:
  functional scope (§6), actor/state/action matrix (§7), API ownership (§9),
  the `CONTROLLED_IRREVERSIBLE_TRANSITION` confirmation classification (§10),
  the closed purely-additive three-file manifest
  (`ordem-compra-data.js`/`-render.js`/`-events.js`, §12), idempotency/error
  contract (§13), test/evidence contract (§14), and hard stops (§16) all
  remain binding. `PHASE-C5B-ACCEPTANCE-DECISION` remains `IDENTIFIED / NOT
  AUTHORIZED` — no `PHASE-C5` implementation order may build any
  acceptance-decision capability. This pass does **not** implement `PHASE-C5`;
  a **fresh Claude Code session** must re-verify the Git baseline first
  (`docs/governance/AGENT_INSTRUCTIONS.md` §2/§3).
- **Manifest (exact):** modified
  `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
  (§25), `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md` (§22),
  `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/ledgers/G28_LEDGER.md` (this entry). No product, test, script,
  migration, configuration, lifecycle-specification, schema-contract,
  visual-contract, or protected-residue change; no database, environment, or
  deployment action; no push.
- **Exact accounting subject:** `docs: close C5A and authorize C5 implementation`
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5A-DB-EMISSION-READINESS
  ACTIVE_PHASE = PHASE-C5
  ACTIVE_PHASE_CONTRACT = docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md

  PHASE-C5A = CLOSED / ACCEPTED / LOCALLY VERIFIED / SHARED-DEVELOPMENT VERIFIED
  PHASE-C5 CONTRACT = ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY
  PHASE-C5 IMPLEMENTATION = NOT YET IMPLEMENTED
  OC-C5-EMISSION-001 = PLANNED / AUTHORIZED_FOR_IMPLEMENTATION
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **NEXT_AUTHORIZABLE_ACTION:** a fresh Claude Code session performs `PHASE-C5` /
  `OC-C5-EMISSION-001` local UI implementation per
  `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md` (§6/§12/§14/§15/§16).
  `PHASE-C5B-ACCEPTANCE-DECISION`, `REAL_CUTOVER`, any shared-database apply
  beyond `db/77`, staging validation/application of `db/76`/`db/77`,
  deployment, activation, production access, branch creation, and any push
  remain unauthorized. **No push is authorized by this pass.**

---

## 2026-07-22 — C5-PURCHASE-ORDER-EMISSION-UI-IMPLEMENTATION-R1 — PHASE-C5 native purchase-order emission UI (implemented, locally verified, awaiting review)

- **Gate:** `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR FUNCTIONAL AND
  VISUAL REVIEW` — not self-accepted, not closed.
- **Phase:** `PHASE-C5` (`OC-C5-EMISSION-001`), local UI implementation under the
  accepted material contract `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md`
  (§22, `ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY`). Entry checkpoint HEAD
  `538f4ba7b7aae5d6e9e0efbe29a57e1ef7bbc776`; parent
  `d17b353ed3eca04225a7decb55f84ccd5817d085`.
- **Scope implemented:** wired the previously disabled `oc-emitir` control to
  native `public.emitir_ordem_compra(BIGINT)` driven EXCLUSIVELY by the server
  `acoes.emitir` signal (never recomputed client-side); added the ratified
  `CONTROLLED_IRREVERSIBLE_TRANSITION` confirmation modal (explicit confirmation,
  primary/neutral — not destructive-red, in-flight duplicate-submit guard,
  authoritative reload after a deterministic success, reload-first resolution of
  an ambiguous transport with no auto-retry and no fallback writer, fixed pt-BR
  message per deterministic writer `codigo`); surfaced `status_aceite`
  (`nao_aplicavel`/`pendente`/`aceita`/`rejeitada`) on the detail header with the
  honest "not lifecycle-complete" notice for a pending acceptance. No
  acceptance/rejection capability built (`PHASE-C5B` untouched).
- **Product manifest (additive only, exactly contract §12):**
  `js/screens/ordem-compra-data.js` (emitir wrapper + local
  transport-ambiguity/attempt-tracker primitives + result classifier),
  `js/screens/ordem-compra-render.js` (server-derived emit button +
  `status_aceite` badge + blocker/readiness/pending notices),
  `js/screens/ordem-compra-events.js` (emitir confirmation-modal handler). No new
  product file; `index.html`, `js/router.js`, `js/boot.js`,
  `js/screens/common.js`, `js/ui.js`, the receipt/distribuicao/cutover/op-nova
  surfaces and all `db/*.sql` byte-unchanged; the
  `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` debt left untouched.
- **Tests (exactly contract §14):** new `tests/ordem-compra-emitir.smoke.js`
  (faithful DOM/VM behavioral suite covering the §14 / order manifest points
  1–25); updated `tests/ordem-compra.smoke.js` tests 4–5 to the server-derived
  state (retaining the "never calls `emitir_ordem_compra` while disabled"
  guarantee).
- **Validation:** targeted suites green (emitir + ordem-compra 48/48; the four C4
  receipt suites 38/38). Full Node suite differential vs a detached baseline
  worktree at `538f4ba`: baseline 142 / worktree 122 failing identities,
  **added failing identities = empty** (zero regressions; the 20 baseline-only
  identities are pre-existing non-determinism, unrelated to emission).
  `node scripts/validate-spec-custody.mjs` PASS; `--self-test` fails only on the
  pre-existing active-contract fixture-harness limitation (`R1:
  ACTIVE_PHASE_CONTRACT is not an existing file`), proven byte-identical on the
  `538f4ba` baseline. `git diff --check` / `--cached --check` clean.
- **Visual evidence (deterministic, offline):** `%TEMP%\ravatex-c5-visual-review\`
  (vendored Tailwind + local `playwright-core`; no Supabase/auth/network/DB/
  production) rendered the real product DOM into seven PNGs (`01-eligible-draft`,
  `02-emission-confirmation`, `03-incomplete-distribution`,
  `04-acceptance-required`, `05-emitted-order`, `06-narrow-layout` 1024×900,
  `07-acceptance-states`) + `c5-visual-contact-sheet.png`. Browser console and
  page errors empty. Computed styles: emission primary button radius 4px
  (`--rv-radius-control`), background `rgb(37,99,235)`/white (primary, not
  destructive-red); confirmation confirm button `rgb(37,99,235)`
  (`is_destructive_red=false`); confirmation card radius 8px + shadow (shared
  `js/ui.js` modal primitive — `SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT`
  debt, frozen by this order); status badge radius 999px pill; disabled emit
  button opacity 0.6 / cursor `not-allowed` / chip background; narrow 1024 no
  horizontal overflow.
- **Residual risk / debts:** the feature cannot be exercised end-to-end in a
  browser here (no auth/Supabase) — evidence is fixture-level DOM/mocked-RPC plus
  the PHASE-C5A shared-dev DB validation, as contract §10 acknowledges;
  `index.html` cache-bust `?v=` not bumped (index.html frozen by contract §12 —
  a future deploy pass must refresh it); shared `js/ui.js` modal 8px radius debt
  (item 16) and `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` (item 15)
  remain; orders with `exige_aceite=TRUE` are still not lifecycle-complete until
  `PHASE-C5B` ships (surfaced honestly in the UI).
- **Next phase indicated at closeout:** supervisor functional + architect visual
  review of this implementation (`SUPERVISION_PROTOCOL.md` §4).
- **Exact accounting subject:** `feat: implement C5 purchase-order emission UI`
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5A-DB-EMISSION-READINESS
  ACTIVE_PHASE = PHASE-C5
  ACTIVE_PHASE_CONTRACT = docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md

  PHASE-C5 CONTRACT = ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY
  PHASE-C5 IMPLEMENTATION = IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR FUNCTIONAL AND VISUAL REVIEW
  OC-C5-EMISSION-001 = PARTIALLY_SATISFIED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **NEXT_AUTHORIZABLE_ACTION:** supervisor functional review + mandatory architect
  visual validation of the `PHASE-C5` implementation; on acceptance a separate
  closeout advances `OC-C5-EMISSION-001` and closes `PHASE-C5`. `PHASE-C5B`,
  `REAL_CUTOVER`, staging/deployment/activation, any shared-database apply,
  production access, branch creation, and any push remain unauthorized. **No push
  is authorized by this pass.**

---

## 2026-07-22 — C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1 — direct supervisor functional/visual review + targeted PHASE-C5 correction + canonical-state forward correction

- **Gate:** `IMPLEMENTED / TARGETED CORRECTION IMPLEMENTED / LOCALLY VERIFIED /
  AWAITING SUPERVISOR RE-REVIEW` — not self-accepted, `PHASE-C5` not closed.
- **Direct-review ruling (recorded as binding):** `PHASE-C4` =
  `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT
  VISUAL VALIDATION PASSED`, accepted technical checkpoint
  `289b0cca66e9c057330a882f69da3476adf90469`; `OC-C4-ADMIN-001` = `SATISFIED`.
  A nonblocking C4 debt was additionally found by this direct review,
  `ORDEM_COMPRA_RECEIPT_HARD_FAILURE_RAW_MESSAGE_EXPOSURE` (the receipt action
  layer may expose `res.error.message` for an unmapped `hard_failure`),
  recorded only — **not corrected in this pass** (out of scope). `PHASE-C5A-
  DB-EMISSION-READINESS` = `CLOSED / ACCEPTED / DIRECTLY VERIFIED /
  SHARED-DEVELOPMENT STATE VERIFIED`. `PHASE-C5 VISUAL REVIEW` =
  `PASS_WITH_NONBLOCKING_COSMETIC_DEBT`. `PHASE-C5 FUNCTIONAL REVIEW` =
  `CHANGES_REQUIRED` on exactly one blocking defect,
  `C5_AMBIGUOUS_EMISSION_RELOAD_FALSE_DRAFT_ASSERTION`: after an ambiguous
  `emitir_ordem_compra` transport result, the UI performed the required
  authoritative reload but, if that reload itself failed, returned `null`,
  returned a different order, or returned an unresolved state, it incorrectly
  asserted the order remained a draft. Honest uncertainty must be preserved
  until an authoritative reload actually resolves the state.
- **Phase:** `PHASE-C5` (`OC-C5-EMISSION-001`), targeted correction of the
  `C5-PURCHASE-ORDER-EMISSION-UI-IMPLEMENTATION-R1` implementation under the
  accepted material contract
  `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md` (§22/§23, now §24).
  Entry checkpoint HEAD `e25361be80eed0c33f2544c58d2273572d0bd588`; parent
  `538f4ba7b7aae5d6e9e0efbe29a57e1ef7bbc776`; branch `dev`. Protected residue
  (`M .gitignore`, `?? .codex/config.toml`, `?? .mcp.json`) preserved
  untouched.
- **Correction implemented (`js/screens/ordem-compra-events.js` only, no other
  product file):** the ambiguous-transport branch of `emitir(o)` now, after
  the single authoritative reload, resolves success only when `state.ordem`
  exists, its `ordem_id` equals the attempted order, and
  `status_administrativo === 'emitida'`; resolves "still a draft" only when
  `state.ordem` exists, its `ordem_id` equals the attempted order, and
  `status_administrativo === 'rascunho'` (offering the deliberate-retry
  message only when the reloaded order's own `acoes.emitir === true`);
  otherwise (reload failure, `null`, a different order, or an unrecognized
  state) shows the fixed pt-BR message "Não foi possível confirmar o
  resultado da emissão. Recarregue a ordem antes de tentar novamente." — never
  claiming draft or emitted, no automatic retry, no fallback writer. The RPC
  (`window.supa.rpc('emitir_ordem_compra', { p_ordem_id: ordemId })`), the
  deterministic-success branch, and the deterministic-rejection branch are
  unchanged. No other product file touched;
  `js/screens/ordem-compra-data.js`/`-render.js`, `js/screens/ordem-compra.js`,
  all receipt modules, `js/ui.js`, `index.html`, `router.js`, `boot.js`, and
  `common.js` are byte-unchanged.
- **Tests (exactly `tests/ordem-compra-emitir.smoke.js`):** six new behavioral
  cases — an authoritative reload that itself fails after an ambiguous
  transport; a reload to a draft the server itself still withholds
  (`acoes.emitir=false`, no false retry offer); a reload to a non-draft/
  non-emitted state (cancelled); a reload returning a mismatched order id; and
  the existing ambiguous-success / ambiguous-stays-draft cases strengthened —
  proving `emitir_ordem_compra` is called exactly once,
  `obter_ordem_compra_admin` is attempted exactly twice, no fallback/legacy
  writer is called, no automatic retry occurs, "continua em rascunho" is never
  shown when the state is actually unresolved, and no enabled `Emitir` control
  is reconstructed from stale pre-reload state. Every existing `PHASE-C5` test
  retained (41/41 pass).
- **Validation:** targeted suites green (emitir 41/41; ordem-compra 11/11; the
  four C4 receipt suites 38/38). Full Node suite differential vs a detached
  baseline worktree at `e25361b`: baseline 142 / worktree 122 failing
  identities, **added failing identities = empty** (zero regressions; the
  20 baseline-only identities are pre-existing non-determinism).
  `node scripts/validate-spec-custody.mjs` PASS; `--self-test` fails only on
  the pre-existing active-contract fixture-harness limitation (`R1:
  ACTIVE_PHASE_CONTRACT is not an existing file`), byte-identical to the
  `e25361b` baseline. `git diff --check` / `--cached --check` clean.
- **Canonical documentation forward-correction:** corrected the stale
  "`PHASE-C5` not yet implemented" / "`ACTIVE_PHASE` is `NONE`" contradictions
  in `PROJECT_STATE.md` (the `PHASE-C4`-closeout-era bullet was temporalized
  as historical; the tail "Next authorizable action" and a new correction
  bullet were added), `AGENT_HANDOFF.md` (four stale spots corrected: the
  active-phase-contract bullet, the push/remote/deployment-limits bullet, the
  C4/C5 roadmap bullet, and canonical-paths items 22/23), and the
  `docs/DOCUMENTATION_INDEX.md` C5 row (no longer says "not yet implemented").
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`'s `NEXT_AUTHORIZABLE_ACTION`
  and `OC-C5-EMISSION-001` residual-debt text were updated to the current
  disposition. `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md` gained
  §24 recording this ruling and correction; its `STATUS` line was updated.
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` required no correction
  (its governance banner already temporalizes historical entries and its
  newest entry was already accurate). No historical entry was rewritten;
  every correction is additive or explicitly marked historical.
- **New nonblocking debts recorded** (`PROJECT_STATE.md` POST-LAUNCH DEBT
  REGISTER items 17–20; items 15/16 unchanged):
  `ORDEM_COMPRA_RECEIPT_HARD_FAILURE_RAW_MESSAGE_EXPOSURE` (17),
  `C5_ORDEM_COMPRA_JS_STALE_EMISSION_COMMENT` (18) — `js/screens/ordem-compra.js`'s
  header comment still says emission is installed-but-inactive/never wired,
  stale since the prior pass, out of this correction's manifest,
  `C5_INDEX_HTML_CACHE_BUST_PENDING_DEPLOY` (19), `C5_COSMETIC_UI_CONSOLIDATION`
  (20).
- **Residual risk / debts unchanged:** `SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT`
  (item 16), `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` (item 15); the
  writer still cannot be exercised end-to-end in a browser here (fixture-level
  DOM/mocked-RPC evidence); orders with `exige_aceite=TRUE` remain not
  lifecycle-complete until `PHASE-C5B` ships.
- **Next phase indicated at closeout:** direct supervisor re-review of this
  single correction commit (`SUPERVISION_PROTOCOL.md` §4). `PHASE-C5` remains
  open; `PHASE-C5B`, `REAL_CUTOVER`, staging validation/application of
  `db/76`/`db/77`, deployment, activation, production access, branch
  creation, and any further push remain unauthorized.
- **Exact accounting subject:** `fix: preserve uncertainty after unresolved
  emission reload`
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5A-DB-EMISSION-READINESS
  ACTIVE_PHASE = PHASE-C5
  ACTIVE_PHASE_CONTRACT = docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md

  PHASE-C4 = CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED
  OC-C4-ADMIN-001 = SATISFIED
  PHASE-C5A-DB-EMISSION-READINESS = CLOSED / ACCEPTED / DIRECTLY VERIFIED / SHARED-DEVELOPMENT STATE VERIFIED
  PHASE-C5 = IMPLEMENTED / TARGETED CORRECTION IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR RE-REVIEW
  PHASE-C5 VISUAL REVIEW = PASS_WITH_NONBLOCKING_COSMETIC_DEBT
  OC-C5-EMISSION-001 = PARTIALLY_SATISFIED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **NEXT_AUTHORIZABLE_ACTION:** direct supervisor re-review of this single
  correction commit. `PHASE-C5B`, `REAL_CUTOVER`, staging/deployment/
  activation, any shared-database apply beyond `db/77`, production access,
  branch creation, and any further push remain unauthorized. **No further push
  is authorized by this pass beyond the one single fast-forward of this pass's
  own commit.**

---

## 2026-07-22 — C5-DOCUMENTATION-CLOSEOUT-R1 — Close PHASE-C5 purchase-order emission phase

- **Gate:** `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED /
  ARCHITECT VISUAL VALIDATION PASSED` — documentation-only closeout after direct
  supervisor acceptance of the targeted-correction commit.
- **Binding supervisor ruling.** The supervisor performed direct re-review of
  the `PHASE-C5` targeted-correction commit
  `3405fdab8e05ec0f81cbfe07c63c489e551fee92`
  (`fix: preserve uncertainty after unresolved emission reload`, parent
  `e25361be80eed0c33f2544c58d2273572d0bd588`) and **ACCEPTED** it as final and
  binding: `ACCEPTED_WITH_NONBLOCKING_DOCUMENTARY_DEBT`; `PHASE-C5 FUNCTIONAL
  GATE = PASS`; `PHASE-C5 VISUAL REVIEW = PASS_WITH_NONBLOCKING_COSMETIC_DEBT`.
- **Defect corrected (resolved).** `C5_AMBIGUOUS_EMISSION_RELOAD_FALSE_DRAFT_ASSERTION`.
  Direct review confirmed the corrected ambiguous-transport branch of
  `js/screens/ordem-compra-events.js` `emitir(o)`: exactly one authoritative
  reload; resolves emitted only for the same order with
  `status_administrativo='emitida'`; resolves draft only for the same order with
  `status_administrativo='rascunho'`; offers a deliberate retry only when the
  reloaded server object exposes `acoes.emitir=true`; preserves honest
  uncertainty for reload failure, `null`, a mismatched order, or an unresolved
  state; no automatic retry; no fallback or legacy writer call; the existing
  canonical RPC/payload preserved.
- **Final PHASE-C5 status:** `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY
  VERIFIED / ARCHITECT VISUAL VALIDATION PASSED`; accepted PHASE-C5 technical
  checkpoint `3405fdab8e05ec0f81cbfe07c63c489e551fee92`.
- **Requirement disposition:** `OC-C5-EMISSION-001` = **`SATISFIED`** (advanced
  from `PARTIALLY_SATISFIED`).
- **Ancillary directly-reviewed dispositions (recorded as binding, not
  reopened):** `PHASE-C4` = `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY
  VERIFIED / ARCHITECT VISUAL VALIDATION PASSED` (`OC-C4-ADMIN-001` =
  `SATISFIED`); `PHASE-C5A-DB-EMISSION-READINESS` = `CLOSED / ACCEPTED /
  DIRECTLY VERIFIED / SHARED-DEVELOPMENT STATE VERIFIED`.
- **Boundaries (each a separate, still-unauthorized gate).**
  `PHASE-C5B-ACCEPTANCE-DECISION` = `IDENTIFIED / NOT AUTHORIZED` (no
  acceptance-decision capability may be built; `exige_aceite=TRUE` orders remain
  not lifecycle-complete). `REAL_CUTOVER` = `NOT AUTHORIZED`, additionally
  hard-gated behind the mandatory read-only completeness disposition of the 13
  unmapped `ordens_compra_fio` rows ids 153–165. No architecture reopened.
- **Nonblocking debts preserved (recorded, not implemented):**
  `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` (15);
  `SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT` (16);
  `ORDEM_COMPRA_RECEIPT_HARD_FAILURE_RAW_MESSAGE_EXPOSURE` (17);
  `C5_ORDEM_COMPRA_JS_STALE_EMISSION_COMMENT` (18);
  `C5_INDEX_HTML_CACHE_BUST_PENDING_DEPLOY` (19);
  `C5_COSMETIC_UI_CONSOLIDATION` (20).
- **Documentation-only manifest:** `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/DOCUMENTATION_INDEX.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md` (§25 closeout;
  `STATUS` header), and this ledger. No product, test, migration, `db/*.sql`,
  `index.html`, CSS, configuration, or protected-residue change; no database,
  Supabase, environment, deployment, activation, cutover, `main`, `origin`,
  production, or branch action.
- **Validação:** `node scripts/validate-spec-custody.mjs` PASS; `--self-test`
  fails only on the pre-existing active-contract fixture-harness limitation
  (`R1: ACTIVE_PHASE_CONTRACT is not an existing file`) — expected once
  `ACTIVE_PHASE_CONTRACT` is `NONE`, byte-consistent with the `3405fda`
  baseline; `git diff --check` / `--cached --check` clean; exact
  documentation-only manifest; protected residue (`M .gitignore`,
  `?? .codex/config.toml`, `?? .mcp.json`) unchanged.
- **Risco residual:** the six nonblocking debts above; the two separately
  governed continuations (`PHASE-C5B-ACCEPTANCE-DECISION`; the `REAL_CUTOVER`
  13-row completeness disposition) remain unauthorized.
- **Exact accounting subject:** `docs: close C5 purchase-order emission phase`
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5
  ACTIVE_PHASE = NONE
  ACTIVE_PHASE_CONTRACT = NONE
  ACTIVE_TRACK = PURCHASE_ORDER_PHASE_C
  ACCEPTED_CHECKPOINT = 3405fdab8e05ec0f81cbfe07c63c489e551fee92

  PHASE-C5 = CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED
  OC-C5-EMISSION-001 = SATISFIED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **Próxima fase indicada no fechamento / NEXT_AUTHORIZABLE_ACTION:** a
  supervisor read-only sequencing decision between the remaining separately
  governed continuations — `PHASE-C5B-ACCEPTANCE-DECISION` and the
  `REAL_CUTOVER` completeness disposition for the 13 unmapped
  `ordens_compra_fio` rows ids 153–165. No implementation authorized; no phase
  chains automatically. This closeout published exactly one documentation-only
  commit through one authorized fast-forward push to `staging/dev`; no further
  push is authorized.

## 2026-07-22 — CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-R1 — Binding clean-slate business-owner ruling recorded; proposed reset contract authored — PROPOSED / AWAITING SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED

- **Order:** `CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-R1` — read-only repository +
  read-only shared-development database + documentation-only destructive-reset
  contract authoring + one-time fast-forward push. Entry checkpoint HEAD
  `56f749812c693cea3c81518a139d174e958fbbbf` (parent
  `5aaea4b9709a33a1514ea737f4a8bfae50b835ef`); `staging/dev` equal to HEAD;
  divergence 0/0; empty index; only protected residue (`M .gitignore`,
  `?? .codex/config.toml`, `?? .mcp.json`). Historical record — live state belongs
  to `PROJECT_STATE.md`.
- **Binding business-owner ruling:** `CLEAN_SLATE_OPERATIONAL_REBUILD` = **APPROVED
  AS TARGET STRATEGY**. The current operational transaction corpus in the
  non-production shared development database `ucrjtfswnfdlxwtmxnoo` does **not** need
  to survive as live business data; the **approximately two** real business flows
  will be recreated manually through the new application in the canonical order
  Pedido → purchasing needs → purchase orders → OPs → subsequent operational
  updates. The 13 unmapped legacy rows ids `153`–`165`, the 51 mapped legacy rows,
  and their native projections carry **no** preservation obligation. The prior
  legacy-data preservation/mapping strategy (incl. the 51-row
  `ordem_compra_item_compat_fio` bridge and the deferred 13-row mapping/backfill
  options) is **SUPERSEDED as the target strategy** — not deleted or rewritten.
  Master/reference data is **preserved by default**.
- **Database identity (read-only):** project `ucrjtfswnfdlxwtmxnoo` (non-production
  shared development), PostgreSQL 17.6, `current_database=postgres`, role
  `postgres`, `session_replication_role=origin`, terminal migration
  `20260722055832` (`77_ordem_compra_c5a_emission_readiness`), cutover singleton
  `legacy_active` / `flat` / `not_started` with every snapshot/import/PONR/ACL/
  activation marker NULL, `source_snapshot`/`inventory_baseline` 0 rows. Production
  `gqmpsxkxynrjvidfmojk` and the legacy project were never accessed. Only
  independently read-only statements were issued (`SELECT`/`WITH … SELECT`/
  `information_schema`/`pg_catalog`); zero `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE`/
  DDL/`CALL`/`DO`/writer-RPC/temp-table/lock.
- **Row-count baseline (exact, read-only):** `ordens_compra_fio` 64 (51 mapped +
  13 unmapped ids 153–165); `necessidade_compra_fio` 64 (all legacy-origin);
  `ordem_compra`/`ordem_compra_item`/`ordem_compra_item_alocacao`/
  `ordem_compra_item_compat_fio` 51 each; `ordem_compra_recebimentos`/
  `ordem_compra_eventos`/`ordem_compra_fio_lancamentos`/
  `ordem_compra_fio_movimentos_estoque`/`ordem_compra_distribuicao_comandos` all 0;
  `ordem_compra_cutover` 1 (pristine pre-cutover); `pedidos` 16, `pedido_itens` 18,
  `ops` 20, `op_itens` 27, `op_fornecedores` 16, `op_eventos` 4, `op_numeros` 2,
  `lotes` 25, `saldo_fios` 5, `saldo_fios_op` 0; documents front `document_candidates`
  40, `document_events` 1, `document_link_revisions` 8 (1 Pedido), `document_link_revision_ops`
  10 (4 OPs), `document_scan_requests` 24, `document_scan_runs` 30; preserved master
  data `clientes` 6, `fornecedores` 6, `cores` 6, `modelos` 12, `usuarios` 10,
  `parametros_largura` 2, `ordem_compra_config` 1.
- **Authored:** `docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`
  (`PHASE_ID: CLEAN-SLATE-TRANSACTIONAL-RESET`, `STATUS: PROPOSED / AWAITING
  SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED`) with all 21 required
  parts: the binding ruling; scope; preserved master-data boundary; the complete
  FK/logical-dependency inventory and per-table classification (`PRESERVE_MASTER_DATA`
  / `PURGE_OPERATIONAL_SOURCE` / `PURGE_OPERATIONAL_DERIVED` / `RESET_CUTOVER_METADATA`
  / `UNPROVEN`); the row-count baseline; the exact dependency-safe deletion order
  (Boundary A = the self-contained 332-row yarn-purchasing corpus; Boundary B =
  `pedidos`/`ops`/`lotes`, only if separately authorized); the mandatory out-of-repo
  archival evidence plan; the destructive-execution design (single serialized
  transaction, `DELETE` not `TRUNCATE`, run only while `legacy_active`, no default
  sequence reset); the sequence policy; the cutover-state strategy (recommended
  **Option C** — remain `legacy_active`; `db/75`'s 51/39/44/20221.280/405.980
  constants become SUPERSEDED and a future `REAL_CUTOVER` needs a re-baselined
  migration); rollback/recovery; the reset PONR (the reset transaction commit,
  distinct from `OC-CUTOVER-PONR-001`); hard stops; the validation matrix; the
  evidence packet; the exact future file/migration manifest (**one-time governed
  administrative operation, not a `db/NN` migration, not the dashboard**); explicit
  exclusions; the `PHASE-C5B` boundary/sequencing; the production prohibition; and
  the supervisor decisions still required.
- **Material entanglement surfaced:** Boundary B deletion of the commercial
  `pedidos`/`ops` collides with the **binding Controlled-Delete × document-history
  rule** — 1 Pedido carries `document_link_revisions` (RESTRICT) and 4 OPs carry
  `document_link_revision_ops` (RESTRICT) — and with the separate documents front;
  classified `UNPROVEN`, requiring an explicit business-owner disposition before
  Boundary B.
- **Former 13-row gate consequence:** `STILL_APPLICABLE_UNTIL_RESET_EXECUTION_COMPLETES`
  then `SUPERSEDED_BY_CLEAN_SLATE_RESET` — reset execution is the §Z.3 disposition
  option 3 (cancellation/removal via a separately authorized business-data action)
  applied to all 64 rows. `OC-CUTOVER-001` stays `PLANNED`; `REAL_CUTOVER` stays
  `NOT AUTHORIZED` (this pass changes no requirement disposition).
- **`PHASE-C5B` sequencing:** corpus-independent; not a prerequisite of and not
  blocked by the reset; best sequenced after the reset and after the two real flows
  are recreated (with `ordem_compra_config.exige_aceite` preserved FALSE, the
  recreated flows do not require an acceptance decision).
- **Documentation manifest (exactly the authorized owners):**
  `docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md` (new),
  `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, and this ledger. No
  product, test, script, migration, `db/*.sql`, configuration, or protected-residue
  change; no database mutation; no deletion; no phase activated.
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS; `--self-test`
  PASS (`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are `NONE`); `git diff --check` /
  `--cached --check` clean; protected residue unchanged.
- **Exact accounting subject:** `docs: define clean-slate transactional reset contract`
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5
  ACTIVE_PHASE = NONE
  ACTIVE_PHASE_CONTRACT = NONE
  ACTIVE_TRACK = PURCHASE_ORDER_PHASE_C
  ACCEPTED_CHECKPOINT = 3405fdab8e05ec0f81cbfe07c63c489e551fee92

  CLEAN-SLATE-TRANSACTIONAL-RESET = PROPOSED / AWAITING SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **Próxima fase indicada / NEXT_AUTHORIZABLE_ACTION:** direct supervisor review of
  the proposed `CLEAN-SLATE-TRANSACTIONAL-RESET` contract. No deletion, database
  mutation, reset execution, phase activation, or continuation is authorized; no
  phase chains automatically. This pass published exactly one documentation-only
  commit through one authorized fast-forward push to `staging/dev`; no further push
  is authorized.

## 2026-07-22 — CLEAN-SLATE-DOCUMENT-HISTORY-AND-RESIDUAL-BOUNDARY-DIAGNOSIS-R1 — Read-only residual-boundary diagnosis — READY_FOR_CONTRACT_CORRECTION (no documentation mutation, no commit, no push)

- **Order:** `CLEAN-SLATE-DOCUMENT-HISTORY-AND-RESIDUAL-BOUNDARY-DIAGNOSIS-R1` —
  continuation in the same session; read-only repository + read-only shared-development
  database; no documentation mutation, no commit, no push. Entry checkpoint HEAD
  `9eeff7d5a97e25cf676d54afcd4510816a8648fb`. Database identity proven read-only:
  `ucrjtfswnfdlxwtmxnoo`, PostgreSQL 17.6, role `postgres`, terminal migration
  `20260722055832`, cutover `legacy_active`/`flat`/`not_started`, all markers NULL.
  Only independently read-only statements were issued (zero
  `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE`/DDL/writer-RPC/temp-table/lock).
- **Decisive finding:** the only transaction-linked document in the entire database
  is a **proven synthetic `G28-B6-VERIFY` verification fixture** —
  `document_id G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT` (no Google
  Drive object, no SHA-256, no fiscal/sender metadata, 0 events/technical
  evidence/decisions) — linking Pedido #34 (`7fa51e02-e15b-4a1b-a0f3-8ca39ceee247`,
  `observacao G28-B6-VERIFY…-PEDIDO_A`, 0 pedido_itens/needs/OC), OPs 55/57/61/63
  (all `tecelagem`, `observacao G28-B6-VERIFY…-OP_*`, 0 op_itens/op_fornecedores/
  op_eventos/needs/OCF/allocations) and lotes 33/37, via 8 `document_link_revisions`
  (v1–v8, only v8 active) + 4 `document_link_revision_ops`. The other 39 of 40
  `document_candidates` are unlinked ingestor-pulled Gmail documents (Drive-backed,
  `pending`, no Pedido/OP link) — a separate front to preserve.
- **Controlled-Delete rule:** enforced by RESTRICT FKs
  (`document_link_revisions.pedido_id → pedidos`, `document_link_revision_ops.op_id
  → ops`, and the `document_id`/`revision_id` RESTRICT edges) plus the `db/53`
  application-layer guard (`remover_pedido`/`remover_op` block when doc-link rows
  exist, never auto-unlink). There is **no immutability trigger** on the link tables
  (append-only enforced by SELECT-only grants + a single `SECURITY DEFINER` writer
  that revokes, never deletes), and `document_candidates.pedido_id` /
  `document_events.pedido_id` are `ON DELETE SET NULL` — so documents survive Pedido
  removal and a governed dependency-ordered SQL operation can remove the fixture rows
  then the Pedido/OP without a normative architecture change.
- **Residual-table dispositions:** `saldo_fios` (5 rows — algodão 732.010/549.010/
  549.000 kg, poliéster PRETO/BRANCO 427.500 kg each, last touched 2026-07-06 before
  the `db/67` refoundation, not receipt-derived) = `PRESERVE_OPERATIONAL_BASELINE`;
  `saldo_fios_op` (0) = preserve empty; `op_numeros` (latex 18 / tecelagem 41) =
  preserve high-water, no restart; `op_fornecedores` (16, op_ids 1,2,53,87–99, 0
  orphans, none on the B6 OPs) = purge with OPs; `pedido_compra_fio_regime` (0),
  `op_latex_entregas` (0), `expedicoes`/`expedicao_itens`/`expedicao_movimentos`/
  `expedicao_movimento_itens`/`entregas`/`entrega_itens` (all 0) = empty (no-op).
  Full Pedido/OP/lote id enumeration captured (16/20/25).
- **Readiness decision:** `READY_FOR_CONTRACT_CORRECTION` — the document-history
  blocker is resolved as synthetic, every residual table is evidence-dispositioned,
  no `DATA_INTEGRITY_HARD_STOP`, and no normative architecture change is required.
- **Invariance:** no repository file modified; no commit; no push; no database
  mutation, deletion, unlink, or archive; HEAD unchanged
  `9eeff7d5a97e25cf676d54afcd4510816a8648fb`; only protected residue present.

## 2026-07-22 — CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-CORRECTION-R1 — Reset contract corrected to one exact target — CORRECTED / AWAITING DIRECT SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED

- **Order:** `CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-CORRECTION-R1` — continuation
  in the same session; documentation-only contract correction + read-only repository
  verification + one-time fast-forward push. Entry checkpoint HEAD
  `9eeff7d5a97e25cf676d54afcd4510816a8648fb` (parent `56f749812c693cea3c81518a139d174e958fbbbf`);
  `staging/dev` equal to HEAD; divergence 0/0; empty index; only protected residue
  (`M .gitignore`, `?? .codex/config.toml`, `?? .mcp.json`). No new database
  diagnosis was required beyond the accepted
  `CLEAN-SLATE-DOCUMENT-HISTORY-AND-RESIDUAL-BOUNDARY-DIAGNOSIS-R1`; no database
  access beyond the prior read-only diagnosis.
- **Correction:** set `docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`
  to `STATUS: CORRECTED / AWAITING DIRECT SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION
  NOT AUTHORIZED` and replaced every prior optional/ambiguous/`UNPROVEN`
  reset-boundary decision with the **binding supervisor rulings**: (1) **final purge
  scope** — all 16 of 16 Pedidos, all 20 of 20 OPs, all 25 of 25 lotes (incl. orphan
  ids 3,4,5,6,7,8,13), `op_fornecedores` (16), and the complete yarn-purchasing
  transaction corpus; (2) **document-history Option D3** — external metadata archive
  then removal of **only** the exact synthetic fixture
  `G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT` (4 revision-ops + 8
  revisions + 1 candidate + 0/0/0 events/evidence/decisions), preserving the rest of
  the documents front and prohibiting broad documents-front deletion; (3) `saldo_fios`
  `PRESERVE_OPERATIONAL_BASELINE` + `saldo_fios_op` empty-state preserve; (4)
  `op_numeros` preserve high-water, no restart; (5) empty auxiliary tables kept
  (schema intact; HARD STOP if any becomes non-empty before execution); (6)
  master/reference data preserved; (7) cutover **Option C** (stay `legacy_active`/
  `flat`/`not_started`, markers NULL; `db/75` constants superseded only after the
  reset completes; any later `REAL_CUTOVER` needs a re-baselined migration); (8)
  `PHASE-C5B` not required (`exige_aceite=FALSE`).
- **Exact manifests added:** Boundary-A deletion order (11 tables → affected rows
  0,0,0,0,0,51,51,51,64,51,64); synthetic-document order (6 steps → 0,0,4,8,0,1, exact
  fixture id, not a broad pattern); Boundary-B order (13 tables → 27,16,4,18,0,0,0,0,0,
  0,20,16,25); the exact 16 Pedido UUIDs / 20 OP ids / 25 lote ids; a **mandatory
  archive package + restore runbook + disposable restore drill** as a pre-execution
  HARD STOP the executor may not waive; the ratified **one-time governed
  administrative DELETE transaction** mechanism (not a `db/NN` migration, not the
  dashboard, not an RPC/UI writer); and a proposed (not created) implementation
  manifest (`scripts/reset/clean-slate-transactional-export.mjs`/`-reset.sql`/
  `-restore.sql`/`-verify.mjs`, `tests/clean-slate-transactional-reset.smoke.mjs`).
- **Non-authorization:** no deletion, database mutation, archive creation, reset
  implementation, migration, cutover, activation, or environment change occurred; the
  contract is **not** marked ACCEPTED/ACTIVE/IMPLEMENTATION-AUTHORIZED/CLOSED and is
  not self-accepted; `OC-CUTOVER-001` stays `PLANNED`; the 13-row gate stays
  `STILL_APPLICABLE_UNTIL_RESET_EXECUTION_COMPLETES`; `REAL_CUTOVER` and
  `PHASE-C5B-ACCEPTANCE-DECISION` remain unauthorized.
- **Documentation manifest (exactly the authorized owners):** the reset contract,
  `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`,
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, and this ledger. No product,
  test, script, migration, `db/*.sql`, configuration, or protected-residue change.
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS; `--self-test` PASS
  (`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are `NONE`); `git diff --check` /
  `--cached --check` clean; protected residue unchanged.
- **Exact accounting subject:** `docs: correct clean-slate reset contract`
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5
  ACTIVE_PHASE = NONE
  ACTIVE_PHASE_CONTRACT = NONE
  ACTIVE_TRACK = PURCHASE_ORDER_PHASE_C
  ACCEPTED_CHECKPOINT = 3405fdab8e05ec0f81cbfe07c63c489e551fee92

  CLEAN-SLATE-TRANSACTIONAL-RESET = CORRECTED / AWAITING DIRECT SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED
  OC-CUTOVER-001 = PLANNED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **Próxima fase indicada / NEXT_AUTHORIZABLE_ACTION:** direct supervisor review of
  the **corrected** `CLEAN-SLATE-TRANSACTIONAL-RESET` contract. No deletion, database
  mutation, archive creation, reset implementation, phase activation, or continuation
  is authorized; no phase chains automatically. This pass published exactly one
  documentation-only commit through one authorized fast-forward push to `staging/dev`;
  no further push is authorized.

## 2026-07-22 — CLEAN-SLATE-TRANSACTIONAL-RESET-B6-ROW-BASELINE-FORWARD-CORRECTION-R1 — B6 fixture row-count baseline corrected — FORWARD_CORRECTION / DOCUMENTATION-ONLY

- **Order:** `CLEAN-SLATE-TRANSACTIONAL-RESET-B6-ROW-BASELINE-FORWARD-CORRECTION-R1`
  — read-only reconciliation + documentation-only forward correction, issued after
  the separately ordered `CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL-R1`
  hard-stopped at its mandatory §7 pre-export corpus gate. Entry checkpoint HEAD
  `7a581d2f6710f52120e713e815d3875c47ebafef` (parent
  `9eeff7d5a97e25cf676d54afcd4510816a8648fb`); `staging/dev` equal to HEAD;
  divergence 0/0; empty index; only protected residue (`M .gitignore`,
  `?? .codex/config.toml`, `?? .mcp.json`).
- **Root cause.** The accepted contract, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, and `ORDEM_COMPRA_C3_TRACEABILITY.md` recorded the B6
  synthetic-fixture's `document_link_revision_ops` count as **4** rows. Read-only
  reconciliation against `ucrjtfswnfdlxwtmxnoo` (transaction proven
  `transaction_read_only = on`, `repeatable read`) found the real value is **10**
  rows: the fixture's 8 `document_link_revisions` include 6 op-bearing revisions
  (v3 2 ops, v4 1 op, v5 2 ops, v6 2 ops, v7 1 op, v8 2 ops = 10 relation rows),
  spanning exactly **4 distinct linked OPs** (`55, 57, 61, 63`). The earlier
  `CLEAN-SLATE-DOCUMENT-HISTORY-AND-RESIDUAL-BOUNDARY-DIAGNOSIS-R1` pass (recorded
  two entries above) had confused the distinct-OP count with the relation-row
  count; the error then propagated into the
  `CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-CORRECTION-R1` correction and from
  there into the contract's §1.2/§4.3/§5/§7.2 and the three dependent bootstrap/
  handoff/traceability blocks. This ledger's own earlier
  `CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-R1` entry (first of the three above)
  had already recorded the correct value (`document_link_revision_ops 10 (4 OPs)`,
  line ~9064) — the error was introduced only in the continuation diagnosis, not
  present at the very first entry.
- **Corrected fixture deletion sequence:** `document_technical_evidences 0,
  document_decisions 0, document_link_revision_ops 10, document_link_revisions 8,
  document_events 0, document_candidates 1` (was `0, 0, 4, 8, 0, 1`).
- **Files corrected (current canonical state only; historical entries in this
  ledger and the disclaimed historical block in
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` were preserved unedited):**
  `docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md` (header
  correction marker + §1.2 + §4.3 + §5 + §7.2), `PROJECT_STATE.md` (bootstrap
  block `NEXT_AUTHORIZABLE_ACTION`), `AGENT_HANDOFF.md` (new leading bullet + the
  live `CLEAN-SLATE-DOCUMENT-HISTORY-AND-RESIDUAL-BOUNDARY-DIAGNOSIS-R1` bullet
  count), `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  (`NEXT_AUTHORIZABLE_ACTION`), and this ledger (new entry, append-only).
  `docs/DOCUMENTATION_INDEX.md` and `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  were read and found not materially dependent on the incorrect baseline (their
  only occurrences are a correct "4 distinct OPs" statement, a `document_link_revision_ops`
  table-name/constraint-name reference, and a self-disclaimed historical `# Update`
  block) — left unchanged. No product, test, script, migration, `db/*.sql`,
  configuration, or protected-residue change.
- **Non-authorization:** no archive generated, no reset tooling implemented, no
  disposable drill executed, no shared-development mutation (`INSERT`/`UPDATE`/
  `DELETE`/`TRUNCATE`/DDL/writer-RPC) — all shared-development access this pass
  was read-only, inside `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ
  ONLY`. The tooling-and-drill implementation remains `NOT IMPLEMENTED`. The
  contract is not marked ACCEPTED/ACTIVE/IMPLEMENTATION-AUTHORIZED/CLOSED; the
  accepted product checkpoint is not advanced; `REAL_CUTOVER` and
  `PHASE-C5B-ACCEPTANCE-DECISION` remain unauthorized; shared-development deletion
  remains unauthorized.
- **Validation:** `node scripts/validate-spec-custody.mjs` PASS; `--self-test`
  PASS (47/47); `git diff --check` / `--cached --check` clean; protected residue
  unchanged.
- **Exact accounting subject:** `docs: correct B6 revision-op row baseline`
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5
  ACTIVE_PHASE = NONE
  ACTIVE_PHASE_CONTRACT = NONE
  ACCEPTED_CHECKPOINT = 3405fdab8e05ec0f81cbfe07c63c489e551fee92

  CLEAN-SLATE-TRANSACTIONAL-RESET = CORRECTED / AWAITING DIRECT SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED (B6 row baseline forward-corrected: document_link_revision_ops = 10, 4 distinct OPs 55/57/61/63)
  CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL = HARD-STOPPED / SUPERSEDED AS WRITTEN (superseded order; not implemented)
  OC-CUTOVER-001 = PLANNED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **Próxima fase indicada / NEXT_AUTHORIZABLE_ACTION:** reissue
  `CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL` against the corrected
  10-row baseline. No deletion, database mutation, archive creation, reset
  implementation, phase activation, or continuation is authorized; no phase
  chains automatically. This pass publishes exactly one documentation-only commit
  through one authorized fast-forward push to `staging/dev`; no further push is
  authorized.

## 2026-07-22 — CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL-R2 — reset tooling implemented, real archive generated read-only, disposable restore/reset drill passed

- **Order / scope.** `CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL-R2` (supersedes the hard-stopped R1): implement the governed clean-slate reset tooling, generate a real deterministic archive from the non-production shared-development database `ucrjtfswnfdlxwtmxnoo` using READ-ONLY access only, and prove the archive + reset lifecycle through a full restore/reset drill in a disposable PostgreSQL environment. Entry checkpoint `21fe32bc4b37773d93cabeac3e7e09aca9079037`; accepted checkpoint stays `3405fdab8e05ec0f81cbfe07c63c489e551fee92`.
- **Contract acceptance & status.** `CONTRACT_ACCEPTANCE: ACCEPTED / DIRECTLY VERIFIED AT 21fe32bc4b37773d93cabeac3e7e09aca9079037`; `IMPLEMENTATION_STATUS: TOOLING_IMPLEMENTED / REAL_ARCHIVE_GENERATED_READ_ONLY / DISPOSABLE_RESTORE_DRILL_PASSED / AWAITING DIRECT SUPERVISOR REVIEW / SHARED-DEVELOPMENT RESET NOT AUTHORIZED`.
- **Corpus gate (read-only, exact).** Inside one `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY` (`transaction_read_only = on`, PostgreSQL 17.6, terminal migration `20260722055832`, cutover `legacy_active/flat/not_started`, markers NULL): Boundary A `0,0,0,0,0,51,51,51,64,51,64`; Boundary B `27,16,4,18,0,0,0,0,0,0,20,16,25`; B6 fixture `document_link_revision_ops = 10` across 4 distinct linked OPs `55, 57, 61, 63` + `document_link_revisions = 8` + `document_candidates = 1` (per-revision `0,0,2,1,2,2,1,2`); 16 Pedidos / 20 OPs / 25 lotes exact; `saldo_fios` 5 (2685.020 kg) / `op_numeros` latex 18 / tecelagem 41 preserved — all matched the contract §5/§6 baseline byte-for-byte.
- **Technical files (5).** `scripts/reset/clean-slate-transactional-export.mjs`, `clean-slate-transactional-reset.sql`, `clean-slate-transactional-restore.sql`, `clean-slate-transactional-verify.mjs`, `tests/clean-slate-transactional-reset.smoke.mjs`. No product / `db/NN` / configuration / protected-residue change; no new dependency.
- **Real archive (read-only, outside the repository).** `D:\Programação\controle-tapetes-g28-artifacts\clean-slate-reset60722T173607Z`; aggregate SHA-256 `337d23cd6426287053dcffe02512253c0e9e96874c6362d2823186b52094f593`; deterministic NDJSON per table + per-file/aggregate SHA-256 + `manifest.json` + evidence (`database-identity`/`cutover-state`/`preserved-baseline`/`corpus-identities`); `verify-archive` 330/330. No `auth.users` PII exported.
- **Disposable drill.** Fresh disposable PostgreSQL 18.4 cluster; Supabase preamble + ordered `db/01..77`; terminal migration `20260722055832` proven; disposable opaque stubs + preserved baselines seeded; restore→reset (`0,0,0,0,0,51,51,51,64,51,64` / `0,0,10,8,0,1` / `27,16,4,18,0,0,0,0,0,0,20,16,25`)→zero + preserve invariance→restore→(counts / 16-20-25 identities / B6 8 revisions + 10 revision-ops across 55/57/61/63 / FK proven)→reset (re-deletable)→zero; execution-mode-guard and incorrect-delete-count negatives proven; cluster destroyed with PID/port/directory-absence proof; smoke + drill 56/56.
- **Non-authorization / non-mutation.** The shared-development database `ucrjtfswnfdlxwtmxnoo` was **not mutated** (post-check counts/values identical to baseline; `ordem_compra_eventos = 0`, no audit writes); its clean-slate reset was **not executed or authorized**. Production `gqmpsxkxynrjvidfmojk` and the forbidden project `bhgifjrfagkzubpyqpew` were never accessed. `REAL_CUTOVER`, `PHASE-C5B-ACCEPTANCE-DECISION`, and shared-development deletion remain unauthorized; the phase is not CLOSED; the accepted product checkpoint is not advanced.
- **Implementation note (for the future real-reset order).** 39 of 51 orders are `emitida`; the reset transactionally disables exactly the blocking `item_quantidade_rascunho_guard`/`alocacao_rascunho_guard` (+ allocation-cache + pedido-parciais-sync) business triggers via table-owner `DISABLE TRIGGER`, keeps FK enforcement and the C3C cutover fence ACTIVE, flushes the deferred `kg_pedido` guard with `SET CONSTRAINTS ALL IMMEDIATE`, and re-enables them before COMMIT. The contract §7 "plain DELETE" prose omits this guard-handling; the future real-reset order must ratify it.
- **Validation.** `node --check` on all three `.mjs` PASS; smoke + drill 56/56; `verify-archive` 330/330; `node scripts/validate-spec-custody.mjs` PASS and `--self-test` 47/47; `git diff --check` / `--cached --check` clean; protected residue (`.gitignore`, `.codex/config.toml`, `.mcp.json`) untouched.
- **Exact accounting subject:** `feat: add clean-slate reset tooling and restore drill`
- **Commit manifest (exactly 12 files).** 5 technical files + 7 documentation files (`docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this ledger). Parent `21fe32bc4b37773d93cabeac3e7e09aca9079037`.
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5
  ACTIVE_PHASE = CLEAN-SLATE-TRANSACTIONAL-RESET
  ACTIVE_PHASE_CONTRACT = docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md
  ACCEPTED_CHECKPOINT = 3405fdab8e05ec0f81cbfe07c63c489e551fee92

  CLEAN-SLATE-TRANSACTIONAL-RESET = CONTRACT ACCEPTED / TOOLING IMPLEMENTED / REAL ARCHIVE GENERATED READ-ONLY / DISPOSABLE RESTORE DRILL PASSED / AWAITING DIRECT SUPERVISOR REVIEW / SHARED-DEVELOPMENT RESET NOT AUTHORIZED
  OC-CUTOVER-001 = PLANNED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **Próxima fase indicada / NEXT_AUTHORIZABLE_ACTION:** direct supervisor review of the clean-slate reset tooling, real archive, and disposable restore-drill evidence. The destructive shared-development reset requires a separate explicit order; no deletion, database mutation, phase closure, or continuation is authorized; no phase chains automatically. This pass publishes exactly one commit through one authorized fast-forward push to `staging/dev`; no further push is authorized.

## 2026-07-22 — CLEAN-SLATE-TRANSACTIONAL-RESET-ARCHIVE-SAFETY-CORRECTION-R1 — trigger-handling ratified, 4 blocking archive-tooling safety gaps fixed, replacement authoritative archive generated read-only, disposable drill re-passed

- **Order / scope.** Direct supervisor review of `6d1c647de9b43088feced6a0632df8123afb1e07`: correct the blocking fail-closed and archive-custody gaps found during review, regenerate the real archive read-only, verify it, rerun the full disposable restore/reset drill, update materially affected documentation, and publish one reviewable checkpoint. No shared-development mutation or reset authorized by this order.
- **Trigger-handling ratification.** The emitted-order trigger-handling mechanism in `clean-slate-transactional-reset.sql` (temporarily disabling `item_quantidade_rascunho_guard` / `alocacao_rascunho_guard` / `trg_alocacao_kg_alocado_cache` / `pedido_itens_sync_parciais_after_change_trigger` inside the same transaction as the `DELETE`, FK enforcement and the C3C cutover fence kept active throughout, `SET CONSTRAINTS ALL IMMEDIATE` before re-enabling, all triggers re-enabled before `COMMIT`, any error rolling back trigger state and data together) is **RATIFIED BY DIRECT SUPERVISOR REVIEW** as an accepted architectural mechanism (contract §21.4) — no longer merely proposed. The future real-reset order must revalidate (not re-decide) the exact triggers' existence/ownership/enabled-state/definitions; no additional trigger may be disabled without a new HARD STOP.
- **Blocking corrections applied (contract §22.1; `clean-slate-transactional-{reset,restore}.sql` stay byte-identical, unchanged):**
  - **A — pre-write gate:** `buildArchive` previously ran `mkdirSync` before validating per-table captures and never validated the preserved baseline (`saldo_fios`/`op_numeros`/master/documents-front) pre-write at all — a failing capture could leave a partial archive directory. Fixed: a new shared `verifyPreservedBaseline()` (single source of truth for the preserved-baseline constants, imported by both exporter and verifier) and a pure `validateCaptureTables()` now complete — zero filesystem writes — before any `mkdirSync`/`writeFileSync`.
  - **B — repository-boundary enforcement:** the guard compared `--out-root` against `process.cwd()` (caller-controlled, not a stable authority). Fixed: `getRepoRoot()` derives the root from this module's own `import.meta.url`; `verifyRepoBoundary()` rejects an out-root at/under that root regardless of the caller's working directory.
  - **C — exact archive inventory:** `verifyArchive` never recursively walked the archive (an unexpected root/evidence file, nested subdirectory, or symlink would verify clean) and silently skipped non-matching `checksums.sha256` lines instead of rejecting them. Fixed: a recursive `walkArchive()` rejects symlinks and any entry outside the exact permitted set; a strict `parseChecksumsFile()` rejects malformed lines, duplicate paths, unsafe paths, and extra/missing entries via set equality.
  - **D — project-ref custody:** `capture.identity.project_ref` was a hardcoded literal baked into `CAPTURE_SQL`, making the target comparison tautological. Fixed: `buildCaptureSQL`/`captureViaPsql` are now parametrized by the actual `--target`; `verifyProjectRefCustody()` rejects a capture/target mismatch pre-write; `verifyArchive` cross-checks manifest/evidence/authorized-ref agreement. The (unused) `--database-url` path logs a non-blocking, non-secret endpoint-ref hint rather than claiming unproven endpoint-derived custody.
- **Tests added.** 16 new fixture-suite cases (pre-write rejections for wrong `saldo_fios` quantity/count, wrong `op_numeros`, wrong documents-front/master count, and capture `project_ref` mismatch — each proving no filesystem residue; repository-boundary rejection from repo-root and `scripts/reset/` cwd plus a CLI-subprocess rejection from an unrelated external cwd; `verifyArchive` rejection of a manifest `project_ref` mismatch, an unexpected root/evidence/nested file, and an extra/duplicate/malformed/missing checksums entry; a final re-verification that the untouched archive still passes). Fixture suite: 49/49, zero regressions in the 21 pre-existing cases.
- **Replacement authoritative archive (read-only).** The prior archive (`20260722T173607Z`, aggregate SHA-256 `337d23cd…`) is superseded, not deleted — retained on disk. New archive generated read-only from `ucrjtfswnfdlxwtmxnoo` inside one `REPEATABLE READ READ ONLY` transaction (rolled back, zero mutation): `D:\Programação\controle-tapetes-g28-artifacts\clean-slate-reset\20260722T183846Z`; aggregate SHA-256 `5221cd4753157ba426cee978b43d8b0107a42a5f08f6e23c96503ee92d7399dc`; `verify-archive` 395/395. **All 30 `tables/*.ndjson` SHA-256 hashes are identical** to the prior archive (only `captured_at`/manifest/aggregate hashes differ, as expected) — no corpus drift, no HARD STOP.
- **Disposable revalidation.** Full drill re-run against the replacement archive: preamble + ordered `db/01..77`; terminal migration `20260722055832` proven; restore (prepare) → reset #1 (exact affected-row sequences `0,0,0,0,0,51,51,51,64,51,64` / `0,0,10,8,0,1` / `27,16,4,18,0,0,0,0,0,0,20,16,25`) → zero-state + preserve invariance → restore → counts/identities (16 Pedidos / 20 OPs / 25 lotes) / B6 (8 revisions, 10 revision-op rows, OPs 55/57/61/63) / FK validity proven → reset #2 (re-deletable) → zero → execution-mode-guard and incorrect-delete-count negatives proven → cluster destroyed with PID/port/directory-absence proof. Smoke + drill: 84/84. Shared-development database re-confirmed unmutated post-drill (`ordem_compra_eventos = 0`, no audit writes).
- **Non-authorization / non-mutation.** The shared-development database `ucrjtfswnfdlxwtmxnoo` was **not mutated** by this pass; its clean-slate reset was **not executed or authorized**. Production `gqmpsxkxynrjvidfmojk` and the forbidden project `bhgifjrfagkzubpyqpew` were never accessed; contract §18 corrected to explicitly stop describing `bhgifjrfagkzubpyqpew` as production (it is the forbidden project, a third, distinct, non-production project). `REAL_CUTOVER`, `PHASE-C5B-ACCEPTANCE-DECISION`, and shared-development deletion remain unauthorized; the phase is not CLOSED; the accepted product checkpoint is not advanced.
- **Validation.** `node --check` on all three `.mjs` PASS; fixture suite 49/49; full smoke+drill 84/84; `verify-archive` 395/395; `node scripts/validate-spec-custody.mjs` PASS; `--self-test` fails only on the pre-existing active-contract fixture-harness limitation (`R1: ACTIVE_PHASE_CONTRACT is not an existing file: docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`) — byte-identical to every prior active-phase pass (C4/C5/C5A precedent), re-surfaced (not introduced) by the CLEAN-SLATE-TRANSACTIONAL-RESET phase remaining active; `git diff --check` / `--cached --check` clean; protected residue (`.gitignore`, `.codex/config.toml`, `.mcp.json`) untouched.
- **Exact accounting subject:** `fix: harden clean-slate archive safety gates`
- **Commit manifest.** 3 technical files (`scripts/reset/clean-slate-transactional-export.mjs`, `clean-slate-transactional-verify.mjs`, `tests/clean-slate-transactional-reset.smoke.mjs` — `clean-slate-transactional-reset.sql`/`-restore.sql` unchanged, not part of this commit's diff) + 7 documentation files (`docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this ledger) = 10 files. Parent `6d1c647de9b43088feced6a0632df8123afb1e07`.
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5
  ACTIVE_PHASE = CLEAN-SLATE-TRANSACTIONAL-RESET
  ACTIVE_PHASE_CONTRACT = docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md
  ACCEPTED_CHECKPOINT = 3405fdab8e05ec0f81cbfe07c63c489e551fee92

  CLEAN-SLATE-TRANSACTIONAL-RESET = CONTRACT ACCEPTED / TOOLING IMPLEMENTED (HARDENED) / TRIGGER-HANDLING RATIFIED / REPLACEMENT ARCHIVE GENERATED READ-ONLY / DISPOSABLE RESTORE DRILL RE-PASSED / AWAITING DIRECT SUPERVISOR REVIEW / SHARED-DEVELOPMENT RESET NOT AUTHORIZED
  OC-CUTOVER-001 = PLANNED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **Próxima fase indicada / NEXT_AUTHORIZABLE_ACTION:** direct supervisor review of the hardened clean-slate reset tooling, the replacement authoritative archive, and the disposable restore-drill re-validation. The destructive shared-development reset requires a separate explicit order; no deletion, database mutation, phase closure, or continuation is authorized; no phase chains automatically. This pass publishes exactly one commit through one authorized fast-forward push to `staging/dev`; no further push is authorized.

## 2026-07-22 — CLEAN-SLATE-TRANSACTIONAL-RESET-FINAL-VALIDATION-GATES-CORRECTION-R1 — checkpoint f165302c NOT ACCEPTED, 2 blocking validation-gate defects fixed, archive-safety patch retained, authoritative archive revalidated (not regenerated)

- **Order / scope.** Direct supervisor review of `f165302c1c542aa26e9ae78464d260c81eda6415`: correct the two remaining blocking validation defects, run every validator successfully, revalidate the existing authoritative archive (do not regenerate unless it fails), rerun the full disposable restore/reset drill against that same archive, update documentation, and publish one forward-correction checkpoint. No shared-development mutation or reset authorized by this order.
- **Checkpoint disposition.** `f165302c1c542aa26e9ae78464d260c81eda6415` is **NOT ACCEPTED** — the mandatory `node scripts/validate-spec-custody.mjs --self-test` failed at that commit with an **uncaught crash** (exit 1, zero PASS lines printed), not a graceful per-case failure. The §22 archive-safety technical patch itself was reviewed and is **RETAINED** — no change was required to it.
- **Root cause A — active contract omitted from the self-test fixture.** `scripts/spec-custody/self-tests.mjs`'s `createFixture()` never copied `ACTIVE_PHASE_CONTRACT` into its synthetic temporary repository. This was invisible while `ACTIVE_PHASE` was `NONE`; once `CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL-R2` made this contract the active phase, the self-test's own baseline fixture began failing R2 (`ACTIVE_PHASE_CONTRACT is not an existing file: ...`) as an **uncaught** exception. Fixed generically (`validation-core.mjs` untouched): `createFixture()` reads the source `PROJECT_STATE.md` bootstrap directly (a minimal, non-duplicated, self-tests-local field extraction), copies and tracks whatever file `ACTIVE_PHASE_CONTRACT` currently points to when `ACTIVE_PHASE != NONE` (never hardcoding a specific phase or contract path), requires the `NONE`/`NONE` combination otherwise, and throws before building a fixture at all if the source's own bootstrap combination is itself invalid. Two **pre-existing** tests (`UNRELATED_CONTRACT_SUBSTRING`, `DUPLICATE_CONTRACT_MARKERS`) hardcoded a literal `'ACTIVE_PHASE: NONE'` string replace that silently no-op'd once the baseline stopped being `NONE`/`NONE` — corrected to use a generic `setBootstrapLine` helper.
- **Self-test coverage added (7 new cases, 54 total, up from 47).** `POSITIVE_ACTIVE_CONTRACT_BASELINE` (renamed from the now-inaccurate `POSITIVE_NONE_CONTRACT`), `POSITIVE_ACTIVE_CONTRACT_TRACKED`, `POSITIVE_NONE_NONE_STATE`, `MISSING_ACTIVE_CONTRACT_FILE` (R1), `UNTRACKED_ACTIVE_CONTRACT_FILE` (R1), `ACTIVE_CONTRACT_PHASE_ID_MISMATCH` (R2), `ACTIVE_PHASE_WITHOUT_CONTRACT` (R2), `NONE_PHASE_WITH_CONTRACT` (R2). `node scripts/validate-spec-custody.mjs --self-test` now exits **0** with all **54/54** lines `=PASS` and no uncaught baseline-fixture error.
- **Root cause B — op_numeros preserved-gate was a loose map, not an exact set.** `verifyPreservedBaseline()`'s `op_numeros` check built a `tipo -> ultimo_numero` map and compared only the two known keys — it ignored `ano` (year) entirely, silently collapsed a duplicate `tipo` to whichever row appeared last, and never checked row count, so an extra third row or a wrong year passed undetected. Fixed: `EXPECTED_OP_NUMEROS` is now the exact canonical two-row set `{tipo:'latex',ano:2026,ultimo_numero:18}` / `{tipo:'tecelagem',ano:2026,ultimo_numero:41}`; the check requires an exact row count of 2, rejects any `NULL` field, rejects a duplicate `(tipo,ano)` identity, rejects any row whose `(tipo,ano)` is not in the expected set, and requires an exact `ultimo_numero` match for each expected row. Remains the single shared source imported by the archive verifier — `clean-slate-transactional-verify.mjs` required no change (it already delegates entirely to `verifyPreservedBaseline()`).
- **Archive-tooling tests added.** Pre-write (each proving no output directory was created): extra op_numeros row, missing op_numeros row, duplicate op_numeros identity, wrong op_numeros year (the pre-existing wrong-value case retitled for clarity). Archive-verifier negatives (each followed by re-confirming the untouched valid archive still passes): extra op_numeros row in preserved-baseline evidence, wrong op_numeros year in preserved-baseline evidence. Fixture suite: **61/61**.
- **Existing authoritative archive — retained, revalidated, not regenerated.** Per this order's explicit instruction, `20260722T183846Z` was not modified, rewritten, regenerated, or deleted. Aggregate SHA-256 before this pass: `5221cd4753157ba426cee978b43d8b0107a42a5f08f6e23c96503ee92d7399dc`; after this pass: **unchanged**, `5221cd4753157ba426cee978b43d8b0107a42a5f08f6e23c96503ee92d7399dc`. Corrected `verify-archive` result: **395/395** checks passed (exact op_numeros two-row identity PASS, exact archive inventory PASS, project-ref custody PASS, all table/count/B6/preserved checks PASS).
- **Disposable revalidation (same archive, no regeneration).** Full drill re-run against `20260722T183846Z`: preamble + ordered `db/01..77`; terminal migration `20260722055832` proven; restore (prepare) → reset #1 (exact affected-row sequences `0,0,0,0,0,51,51,51,64,51,64` / `0,0,10,8,0,1` / `27,16,4,18,0,0,0,0,0,0,20,16,25`) → zero-state + preserve invariance (including the exact two `op_numeros` rows with year) → restore → counts/identities (16 Pedidos / 20 OPs / 25 lotes) / B6 (8 revisions, 10 revision-op rows, OPs 55/57/61/63) / FK validity proven → reset #2 (re-deletable) → zero → execution-mode-guard and incorrect-delete-count negatives proven → cluster destroyed with PID/port/directory-absence proof. Smoke + drill: **96/96**. `clean-slate-transactional-reset.sql`/`-restore.sql` confirmed **byte-identical** throughout (`git diff --stat`, empty). The ratified contract §21.4 trigger-handling mechanism ran unchanged.
- **Non-authorization / non-mutation.** **No shared-development access of any kind occurred in this pass** (no MCP call, no connection, no query) — validated entirely against local repository files and the disposable cluster. The shared-development database `ucrjtfswnfdlxwtmxnoo` was not accessed; its clean-slate reset remains **not executed or authorized**. `REAL_CUTOVER`, `PHASE-C5B-ACCEPTANCE-DECISION`, and shared-development deletion remain unauthorized; the phase is not CLOSED; the accepted product checkpoint is not advanced.
- **Validation.** `node --check` on `self-tests.mjs`/`export.mjs`/`verify.mjs`/`smoke.mjs` PASS; `node scripts/validate-spec-custody.mjs` PASS; `--self-test` **54/54 PASS, exit 0**; `verify-archive` **395/395**; fixture suite **61/61**; full smoke+drill **96/96**; `git diff --check` / `--cached --check` clean; protected residue (`.gitignore`, `.codex/config.toml`, `.mcp.json`) untouched.
- **Exact accounting subject:** `fix: close clean-slate validation gates`
- **Commit manifest.** 3 technical files (`scripts/spec-custody/self-tests.mjs`, `scripts/reset/clean-slate-transactional-export.mjs`, `tests/clean-slate-transactional-reset.smoke.mjs` — `clean-slate-transactional-verify.mjs`, `validation-core.mjs`, `clean-slate-transactional-{reset,restore}.sql` unchanged, not part of this commit's diff) + 7 documentation files (`docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this ledger) = 10 files. Parent `f165302c1c542aa26e9ae78464d260c81eda6415`.
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5
  ACTIVE_PHASE = CLEAN-SLATE-TRANSACTIONAL-RESET
  ACTIVE_PHASE_CONTRACT = docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md
  ACCEPTED_CHECKPOINT = 3405fdab8e05ec0f81cbfe07c63c489e551fee92

  CLEAN-SLATE-TRANSACTIONAL-RESET = CONTRACT ACCEPTED / TOOLING IMPLEMENTED / TRIGGER-HANDLING RATIFIED / ARCHIVE-SAFETY PATCH RETAINED / VALIDATION GATES CLOSED (f165302c NOT ACCEPTED, superseded by this checkpoint) / AWAITING DIRECT SUPERVISOR REVIEW / SHARED-DEVELOPMENT RESET NOT AUTHORIZED
  OC-CUTOVER-001 = PLANNED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **Próxima fase indicada / NEXT_AUTHORIZABLE_ACTION:** direct supervisor review of the validation-gate-closed clean-slate reset tooling, with the existing authoritative archive revalidated (not regenerated). The destructive shared-development reset requires a separate explicit order; no deletion, database mutation, phase closure, or continuation is authorized; no phase chains automatically. This pass publishes exactly one commit through one authorized fast-forward push to `staging/dev`; no further push is authorized.

---

## 2026-07-22 — CLEAN-SLATE-TRANSACTIONAL-RESET-READINESS-ACCEPTANCE-CLOSEOUT-R1 — direct supervisor acceptance of clean-slate reset readiness (checkpoint 62bdcc75 ACCEPTED); shared-development reset authorized as the next separate governed destructive order, not executed — DOCUMENTATION-ONLY

- **Order / scope.** Documentation-only supervisor-acceptance recording. Record, in the canonical repository, the direct supervisor acceptance of checkpoint `62bdcc75c335e3881adb1af6350de801675aa788` (the accepted clean-slate contract, the implemented + hardened reset tooling, the retained + verified authoritative archive, the passed disposable restore/reset drill, the closed validation gates, and the ratified trigger-handling mechanism), and set the live next authorizable action to the separate governed destructive execution order. Authorizes **documentation changes only** — no database access, SQL, reset execution, deletion, archive regeneration, deployment, `REAL_CUTOVER`, or `PHASE-C5B`.
- **Supervisor acceptance (binding).** `62bdcc75c335e3881adb1af6350de801675aa788` = **ACCEPTED / DIRECTLY VERIFIED**. `CLEAN-SLATE RESET READINESS = ACCEPTED`; `CONTRACT = ACCEPTED`; `TOOLING = ACCEPTED`; `ARCHIVE = ACCEPTED` (`20260722T183846Z`, aggregate SHA-256 `5221cd4753157ba426cee978b43d8b0107a42a5f08f6e23c96503ee92d7399dc`, `verify-archive` 395/395); `DISPOSABLE RESTORE/RESET DRILL = ACCEPTED` (96/96); `VALIDATION GATES = CLOSED` (`--self-test` 54/54, fixture suite 61/61); `TRIGGER-HANDLING MECHANISM = RATIFIED / ACCEPTED` (contract §21.4, reset/restore SQL byte-identical). `SHARED-DEVELOPMENT RESET = AUTHORIZED AS THE NEXT SEPARATE GOVERNED DESTRUCTIVE ORDER (CLEAN-SLATE-TRANSACTIONAL-RESET-SHARED-DEV-EXECUTION-R1) / NOT EXECUTED BY THIS ORDER`.
- **Superseded-checkpoint disposition.** `f165302c1c542aa26e9ae78464d260c81eda6415` **remains NOT ACCEPTED** (its mandatory `--self-test` failed there, §23); its retained technical corrections are **incorporated into and superseded by** the accepted checkpoint `62bdcc75c335e3881adb1af6350de801675aa788`.
- **Non-authorization / non-mutation.** **No shared-development access of any kind occurred in this pass** (no MCP call, no connection, no query, no SQL). No reset was executed; the shared-development corpus (64/51/13, 16 Pedidos, 20 OPs, 25 lotes, the synthetic B6-VERIFY fixture) is **unchanged** and physically exists in `ucrjtfswnfdlxwtmxnoo`. The authoritative archive was not modified or regenerated. `REAL_CUTOVER`, `PHASE-C5B-ACCEPTANCE-DECISION`, real business-flow recreation, any shared-database apply beyond `db/77`, staging validation/application, deployment, activation, production access, and branch creation remain **unauthorized**; the phase is **not CLOSED**; the accepted product checkpoint stays `3405fdab8e05ec0f81cbfe07c63c489e551fee92`; no phase chains automatically.
- **Validation.** `node scripts/validate-spec-custody.mjs` PASS; `node scripts/validate-spec-custody.mjs --self-test` **54/54 PASS, exit 0**; `git diff --check` / `git diff --cached --check` clean; protected residue (`.gitignore`, `.codex/config.toml`, `.mcp.json`) untouched.
- **Exact accounting subject:** `docs: accept clean-slate reset readiness`
- **Commit manifest.** 7 documentation files only (`docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this ledger). No technical/product/test/script/migration/config change; no protected-residue change. Parent `62bdcc75c335e3881adb1af6350de801675aa788`.
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5
  ACTIVE_PHASE = CLEAN-SLATE-TRANSACTIONAL-RESET
  ACTIVE_PHASE_CONTRACT = docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md
  ACCEPTED_CHECKPOINT = 3405fdab8e05ec0f81cbfe07c63c489e551fee92
  ACCEPTED_CLEAN_SLATE_READINESS_CHECKPOINT = 62bdcc75c335e3881adb1af6350de801675aa788

  CLEAN-SLATE-TRANSACTIONAL-RESET = CONTRACT ACCEPTED / TOOLING IMPLEMENTED / TRIGGER-HANDLING RATIFIED / ARCHIVE-SAFETY PATCH RETAINED / VALIDATION GATES CLOSED / READINESS ACCEPTED / DIRECTLY VERIFIED (62bdcc75) / f165302c NOT ACCEPTED (superseded by 62bdcc75) / SHARED-DEVELOPMENT RESET AUTHORIZED AS THE NEXT SEPARATE GOVERNED DESTRUCTIVE ORDER / NOT EXECUTED
  OC-CUTOVER-001 = PLANNED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED
  ```
- **Próxima fase indicada / NEXT_AUTHORIZABLE_ACTION:** execute the authorized clean-slate shared-development transactional reset under the separate governed destructive order `CLEAN-SLATE-TRANSACTIONAL-RESET-SHARED-DEV-EXECUTION-R1` (authorized as a separate governed destructive order; not executed). Recording this acceptance does not itself execute anything; the destructive reset runs only under that separate order with every contract §12/§13 gate satisfied. This pass publishes exactly one documentation-only commit through one authorized fast-forward push to `staging/dev`; no further push is authorized.

## 2026-07-22 — CLEAN-SLATE-TRANSACTIONAL-RESET-SHARED-DEV-EXECUTION-R1 — governed destructive execution of the accepted clean-slate reset — EXECUTED / TRANSACTIONALLY VERIFIED / AWAITING DIRECT SUPERVISOR REVIEW

- **Order / scope.** Execute the accepted clean-slate transactional reset **exactly once** against the authorized non-production shared-development project `ucrjtfswnfdlxwtmxnoo`, prove the zero-state and preserved invariance, update the affected canonical documents, and publish one documentation-only commit. Canonical authorization checkpoint `9706ec75c10bf811abf67e4cfcabb19aa64cbeeb`; accepted readiness checkpoint `62bdcc75c335e3881adb1af6350de801675aa788`. This order authorized **no** `REAL_CUTOVER`, `PHASE-C5B`, production/forbidden-project access, deployment, staging application, application implementation, or real business-flow recreation.
- **Execution mechanism (binding).** One serialized `BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE`, submitted in a single project-scoped SQL invocation via the `supabase-dev-g28` transport (target identity proven by content fingerprint — the synthetic B6-VERIFY fixture + the exact §5 corpus — matching the archive manifest `project_ref` `ucrjtfswnfdlxwtmxnoo`; no production or forbidden project accessed), with bounded `lock_timeout`/`statement_timeout`/`idle_in_transaction_session_timeout`, a transaction advisory lock, deterministic `SHARE ROW EXCLUSIVE … NOWAIT` locks over the full §10 45-table set, and complete in-transaction re-verification (identity, cutover + NULL markers, §5 corpus + identities, preserved baseline, trigger catalog) after locks were held. The committed `scripts/reset/clean-slate-transactional-reset.sql` (disposable-drill-only) was **not** used or changed; the external execution artifact removed the drill sentinel and added the real-execution gates while keeping the four DISABLE, the `$reset$` DELETE block (order + every ROW_COUNT assertion + expected value), `SET CONSTRAINTS ALL IMMEDIATE`, the four ENABLE, and rollback-on-error **byte-identical** (proven by the canonical-to-execution diff). Affected-row sequences (each COMMIT-gating): Boundary A `0,0,0,0,0,51,51,51,64,51,64`; B6 `0,0,10,8,0,1`; Boundary B `27,16,4,18,0,0,0,0,0,0,20,16,25`.
- **Purged.** 64 legacy orders, 64 needs, 51 native purchase orders (+ items / allocations / compat), 16 Pedidos, 20 OPs, 25 lotes, and the exact synthetic `G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT` fixture. The 13 unmapped `ordens_compra_fio` rows ids `153`–`165` were removed within the `ordens_compra_fio` purge (contract §16 `SUPERSEDED_BY_CLEAN_SLATE_RESET` realised).
- **Post-state proof (read-only repeatable-read).** Every purge table `count(*)=0`; the B6 fixture absent across all six tables; **preserved unchanged** — `saldo_fios` (5 rows/quantities), `saldo_fios_op` (0), `op_numeros` (latex/2026/18, tecelagem/2026/41), documents front excluding B6 (39 candidates / 1 event / 24 scan-req / 30 scan-run), master/reference counts, the `legacy_active`/`flat`/`not_started` cutover with all markers NULL, terminal migration `20260722055832`; sequence invariance (full state hash `c210b65d60b5bafee526d4306fdbe946`, unchanged; no sequence reset); trigger invariance (full user-trigger state hash `7060ba455cbdf769f0eb0d71a5e8d6eb`, unchanged; the four temporarily-disabled guards re-enabled with byte-identical definitions; `trg_c3c_protected_mutation_guard` enabled on all required tables; zero user triggers left disabled). PONR (`productive_receipt_started_at`) remains NULL.
- **Evidence (outside the repository).** `…/controle-tapetes-g28-artifacts/clean-slate-reset/execution/20260722T202717Z/`: `shared-development-reset.sql` (sha256 `73c08150cac1cebeae7fb3eb86271da7b72c9003561395ffe984d060f3930a12`), `canonical-reset-source.sha256` (`33096194…`), `shared-development-reset.sha256`, `canonical-to-execution.diff`, `preflight.json`, `trigger-catalog.json`, `sequence-baseline.json`, `post-state.json`, `post-trigger-catalog.json`, `sequence-after.json`, `execution-result.txt`. The authoritative archive `20260722T183846Z` (aggregate SHA-256 `5221cd4753157ba426cee978b43d8b0107a42a5f08f6e23c96503ee92d7399dc`, `verify-archive` 395/395) is **unchanged**.
- **Validation.** `node scripts/validate-spec-custody.mjs` PASS; `node scripts/validate-spec-custody.mjs --self-test` **54/54 PASS, exit 0**; `git diff --check` / `git diff --cached --check` clean; protected residue (`.gitignore`, `.codex/config.toml`, `.mcp.json`) untouched.
- **Exact accounting subject:** `docs: record clean-slate shared-dev reset`
- **Commit manifest.** 7 documentation files only (`docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this ledger). No technical/product/test/script/migration/config change; the external SQL and evidence remain outside the repository; no protected-residue change. Parent `9706ec75c10bf811abf67e4cfcabb19aa64cbeeb`.
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5
  ACTIVE_PHASE = CLEAN-SLATE-TRANSACTIONAL-RESET
  ACTIVE_PHASE_CONTRACT = docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md
  ACCEPTED_CHECKPOINT = 3405fdab8e05ec0f81cbfe07c63c489e551fee92
  ACCEPTED_CLEAN_SLATE_READINESS_CHECKPOINT = 62bdcc75c335e3881adb1af6350de801675aa788

  CLEAN-SLATE-TRANSACTIONAL-RESET = CONTRACT ACCEPTED / TOOLING IMPLEMENTED / READINESS ACCEPTED (62bdcc75) / SHARED-DEVELOPMENT RESET EXECUTED / TRANSACTIONALLY VERIFIED (execution artifact 20260722T202717Z, contract §25) / AWAITING DIRECT SUPERVISOR REVIEW / PHASE NOT CLOSED
  OC-CUTOVER-001 = PLANNED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED / NOT EXECUTED
  ```
- **Risco residual.** The executed reset is **not self-accepted**; it awaits direct supervisor review. The phase is **not CLOSED** and no phase chains automatically. Real business-flow recreation, `REAL_CUTOVER`, `PHASE-C5B-ACCEPTANCE-DECISION`, staging application, deployment, activation, production/forbidden-project access, and branch creation remain unauthorized.
- **Próxima fase indicada / NEXT_AUTHORIZABLE_ACTION:** `DIRECT SUPERVISOR REVIEW` of the executed shared-development reset. This pass publishes exactly one documentation-only commit through one authorized fast-forward push to `staging/dev`; no further push is authorized.

## 2026-07-22 — CLEAN-SLATE-TRANSACTIONAL-RESET-EXECUTION-ACCEPTANCE-CLOSEOUT-R1 — direct supervisor acceptance of the executed clean-slate shared-development reset (checkpoint 770772548baf04c52e9ef020ff94f8bdabf77f03 ACCEPTED / DIRECTLY VERIFIED); CLEAN-SLATE-TRANSACTIONAL-RESET phase CLOSED — DOCUMENTATION-ONLY

- **Order / scope.** Documentation-only supervisor-acceptance recording. Record the direct supervisor acceptance of the executed, transactionally-verified shared-development clean-slate reset at checkpoint `770772548baf04c52e9ef020ff94f8bdabf77f03`, close the `CLEAN-SLATE-TRANSACTIONAL-RESET` material phase, and set the live next authorizable action to a read-only diagnosis of the real business flows to recreate. Authorizes **documentation changes only** — no database access, SQL, data recreation, product implementation, deployment, `REAL_CUTOVER`, or `PHASE-C5B`.
- **Repository baseline confirmed.** Branch `dev`; `HEAD` = `770772548baf04c52e9ef020ff94f8bdabf77f03`; `HEAD^` = `9706ec75c10bf811abf67e4cfcabb19aa64cbeeb`; `staging/dev` = `770772548baf04c52e9ef020ff94f8bdabf77f03` (0 behind / 0 ahead); index empty; only the permitted protected residue present (modified `.gitignore`; untracked `.codex/config.toml`, `.mcp.json`), none of it opened, inspected, or modified. No technical file changed in checkpoint `770772548…` (documentation-only, matching its own prior recording).
- **Supervisor acceptance (binding).** `770772548baf04c52e9ef020ff94f8bdabf77f03` = **ACCEPTED / DIRECTLY VERIFIED**. `SHARED-DEVELOPMENT RESET = EXECUTED / TRANSACTIONALLY VERIFIED / ACCEPTED`. `CLEAN-SLATE-TRANSACTIONAL-RESET = CLOSED / ACCEPTED / DIRECTLY VERIFIED`.
- **Directly verified final database state (re-affirmed from §25 evidence).** `ucrjtfswnfdlxwtmxnoo` (PostgreSQL 17.6, terminal migration `20260722055832`): purged 64 legacy purchase-order rows, 64 purchase needs, 51 native purchase orders, 16 Pedidos, 20 OPs, 25 lotes, and the exact synthetic `G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT` fixture; all 24 purge tables and all six B6 fixture tables `count(*) = 0`. Preserved: master/reference records; `saldo_fios` exact five rows/quantities; `saldo_fios_op = 0`; `op_numeros` (`latex`/2026/18, `tecelagem`/2026/41); the documents front excluding B6 = 39/1/24/30; the `legacy_active`/`flat`/`not_started` cutover with all governed cutover markers NULL; migration history; sequence high-water states; all user triggers enabled (the four temporarily-disabled guards re-enabled byte-identical); all C3C protected mutation guards enabled.
- **External artifacts (unchanged, outside the repository).** Archive `D:\Programação\controle-tapetes-g28-artifacts\clean-slate-reset\20260722T183846Z` (aggregate SHA-256 `5221cd4753157ba426cee978b43d8b0107a42a5f08f6e23c96503ee92d7399dc`). Execution evidence `D:\Programação\controle-tapetes-g28-artifacts\clean-slate-reset\execution\20260722T202717Z`. Neither modified by this pass.
- **Phase closure.** `LAST_ACCEPTED_PHASE` stays `PHASE-C5`; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` become `NONE`/`NONE`. The product `ACCEPTED_CHECKPOINT` stays `3405fdab8e05ec0f81cbfe07c63c489e551fee92` — never repurposed for the reset checkpoint, which is recorded separately as `ACCEPTED_CLEAN_SLATE_RESET_EXECUTION_CHECKPOINT = 770772548baf04c52e9ef020ff94f8bdabf77f03`.
- **Non-authorization / non-mutation.** **No database access of any kind occurred in this pass** (no MCP call, no connection, no query, no SQL) — this pass records the supervisor's acceptance of the already-executed and already-evidenced reset. No business flow was recreated. `REAL_CUTOVER` (`NOT AUTHORIZED / NOT EXECUTED`), `PHASE-C5B-ACCEPTANCE-DECISION` (`IDENTIFIED / NOT AUTHORIZED / NOT IMPLEMENTED`), real business-flow recreation (`NOT YET AUTHORIZED`), production (`NOT ACCESSED / NOT AUTHORIZED`), the forbidden project (`NOT ACCESSED`), and deployment/activation (`NOT AUTHORIZED`) remain unauthorized; no phase chains automatically.
- **Validation.** `node scripts/validate-spec-custody.mjs` PASS; `node scripts/validate-spec-custody.mjs --self-test` **54/54 PASS, exit 0**; `git diff --check` / `git diff --cached --check` clean; protected residue (`.gitignore`, `.codex/config.toml`, `.mcp.json`) untouched.
- **Exact accounting subject:** `docs: accept clean-slate shared-dev reset`
- **Commit manifest.** 7 documentation files only (`PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`, `docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this ledger). No technical/product/test/script/migration/config change; no protected-residue change. Parent `770772548baf04c52e9ef020ff94f8bdabf77f03`.
- **Canonical state after this commit:**
  ```text
  LAST_ACCEPTED_PHASE = PHASE-C5
  ACTIVE_PHASE = NONE
  ACTIVE_PHASE_CONTRACT = NONE
  ACCEPTED_CHECKPOINT = 3405fdab8e05ec0f81cbfe07c63c489e551fee92
  ACCEPTED_CLEAN_SLATE_RESET_EXECUTION_CHECKPOINT = 770772548baf04c52e9ef020ff94f8bdabf77f03

  CLEAN-SLATE-TRANSACTIONAL-RESET = CLOSED / ACCEPTED / DIRECTLY VERIFIED
  OC-CUTOVER-001 = PLANNED
  PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
  REAL_CUTOVER = NOT AUTHORIZED / NOT EXECUTED
  ```
- **Risco residual.** None introduced by this pass. The closed reset leaves the shared-development transaction corpus at zero-state; real business flows must be recreated through the new application under a separately authorized order.
- **Reconciliation note (before commit).** The next-authorizable-action framing below was corrected from `REAL-BUSINESS-FLOW-RECREATION-DIAGNOSIS-R1` (this section's original draft next action) to `GOVERNANCE-EFFICIENCY-REFOUNDATION-DIAGNOSIS-R1` per the reissued `CLEAN-SLATE-TRANSACTIONAL-RESET-EXECUTION-ACCEPTANCE-CLOSEOUT-R1` order, prior to this entry's first commit — no accepted historical entry was rewritten. The previously emitted but unexecuted order `CLEAN-SLATE-CLOSEOUT-AND-GOVERNANCE-EFFICIENCY-REFOUNDATION-SHADOW-R1` is superseded and must not be executed.
- **Próxima fase indicada / NEXT_AUTHORIZABLE_ACTION:** `GOVERNANCE-EFFICIENCY-REFOUNDATION-DIAGNOSIS-R1` — `READ-ONLY DOCUMENT INVENTORY AND REFOUNDATION DIAGNOSIS AUTHORIZED / IMPLEMENTATION NOT YET AUTHORIZED`: inventory and classify all current governance documents — line counts and file sizes, current authority and ownership, unique information held by each document, duplicated facts and duplicated narratives, documents required during normal bootstrap vs. only for historical audit, manual versus generated documents, consumers and inbound references, ledger partitioning and rollover options, archive and compaction candidates, safe deprecation candidates, documents that must remain normative, documents that may become generated views, information-loss risks, and link/reference migration requirements. The diagnosis must not delete, archive, split, compact, or generate replacement files. Real business-flow recreation stays a separate, still-unauthorized track (formerly framed as the live next action; not defined or guessed by this closeout). This pass publishes exactly one documentation-only commit through one authorized fast-forward push to `staging/dev`; no further push is authorized.


## 2026-07-22 — GOVERNANCE-EFFICIENCY-REFOUNDATION-SHADOW-STATE-R1 — shadow implementation opening

- **Order / scope.** The accepted `GOVERNANCE-EFFICIENCY-REFOUNDATION-DIAGNOSIS-R1` diagnosis is closed as accepted and this material governance phase is opened under `GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md`. This event authorizes only the non-canonical structured current-state shadow, deterministic compatibility views, equivalence mapping, renderer, validator, and dependency-free tests.
- **Canonical authority retained.** `PROJECT_STATE.md` remains the sole current-state owner and `AGENT_HANDOFF.md` remains the derived handoff. Structured sources are `NON-CANONICAL UNTIL SUPERVISOR CUTOVER`; no generated view replaces either root document.
- **Baseline / checkpoints.** Parent baseline is `82d39a7ffde4f9149afb83e9599ec3fa761c8b34`; product checkpoint remains `3405fdab8e05ec0f81cbfe07c63c489e551fee92`; clean-slate readiness remains `62bdcc75c335e3881adb1af6350de801675aa788`; clean-slate execution remains `770772548baf04c52e9ef020ff94f8bdabf77f03`.
- **Manifest.** Contract, schema, structured state, equivalence mapping, renderer, validator, tests, generated shadow views, and the four authorized canonical owners are included. Existing spec-custody validator files and all product, schema-contract, migration, database, and protected-residue paths remain unchanged.
- **Validation / gate.** Direct supervisor review of `GOVERNANCE-EFFICIENCY-REFOUNDATION-SHADOW-STATE-R1` is the next authorizable action. Documentary-authority cutover, cleanup, compaction, partitioning, archival, deprecation, deletion, product work, database access, deployment, `REAL_CUTOVER`, and `PHASE-C5B` remain unauthorized. Exact accounting subject: `feat: add governance current-state shadow`.



<!-- G28_LEDGER_SHADOW_PAYLOAD_END_7b9d4e3a -->
