# Domain Context Harness

이 문서는 Domain 작업일 때 shared Root [`../../root.md`](../../root.md)와 함께 읽는다.

Domain은 플랫폼 독립적인 model, validation, 상태와 상태 전이, 비즈니스 판단·계산을
담당하며 가능한 한 순수 TypeScript로 작성한다.

- React, Presentation, API client, Data Layer에 의존하지 않는다.
- 상태값·전이·validation 규칙을 추측하지 않고 근거가 없으면 구현을 중단한다.
- 한 사용처의 로직을 미래 대비 공용화하지 않는다.
- 실제 두 번째 사용처가 생기면 복사하지 말고 공통 Domain 위치로 이동한다.
- React Native 등 다른 UI에서도 사용할 수 있도록 플랫폼 API 의존을 피한다.

순수 비즈니스 규칙만 바뀌면 Presentation/Data Context를 읽지 않는다. DTO mapping이나
UI 표현까지 영향이 확인될 때만 해당 Context를 추가한다.
