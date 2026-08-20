# Data Context Harness

이 문서는 Data 작업일 때 Root `AGENTS.md`와 함께 읽는다.

Data는 API client, endpoint 호출, Request/Response DTO, mapper, 요청 상태와 API 오류
변환을 담당한다.

- 존재하지 않는 endpoint, response field, 서버 상태값, 권한 동작을 추측하지 않는다.
- API base URL을 하드코딩하지 않는다.
- Contract를 찾을 수 없으면 Implementer 전에 중단하고 필요한 정보를 요청한다.
- Component에서 직접 fetch하지 않는다.
- 서버 DTO와 Domain/UI model이 다르면 이름 있는 경계 한 곳에서 명시적으로 변환한다.
- cast나 generic이 있는 경계는 실제 생산자 반환값과 소비자 기대값을 함께 검토한다.

Data만 바뀌면 Presentation/Domain Context를 읽지 않는다. 화면 연결 또는 Domain model
변경이 실제 범위에 포함될 때만 해당 Context를 추가한다.
