# Shared Repository Agent Instructions

This file is the active operational authority for every repository-capable
agent. Root `AGENTS.md` and `CLAUDE.md` are byte-identical harness entrypoints
that point here and own no rules or state.

## 1. Authority and sources of truth

- The architect alone decides, authorizes, validates product behavior, and
  accepts checkpoints.
- This file owns agent behavior, authorization boundaries, gates, evidence,
  escalation, Git safety, and proportional documentation rules.
- `docs/governance/current-state.json` owns only current operational continuity.
- `AGENT_HANDOFF.md` is a concise generated projection of current state and has
  no independent authority.
- Applicable plans and backlogs own sequence and dependencies.
- Applicable specifications and contracts own product and technical semantics.
- Git, code, migrations, and tests are primary technical evidence.
- Append-only ledgers own accepted historical and audit evidence.
- Catalogs, schemas, manifests, cutover evidence, generated indexes, and
  historical governance contracts are references outside the fixed bootstrap;
  they do not authorize work or override their applicable owner.
- Conversation, memory, rollout summaries, generated views, and tool caches are
  non-authoritative. Verify any material claim against repository or environment
  evidence before relying on it.

One fact has one owner. Secondary documents point to the owner and must not
become parallel current-state, classification, authorization, or product sources.

## 2. Fixed deterministic bootstrap

Normal continuation has exactly four fixed file inputs:

1. the one wrapper selected by the harness: `AGENTS.md` or `CLAUDE.md`;
2. `docs/governance/AGENT_INSTRUCTIONS.md`;
3. `docs/governance/current-state.json`;
4. `AGENT_HANDOFF.md`.

Before reading them, perform the live preflight in §3. Afterward, read only the
task-specific plan, specification, contract, traceability, rollback, or evidence
pointers required by current state or handoff. Those additions are task inputs,
not fixed bootstrap inputs.

Do not load complete ledgers, historical archives, catalogs, schemas, manifests,
generated roots, hash chains, or old governance contracts during normal
bootstrap. Retrieve bounded historical or audit evidence only when the task
requires it. Silent fallback to a shadow, candidate, generated, historical, or
private source is forbidden.

## 3. Live Git and environment preflight

Before deciding, validating, or mutating:

- verify the canonical workspace, repository identity, standalone Git directory,
  current branch, HEAD, index, worktree, all untracked paths, configured remotes,
  tracking ref, and ahead/behind divergence;
- compare them with the routing and protected-residue declarations in current
  state and the exact authorized baseline;
- identify any external environment by explicit project or environment identity
  before access;
- hard stop on unexplained residue, changed protected residue, ambiguous
  environment identity, or repository, branch, ref, ancestry, index, worktree,
  or remote mismatch.

Protected residue must not be opened, displayed, copied, modified, restored,
staged, committed, removed, cleaned, or reinterpreted. An order may explicitly
authorize non-disclosing byte-hash capture and equality checks.

## 4. Authorization and roles

- The architect issues explicit, bounded authorization per action and phase.
- A reviewer inspects evidence and drafts decisions or orders; the reviewer
  never holds state custody or converts an inference into repository fact.
- A resident executor acts only within the exact order, validates the result,
  and reports evidence without self-accepting it.
- Diagnosis, implementation, testing, local validation, staging validation,
  staging application, commit, push, deployment, activation, cutover, product
  acceptance, and documentary closeout are separate authorizations.
- Completion, acceptance, numbering, a backlog position, or a contract never
  authorizes the next phase automatically.
- A material phase requires an explicit contract and anchored requirements.
  Missing semantics, ownership, environment boundaries, or acceptance criteria
  require an architect decision, not executor inference.

An executor order must state the agent/model/effort and mode when material, the
objective, verified starting state, exact scope and allowed paths/actions,
prohibitions, hard stops, tests, acceptance evidence, and mandatory closeout.
Product implementation orders must also require structural-policy evidence
against `docs/architecture/CODE_HEALTH_RULES.md`.

## 5. Proportional documentation

The binding rule is:

**UPDATE EVERY AFFECTED CANONICAL OWNER; DO NOT TOUCH UNAFFECTED DOCUMENTS.**

- `READ_ONLY_RECONCILIATION`: report only; no canonical mutation.
- `INTERMEDIATE_IMPLEMENTATION`: update evidence only when operational state
  materially changes; do not manufacture acceptance or closeout.
- `MATERIAL_STATE_CHANGE`: update the affected state and historical owner.
- `PHASE_CLOSEOUT`: update every affected current, historical, traceability,
  plan, contract, and continuity owner.
- `NORMATIVE_CHANGE`: update the specification or contract that owns the changed
  semantics.
- `HANDOFF`: regenerate only the handoff unless another owned fact changed.
- `FORWARD_CORRECTION`: preserve prior evidence, append the correction where
  required, and update only affected current, normative, and traceability owners.

Ledgers are append-only. Never edit, delete, reorder, normalize, translate, or
replace accepted history. A correction is a new linked record. Plans change only
when plan-owned architecture, requirements, dependencies, or backlog changes.
Current state must not store living HEAD, index, worktree, or divergence facts;
those come from Git. Component-local state files must not duplicate the active
phase or next action.

Compaction, migration of authority, archival, deprecation, or deletion requires
separate authorization and reviewed information-survival and reference-survival
proof. Generated cardinality or hash parity alone is not semantic proof.

Canonical state documents and execution reports are written in English. Phase
IDs and immutable historical records retain their original identifiers and
language.

## 6. Git and publication safety

- Preserve all pre-existing residue exactly.
- Stage only authorized literal paths. Never use `git add .` or `git add -A`.
- Before commit, prove the staged manifest is the exact authorized changed
  subset and that the index contains no other path.
- Do not reset, restore, clean, stash, rebase, merge, amend, tag, force, or
  rewrite history without separate explicit authorization.
- Commit and publication are separate permissions. Do not infer push authority
  from permission to edit, test, stage, or commit.
- The normal review publication boundary is the explicitly authorized
  fast-forward update of `staging/dev`; `origin`, `main`, tags, additional refs,
  deployment, and production remain prohibited unless separately named.
- Immediately before an authorized push, reverify branch, local and remote refs,
  linear ancestry, exact divergence, empty index, exact commit manifest, and
  protected residue. A failed or ambiguous one-attempt publication is a hard
  stop unless the architect issues a new order.

## 7. Environment, migration, security, rollback, and cutover gates

- Database, Supabase, shared-development, staging, production, deployment,
  migration, ACL/RLS, Auth, rollback, activation, cutover, and PONR operations
  each require authorization naming the environment and permitted operation.
- A migration file in Git proves only that it is versioned. Applied and verified
  are separate per-environment states requiring direct evidence.
- Discovery of a required schema change stops the current phase unless that
  migration is already explicitly authorized.
- ACL/RLS and privileged Auth changes require explicit role and effective-access
  evidence, including negative cases; `auth.admin.*` or project Auth
  configuration is a separately classified risk.
- UI implementation requires an approved visual contract or mockup when
  applicable and explicit architect visual acceptance after executor validation.
- Cutover requires a named source and target authority, entry criteria,
  reconciliation, rollback or forward-recovery plan, lock/concurrency boundary,
  observability, and an explicitly identified PONR.
- Before PONR, rehearse and evidence rollback where required. After PONR, do not
  simulate rollback by rewriting accepted history; use an authorized
  forward-recovery action.
- Production access is prohibited unless an order explicitly names production,
  the environment identity, the exact operation, and the evidence and rollback
  boundaries.

## 8. Hard stops

Stop and report the exact blocker when:

- canonical owners contradict each other or a required owner/pointer is absent;
- a material rule or requirement has no surviving owner or unambiguous anchor;
- work needs a path, environment, or action outside the authorized scope;
- active CI or a central runner would break and its correction is out of scope;
- architecture or product semantics would change without an owning decision;
- accepted history or protected residue would need rewriting;
- repository, ref, branch, ancestry, index, worktree, remote, or environment
  identity differs from the authorized baseline;
- migration, ACL/RLS, Auth, rollback, cutover, PONR, or production semantics are
  incomplete;
- validation would require fabricated data, authority, acceptance, evidence, or
  provenance;
- a required tool or environment cannot be identified or queried safely.

## 9. Mandatory evidence and closeout

Report proportionally to risk:

- workspace, repository identity, branch, starting/final HEAD, index, worktree,
  untracked paths, remotes, and divergence;
- authorization, exact scope, exact changed and staged manifests, and preserved
  residue;
- governing pointers and requirement anchors;
- implementation artifacts, structural compliance, and tests with commands,
  exit codes, positive and negative evidence, and unresolved failures;
- local, shared-development, staging, deployment, activation, production, and
  product-acceptance states distinctly;
- affected owners updated, unaffected owners intentionally untouched, and
  append-only history preserved;
- commit/push evidence only when authorized and directly proved;
- final status, risks, deferred items, hard stops, and next authorizable action.

Never claim an execution, environment validation, publication, technical
acceptance, architect acceptance, or product behavior that was not directly
proved at that level.
