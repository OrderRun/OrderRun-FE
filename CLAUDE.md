# Claude Code Adapter — OrderRun-FE

항상 Root [`AGENTS.md`](AGENTS.md)를 프로젝트 규칙과 Context Router로 사용한다.
Planner가 선택한 `.harness/context/{presentation|domain|data}/AGENTS.md`만 추가로 읽는다.

기능·수정·버그·리팩터링은 `orderrun-development`, 독립 검증은 `orderrun-review`를
사용한다. `.claude/agents/`는 canonical `.harness/roles/`를 실행하기 위한 Claude
custom-agent Adapter다. 공통 역할·Lane·규칙·판정을 이 파일이나 `.claude/`에 별도로
정의하지 않는다.
