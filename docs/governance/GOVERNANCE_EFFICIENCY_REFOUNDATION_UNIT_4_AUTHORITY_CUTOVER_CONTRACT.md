# Governance Efficiency Refoundation — Unit 4 Authority Cutover Contract

CONTRACT_ID: GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4-BOOTSTRAP-AUTHORITY-CUTOVER-CONTRACT-R1

STATUS: CONTRACT DEFINED / AWAITING DIRECT SUPERVISOR REVIEW

UNIT 4A IMPLEMENTATION: NOT AUTHORIZED

DOCUMENTARY-AUTHORITY CUTOVER: NOT AUTHORIZED

UNIT 5: NOT AUTHORIZED

## 1. Purpose and non-goals

This contract defines the bounded sequence, authority model, compatibility
requirements, evidence, tests, point of no return, and forward-correction
rollback protocol for a future documentary-authority cutover.

This contract does not implement Unit 4A, create a canonical structured
current-state source, activate any authority marker, change repository-agent
bootstrap, change a root document to generated status, alter product semantics,
replace the canonical ledger, archive or delete any document, access any
database or environment, deploy, or authorize Unit 5.

## 2. Accepted prerequisites

| Unit | Accepted status | Accepted checkpoint |
|---|---|---|
| Unit 1 | CLOSED / ACCEPTED / DIRECTLY VERIFIED | `39abf42a7341b61fd4ac02a8e38d1e4f33471f0f` |
| Unit 2 | CLOSED / ACCEPTED / DIRECTLY VERIFIED | `f7106977f4613de1830bef46002dbf0a4b8b3cbe` |
| Unit 3 | CLOSED / ACCEPTED / DIRECTLY VERIFIED | `53899e30b72cde3d1f5759ea59fb0a4d632c974d` |

The accepted Unit 3 interval is
`e3c8c15b368d20161df6e593debbdf0c68cb7e41` through
`53899e30b72cde3d1f5759ea59fb0a4d632c974d`. These are external supervisor
rulings, not executor self-acceptance.

## 3. Before/after authority matrix

| Concern | Authority before cutover | Candidate/readiness artifact | Authority after an accepted cutover | Human or compatibility view |
|---|---|---|---|---|
| Current operational state | `PROJECT_STATE.md` | docs/governance/current-state.json | docs/governance/current-state.json | `PROJECT_STATE.md`, deterministically generated |
| Operational handoff | `AGENT_HANDOFF.md`, derived and manual | Candidate renderer output | Derived from structured state, governing pointers, and bounded ledger references | `AGENT_HANDOFF.md`, deterministically generated |
| Document classification and ownership | `docs/DOCUMENTATION_INDEX.md` | `docs/governance/catalog/documents.json` | `docs/governance/catalog/documents.json` | `docs/DOCUMENTATION_INDEX.md`, deterministically generated |
| Documentation-governance semantics | `docs/governance/DOCUMENTATION_MODEL.md` | None | Unchanged authored Markdown authority | Same authored document |
| Phase-C traceability | `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` | `docs/governance/traceability/purchase-order-phase-c.json` | `docs/governance/traceability/purchase-order-phase-c.json` | `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, deterministically generated |
| Product and technical semantics | Authored specifications and contracts | None | Unchanged authored Markdown authority | Same authored documents |
| Phase sequencing | Authored plans and phase contracts | None | Unchanged authored Markdown authority | Same authored documents |
| Historical ledger | `docs/ledgers/G28_LEDGER.md` | Accepted Unit 3 derived artifacts | `docs/ledgers/G28_LEDGER.md`, unchanged | Partitions, index, and compatibility view remain derived |

Candidate existence never changes authority. Every current owner in the
"before" column remains authoritative through Unit 4A and Unit 4B.

## 4. Canonical paths

The future structured current-state owner is
docs/governance/current-state.json. The accepted predecessor remains
`docs/governance/shadow/current-state.json`; it must not be promoted in place
under a misleading shadow path.

The future document catalog owner remains
`docs/governance/catalog/documents.json`. The future Phase-C traceability owner
remains `docs/governance/traceability/purchase-order-phase-c.json`. The
canonical ledger remains `docs/ledgers/G28_LEDGER.md`.

Root compatibility paths remain stable: `PROJECT_STATE.md`,
`AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`, and
`docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`.

## 5. Target schema transition

Target current-state schema version: `2.0.0`.

Version `1.0.0` remains valid only for the accepted shadow predecessor during
Unit 4A and Unit 4B dual-read validation. It cannot become canonical unchanged.
The target version must define:

- `mode`: `cutover_candidate` before activation and `canonical` only after the
  authorized activation transaction;
- `authority`: `non_canonical_until_supervisor_activation` before activation and
  `canonical_current_state` only after activation;
- a new `state_id` that does not retain the shadow-state identity;
- active-phase identity, contract, and status as separately validated fields;
- a controlled next-authorizable-action object with stable order ID, canonical
  wording, mode, risk class, and status;
- `authority_epoch` and an immutable `cutover_id`;
- an `activation` object with status, checkpoint, parent, and activation
  transaction identity;
- hashes for every generated root view;
- hashes or versions for every governing artifact followed at bootstrap;
- bounded recent-ledger references identifying exact entries and, when used,
  exact Unit 3 partitions;
- an optional applicable-baseline pointer with an explicit null form;
- the complete fact coverage in §9.

Compatibility rules:

1. A `1.0.0` shadow document is never accepted as canonical.
2. A `2.0.0` candidate with inactive activation is non-canonical.
3. Canonical authority requires `2.0.0`, `mode=canonical`,
   `authority=canonical_current_state`, an active marker, and exact checkpoint
   and generated-view hash parity.
4. Unknown major versions fail closed.
5. Missing, duplicate, or contradictory activation fields fail closed.
6. Readers must never silently fall back from an invalid canonical candidate to
   a shadow or generated Markdown view.

This contract defines the transition; it does not implement schema `2.0.0`.

## 6. Authority activation marker

The future schema must expose one machine-readable activation object. Before
Unit 4C it must be inactive. Unit 4C may activate it exactly once in the bounded
cutover commit. The marker must bind:

- authority epoch;
- cutover ID;
- cutover commit and required parent;
- source schema version;
- generated-view hashes;
- governing artifact hashes or versions;
- the accepted Unit 4 readiness checkpoint.

Neither a filename, renderer, candidate state, branch push, nor generated view
is an activation marker.

## 7. Bootstrap algorithm after cutover

After an accepted Unit 4C activation, every repository-capable agent must:

1. verify the real workspace, standalone Git directory, branch, HEAD, index,
   worktree, untracked files, and configured remotes;
2. read docs/governance/current-state.json;
3. validate it against the canonical current-state schema;
4. validate the active authority marker and checkpoint binding;
5. follow only the active phase contract and governing pointers declared by the
   structured state;
6. read an applicable structured baseline when the state declares one;
7. retrieve only recent ledger entries or Unit 3 partitions explicitly
   referenced by the state;
8. use generated human views only when readable context is useful;
9. stop on missing paths, schema failure, hash drift, ambiguous authority,
   stale generation, or source/generated divergence.

Normal bootstrap must not require the full `PROJECT_STATE.md`, full
`AGENT_HANDOFF.md`, full `docs/ledgers/G28_LEDGER.md`, full document catalog, or
historical archives.

## 8. Read-only consumer reconciliation

The following 31 relevant consumers and authority participants were classified.
An unresolved material consumer count of zero is required before this contract
can pass direct review.

| # | Consumer path | Current source read / assumption | Target after cutover | Required future change | Gate | Forward-correction behavior | Required evidence |
|---:|---|---|---|---|---|---|---|
| 1 | `AGENTS.md` | Entry wrapper; delegates to shared instructions | Same wrapper | No authority facts; retain pointer-only form | 4A/4C | Follows restored shared instructions | Byte parity with `CLAUDE.md`; bootstrap test |
| 2 | `CLAUDE.md` | Entry wrapper; delegates to shared instructions | Same wrapper | No authority facts; retain pointer-only form | 4A/4C | Follows restored shared instructions | Byte parity with `AGENTS.md`; bootstrap test |
| 3 | `docs/governance/AGENT_INSTRUCTIONS.md` | Directs bootstrap through `PROJECT_STATE.md` | Structured current state | Change bootstrap order only in 4C | 4C | Forward-correct pointer and bootstrap order | New-chat bootstrap and old-owner non-authority tests |
| 4 | `docs/governance/DOCUMENTATION_MODEL.md` | Declares Markdown state/index owners | Structured owners plus generated views | Normative ownership revision only in 4C | 4C | Forward-correct ownership clauses | Authority matrix and catalog parity |
| 5 | `docs/governance/SUPERVISION_PROTOCOL.md` | Onboarding reads handoff/state in full | Structured bootstrap, bounded pointers | Revise onboarding only in 4C | 4C | Forward-correct onboarding order | Clean-session continuity test |
| 6 | `PROJECT_STATE.md` | Sole manual current-state authority | Generated view of structured state | Implement deterministic renderer and generated marker | 4A/4C | Regenerate from restored owner after forward correction | Exact semantic parity and direct-edit rejection |
| 7 | `AGENT_HANDOFF.md` | Manual derived operational handoff | Generated bounded operational view | Render from state, governing pointers, and referenced ledger events | 4A/4C | Regenerate from restored owner set | Determinism, bounded-ledger, no-second-owner tests |
| 8 | `docs/DOCUMENTATION_INDEX.md` | Manual classification/authority owner | Generated catalog view | Render complete human index from structured catalog | 4A/4C | Regenerate from restored owner after forward correction | Catalog/view equivalence and direct-edit rejection |
| 9 | `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` | Manual Phase-C traceability owner | Generated structured-traceability view | Render exact normative pointers and dispositions | 4A/4C | Regenerate from restored owner after forward correction | Row/hash/evidence parity |
| 10 | `docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md` | Defines current phase and unit status | Authored normative phase contract | Record 4A–4D gates; never derive semantics | 4A–4D | Append forward-correction status | Contract/status consistency |
| 11 | `scripts/validate-spec-custody.mjs` | Entry to Markdown bootstrap custody checks | Structured bootstrap custody entry | Route canonical validation to the structured owner in 4C | 4A/4C | Versioned validation of restored authority | Positive/negative custody suite |
| 12 | `scripts/spec-custody/validation-core.mjs` | Parses `PROJECT_STATE.md` bootstrap block | Parses and validates structured state | Add schema, activation, pointer, and old-owner rejection checks | 4A/4C | Recognize explicit forward-correction epoch only | Missing/hash/ambiguity/fallback negatives |
| 13 | `scripts/spec-custody/self-tests.mjs` | Builds Markdown-state fixtures | Builds structured-state activation fixtures | Add candidate, cutover, drift, and rollback fixtures | 4A–4D | Exercise forward-correction epoch | Complete positive/negative matrix |
| 14 | `scripts/governance/build-current-state-source-manifest.mjs` | Inventories root state/handoff | Candidate source/equivalence evidence | Replace with bounded readiness/equivalence input builder | 4A | Preserve pre-cutover sources for forward correction | Full fact-coverage manifest |
| 15 | `scripts/governance/render-current-state-shadow.mjs` | Renders non-canonical shadow root views | Renders candidate then canonical root views | Add explicit mode and canonical generated markers | 4A/4C | Render restored-authority compatibility views | Deterministic double render |
| 16 | `scripts/governance/validate-current-state-shadow.mjs` | Validates shadow/state/root equivalence | Validates candidate and canonical modes | Add dual-read, activation, drift, and old-owner checks | 4A–4D | Validate forward-correction epoch | Worktree and immutable validation |
| 17 | `tests/governance-current-state-shadow.test.mjs` | Tests Unit 1 shadow behavior | Tests readiness and cutover lifecycle | Add 4A, 4C, 4D, and rollback fixtures | 4A–4D | Prove forward-correction recovery | Exact pass count and fixture inventory |
| 18 | `scripts/governance/build-document-source-manifest.mjs` | Inventories governed Markdown | Inventories generated root views plus authored normative docs | Preserve generated/manual classification transition | 4A/4C | Reclassify only under explicit epoch | Exhaustive path inventory |
| 19 | `scripts/governance/render-documentation-shadow.mjs` | Renders non-canonical index/traceability views | Renders root generated views | Add target-mode markers and root output transaction | 4A/4C | Render restored-owner views | Deterministic double render |
| 20 | `scripts/governance/validate-documentation-shadow.mjs` | Validates Markdown owners against shadow data | Validates structured owners and generated roots | Add dual-read, source-first transaction, and drift checks | 4A–4D | Accept restored authority only by explicit epoch | Catalog/traceability/source-generated negatives |
| 21 | `tests/governance-documentation-shadow.test.mjs` | Tests Unit 2 shadow behavior | Tests catalog/traceability authority lifecycle | Add candidate/cutover/rollback cases | 4A–4D | Prove restored-owner parity | Exact pass count and immutable test |
| 22 | `scripts/governance/git-content-reader.mjs` | Immutable/worktree content abstraction | Same abstraction | Include all new canonical paths without checkout mutation | 4A | Read prior and corrected epochs immutably | Before/after Git-state equality |
| 23 | `scripts/governance/build-g28-ledger-partitions.mjs` | Derives Unit 3 artifacts from canonical ledger | Same canonical ledger input | Preserve authority; expose bounded referenced-event lookup | 4A | Rebuild from unchanged canonical ledger | Reassembly and reference-survival proof |
| 24 | `scripts/governance/render-g28-ledger-shadow.mjs` | Renders full compatibility view | Same derived compatibility view | No authority promotion | 4A/4D | Rebuild from canonical ledger | Exact byte reassembly |
| 25 | `scripts/governance/validate-g28-ledger-shadow.mjs` | Validates Unit 3 derived artifacts | Same plus bounded state references | Validate referenced event/partition identity | 4A/4D | Validate corrected state references | Closed-partition identity and immutable run |
| 26 | `tests/governance-g28-ledger-shadow.test.mjs` | Tests Unit 3 losslessness | Same plus bounded-reference contract | Add stale/missing/ambiguous event-reference negatives | 4A/4D | Test corrected reference set | Exact pass count |
| 27 | `docs/governance/shadow/current-state.json` | Accepted non-canonical Unit 1 source | Historical predecessor only | Migrate meaning to new canonical path without semantic loss | 4A | Retain as evidence; never silently reactivate | Field-by-field equivalence |
| 28 | `docs/governance/catalog/documents.json` | Accepted non-canonical Unit 2 catalog | Canonical catalog after accepted cutover | Add activation/version ownership fields | 4A/4C | Versioned forward-correction authority | Full artifact and reference parity |
| 29 | `docs/governance/traceability/purchase-order-phase-c.json` | Accepted non-canonical Unit 2 traceability | Canonical traceability after accepted cutover | Add activation/version ownership fields | 4A/4C | Versioned forward-correction authority | Exact 13-row parity and source hashes |
| 30 | `docs/governance/ledger/g28-ledger-source-manifest.json` | Derived Unit 3 source identity | Same derived role | Bind bounded ledger references from structured state | 4A/4D | Regenerate from canonical ledger | Canonical object/hash/byte/line parity |
| 31 | `docs/governance/ledger/g28-ledger-partition-index.json` and partition family | Derived navigation and integrity artifacts | Same derived role | Resolve only state-declared recent events/partitions | 4A/4D | Regenerate from canonical ledger | Partition identity, reassembly, and survival proof |

UNRESOLVED MATERIAL CONSUMERS: 0

Repository reference search remains a mandatory Unit 4A preflight. Any newly
found material consumer that cannot be classified is a hard stop.

## 9. Current-state fact coverage

The target source must represent, without silent omission:

- repository identity, canonical workspace, standalone Git expectation, branch,
  and checkpoint remote;
- accepted product checkpoint;
- accepted governance Unit 1, Unit 2, Unit 3, and later Unit 4 checkpoints;
- active phase, active contract, status, and active track;
- exact next-authorizable action and risk/mode/status;
- governing specification, technical contract, sequence authority,
  traceability, ledger, handoff policy, and applicable baseline;
- allowed and forbidden environments;
- protected residue path and expected status, without storing file content;
- active blockers and debts with stable IDs, owner, blocking state, and status;
- actions and environments still prohibited;
- bounded recent-ledger event references;
- source/generated hashes, authority epoch, activation state, and schema version.

All retained `PROJECT_STATE.md` content in the accepted Unit 1 equivalence map
must receive one explicit disposition: structured field, authored normative
owner, append-only ledger/archive owner, generated-view content, or explicitly
deferred non-current material. No current fact may remain only in a manual root
view at readiness.

## 10. Generated-view ownership and protection

After cutover, root generated views own no independent facts. Each must carry an
explicit generated marker naming its structured source and renderer. Validators
must reject:

- direct manual root-view edits;
- source changes without regeneration;
- generated changes without source changes;
- mismatched source and generated hashes;
- non-deterministic renders;
- missing, duplicate, or misleading generated markers.

## 11. Update transaction

The post-cutover update workflow is source first:

1. verify Git and authority epoch;
2. update the structured owner;
3. validate schema and governing pointers;
4. render all affected generated views;
5. validate exact source/generated parity;
6. update an affected authored normative document only when semantics changed;
7. append the canonical ledger when the event matrix requires it;
8. validate the complete exact path manifest;
9. commit once under the separately authorized order.

A root generated view is never edited first or maintained manually.

## 12. Dual-read and equivalence period

Unit 4A must maintain existing Markdown owners as authoritative while creating
the candidate structured source and candidate renderers. Validators must compare
both representations and fail on missing facts, unequal values, mismatched
ownership, or unexplained retained content. Unit 4B directly reviews that
evidence. Dual-read is validation only; it is not silent fallback.

## 13. Readiness gates

Unit 4A is ready for Unit 4B only when:

- the target schema and candidate source validate;
- all current-state facts have explicit coverage;
- all 31 known consumers are implemented or proven unchanged;
- repository search finds no unresolved material consumer;
- all root candidate renders are deterministic and drift-protected;
- source-first update transactions are enforced;
- new-chat bootstrap succeeds without private memory or full-history reads;
- bounded ledger references resolve exactly;
- rollback-forward-correction prerequisites are preserved;
- all Unit 1, Unit 2, Unit 3, spec-custody, syntax, schema, immutable-read, and
  zero-Git-mutation gates pass.

Unit 4B is direct supervisor review only and performs no authority cutover.

## 14. PONR definition

The Unit 4 point of no return is the single fast-forward publication of the
authorized Unit 4C activation commit to `staging/dev`. Before that publication,
candidate files, local commits, and renderers do not change canonical authority.
After that publication, authority must not be restored by reset, force push,
history rewrite, branch replacement, or silent fallback; recovery is a separate
authorized forward correction.

## 15. Exact cutover preconditions

Unit 4C requires all of the following:

1. Unit 4A readiness implementation committed and directly reviewed;
2. Unit 4B accepted at one immutable readiness checkpoint;
3. explicit external supervisor authorization naming the exact parent, branch,
   remote, path manifest, activation marker, PONR, and publication command;
4. clean index and only explicitly preserved worktree residue;
5. local `dev` and `staging/dev` equal the authorized parent;
6. zero unresolved material consumers;
7. complete semantic equivalence and current-state coverage;
8. deterministic root renders and generated-drift protection;
9. clean new-chat bootstrap and rollback-readiness evidence;
10. exact rollback forward-correction package prepared but not activated.

Failure of any precondition is a hard stop.

## 16. Cutover execution boundaries

Unit 4C may, only under its separate order:

- activate the structured current-state authority;
- switch repository bootstrap consumers;
- change root human documents to generated status;
- activate structured document catalog and Phase-C traceability ownership;
- update affected authority maps and authored governance clauses;
- render root views;
- create one bounded linear activation commit;
- publish exactly once by fast-forward to `staging/dev`;
- stop for direct supervisor review.

It may not change product code, databases, migrations, environments,
deployments, production, the canonical ledger authority, authored product or
technical semantics, unrelated documents, or Unit 5 status.

## 17. Post-cutover validation

Unit 4D must validate the immutable Unit 4C checkpoint using only the new
bootstrap path. It must prove:

- schema, activation, epoch, checkpoint, and hash validity;
- continuity from a no-private-memory agent fixture;
- generated-view drift rejection;
- manual old owners no longer possess authority;
- no silent shadow or Markdown fallback;
- bounded recent-ledger retrieval;
- all governing pointers and applicable baseline resolve;
- immutable validators cause zero Git mutation;
- Unit 1–3 guarantees remain intact.

Only direct supervisor acceptance closes Unit 4D.

## 18. Rollback by forward correction

Rollback is a separate authorized forward correction. It must:

1. diagnose the defect without changing authority;
2. identify the accepted cutover checkpoint and defective facts;
3. prepare a new schema-valid authority epoch;
4. restore prior-owner authority only through explicit ownership fields and
   updated bootstrap consumers;
5. regenerate compatibility documents from the selected authority sources;
6. append a correction to the canonical ledger;
7. commit and publish one reviewable fast-forward correction;
8. receive direct supervisor review.

No automatic reset, force push, history rewrite, branch replacement, silent
fallback, or return to manually maintained generated documents is permitted.
Unit 4A must preserve sufficient source content and renderers to make this
forward correction possible.

## 19. Hard stops

Stop on:

- any contradiction between this contract and repository evidence;
- missing or ambiguous authority, schema, path, hash, or activation identity;
- a material consumer that cannot be classified;
- current-state information without a single explicit owner or disposition;
- source/generated divergence or non-deterministic rendering;
- an unbounded or unresolved ledger reference;
- a required file or action outside the separately authorized manifest;
- baseline, branch, remote, parent, index, worktree, or protected-residue drift;
- an attempt to change canonical ledger authority or authored normative
  semantics through a generated artifact;
- any requirement for database, environment, product, deployment, archive,
  deletion, compaction, or Unit 5 work.

## 20. Authorized path families for a future Unit 4A order

This section defines a ceiling for drafting the future order; it does not
authorize mutation now. A Unit 4A order may authorize only:

- current-state candidate source, schema, equivalence, and source manifest;
- catalog and Phase-C traceability structured sources and schemas;
- current-state, documentation, traceability, and ledger governance scripts;
- spec-custody bootstrap validation modules;
- governance tests for those modules;
- non-canonical candidate generated views;
- the active governance phase and Unit 4 contracts;
- proportional current state, handoff, documentation index, and append-only
  ledger evidence required by the authorized event.

The future order must enumerate literal paths. Product, database, migration,
deployment, environment, cleanup, archive, deprecation, deletion, and Unit 5
paths are excluded.

## 21. Required positive tests

- target schema validation;
- full current-state fact coverage;
- 31-consumer classification and implementation coverage;
- exact dual-read semantic equivalence;
- deterministic repeated render for every root view;
- source-first update transaction;
- candidate mode does not activate authority;
- activated mode resolves all governing pointers;
- no-private-memory bootstrap continuity;
- bounded recent-ledger lookup without full ledger read;
- Unit 1, Unit 2, Unit 3, and spec-custody suites;
- immutable commit validation with zero Git mutation;
- forward-correction readiness.

## 22. Required negative tests

- shadow `1.0.0` presented as canonical;
- candidate mode or inactive marker presented as canonical;
- unknown schema major version;
- missing, duplicate, mismatched, or stale activation fields;
- missing current-state fact or competing owner;
- missing, stale, ambiguous, or unbounded ledger reference;
- governing-artifact or generated-view hash drift;
- source change without render and render change without source;
- direct manual generated-root edit;
- non-deterministic render;
- old Markdown owner treated as authoritative after activation;
- silent fallback after canonical validation failure;
- new unclassified consumer;
- wrong workspace, branch, parent, remote, index, worktree, or residue;
- forward correction attempted through reset, force, or history rewrite.

## 23. Evidence packet

Each material Unit 4 gate must report:

- repository, workspace, gitdir, branch, starting/final HEAD, parent, remotes,
  index, worktree, untracked files, and protected residue path-only;
- exact authorization and changed-path manifest;
- schema version, authority epoch, activation state, and cutover ID;
- before/after authority matrix;
- consumer inventory count and unresolved count;
- current-state fact-coverage table;
- deterministic render and drift-protection results;
- positive and negative test counts;
- Unit 1, Unit 2, Unit 3, and spec-custody results;
- immutable validation and zero-Git-mutation proof;
- bounded ledger-reference evidence;
- PONR and publication result when applicable;
- rollback-forward-correction readiness;
- all prohibited actions confirmed absent.

## 24. Unit statuses

| Gate | Status after this contract-definition pass |
|---|---|
| Unit 4A — cutover readiness implementation | NOT AUTHORIZED |
| Unit 4B — readiness direct review | NOT AUTHORIZED |
| Unit 4C — authority cutover execution | NOT AUTHORIZED |
| Unit 4D — post-cutover acceptance | NOT AUTHORIZED |
| Documentary-authority cutover | NOT AUTHORIZED |

The next authorizable action is direct supervisor review of this contract.

## 25. Explicit Unit 5 exclusion

Unit 5 cannot start before Unit 4D is directly accepted. This contract does not
authorize cleanup, compaction, archival, deprecation, deletion, bootstrap-artifact
removal, compatibility-view removal, ledger replacement, or any other Unit 5
work.
