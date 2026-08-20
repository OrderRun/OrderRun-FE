# Harness changelog

| Date | Change | Shared source updated | Reason |
|---|---|---|---|
| 2026-08-20 | Migrated Claude/Codex rules to `.harness/` | all rules/workflows | single source of truth |
| 2026-08-20 | Canonicalized role definitions and symmetric Skills | `roles/`, runtime adapters | eliminate Claude/Codex execution-design drift |
| 2026-08-20 | Made Root/Presentation/Domain/Data AGENTS the Context Harness | Root `AGENTS.md`, `context/*/AGENTS.md` | match both runtimes to one progressive-disclosure flow |

## Migration coverage

| Existing Claude capability | Shared replacement |
|---|---|
| planner / feature-implementer / reviewer separation | `workflows/standard.md` roles |
| implementer-only source writes and planner/reviewer diff guard | `workflows/standard.md` |
| A/B lightweight routing and minimal reads | `README.md`, `workflows/lightweight.md` |
| plan/impl/review short handoffs and retained implementer fixes | `workflows/standard.md` |
| typecheck/lint/build exit-code gate and unverified reporting | `rules/verification.md` |
| compiler, package, Architecture baseline | Root `AGENTS.md` |
| Presentation/Domain/Data rules | `context/*/AGENTS.md` |
| project convention change log | this changelog and `learnings.md` |

Lane C adds explicit treatment for cross-layer and high-risk work without
weakening the prior A/B behavior.
