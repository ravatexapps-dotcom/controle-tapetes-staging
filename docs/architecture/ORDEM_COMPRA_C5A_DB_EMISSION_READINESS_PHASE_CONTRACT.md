# PHASE-C5A Material Phase Contract — Database Emission Readiness

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: PHASE-C5A-DB-EMISSION-READINESS
<!-- MATERIAL_PHASE_CONTRACT:END -->
STATUS: PROPOSED / AWAITING SUPERVISOR REVIEW / IMPLEMENTATION NOT AUTHORIZED

> **Role of this document.** This is a **material phase contract**, authored under
> the order `C5A-DB-EMISSION-READINESS-CONTRACT-R1` as **read-only database
> reconciliation + documentation-only phase-contract authoring**. It does
> **not** authorize database migration, `GRANT`, environment mutation, staging
> application, deployment, activation, cutover, `PHASE-C5` UI implementation,
> `PHASE-C5B` acceptance-decision implementation, or push. It defines the exact
> database, ACL, writer-readiness, read-model, testing, rollback, and
> shared-environment evidence required before `PHASE-C5` purchase-order emission
> UI implementation may be authorized, so a **future, separately authorized**
> `PHASE-C5A` implementation order and the downstream `PHASE-C5` order have
> nothing left to infer. Per `docs/governance/DOCUMENTATION_MODEL.md` §19,
> authoring a `PROPOSED` contract of this kind is `READ_ONLY_RECONCILIATION` — no
> canonical mutation beyond this new file and its proportional
> state/index/traceability/backlog/ledger registration (§21). **This contract
> does not self-accept.**

---

## 0. Order authorization, entry checkpoint, and scope of this pass

- **Order:** `C5A-DB-EMISSION-READINESS-CONTRACT-R1` — read-only database
  reconciliation + documentation-only `PHASE-C5A-DB-EMISSION-READINESS`
  material-contract authoring. Explicitly does **not** authorize implementation
  of C5A, C5, or C5B, nor any migration, database access, or push.
- **Entry checkpoint (this pass):**
  - Workspace: `D:\Programação\controle-tapetes-g28`; Git dir `.git` (normal
    repository, single worktree).
  - Branch: `dev`. `HEAD`: `b4e8cd5825ef6f263a589e8e012dff7733bcb2d5`
    (`docs: accept C5 emission contract`). `HEAD^`:
    `f9fa97703d2724d62a0d916cca7b9637d54a1e08`.
  - `git status --short --untracked-files=all`: `M .gitignore`,
    `?? .codex/config.toml`, `?? .mcp.json` — unchanged protected residue; none
    of the three paths opened, displayed, copied, modified, or staged.
  - Remote: `git fetch staging`; `staging/dev` =
    `0df4228f903ae68c7e8b240e69ff3b37df9ebd86`;
    `git rev-list --left-right --count staging/dev...HEAD` = `0	8`
    (`staging/dev` is behind local `dev` by eight commits — the expected
    non-blocking local-ahead condition). No `HARD STOP`.
- **This pass's authorized output:** exactly one new file (this document) plus
  proportional updates to the documents enumerated in §21, and one local
  documentation-only commit. No push. **No database, Supabase, or
  shared-environment access occurred** — every database fact below is derived
  from the tracked migration files, not from any live connection.

---

## 1. Dependencies read this pass

Per `docs/governance/AGENT_INSTRUCTIONS.md` §2 and the order's mandatory
canonical-reading list:

1. Governance: `docs/governance/AGENT_INSTRUCTIONS.md`, `PROJECT_STATE.md`,
   `AGENT_HANDOFF.md`, `CLAUDE.md`, `docs/DOCUMENTATION_INDEX.md`,
   `docs/governance/DOCUMENTATION_MODEL.md`,
   `docs/governance/SUPERVISION_PROTOCOL.md`,
   `docs/architecture/CODE_HEALTH_RULES.md` (materially-applicable sections).
2. Architecture: `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
   (§R.7/§R.8/§R.16/§R.22.5/§R.22.6/§R.23.0/§R.23.8/§R.23.9/§R.24.10/§R.25.3/§R.31),
   `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`,
   `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
   `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
   `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`,
   `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md` (the directly-governing
   accepted contract this phase resolves),
   `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
   (structural precedent — the closest analog DB-prerequisite phase contract),
   `docs/ledgers/G28_LEDGER.md` (tail).
3. Database (tracked migration files, read in full or by dependency trace):
   `db/65` … `db/76`, specifically
   `db/66_ordem_compra_emitir_cancelar.sql` (legacy flat emission),
   `db/67_ordem_compra_refoundation_schema.sql` (first `alocar_...` +
   `ordem_compra` grants),
   `db/68_ordem_compra_native_draft_admin.sql` (native `emitir_ordem_compra`,
   read models),
   `db/69_ordem_compra_preprod_allocation.sql` (allocation writer + terminal read
   models + `_distribuicao_completa_ordem`),
   `db/74_ordem_compra_hybrid_origin_forward_correction.sql` (F1 distribution
   writer + "exact final execution ACL matrix"),
   `db/75_ordem_compra_c3c_inactive_cutover.sql` (cutover fence),
   `db/76_ordem_compra_c3c_b_db_prerequisites.sql` (checked for absence of any
   further mutation to the emission/allocation objects).
4. Product code: `js/screens/ordem-compra-render.js`,
   `js/screens/ordem-compra-data.js`, `js/screens/ordem-compra-events.js`,
   `js/screens/ordem-compra-distribuicao.js`,
   `js/screens/pedido-insumos-distribuicao.js` (the live allocation call-site),
   repo-wide grep for `emitir_ordem_compra`/`alocar_necessidade_compra_fio`/
   `definir_alocacao_necessidade_compra_fio` under `js/`.

Chat memory and the prior C5 report were **not** treated as the source of truth;
every database fact below is re-derived from the migration files and cited by
file and line, and one material refinement to the accepted C5 contract's premise
was found (§4.7, §5) by that re-derivation.

---

## 2. Governing normative anchors — exact citations

| Anchor | Governing clause (as it bears on C5A) |
|---|---|
| §R.22.5 | `emitir_ordem_compra(BIGINT)` "created by the migration but granted to no client role"; rejects unless native + `rascunho` + fornecedor + ≥1 item + every item fully allocated (SUM(active alloc)=`kg_pedido`) + matching Pedido ownership + material/color identity; freezes issuance fields atomically; "Because allocation is inactive in REFUND-B1, no ordinary UI-created draft can satisfy this precondition — intentional." |
| §R.22.6 | "The read model returns, for ordinary native drafts, `pode_emitir=false` and `bloqueio_emissao='distribuicao_necessidades_pendente'`. The screen may render a disabled action showing that reason, but must never call `emitir_ordem_compra`; no `authenticated` EXECUTE grant exists on it." |
| §R.23.8 | `obter_ordem_compra_admin` exposes `distribuicao_completa`, `pronta_para_emissao`, `pode_emitir=false`, `bloqueio_emissao` — `'recebimento_nativo_ainda_inativo'` when distribution is complete, `'distribuicao_necessidades_pendente'` when incomplete. "The server computes readiness; it does not authorize emission." |
| §R.23.9 | "`db/69` does not grant `emitir_ordem_compra`… The UI renders Emitir as disabled; when distribution is complete its explanation states that emission awaits native receipt activation (Phase C), not that distribution is incomplete." |
| §R.24.10 | Delivery sequence: "C5: separate native emission activation gate. Native emission stays inactive and ungranted until C1 through C4 are each accepted. No phase chains automatically." |
| §R.7 | Acceptance lifecycle: config-gated at emission (`nao_aplicavel` when `exige_aceite=false`; `pendente` when true), then `aceita`/`rejeitada` by explicit decision; receipt blocked until `status_aceite IN ('nao_aplicavel','aceita')`. |
| §R.8 / §R.25.3 | Native receipt permitted only when `status_administrativo='emitida'` and `status_aceite IN ('nao_aplicavel','aceita')`. |
| §R.31 registry | `OC-C5-EMISSION-001` → anchor `§R.24.10`, owning phase `C5`, "Keep native emission behind the separate post-C4 gate." **C5A introduces no new requirement ID** — it is the database-readiness prerequisite of the existing `OC-C5-EMISSION-001`. |

`§R.23.8`/`§R.23.9` are the exact normative basis for the read-model correction
this contract requires (§5): the spec itself frames `pode_emitir=false` as an
**installed-but-inactive activation state** whose flip to a computable-true is the
Phase-C activation step. C5A performs no UI-computed substitute for that
server-side signal.

---

## 3. Effective terminal database contract — the two writers (evidence-cited)

Read from the tracked migrations; every line reference is verified this pass.

### 3.1 `emitir_ordem_compra(p_ordem_id BIGINT) RETURNS JSONB` — the emission writer

1. **Exact terminal signature.** `public.emitir_ordem_compra(p_ordem_id BIGINT)
   RETURNS jsonb`. Defined once at `db/68:247`; **never `CREATE OR REPLACE`d
   again through `db/76`** (grep-confirmed).
2. **Terminal body ownership.** `LANGUAGE plpgsql`, created by `db/68` as the
   migration owner (`postgres`/owner); `db/74`'s owner-normalization block
   (`db/74:1216-1224`) does **not** list `emitir_ordem_compra`, so its owner is
   the `db/68` creator (`postgres`).
3. **SECURITY DEFINER / INVOKER.** `SECURITY DEFINER` (`db/68:250`).
4. **Effective search_path.** `SET search_path = public` (`db/68:251`).
5. **Effective EXECUTE grants/revocations (terminal).** `REVOKE ALL … FROM
   PUBLIC, anon, authenticated, service_role` at `db/68:347-350`, restated
   verbatim at `db/70:1203-1206`, and restated a third time — as the terminal
   statement — at `db/74:1192-1193` under `db/74`'s own heading
   "6. Exact final execution ACL matrix." **No `GRANT` to any role exists
   anywhere in `db/01`…`db/76`.** In the same `db/74` §6 block every sibling
   writer receives a paired `GRANT EXECUTE … TO authenticated`
   (`definir_alocacao_necessidade_compra_fio` 1177-1178, `sincronizar_…`
   1190-1191, `cancelar_ordem_compra` 1197, `registrar_recebimento_ordem_compra`
   1201-1202, `estornar_recebimento_ordem_compra` 1206-1207); `emitir_ordem_compra`
   is the one writer with a `REVOKE` and **no** paired `GRANT`.
   **Terminal state: EXECUTE revoked from every role including `service_role`;
   the function is unreachable from any PostgREST/RPC client surface.**
6. **Internal actor authorization.** `IF NOT public.is_admin() THEN … 'sem_permissao'`
   (`db/68:260-262`) — admin-gated internally, independent of the (absent)
   EXECUTE grant.
7. **Administrative-state gate.** `status_administrativo='rascunho'` required
   (`db/68:271-273`, `codigo:'estado_invalido'`).
8. **Pedido/supplier/need/item/allocation invariants** (`db/68:264-314`, in
   order): row exists (`nao_encontrada`); `legado=FALSE` (`ordem_legado`);
   `fornecedor_id IS NOT NULL` (`sem_fornecedor`); ≥1 item (`sem_itens`); every
   item `SUM(active alloc kg)=kg_pedido` (`alocacao_incompleta`); every
   allocation's need matches `pedido_id` + item material/color identity
   (`alocacao_incoerente`). `FOR UPDATE` row lock at `db/68:264`.
9. **Idempotency mechanism.** None by parameter; **natural** guard only — a
   retry against an already-`emitida` order falls into `estado_invalido`
   (`db/68:271-273`). No `p_idempotency_key`, no `ON CONFLICT` on the transition.
10. **Concurrency/locking.** `SELECT … FOR UPDATE` on the target order
    (`db/68:264`); no advisory lock.
11. **Return shape.** `jsonb` — `{ok:false, codigo, erro[, …]}` on failure;
    `{ok:true, codigo:'ok', ordem_compra_id, status_administrativo:'emitida',
    status_aceite}` on success (`db/68:339-340`).
12. **Deterministic error vocabulary (exact, from the live body).**
    `sem_permissao`, `nao_encontrada`, `ordem_legado`, `estado_invalido`,
    `sem_fornecedor`, `sem_itens`, `alocacao_incompleta`, `alocacao_incoerente`
    (`db/68:260-314`).
13. **Audit/history side effect.** Exactly one `ordem_compra_eventos` row per
    success (`dimensao='administrativo'`, `tipo_evento='emitida'`, payload
    carrying `aceite_exigido_na_emissao`/`status_aceite`, `db/68:330-334`).
14. **Acceptance snapshot at emission.** `SELECT exige_aceite … FROM
    ordem_compra_config WHERE id=1` → `status_aceite = 'pendente' WHEN
    exige_aceite ELSE 'nao_aplicavel'` (`db/68:317-324`), frozen into
    `aceite_exigido_na_emissao`/`status_aceite`.
15. **Cutover dependency (in-body).** **None** — the function body never
    references `ordem_compra_cutover`/`legacy_active`/`canonical_active`
    (`db/68:247-342`, read in full; the cutover table postdates it by three
    migrations and it is never amended afterward). Table-level cutover gating is
    separate — see §7.

**Conclusion (emission writer):** body is complete and correct; the sole missing
database ingredient for the writer itself is the EXECUTE grant. **Its body
remains byte-equivalent under C5A — no writer-body correction is required.**

### 3.2 `definir_alocacao_necessidade_compra_fio(...)` — the LIVE allocation writer

The canonical, need-first distribution/allocation command installed by the F1
"hybrid origin forward correction," `db/74:330`.

1. **Exact terminal signature.**
   `public.definir_alocacao_necessidade_compra_fio(p_necessidade_id BIGINT,
   p_fornecedor_id BIGINT, p_kg_alocado NUMERIC, p_idempotency_key TEXT)
   RETURNS jsonb` (`db/74:330-336`). Terminal (not replaced through `db/76`).
2. **Ownership / definer / search_path.** `SECURITY DEFINER`
   (`db/74:338`), `SET search_path = ''` (fully schema-qualified body,
   `db/74:339`), `ALTER FUNCTION … OWNER TO postgres` (`db/74:1216`).
3. **Terminal EXECUTE grant.** `REVOKE ALL … FROM PUBLIC, anon, authenticated,
   service_role;` **then `GRANT EXECUTE … TO authenticated`** (`db/74:1175-1178`).
   **This writer is GRANTED to `authenticated` today.**
4. **Internal actor authorization.** `IF v_actor IS NULL OR NOT public.is_admin()`
   → `sem_permissao` (`db/74:368-370`) — authenticated-admin only.
5. **Atomic draft-order create-or-reuse.** Advisory `pg_advisory_xact_lock` on
   `(pedido, fornecedor)` (`db/74:450-452`); `SELECT … FROM ordem_compra WHERE
   pedido_id=…, fornecedor_id=…, legado=FALSE, status_administrativo='rascunho'
   FOR UPDATE`; if absent, `INSERT INTO ordem_compra (… 'rascunho',
   'nao_aplicavel', 'nao_recebido', FALSE)` (`db/74:454-511`). A frozen-historical
   guard returns `estado_invalido` if a matching non-`rascunho` entity exists
   (`db/74:462-474`).
6. **Atomic item create-or-reuse.** `SELECT … FROM ordem_compra_item WHERE
   ordem_id, material, cor_id, cor_poliester FOR UPDATE`; if absent, `INSERT INTO
   ordem_compra_item (… kg_pedido=v_target …)` (`db/74:515-556`).
7. **Allocation write.** Reads/updates/inserts
   `ordem_compra_item_alocacao(item_id, necessidade_id, op_id, kg_alocado)`
   (`db/74:559+`) — **exactly the rows `emitir_ordem_compra`'s
   completeness/coherence checks read.** Absolute-target semantics with need-cap
   enforcement (`excede_saldo`, `db/74:569-574`).
8. **Provenance preserved; no fabricated OP.** OP-origin cotton requires the
   need's real OP; Pedido-origin polyester keeps `op_id` NULL and requires a
   real OP of the same Pedido only for cotton (`db/74:419-436, 570-586`).
9. **Idempotency mechanism.** Explicit `p_idempotency_key`, actor-scoped, journaled
   in the immutable `ordem_compra_distribuicao_comandos` table (`db/74:14-65`);
   advisory `pg_advisory_xact_lock` on `(actor, key)`; replay of the same payload
   returns the stored result; a reused key with a different payload →
   `idempotencia_conflitante` (`db/74:391-406`).
10. **Coherence enforced on write.** Same-Pedido ownership + material/color
    identity + supplier-material compatibility (`db/74:427-448, 557-568`); plus
    the `trg_item_kg_pedido_derivado_guard` deferred constraint trigger that
    forces `ordem_compra_item.kg_pedido = SUM(positive allocation)` at commit
    (`db/74:311-324`). **By construction, any draft built through this writer
    satisfies `emitir_ordem_compra`'s `alocacao_incompleta`/`alocacao_incoerente`
    preconditions.**
11. **Wired in the UI.** Called from `js/screens/pedido-insumos-distribuicao.js:135`
    (`window.supa.rpc('definir_alocacao_necessidade_compra_fio', …)`) — the
    Pedido/Insumos distribution surface. `emitir_ordem_compra` and
    `alocar_necessidade_compra_fio` are called **nowhere** in `js/`.
12. **Cutover dependency (in-body).** None (advisory locks are distribution keys,
    not cutover state); table-level gating separate (§7).

### 3.3 `alocar_necessidade_compra_fio(BIGINT,BIGINT,BIGINT,NUMERIC)` — SUPERSEDED

The older allocation writer named in the accepted C5 contract §5(b).
Defined `db/67:357`, replaced `db/69:505`; granted to `authenticated` at
`db/69:629`; **that grant revoked with no re-grant at `db/74:1182-1183`**, in the
same §6 block that installs `definir_alocacao_necessidade_compra_fio`'s grant.
`definir_item_ordem_compra`, `remover_item_ordem_compra`, and
`remover_alocacao_compra_fio` are revoked-with-no-regrant in the same block
(`db/74:1180-1187`). **This function is superseded by
`definir_alocacao_necessidade_compra_fio`; its missing grant is intentional and
is NOT a C5A prerequisite** (§4.7, §5). It is not called from `js/`.

---

## 4. Effective terminal read model — the emission-readiness signal

### 4.1 Terminal read models (correct file identified)

The order-detail and list read models were **redefined in `db/69`**, which is
their terminal version — **not** the `db/68` versions the accepted C5 contract
cited (`db/68:486`/`db/68:505`/`db/68:528-532`). No `db/70`…`db/76` migration
redefines them (grep-confirmed):

- `public.obter_ordem_compra_admin(p_ordem_id BIGINT)` — terminal at
  **`db/69:987-1075`** (single-order read model consumed by
  `js/screens/ordem-compra-data.js`'s `loadOrdemDetail`).
- `public.listar_ordens_compra_admin(p_pedido_id UUID)` — terminal at
  **`db/69:913-…`** (list read model).

### 4.2 The hard-coded block (root cause)

In **both** terminal read models, the emission signals are constants with no
code path to `true`:

- `acoes.emitir` = `false` in **every** branch (legado / rascunho / else),
  `db/69:1037-1039` (single) and `db/69:959-961` (list).
- `pode_emitir` = **hard-coded `false`**, `db/69:1043` (single) / `db/69:965`
  (list). The function comment states it verbatim: "pode_emitir stays false;
  emission awaits Phase C native receipt." (`db/69:1073-1075`).
- `bloqueio_emissao` = for a native `rascunho`: `'recebimento_nativo_ainda_inativo'`
  when `_distribuicao_completa_ordem` is true, else
  `'distribuicao_necessidades_pendente'`; NULL otherwise (`db/69:1044-1046` /
  `db/69:966-968`).
- `distribuicao_completa` / `pronta_para_emissao` = `_distribuicao_completa_ordem(oc.id)`
  (`db/69:963-964` / `db/69:1041-1042`).

### 4.3 Completeness is already derivable authoritatively

`public._distribuicao_completa_ordem(BIGINT)` (`db/69:889-903`, `STABLE`,
`SECURITY DEFINER`, granted to no client role) returns TRUE iff the order is a
native `rascunho`, has ≥1 item, and every item's `SUM(kg_alocado)=kg_pedido` —
**byte-equivalent in logic to `emitir_ordem_compra`'s own
`alocacao_incompleta` check** (`db/68:283-296`). Allocation completeness is
therefore already computed server-side; it is simply **not routed into
`pode_emitir`/`acoes.emitir`**.

### 4.4 Consequence

Granting `emitir_ordem_compra` alone would leave the terminal read model still
reporting `pode_emitir=false`/`acoes.emitir=false` forever. Because the accepted
`PHASE-C5` contract binds the UI's action availability to the server
`acoes.emitir`/`pode_emitir`/`bloqueio_emissao` model and forbids client-side
recomputation (`ORDEM_COMPRA_C5_PHASE_CONTRACT.md` §6.1/§7), **the emission
button could never enable after a grant-only change.** A read-model correction
is a co-equal database prerequisite (§5), consistent with `§R.23.8`/`§R.23.9`'s
framing of `pode_emitir=false` as an installed-but-inactive activation state.

### 4.5 `status_aceite` visibility

Both terminal read models already return `status_aceite` (`db/69` list and
single). It is unrendered on the order-detail screen today — a `PHASE-C5` UI
concern, not a database change.

### 4.6 Acceptance config is structurally frozen FALSE

`ordem_compra_config.exige_aceite` is `BOOLEAN NOT NULL DEFAULT FALSE`
(`db/65:174`), seeded `FALSE` (`db/65:182`). The table is `GRANT SELECT … TO
authenticated` **only** (`db/65:192`) with an admin `SELECT` policy
(`db/65:194-195`) and **no UPDATE grant, no UPDATE policy, and no RPC anywhere
that writes `exige_aceite`** (grep-confirmed). Therefore, through any client
role, `emitir_ordem_compra` can only ever produce
`status_aceite='nao_aplicavel'`. See §9.

### 4.7 Reconciliation with the accepted C5 contract (not a contradiction)

The accepted `PHASE-C5` contract §5(b) named `alocar_necessidade_compra_fio` as
a co-blocker "or an equivalent activated allocation-writing path … not assumed
here," explicitly deferring the determination to this C5A diagnosis. This
contract **resolves** that open question: the equivalent activated path exists
and is `definir_alocacao_necessidade_compra_fio` (granted, wired, §3.2). C5 §5
also did not surface the read-model prerequisite (§4). Neither point contradicts
normative architecture — `§R.23.8`/`§R.23.9` anticipate a Phase-C activation
that flips `pode_emitir` — so **no HARD STOP is raised**; the refinement is
recorded here and does not modify the accepted C5 contract (which remains binding
and unmodified per §21).

---

## 5. Overall C5A prerequisite classification

**Classification: `READ_MODEL_FUNCTION_AND_GRANT_PREREQUISITE`.**

This is **not** `GRANT_ONLY` — a grant alone leaves the read model reporting
`pode_emitir=false` with no path to true (§4.4); the order's own caution ("Do not
choose GRANT_ONLY merely because the known immediate symptom is missing EXECUTE
privilege") applies exactly here. It is **not** `FUNCTION_AND_GRANT` in the
writer-body sense (no writer body changes — `emitir_ordem_compra`'s and
`definir_alocacao_necessidade_compra_fio`'s bodies remain byte-equivalent). It is
**not** `MULTI_WRITER_FUNCTION_AND_GRANT` (only one writer, `emitir_ordem_compra`,
needs a grant; the allocation writer is already granted). It is **not**
`NO_DATABASE_CHANGE_REQUIRED` (a grant and a read-model correction are both
required).

The exact minimal database change set is:

1. **GRANT** `EXECUTE ON FUNCTION public.emitir_ordem_compra(BIGINT) TO
   authenticated` (with `PUBLIC`/`anon`/`service_role` explicitly kept revoked).
2. **READ-MODEL correction** of the two terminal read-model functions
   `obter_ordem_compra_admin(BIGINT)` (`db/69:987`) and
   `listar_ordens_compra_admin(UUID)` (`db/69:913`) so `pode_emitir` and
   `acoes.emitir` derive true, and `bloqueio_emissao` clears, when an order is a
   native `rascunho` with `_distribuicao_completa_ordem = TRUE` **and**
   `ordem_compra_config.exige_aceite = FALSE` (§9).

No allocation-writer grant, no writer-body change, no acceptance RPC, no
migration to `emitir_ordem_compra`'s body, and no cutover/activation action are
part of this classification.

---

## 6. Actor-ownership decision (per writer)

Determined **separately** for each writer, from canonical + effective-code
evidence (`docs/governance/AGENT_INSTRUCTIONS.md` §6):

| Writer | Disposition | Evidence |
|---|---|---|
| `emitir_ordem_compra(BIGINT)` | **AUTHENTICATED_ADMIN_ONLY** | Intended grant is `authenticated` (every sibling writer in `db/74` §6 is `GRANT EXECUTE … TO authenticated`; the `db/68`/`db/74` comments say "PRE-PROD grants EXECUTE"), with the binding internal `is_admin()` gate (`db/68:260`). The missing grant is the deliberate inactivation, not an actor-model ambiguity. |
| `definir_alocacao_necessidade_compra_fio(...)` (the live allocation writer) | **AUTHENTICATED_ADMIN_ONLY** | Granted to `authenticated` (`db/74:1177-1178`), internal `v_actor IS NULL OR NOT is_admin()` gate (`db/74:368`). Already ready. |
| `alocar_necessidade_compra_fio(BIGINT,BIGINT,BIGINT,NUMERIC)` (legacy) | **INTERNAL_FUNCTION_ONLY (SUPERSEDED)** | Revoked from all roles with no re-grant (`db/74:1182-1183`); superseded by `definir_alocacao_necessidade_compra_fio`; no `js/` caller. No client principal is intended; it is effectively decommissioned. |

The two named writers do **not** share an actor owner in the sense the order
warns against: `emitir_ordem_compra` is a to-be-granted AUTHENTICATED_ADMIN
writer; the legacy `alocar_necessidade_compra_fio` is a superseded internal-only
object whose capability now lives in the already-granted
`definir_alocacao_necessidade_compra_fio`.

---

## 7. Cutover boundary (per writer, terminal-body + table-fence evidence)

The writer **bodies** never reference cutover state (§3.1.15, §3.2.12). Gating is
entirely table-level: `db/75` installs `trg_c3c_protected_mutation_guard`
(`db/75:121-172`) as a `BEFORE INSERT OR UPDATE OR DELETE` trigger on eight
tables including `ordem_compra`, `ordem_compra_item`, `ordem_compra_item_alocacao`,
and `necessidade_compra_fio` (`db/75:179-189`). The guard returns immediately
(permits) when the cutover status is NULL or `legacy_active` (`db/75:131-133`);
otherwise it raises `legacy_receipt_fenced` (SQLSTATE `55000`) on any mutation
except a narrow depth>1 no-op-shape UPDATE.

| Cutover mode | `emitir_ordem_compra` (UPDATE `ordem_compra`) | `definir_alocacao_...` (INSERT `ordem_compra`/`item`/`alocacao`) | Basis |
|---|---|---|---|
| `legacy_active` (current dev-DB state) | **PERMITS** | **PERMITS** | fence inert (`db/75:131-133`) |
| `maintenance_fenced` | **DENIES** (`55000`) — the emission UPDATE changes `status_administrativo`, so it is not a no-op-shape UPDATE (`db/75:149-161`) | **DENIES** (`55000`) — INSERTs hit the catch-all (`db/75:170`) | table fence |
| `canonical_active` | **DENIES** (`55000`) — same non-no-op UPDATE rule | **DENIES** (`55000`) — INSERTs hit the catch-all (only `saldo_fios`/`saldo_fios_op` have a depth>1 canonical exception, `db/75:163-168`) | table fence |

**For C5A** (current `legacy_active`/`flat` non-production authorized
environment, no cutover activation authorized) both writers' DML is **permitted**;
cutover mode is **not checked by the writer bodies** and is **irrelevant to
C5A's readiness proof under `legacy_active`**. The `maintenance_fenced`/
`canonical_active` denials are governed by `REAL_CUTOVER`, out of C5A scope.
**An open question is recorded (§16, §19):** under `canonical_active` the fence
denies new native draft/item/allocation INSERTs and the emission UPDATE — i.e.,
whether native purchase-order creation and emission are intended to remain
available after a real cutover, or are intentionally frozen, is a `REAL_CUTOVER`
design question C5A neither resolves nor activates.

---

## 8. Allocation-readiness analysis

Determined against the order's checklist, from §3.2 evidence:

- needs exist before allocation (need-first command keyed on `p_necessidade_id`); ✔
- allocation begins from the selected need; ✔
- supplier is selected in the Pedido distribution surface (`p_fornecedor_id`,
  `pedido-insumos-distribuicao.js:135`); ✔
- quantity is explicit (`p_kg_alocado`, absolute target); ✔
- the active draft order is created or reused atomically by Pedido + supplier
  under an advisory lock (`db/74:450-511`); ✔
- the item is created or reused atomically (`db/74:515-556`); ✔
- allocation preserves originating OP/Pedido provenance; no fabricated OP for
  Pedido-origin needs (`db/74:419-436`); ✔
- quantity cannot exceed available need (`excede_saldo`, `db/74:569-574`); ✔
- allocation completeness is derived authoritatively (`_distribuicao_completa_ordem`,
  §4.3); ✔
- no order-first or manual item/allocation workflow is reintroduced (the legacy
  `alocar_...`/`definir_item_...` writers are ungranted, §3.3); ✔
- concurrency and idempotency are sufficient for the granted writer (per-`(actor,key)`
  and per-`(pedido,fornecedor)` advisory locks + immutable command journal,
  §3.2.9); ✔

**Classification: `ALLOCATION_PATH_READY_AFTER_GRANT`** — and the required grant
**already exists** on the live writer (`definir_alocacao_necessidade_compra_fio`
→ `authenticated`, `db/74:1177`). No new allocation grant, function correction,
or read-model correction is required for the allocation path itself. C5A adds
**no** allocation change.

---

## 9. Emission preconditions and the acceptance-required-order disposition

### 9.1 Server-side emission preconditions (exact, from the live body)

Native (`legado=FALSE`); `status_administrativo='rascunho'`; `fornecedor_id`
present; ≥1 item; every item `SUM(active alloc)=kg_pedido`; every allocation's
need matches the order's Pedido and the item's material/color identity; actor is
an authenticated admin (`is_admin()`); `FOR UPDATE` serialization; one
`administrativo/'emitida'` audit event; acceptance snapshot frozen from
`ordem_compra_config.exige_aceite`; deterministic repeat behaviour (a re-call on
an `emitida` order returns `estado_invalido`); full transaction atomicity (the
UPDATE + event + freeze commit or roll back together). **These preconditions are
enforced by the function body — the read-model readiness signal is advisory for
UI enablement only; `emitir_ordem_compra` remains the authoritative server gate.**
This contract authorizes **no** UI-computed substitute for that enforcement.

### 9.2 Acceptance-required-order disposition

**Disposition: `EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE`.**

Evidence: `emitir_ordem_compra` currently **permits** `exige_aceite=TRUE`
(it would set `status_aceite='pendente'`, `db/68:317-324`); the initial
`status_aceite` at emission is `'pendente'` (when `exige_aceite`) or
`'nao_aplicavel'` (otherwise); a `pendente` order is `emitida` but **receipt-blocked**
(`§R.8`/`§R.25.3`, enforced at `db/74:1057`/`db/70:685`); and **no RPC anywhere
in `db/01`…`db/76` transitions `status_aceite` from `pendente` to
`aceita`/`rejeitada`** (the only `status_aceite =` writes are at emission —
`db/68:324`, `db/66:126` — and the schema default `db/65:216`; grep-confirmed).
So an `exige_aceite=TRUE` order would be **permanently unreceivable** until
`PHASE-C5B` ships.

This disposition is **already server-enforced structurally**: `exige_aceite` is
`DEFAULT FALSE`, seeded FALSE, and has no client-writable path (§4.6), so every
client-reachable emission yields `nao_aplicavel`. C5A therefore restricts
emission readiness to the `exige_aceite=FALSE` regime and:

- the §5 read-model correction gates `pode_emitir`/`acoes.emitir=true` on
  `exige_aceite=FALSE` (defensive: if a future migration/`PHASE-C5B` ever enables
  `exige_aceite`, emission does not silently activate without the acceptance
  capability);
- C5A **must not** add any `exige_aceite` writer or any acceptance-decision
  capability — both belong to `PHASE-C5B`/config domain;
- the accepted C5 §21 binding-usability rule is preserved: orders with
  `exige_aceite=TRUE` are not lifecycle-complete until `PHASE-C5B`.

`PHASE-C5B-ACCEPTANCE-DECISION` remains `IDENTIFIED / NOT AUTHORIZED`; C5A does
not implement, design in detail, or fabricate any acceptance decision.

---

## 10. Proposed migration boundary (no files created this pass)

- **Proposed migration count: exactly one** (`db/77`; the exact filename is a
  future-implementation detail, proposed `db/77_ordem_compra_c5a_emission_readiness.sql`).
  The grant (§5.1) and the read-model correction (§5.2) are **interdependent**
  (grant-without-read-model = a permanently-disabled button; read-model-without-grant
  = an enabled button whose RPC is denied) and must activate atomically, so they
  are **not** split into two migrations.
- **Proposed purpose:** activate native emission readiness — grant
  `emitir_ordem_compra` to `authenticated`; route the existing
  `_distribuicao_completa_ordem` + `exige_aceite=FALSE` signal into
  `pode_emitir`/`acoes.emitir` and clear `bloqueio_emissao` for emission-ready
  native drafts.
- **Exact functions changed or granted:**
  - `GRANT EXECUTE ON FUNCTION public.emitir_ordem_compra(BIGINT) TO authenticated;`
    (preceded by the explicit `REVOKE ALL … FROM PUBLIC, anon, service_role` to
    keep the exact ACL model).
  - `CREATE OR REPLACE FUNCTION public.obter_ordem_compra_admin(BIGINT)` — readiness
    derivation only.
  - `CREATE OR REPLACE FUNCTION public.listar_ordens_compra_admin(UUID)` — same
    derivation.
- **Exact roles involved:** `authenticated` (the only EXECUTE grantee for
  `emitir_ordem_compra` and the read models).
- **Exact revocations preserved:** `PUBLIC`/`anon`/`service_role` EXECUTE on
  `emitir_ordem_compra` and the read models stays revoked; the legacy
  `alocar_necessidade_compra_fio`, `definir_item_ordem_compra`,
  `remover_item_ordem_compra`, `remover_alocacao_compra_fio` stay revoked;
  `_distribuicao_completa_ordem` stays granted to no client role.
- **Function bodies byte-equivalent?** `emitir_ordem_compra` and
  `definir_alocacao_necessidade_compra_fio`: **yes** (unchanged). The two read
  models: **no** (their `pode_emitir`/`acoes.emitir`/`bloqueio_emissao`
  computation changes; every other field byte-preserved).
- **Read models change?** Yes (the two above).
- **Tests require fixture updates?** Yes — any test asserting the current
  `pode_emitir=false`/`acoes.emitir=false`/`bloqueio_emissao='recebimento_nativo_ainda_inativo'`
  terminal state must be updated to the new ready-state semantics, plus new
  positive/negative ACL and readiness tests (§13).
- **Separate shared-environment validation pass required?** Yes — a distinct,
  separately authorized non-production apply + evidence pass (§14), mirroring the
  `PHASE-C3C-B-DB-PREREQ` precedent.

Two logically independent changes do **not** exist here (grant and read-model are
interdependent, above). This boundary bundles **no** `PHASE-C5B` acceptance-decision
function, **no** `REAL_CUTOVER` object, and **no** `PHASE-C5` UI code.

---

## 11. ACL requirements for the future C5A implementation

The future implementation contract must prove:

1. authorized positive path — an authenticated admin executes
   `emitir_ordem_compra` on a fully-distributed native `rascunho` and succeeds;
2. unauthorized authenticated denial — an authenticated non-admin is rejected
   `sem_permissao` by the internal gate even with the EXECUTE grant present;
3. anonymous denial — `anon` has no EXECUTE (PostgREST 401/permission-denied);
4. supplier denial — a supplier role has no EXECUTE and is not canonically
   authorized to emit;
5. service-role behaviour — `service_role` remains revoked (no EXECUTE);
6. `PUBLIC` has no EXECUTE;
7. grants match the intended actor model exactly — only `authenticated`;
8. the internal `is_admin()` check remains binding after the grant (grant ≠ admin
   authorization);
9. no grant broader than `authenticated` is introduced anywhere in the migration.

The absence of an EXECUTE grant must never be confused with the absence of
internal actor validation (both must be independently proven).

---

## 12. Emission preconditions the read model must respect (exact)

The corrected read model must set `pode_emitir=true` / `acoes.emitir=true` and
`bloqueio_emissao=NULL` **iff** all hold: native (`legado=FALSE`);
`status_administrativo='rascunho'`; `_distribuicao_completa_ordem(id)=TRUE` (≥1
item, every item fully allocated); and `ordem_compra_config.exige_aceite=FALSE`.
It must keep `bloqueio_emissao='distribuicao_necessidades_pendente'` for an
incomplete native draft, and must not report `pode_emitir=true` for
legado/`emitida`/`cancelada` orders. The read model invents **no** precondition
beyond `emitir_ordem_compra`'s own body + the acceptance regime; it is a UI-enablement
signal, never a substitute for the server gate (§9.1).

---

## 13. Closed future implementation manifest (C5A implementation, not this pass)

Minimum necessary, exact, no wildcards:

- **Migration:** exactly one — `db/77_ordem_compra_c5a_emission_readiness.sql`
  (§10). No other `db/*.sql` file changed.
- **Database integration tests:** `tests/ordem-compra-c5a-emission-readiness.integration.sql`
  (new) — terminal grant matrix; authorized positive emission; readiness signal
  transitions; wrong-state / incomplete-allocation / over-allocation denials;
  idempotent duplicate emission (`estado_invalido` on replay); transaction
  rollback on deterministic failure; audit-event assertion; acceptance-snapshot
  assertion; proof no acceptance decision is fabricated.
- **ACL / concurrency tests:** covered by the same integration file plus, if a
  Node concurrency harness is needed, `tests/ordem-compra-c5a-emission-concurrency.mjs`
  (new) — concurrent allocation + emission serialization.
- **Read-model fixture updates:** the existing smoke suite(s) asserting the
  current inert `pode_emitir`/`acoes.emitir` state must be updated to the new
  ready-state semantics (named exactly by the future order, matching this file).
- **Documentation:** this contract's status flip + proportional state/ledger/
  traceability updates at that phase's own closeout.

**Explicitly prohibited from change by any C5A implementation order:**
all `js/` product files; all UI tests; `js/router.js`; `js/boot.js`;
`js/screens/common.js`; `index.html`; the C4 receipt modules
(`js/screens/ordem-compra-receipt-*.js`); the Pedido distribution UI
(`js/screens/pedido-insumos-distribuicao.js`); supplier UI; OP UI; legacy receipt
surfaces; `PHASE-C5` UI implementation; `PHASE-C5B` acceptance-decision
implementation; `REAL_CUTOVER` activation; production configuration; the lifecycle
spec, schema contract, and visual contract (no normative rewrite).

---

## 14. Shared-environment evidence contract (after C5A implementation is authorized)

Required, at minimum, in the **explicitly authorized non-production** environment:

1. migration apply evidence in the authorized non-production environment;
2. terminal function-definition verification (`emitir_ordem_compra` body
   byte-unchanged; the two read models carry exactly the readiness derivation);
3. terminal grant-matrix verification (only `authenticated` on
   `emitir_ordem_compra` and the read models; `PUBLIC`/`anon`/`service_role`
   revoked; legacy allocation writers still revoked);
4. authenticated authorized allocation test (via
   `definir_alocacao_necessidade_compra_fio`);
5. authenticated authorized emission test;
6. unauthorized-role (authenticated non-admin) denial;
7. anonymous denial;
8. wrong-state denial (`estado_invalido` on non-`rascunho`);
9. incomplete-allocation denial (`alocacao_incompleta`);
10. over-allocation denial (`excede_saldo` at allocation);
11. idempotent duplicate allocation behaviour (`ordem_compra_distribuicao_comandos`
    replay);
12. idempotent duplicate emission behaviour (`estado_invalido` on replay);
13. concurrent allocation behaviour (advisory-lock serialization);
14. audit/history verification (one `administrativo/'emitida'` event);
15. acceptance initialization verification (`status_aceite='nao_aplicavel'` when
    `exige_aceite=FALSE`);
16. proof that no acceptance decision is fabricated (no `pendente→aceita/rejeitada`
    transition exists or is invoked);
17. transaction rollback on deterministic failure;
18. proof that production was not accessed;
19. proof that `REAL_CUTOVER` was not activated (cutover singleton unchanged;
    `legacy_active`/`flat` throughout).

---

## 15. Rollback contract (future C5A implementation)

- Revoke the newly granted `EXECUTE ON emitir_ordem_compra(BIGINT)` from
  `authenticated`, restoring the prior all-revoked ACL matrix byte-for-byte.
- `CREATE OR REPLACE` the two read models back to their `db/69` terminal bodies
  (restore `pode_emitir=false`/`acoes.emitir=false`/`bloqueio_emissao` two-way).
- Writer disablement is achieved by the grant revocation alone (bodies unchanged).
- **Already-created drafts:** unaffected (allocation path unchanged; drafts
  remain `rascunho`).
- **Already-emitted orders:** never reversed — a valid historical emission is not
  undone by rollback; `status_administrativo='emitida'` and its audit event are
  preserved.
- **Audit preservation:** no `ordem_compra_eventos` row is deleted or altered.
- No destructive deletion of any business record; no automatic reversal of valid
  historical emission.

---

## 16. Residual debts / open questions (recorded, not resolved here)

1. **`canonical_active` fence denial of native writes** (§7) — whether native
   draft/allocation/emission remain available after a real cutover, or are
   intentionally frozen, is a `REAL_CUTOVER` design question, not a C5A blocker.
2. **`PHASE-C5B-ACCEPTANCE-DECISION` gap** — the missing
   `pendente→aceita/rejeitada` transition RPC (§9.2); `IDENTIFIED / NOT
   AUTHORIZED`; C5A restricts emission to `exige_aceite=FALSE` and adds nothing
   here.
3. **`db/77` staging/non-production application** — a separate authorization
   beyond C5A implementation (mirrors the `PHASE-C3C-B-DB-PREREQ` "not applied to
   staging" boundary).

---

## 17. Boundary — what this contract does not do

No product file, test, script, migration, configuration, lifecycle spec, schema
contract, or visual-contract change; no database/Supabase/shared-environment
access; no migration application; no `GRANT`; no cutover/activation; no
`PHASE-C5` UI; no `PHASE-C5B` acceptance decision; no `REAL_CUTOVER`; no branch;
no push. The accepted `PHASE-C5` and `PHASE-C4` contracts are read-only
references and are not modified.

---

## 18. Hard stops

**Checked and not triggered by this documentation-only diagnosis pass:** baseline
matched the order's expected SHAs; protected residue untouched; the one premise
refinement found (§4.7) is a resolution of a question the accepted C5 contract
explicitly deferred to C5A, grounded in `§R.23.8`/`§R.23.9`, not a normative
contradiction — no silent normative change was made; no database access; no push.

**Recorded as HARD STOPs for any future C5A implementation order** (must stop and
report, not proceed past, unless separately resolved first):

1. unresolved actor ownership for `emitir_ordem_compra` (must remain
   AUTHENTICATED_ADMIN_ONLY, §6);
2. unresolved grant scope (broader than `authenticated`, §11);
3. terminal function-body ambiguity or schema drift — if the live
   `emitir_ordem_compra`/read-model bodies or ACL differ from §3/§4 at the
   implementation session's entry checkpoint, re-verify before writing SQL;
4. any need for a `PHASE-C5B` acceptance decision inside C5A;
5. any need for UI changes;
6. any need for `REAL_CUTOVER`, production access, or unrelated schema redesign;
7. unexpected Git divergence from the authorized baseline;
8. any broader-than-canonical ACL requirement;
9. inability to prove allocation completeness, transaction atomicity, or the
   authorized/unauthorized identity matrix.

---

## 19. Supervisor decisions required

1. **Accept, reject, or request changes** to this proposed `PHASE-C5A` material
   contract as a whole.
2. **Ratify the classification `READ_MODEL_FUNCTION_AND_GRANT_PREREQUISITE`** (§5)
   — specifically that the read-model correction of
   `obter_ordem_compra_admin`/`listar_ordens_compra_admin` is in C5A's scope
   (not deferred to `PHASE-C5` UI), and that the allocation path is
   `ALLOCATION_PATH_READY_AFTER_GRANT` via the already-granted
   `definir_alocacao_necessidade_compra_fio` (so `alocar_necessidade_compra_fio`
   is confirmed superseded and needs no grant).
3. **Ratify the acceptance-required-order disposition
   `EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE`** (§9.2) and the
   read-model `exige_aceite=FALSE` gate.
4. **Rule on the `canonical_active` fence/native-write open question** (§7, §16)
   — for `REAL_CUTOVER`, not for C5A; recorded so it is not lost.
5. Once accepted, issue a **separate, explicit `PHASE-C5A` implementation order**
   in a fresh session that re-reads the canonical repository first
   (`docs/governance/AGENT_INSTRUCTIONS.md` §2/§3; phases do not chain
   automatically) — implementation is **not** authorized by this contract's
   acceptance alone.

---

## 20. Canonical state this contract records (does not itself change ACTIVE_PHASE)

```text
LAST_ACCEPTED_PHASE = PHASE-C4
ACTIVE_PHASE = NONE
ACTIVE_PHASE_CONTRACT = NONE

PHASE-C5 CONTRACT = ACCEPTED / IMPLEMENTATION BLOCKED BY DATABASE PREREQUISITE
PHASE-C5 IMPLEMENTATION = NOT AUTHORIZED
OC-C5-EMISSION-001 = PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE

PHASE-C5A CONTRACT = PROPOSED / AWAITING SUPERVISOR REVIEW / IMPLEMENTATION NOT AUTHORIZED
PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED

REAL_CUTOVER = NOT AUTHORIZED
```

`NEXT_AUTHORIZABLE_ACTION`: supervisor review and acceptance/rejection of this
proposed `PHASE-C5A-DB-EMISSION-READINESS` material contract, plus the §19
decisions. This contract does not self-accept, does not authorize implementation,
and does not chain another order.

---

## 21. Documentation-closeout rules

Per `docs/governance/DOCUMENTATION_MODEL.md` §19, `READ_ONLY_RECONCILIATION`
mandates no canonical mutation beyond this new contract file. This pass
proportionally also updates: `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
`docs/DOCUMENTATION_INDEX.md`,
`docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
`docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, and
`docs/ledgers/G28_LEDGER.md` — the exact set the order's documentation manifest
pre-authorizes, and no other document. The governing specification, schema
contract, and visual contract are **not** modified; the accepted `PHASE-C5`
contract is **not** modified (its §5(b)/§21 premise is refined only within this
new file, §4.7). After authoring: `OC-C5-EMISSION-001` stays
`PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE`; no requirement becomes `SATISFIED`;
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` stay `NONE`; `PHASE-C5A` implementation
remains unauthorized.
