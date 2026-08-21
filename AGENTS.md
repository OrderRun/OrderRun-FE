# OrderRun-FE Codex Adapter

항상 [`.harness/root.md`](.harness/root.md)를 프로젝트 규칙의 단일 원본이자
Context/Lane Router로 읽고 따른다. 이 파일은 Codex가 공통 Harness를 발견하기 위한
얇은 Adapter이며 프로젝트 규칙, 역할 책임, Lane 기준, 완료 판정을 별도로 정의하지
않는다.

`.harness/root.md`가 선택한 Context, workflow, role, rule 문서만 추가로 읽는다.

기능·수정·버그·리팩터링은 `.codex/skills/orderrun-development/SKILL.md`, 독립 검증은
`.codex/skills/orderrun-review/SKILL.md`를 진입점으로 사용한다. 이 두 Skill은 canonical
`.harness/roles/`를 Codex 도구로 실행하기 위한 Adapter이며, 공통 역할·Lane·규칙·판정을
이 파일이나 `.codex/`에 별도로 정의하지 않는다.
