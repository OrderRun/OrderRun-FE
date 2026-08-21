# Presentation Context Harness

이 문서는 Presentation 작업일 때 shared Root [`../../root.md`](../../root.md)와 함께 읽는다.

Presentation은 Page, Component, 사용자 입력, routing, 로컬 화면 상태와
Loading/Empty/Error/잘못된 입력/권한 없음 UI, 사용자 피드백을 담당한다.

- Component에서 API endpoint를 직접 호출하지 않는다.
- 서버 DTO나 서버 상태값을 UI에서 만들거나 추측하지 않는다.
- 비즈니스 판단과 상태 전이 규칙을 Component에 넣지 않는다.
- 데이터 요청 상태는 UI 밖의 hook/data 경계에서 받고, 순수 규칙은 Domain에 둔다.
- 계획한 경계 상태를 행 단위로 확인하고, props 생산자와 소비자를 함께 검토한다.
- Component 파일의 non-component export는 refresh lint를 피하도록 별도 파일에 둔다.

Presentation만 바뀌면 Domain/Data Context를 읽지 않는다. 실제 계약이나 비즈니스
규칙까지 바뀔 때만 해당 Context를 추가한다.
