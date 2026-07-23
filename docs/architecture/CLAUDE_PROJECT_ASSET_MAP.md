# PROJECT ASSET AND FILE MAP — CLAUDE / RAVATEX

> **Type:** asset inventory (components, entrypoints, contracts,
> `.claude` structure). **Not a source of current state, not an arbiter
> of documentation authority, and does not define HEAD, branch, next phase, or
> operational status.**
> **Documentation classification and canonical paths:** `docs/governance/catalog/documents.json`.
> **Governance model:** `docs/governance/DOCUMENTATION_MODEL.md`.
> **Current operational state:** `docs/governance/current-state.json`.
> **Repository-agent bootstrap:** `docs/governance/AGENT_INSTRUCTIONS.md`.
> `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, and `docs/DOCUMENTATION_INDEX.md`
> are optional generated compatibility views with no independent authority.
> **Branch, HEAD, working tree, staging, and divergence:** consult Git directly.
> **Record commit (historical, not canonical):** `bdb2fa3b05361c761d55506192483fe4d8be5034`
> (`G28-P0`, when the inventory was made). Do not treat it as the current state.
> **Original workspace (quarantine, read-only):** `D:\OneDrive\Programação\Ravatex\controle-tapetes`

This map records where the project's assets live, which ones are useful by
task type, and which assets need to be promoted from `.claude` to
versioned documentation. It exists so that any new worktree knows what
to read before acting — including when the `.claude` folder **does not exist**
in it (see §13). **Documentation-governance semantics belong to
`docs/governance/DOCUMENTATION_MODEL.md`; classification and canonical paths
belong to `docs/governance/catalog/documents.json`, not to this map.**

---

## 1. Document inventory by category

> **Documentation classification and canonical paths:** the structured owner is
> `docs/governance/catalog/documents.json`, and the governance model is
> `docs/governance/DOCUMENTATION_MODEL.md`. The table below is a
> **location and category inventory**, not a precedence list
> nor a source of current state.

§1 is the document **inventory** — it is **not** a mandatory full
reading order before every task, and it is **not** an arbiter of
authority:

- the **initial gate** is to validate Git, read and validate
  `docs/governance/current-state.json`, follow its governing pointers, and read
  the applicable plan or contract;
- §11 defines the specific readings by task type;
- the remaining references are read when they affect the task's scope.

| Document | Category / location |
|---|---|
| `PROJECT_STATE.md` (root) | Optional generated compatibility view of `docs/governance/current-state.json`; no independent authority. |
| `AGENT_HANDOFF.md` (root) | Optional generated compatibility handoff sourced from canonical structured state; no independent authority. |
| `services/documents-ingestor/PROJECT_STATE.md` | Technical context of the Documents Ingestor service. |
| `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md` | **Master plan** for the documentation front (Camadas 0–4, sequence, backlog, phase matrix, hard stops). |
| `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` | Persistent plan Pedido ↔ OP ↔ Movimentação ↔ Documentos. |
| `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` | Technical schema contract for Pedido/OP/documents. |
| `docs/architecture/CODE_HEALTH_RULES.md` | 18 binding architectural health rules. |
| `docs/architecture/PORTAL_B2B_ARCHITECTURE_RULES.md` | Cliente / Admin / Fornecedor separation; operational vs. visual status. |
| `docs/architecture/DOCUMENTS_INGESTOR_CONSUMER_DESIGN.md` | Contract for the Controle's reader over the Ingestor. |
| `docs/architecture/CLAUDE_PROJECT_ASSET_MAP.md` | **This map** — asset inventory; not documentation authority. |
| `docs/architecture/UI_VISUAL_CONTRACT.md` | **Versioned visual contract** (consolidation of the `.claude/design-skill` skill). |
| `docs/DOCUMENTATION_INDEX.md` | Generated compatibility view of `docs/governance/catalog/documents.json`; no independent authority. |
| `docs/governance/catalog/documents.json` | Canonical documentation-classification and canonical-path owner. |
| `docs/governance/current-state.json` | Canonical current operational-state owner. |
| `docs/governance/AGENT_INSTRUCTIONS.md` | Canonical repository-agent bootstrap instructions. |
| `docs/governance/DOCUMENTATION_MODEL.md` | **Documentation governance model.** |

## 2. Persistent plans

| Plan | Front | Update rule |
|---|---|---|
| `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md` | Documents, validation, links, evolution | Update the phase matrix after each technical acceptance. |
| `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` | Pedido/OP/Movimentação/Documentos | Permanent obligation §6: consult before, update on close. |
| `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` | Pedido's production flow + Admin backlog | Mandatory reading before implementation in the production flow. |
| `docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md` | Refactor phase history | Chronological ledger. |

## 3. State files

| File | Scope | Format |
|---|---|---|
| `PROJECT_STATE.md` (root) | Controle de Tapetes monorepo | Deterministic generated compatibility view; no independent state ownership. |
| `services/documents-ingestor/PROJECT_STATE.md` | Documents Ingestor service | Reverse-chronological log. |

## 4. Handoff files

| File | Scope |
|---|---|
| `AGENT_HANDOFF.md` (root) | Deterministic generated compatibility handoff sourced from canonical structured state. |

## 5. Inventory of the `.claude` folder

`.claude` is **partially tracked**: `.claude/launch.json` **is a tracked file**
(committed under `GOVERNANCE-SPEC-CUSTODY`/`Add local preview launch config`); the
rest of `.claude` is untracked (not versioned, not ignored). In the current
`controle-tapetes-g28` worktree, `.claude/` **exists on disk** and contains
exactly `launch.json` (tracked) and `settings.local.json` (untracked, machine
permissions, no secrets) — the design-skill/tokens/preview material below lives
only in the original quarantined workspace and is **absent from this worktree**
(confirm with `git ls-files .claude` and a disk listing). None of the files below
contain credentials, authentication tokens, keys, or secrets — the files called
`tokens/` are **CSS design tokens** (colors/layout/typography), not secrets.

| Path (`.claude/…`) | Tracked | Purpose | Type | Permanent rule? | Local path? | Usable in a new worktree? | Action |
|---|---|---|---|---|---|---|---|
| `design-skill/SKILL.md` | untracked | `inttex-ui` visual skill (generates screens in the Ravatex style) | skill / visual instruction | Yes (UI rules) | No | No (only exists in the original) | `KEEP_AS_SKILL` (file) + `PROMOTE_RULES_TO_VERSIONED_DOC` (permanent rules → `UI_VISUAL_CONTRACT.md`) |
| `design-skill/README.md` | untracked | Complete visual guide (foundations, cockpit layout, components, golden rule for tables) | visual reference / instruction | Yes | No | No | `KEEP_AS_SKILL` (file) + `PROMOTE_RULES_TO_VERSIONED_DOC` (rules consolidated in `UI_VISUAL_CONTRACT.md`) |
| `design-skill/styles.css` | untracked | Entry CSS that imports Inter + tokens | visual reference | Partial | No | No | REFERENCE_ONLY (versioned equivalent: `css/tokens.css`) |
| `design-skill/tokens/colors.css` | untracked | Skill's color design tokens | visual reference | Partial | No | No | REFERENCE_ONLY → versioned canonical `css/tokens.css` (`--rv-*`) |
| `design-skill/tokens/layout.css` | untracked | Layout design tokens | visual reference | Partial | No | No | REFERENCE_ONLY |
| `design-skill/tokens/typography.css` | untracked | Typography design tokens | visual reference | Partial | No | No | REFERENCE_ONLY |
| `design-skill/tailwind-preset.js` | untracked | Tailwind preset that maps tokens → classes | visual reference / config | Partial | No | No | REFERENCE_ONLY |
| `design-skill/example.html` | untracked | Screen example | example | No | No | No | REFERENCE_ONLY |
| `design-skill/OP Acabamento - Aberta (standalone).html` | untracked | Standalone mock of OP Acabamento | example / visual reference | No | No | No | REFERENCE_ONLY |
| `design-skill/OP Tecelagem - Em produção - Compacto (standalone).html` | untracked | Standalone mock of OP Tecelagem | example / visual reference | No | No | No | REFERENCE_ONLY |
| `tokens/colors.css` | untracked | Color design tokens (`.claude` root) | visual reference | Partial | No | No | REFERENCE_ONLY (duplicates `design-skill/tokens`) |
| `tokens/layout.css` | untracked | Layout design tokens | visual reference | Partial | No | No | REFERENCE_ONLY |
| `tokens/typography.css` | untracked | Typography design tokens | visual reference | Partial | No | No | REFERENCE_ONLY |
| `preview/*.html` | untracked | Real render harness (tecelagem/acabamento/op-aberta) | example / verification | No | No | No | KEEP_LOCAL (visual verification harness) |
| `preview/screenshots/*.png` | untracked | Visual evidence of the pilots | visual reference | No | No | No | KEEP_LOCAL |
| `launch.json` | **tracked** | Local preview config (`python -m http.server 8765`) | local configuration | No | Yes (local runtime) | Yes (present in this worktree) | TRACKED — authority NONE (tooling pointer; classification is owned by `docs/governance/catalog/documents.json`) |
| `settings.local.json` | untracked | Machine permission allowlist (no secrets) | local configuration / machine-specific | No | Yes (local path) | No | KEEP_LOCAL |

> No sensitive content was found; therefore no row is marked as
> `SENSITIVE — CONTENT NOT COPIED`. If, in a future review, `.claude` comes to
> contain secrets, those files must be marked accordingly and **not copied**.

## 6. Visual skills

- **Operational source:** `.claude/design-skill/` (skill `inttex-ui`, `user-invocable`).
- **Permanent rules promoted to:** `docs/architecture/UI_VISUAL_CONTRACT.md`.
- **Versioned canonical tokens:** `css/tokens.css` (`--rv-*` prefix).
- **Real reference pilots:** `js/screens/op-latex-admin.js`,
  `js/screens/op-tecelagem-producao-admin.js`.
- **Verification harness:** `.claude/preview/*.html` (local, not versioned).

Rule: the skill can **teach** how to apply the pattern, but the versioned
visual contract prevails. A skill cannot contradict the architecture.

## 7. Entrypoints of the Documentos section

| File | Role |
|---|---|
| `js/screens/documentos-recebidos.js` | Central screen for Documentos recebidos. |
| `js/documents-ingestor.js` | Core frontend integration with the Ingestor. |
| `js/documents-ingestor-loader.js` / `js/documents-ingestor-auto-load.js` | Loading/boot of the integration. |
| `js/documents-ingestor-import-received.js` / `js/documents-ingestor-import-ui.js` | Import of received documents + UI. |
| `js/documents-scan-trigger.js` | Triggering of the scan RPC (request queue). |
| `js/documents-supabase-reader.js` | Reader for `document_candidates`/events in Supabase. |
| `js/documents-supabase-decisions.js` | Decisions (accept/reject/undo) on documents. |

## 8. Entrypoints of Pedido

| File | Role |
|---|---|
| `js/screens/pedidos-list.js` | Admin list of pedidos. |
| `js/screens/pedido-detail.js` (+ `pedido-detail-data/events/progress/render.js`) | Admin detail of the pedido (central documents index). |
| `js/screens/pedido-form.js` / `pedido-edit.js` / `pedido-itens-edit.js` | Creation/editing of pedido and items. |
| `js/screens/pedido-parciais-admin.js` / `pedido-tracking-admin.js` / `pedido-chain-state.js` | Partials, tracking, and chain state. |
| `js/screens/cliente-pedido-detail.js` / `cliente-pedido-form.js` / `cliente-pedido-tracking.js` / `cliente-pedidos-list.js` | Client Portal surfaces (public read model). |

## 9. Entrypoints of OP

| File | Role |
|---|---|
| `js/screens/op-latex-admin.js` | Látex/acabamento OP (visual pilot). |
| `js/screens/op-tecelagem-producao-admin.js` | Tecelagem OP in production (visual pilot). |
| `js/screens/op-nova.js` / `op-form-helpers.js` | Creation of OP (requires Pedido — guard). |
| `js/screens/op-persistir.js` / `op-writes.js` / `op-recalculo.js` | Persistence, writing, and recalculation of the OP. |
| `js/screens/op-pdf.js` | PDF generation for the OP. |

## 10. Supabase contracts / existing documents

**Snapshot of G28-P0 — not a permanent operational source.** The state of the
migrations below is a snapshot of the moment of recording:

- the current state must be confirmed in `docs/governance/current-state.json`, in the application
  evidence, and in the target environment;
- "Applied" here means "reported applied in the G28-P0 snapshot," not a
  permanent guarantee;
- **never** run or skip a migration based solely on this map.

| Artifact | Role | State (G28-P0 snapshot) |
|---|---|---|
| `db/38_documentos_schema.sql` | Base document schema | Applied |
| `db/39_documentos_ingestor_state_undo.sql` | Ingestor state + decision undo | Applied |
| `db/40_document_scan_runs_stale_recovery.sql` | Recovery of stuck scan runs | Applied |
| `db/41_document_scan_requests_queue.sql` | Scan request queue | **Versioned, NOT applied** |
| `db/42_email_received_timestamp.sql` / `db/43_document_sender_email.sql` | Received email metadata | Applied |
| `db/47_document_candidate_cnpj.sql` / `db/48_document_candidate_cnpj_projection.sql` | CNPJ in `document_candidates` + projection | Applied |
| `services/documents-ingestor/docs/CONTROL_TAPETES_DOCUMENTS_CONTRACT.md` | Ingestor ↔ Controle contract | Canonical |
| `services/documents-ingestor/contracts/document-event.schema.json` | Document event schema | Canonical |
| `services/documents-ingestor/contracts/manifest.schema.json` | Manifest schema | Canonical |
| `docs/architecture/DOCUMENTS_INGESTOR_CONSUMER_DESIGN.md` | Design of the Controle's consumer/reader | Canonical |

> `db/49` **does not exist** in the versioned tree. The architecture proposed in G28-A
> (including `db/49`, `qualified` as the final state, `duplicate` as the
> primary state, and the qualification matrix) is
> `REJECTED AS CONTRACT / RETAINED AS DIAGNOSTIC INPUT` — it is **not** the current
> architecture; its evidence remains as diagnostic input.

## 11. Mandatory files by task type

| Task type | Mandatory reading before |
|---|---|
| Any phase | Validate Git + `docs/governance/AGENT_INSTRUCTIONS.md` + validated `docs/governance/current-state.json` + its applicable governing pointers |
| Documentos front | Master plan + `PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` + `DOCUMENTS_INGESTOR_CONSUMER_DESIGN.md` + `services/documents-ingestor/PROJECT_STATE.md` |
| Schema / migration | `PEDIDO_OP_SCHEMA_CONTRACT.md` + `CODE_HEALTH_RULES.md` + §10 contracts |
| UI / modal / table / card | `UI_VISUAL_CONTRACT.md` + `css/tokens.css` + skill `.claude/design-skill` (when present) + §9 pilots |
| Pedido / OP | `PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` + `PEDIDO_PRODUCTION_FLOW_BACKLOG.md` + §8/§9 entrypoints |
| Client Portal / Fornecedor | `PORTAL_B2B_ARCHITECTURE_RULES.md` + `docs/ui/CLIENTE_PORTAL_UI_*` |

## 12. Functional use of sources (guidance, not authority)

> **Classification and canonical paths:** `docs/governance/catalog/documents.json`
> is the structured owner; `docs/governance/DOCUMENTATION_MODEL.md` §11
> defines which document to update per phase event. The text below is
> **usage guidance** (what type of question each document helps
> resolve), not a competing precedence list.

Each document resolves one type of question. In case of divergence, use the
document whose **scope** matches the question — not its position in a list:

- **current explicit decision from the IAlead/architect** — resolves reserved decisions and supersession;
- **domain architectural contract** — resolves invariants and semantics;
- **`docs/governance/current-state.json`** — owns phase, publication, environment, and current operational state;
- **applicable persistent plan** — resolves sequence, dependencies, and backlog;
- **task-specific contract** (UI, schema, integration, other technical domain) — resolves the corresponding technical domain;
- **`AGENT_HANDOFF.md`** — optional generated compatibility handoff sourced from canonical structured state; no independent authority;
- **skill** — guides execution, without altering the contract;
- **agent preference** — does not create a rule.

> **In a real conflict, stop and escalate.** Do not silently choose a source
> just by its position in a list. A skill cannot contradict the architecture.

## 13. Risk: a clean worktree may not contain the full `.claude`

Only `.claude/launch.json` is tracked; the rest of `.claude` is untracked and
physical per directory. The `controle-tapetes-g28` worktree **does contain
`.claude/`**, but only with the tracked `launch.json` and an untracked
`settings.local.json` — the design-skill/tokens/preview material is **absent**
(verified: `git ls-files .claude` = `.claude/launch.json`; disk listing shows
`launch.json` + `settings.local.json`; the untracked skill/token/preview files
are not in `.gitignore` and exist only in the original workspace). Consequences:

- skills and tokens from `.claude` are **not** automatically available in
  new worktrees;
- permanent product/UI rules that live only in `.claude` become invisible;
- therefore, every permanent rule **must** also exist in versioned
  documentation (§15). This is the reason for promoting the visual skill to
  `UI_VISUAL_CONTRACT.md` and for fixing the tokens in `css/tokens.css`.

## 14. Items that must remain local

- `.claude/settings.local.json` (machine permissions, no secrets);
- `.claude/preview/*.html` and `.claude/preview/screenshots/*.png` (verification harness/evidence);
- the standalone mocks and `example.html` (supporting reference).

> Previews, screenshots, and mocks remain `KEEP_LOCAL` / `REFERENCE_ONLY`.
> Only an artifact **formally designated** as
> `CANONICAL_VISUAL_ACCEPTANCE_REFERENCE` may later be promoted to versioned
> documentation.

## 15. Items that must become versioned documentation

- **Permanent visual rules** from `.claude/design-skill/SKILL.md` and `README.md`
  → `docs/architecture/UI_VISUAL_CONTRACT.md` (done in this phase).
- **Visual tokens** → already versioned in `css/tokens.css` (`--rv-*`); the
  `.claude` tokens remain as reference.
- Any new permanent product/UI rule discovered in `.claude` must be
  promoted before it can support an implementation phase.

---

> **This map is an asset location inventory; it is not an arbiter of
> > documentation authority.** Classification and canonical-path ownership belong
> > to `docs/governance/catalog/documents.json`. This map must be consulted at the
> > start of each phase and updated when entrypoints, contracts, or the
> > `.claude` structure change.
