# Harness changelog

| Date | Change | Shared source updated | Reason |
|---|---|---|---|
| 2026-08-20 | Migrated Claude/Codex rules to `.harness/` | all rules/workflows | single source of truth |
| 2026-08-20 | Canonicalized role definitions and symmetric Skills | `roles/`, runtime adapters | eliminate Claude/Codex execution-design drift |
| 2026-08-20 | Made Root/Presentation/Domain/Data AGENTS the Context Harness | Root `AGENTS.md`, `context/*/AGENTS.md` | match both runtimes to one progressive-disclosure flow |
| 2026-08-21 | Reduced `README.md` to an overview and link index | `README.md`, this changelog | it had become a parallel rulebook competing with the shared Harness |
| 2026-08-21 | Defined promotion criteria, scope placement, and promotion authority | `evolution/learnings.md` | Evolution rules existed only in `README.md` and had no executor |
| 2026-08-21 | Added layer directory convention and `_workspace/{slug}` lifecycle | Root `AGENTS.md` | remove file-placement guessing and restore artifact reuse across re-runs |
| 2026-08-21 | Made implementer resume explicit for Claude, removed restated rules from Codex adapter | `.claude/skills/orderrun-development`, `.codex/skills/orderrun-development` | keep runtime adapters symmetric and invocation-only |
| 2026-08-21 | Moved shared Root authority under `.harness/`, unified mutation guard, clarified Lane A routing, reduced README to index | `root.md`, `rules/mutation-guard.md`, workflows/adapters/README | close Harness audit findings without provider drift |
| 2026-08-21 | Scoped mutation guard to the git-observable area, added digest-only snapshot comparison, symmetrized the Codex entry point, set the new-document language | `rules/mutation-guard.md`, `root.md`, `AGENTS.md`, `workflows/standard.md`, `validation/dry-run.md` | the guard claimed a `_workspace/` guarantee gitignore makes impossible |
| 2026-08-21 | Defined the closed Conventional Commit format, Korean summary policy, and allowed types | `rules/git.md`, `evolution/learnings.md` | remove ambiguity from human and AI commit messages |

## Migration coverage

| Existing Claude capability | Shared replacement |
|---|---|
| planner / feature-implementer / reviewer separation | `workflows/standard.md` roles |
| implementer-only source writes and planner/reviewer diff guard | `rules/mutation-guard.md`, `workflows/standard.md` |
| A/B lightweight routing and minimal reads | `workflows/lightweight.md`, `.harness/root.md` lane table |
| plan/impl/review short handoffs and retained implementer fixes | `workflows/standard.md` |
| typecheck/lint/build exit-code gate and unverified reporting | `rules/verification.md` |
| compiler, package, Architecture baseline | `.harness/root.md` |
| Presentation/Domain/Data rules | `context/*/AGENTS.md` |
| project convention change log | this changelog and `learnings.md` |

Lane C adds explicit treatment for cross-layer and high-risk work without
weakening the prior A/B behavior.
