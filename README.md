# Harness Engineering Architecture

> 이 문서는 사람이 구조를 찾기 위한 비규칙 개요와 링크 인덱스입니다.
> Claude Code와 Codex가 따르는 규칙의 단일 원본은 [`.harness/`](.harness/)입니다.

OrderRun-FE는 Claude Code와 Codex가 같은 Architecture, Context, Workflow,
Verification, Evolution 규칙을 공유하도록 구성되어 있습니다. 런타임별 파일은 공통
Harness를 찾고 실행하는 Adapter만 담당합니다.

```text
AGENTS.md / CLAUDE.md
          ↓
  .harness/root.md
          ↓
 Context + Workflow + Role
          ↓
 Verification / Evolution
```

## 문서 지도

| 영역 | 위치 |
|---|---|
| 프로젝트 지도, Architecture, Dependency, Lane Router | [`.harness/root.md`](.harness/root.md) |
| Presentation | [`.harness/context/presentation/AGENTS.md`](.harness/context/presentation/AGENTS.md) |
| Domain | [`.harness/context/domain/AGENTS.md`](.harness/context/domain/AGENTS.md) |
| Data | [`.harness/context/data/AGENTS.md`](.harness/context/data/AGENTS.md) |
| Planner / Implementer / Reviewer | [`.harness/roles/`](.harness/roles/) |
| Lane A / B / C | [`.harness/workflows/`](.harness/workflows/) |
| Verification / mutation guard / Git | [`.harness/rules/`](.harness/rules/) |
| Learning과 변경 이력 | [`.harness/evolution/`](.harness/evolution/) |
| Routing과 runtime parity 점검표 | [`.harness/validation/dry-run.md`](.harness/validation/dry-run.md) |

## Runtime Adapter

- Claude Code: [`CLAUDE.md`](CLAUDE.md), [`.claude/`](.claude/)
- Codex: [`AGENTS.md`](AGENTS.md), [`.codex/`](.codex/)
