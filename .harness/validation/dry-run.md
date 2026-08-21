# Harness dry-run matrix

| Scenario | Documents loaded after `.harness/root.md` | Roles / lane | Verification |
|---|---|---|---|
| Presentation-only edit | Presentation `AGENTS.md` | A if narrow; otherwise B | shared gate + relevant UI criteria |
| Data-only edit | Data `AGENTS.md` | B | shared gate + DTO/map boundary review |
| Domain-only edit | Domain `AGENTS.md` | B | shared gate + pure-rule boundary review |
| Data → Presentation | Data + Presentation `AGENTS.md` | B | shared gate + producer/consumer review |
| Multi-layer/high-risk | every affected Context `AGENTS.md` | C | gate + enhanced boundary/risk check |
| Reviewer finds issue | selected docs already in plan | retained implementer → reviewer | rerun full gate; max 3 rounds |
| Missing API contract | Data `AGENTS.md` | planner stops before implementer | no PASS; request contract |
| Type/lint/build failure | verification rule | implementer fix → reviewer | failing exit is FIX_REQUIRED |
| Candidate learning | root, narrow affected rule | normal lane as applicable | record then promote only by criteria |
| Lane A Context routing | target file + one affected Context | orchestrator → implementer → reviewer | no Planner; same selection reaches both roles |
| Pre-existing dirty/staged tree | full before/after guard snapshot | any Planner/Reviewer call | unchanged baseline is allowed; added delta fails |
| Role artifact write | workflow artifact rule only | matching role | `_workspace/` is gitignored and outside guard scope |
| Harness/Adapter mutation | full repository guard snapshot | Planner/Reviewer stage | stage invalid even when `src` is unchanged |

This validates routing and role/gate behavior only; it does not create application
features or claim runtime coverage.

## Runtime parity check

| Contract point | Claude Adapter | Codex Adapter | Canonical source |
|---|---|---|---|
| Development entry | `orderrun-development` | `orderrun-development` | `.harness/root.md` map + lane workflow |
| Review entry | `orderrun-review` | `orderrun-review` | verification rule |
| Planner | custom-agent wrapper | spawned subagent | `roles/planner.md` |
| Implementer | custom-agent wrapper | spawned/retained subagent | `roles/implementer.md` |
| Reviewer | custom-agent wrapper | spawned subagent | `roles/reviewer.md` |
| Fix loop | resume same agent | follow up same agent | selected workflow |

Only the wrapper/invocation mechanism differs. A role, lane, gate, or decision
that exists for just one runtime fails this parity check and must be moved to the
shared Harness or removed.
