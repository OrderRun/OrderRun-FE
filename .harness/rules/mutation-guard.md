# Planner and Reviewer mutation guard

이 guard는 Git이 관찰할 수 있는 프로젝트 영역의 무단 변경만 탐지한다. Planner와
Reviewer 호출 전후에 오케스트레이터가 동일한 snapshot을 만들고 비교한다. 기존
dirty/staged 상태는 허용된 baseline일 뿐이며 호출 중 추가된 delta는 반드시 탐지해야 한다.

## 보장 범위

Snapshot은 tracked 파일과 untracked non-ignored 파일에 대해 다음을 보존한다.

1. `git diff --no-ext-diff --binary`의 tracked working-tree 내용, mode, rename, 삭제 상태
2. `git diff --cached --no-ext-diff --binary`의 index 상태
3. `git status --porcelain=v1 --untracked-files=all`의 경로 상태
4. 모든 untracked non-ignored 파일의 경로와 SHA-256 content hash

호출 전과 후의 네 snapshot이 모두 같아야 한다. application source, settings,
dependencies, Harness 문서, runtime Adapter, 그 밖의 tracked/non-ignored 파일 변경은 모두
stage를 무효화한다. 기존 dirty 파일의 상태 코드가 같더라도 diff 내용이 달라지면 실패다.
허용되지 않은 delta를 되돌리지 말고 경로와 baseline 차이를 보고한 뒤 중단한다.

검증 명령이 만든 ignored cache/build output은 source 변경으로 주장하지 않는다.

## 보장하지 않는 범위

`_workspace/`는 gitignore 대상이므로 위 snapshot에 나타나지 않는다. 이 guard는
`_workspace/` 내부 산출물의 변경, 기존 산출물 덮어쓰기, 다른 slug 침범을 탐지하지
못하며 그 불변성을 보장한다고 표현하지 않는다. 산출물 경로, 라운드마다 새 파일 작성,
slug 수명주기는 `../root.md`의 workflow 규칙과 `../roles/`의 역할 정의로만 강제한다.

## Snapshot 비교와 토큰

- 호출 직전과 직후에 각각 snapshot을 만든다.
- snapshot 본문을 Agent Context나 인계 문서에 넣지 않는다. 파일이나 변수로 보관하고
  항목별 digest(SHA-256)만 비교한다.
- digest가 모두 같으면 그 이상 조사하지 않는다.
- 다를 때만 달라진 경로 목록을 먼저 얻고, 판단에 필요한 최소 변경 정보만 확인한다.
- 큰 `git diff` 전문을 보고서나 Agent 간 전달 문서에 옮기지 않는다.
