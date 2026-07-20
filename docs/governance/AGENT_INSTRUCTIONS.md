# Shared Repository Agent Instructions

This tracked file is the single repository-native instruction source for Claude
Code, Codex, and equivalent repository-capable agents. Root `CLAUDE.md` and
`AGENTS.md` are byte-identical harness entrypoints that direct agents here. They
have no independent authority.

## 1. Sources of truth

Repository files and Git are the only operational sources of truth.

- Git owns commits, diffs, branch, HEAD, index, worktree, untracked files, and
  remotes.
- `docs/DOCUMENTATION_INDEX.md` owns documentation classification and canonical
  paths.
- `docs/governance/DOCUMENTATION_MODEL.md` owns documentation responsibility and
  update rules.
- `docs/governance/SUPERVISION_PROTOCOL.md` owns roles, authorization format, and
  gates.
- `PROJECT_STATE.md` owns current operational state.
- Applicable plans and backlogs own sequence and dependencies.
- Applicable specifications and contracts own product and technical semantics.
- The applicable append-only ledger owns accepted historical evidence.
- `AGENT_HANDOFF.md` is a derived operational handoff, never a second state owner.

Conversation, private memory, rollout summaries, agent auto-memory, and local
tool caches are non-authoritative. They may help locate evidence but cannot
establish repository state, authorization, product semantics, or acceptance.

If material information exists only in a private cache or conversation, verify it
against repository evidence and promote it into the correct canonical owner in an
explicitly authorized change. Never silently treat private context as canon.

## 2. Deterministic bootstrap — “continue the project”

Before deciding, validating, or implementing:

1. Verify the workspace, standalone Git directory, branch, HEAD, index,
   worktree, untracked files, and configured remotes.
2. Read the `SPEC_CUSTODY_BOOTSTRAP` block in `PROJECT_STATE.md`.
3. Follow every path in that block: governing specification, technical
   contract, sequence authority, active-track traceability, ledger, and handoff.
4. Read `docs/DOCUMENTATION_INDEX.md`,
   `docs/governance/DOCUMENTATION_MODEL.md`, and
   `docs/governance/SUPERVISION_PROTOCOL.md` when authority, status, or update
   responsibility is relevant.
5. Confirm the active phase and authorization boundary from repository files.
   A backlog position or phase number never authorizes execution.
6. Read the current governing clauses before reviewing or implementing any
   requirement. Do not validate a report against memory or a copied summary.
7. Stop if the bootstrap paths are missing, contradictory, or cannot identify a
   single current-state owner.

## 3. Authorization and architecture

- The architect is the final decision-maker. Every phase requires explicit,
  bounded authorization.
- Phases do not chain automatically. Completion, acceptance, or numbering never
  authorizes the next phase.
- Do not create architecture by inference. Missing semantics, ownership,
  acceptance criteria, environment boundaries, or requirement anchors require a
  hard stop and an architect decision.
- Plans define sequence; specifications define product behavior; contracts define
  technical behavior. An implementation order cannot silently revise them.
- Preserve the distinction between diagnosis, implementation, verification,
  local technical acceptance, staging validation, staging application,
  deployment, activation, cutover, product acceptance, and documentary closeout.
  Evidence for one state never implies another.

## 4. Proportional documentation updates

Apply `docs/governance/DOCUMENTATION_MODEL.md` exactly. The governing rule is:

**UPDATE EVERY AFFECTED CANONICAL DOCUMENT — DO NOT TOUCH UNAFFECTED DOCUMENTS.**

- `READ_ONLY_RECONCILIATION`: no canonical mutation.
- `INTERMEDIATE_IMPLEMENTATION`: update evidence only when operational state
  materially changes; do not manufacture acceptance or closeout state.
- `MATERIAL_STATE_CHANGE`: update the affected state and ledger owners.
- `PHASE_CLOSEOUT`: update state, ledger, active traceability, the handoff when
  continuity changes, and every other affected canonical owner.
- `NORMATIVE_CHANGE`: update the specification or contract that owns the changed
  semantics.
- `HANDOFF`: update only the derived handoff unless another fact independently
  changed.
- `FORWARD_CORRECTION`: append the ledger correction and update only affected
  current-state, normative, and traceability owners. Never rewrite history.

The ledger is append-only. Corrections are new entries referencing the prior
record. Never edit, delete, reorder, or normalize an accepted historical entry.

## 5. Git and environment safety

- Preserve pre-existing worktree residue and report it explicitly.
- Stage only authorized literal paths. Never use `git add .` or `git add -A`.
- Do not reset, restore, clean, stash, rebase, amend, merge, tag, push, access a
  remote environment, or change production without explicit authorization.
- Database, Supabase, staging, production, deployment, activation, and cutover are
  separate authorizations.
- Stop when the real repository, branch, HEAD, environment, or allowed manifest
  differs materially from the authorized baseline.

## 6. Hard stops

Stop and report a precise blocker when:

- canonical owners contradict each other;
- a requirement lacks an unambiguous normative anchor;
- work requires a path or action outside the authorized scope;
- implementation would change architecture not authorized by the governing spec;
- accepted history would need rewriting;
- an environment cannot be identified safely;
- validation requires fabricated data, authority, evidence, or provenance;
- a material private-memory claim cannot be verified in repository evidence;
- a phase contract is missing for material work;
- an active requirement has no disposition or has multiple competing owners.

## 7. Mandatory implementation evidence

An implementation report must provide, proportionally to risk:

- workspace, branch, starting and final HEAD, index, worktree, untracked files,
  and remotes;
- authorization, exact scope, exact manifest, and preserved residue;
- governing requirement IDs and normative anchors;
- implementation artifacts and structural-policy compliance;
- tests, positive and negative evidence, and unresolved failures or debts;
- environment distinction: local, staging, deployment, activation, production,
  and product acceptance;
- documentation owners updated and unaffected owners intentionally untouched;
- append-only ledger confirmation when applicable;
- final status, remaining unauthorized actions, and next authorizable action.

Never claim execution, verification, bootstrap compatibility, environment access,
or acceptance that was not directly proved. If a required tool is unavailable,
report it as unavailable instead of inferring success.
