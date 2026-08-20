# OrderRun-FE 프로젝트 규칙

이 문서는 Codex Harness의 확인된 프로젝트 사실과 반복 규칙의 단일 기록이다.
미확정 사항은 추측으로 채우지 않는다. 스택이나 명령이 달라졌다고 의심되거나 새
의존성이 필요할 때만 원본 설정을 확인하고 이 문서를 갱신한다.

## 확인된 사실 (2026-08-20)

| 항목 | 값 |
|---|---|
| UI | React 19 + TypeScript 6 + Vite 8 |
| lint | ESLint flat config, `--max-warnings 0` |
| 테스트 | 미도입 |
| 라우터/상태관리/fetch/UI 라이브러리 | 미도입 |
| 검증 | `npm run typecheck`, `npm run lint`, `npm run build` |

`package.json`에 없는 라이브러리는 승인 없이 추가하지 않는다. `test` 스크립트가
생기면 검증 게이트에 추가하고 이 표를 갱신한다.

## 작성 제약

- `strict`, `noUnusedLocals`, `noUnusedParameters`가 켜져 있다.
- 타입만 가져오면 `import type`을 쓴다.
- `enum`, `namespace`, 생성자 파라미터 프로퍼티는 사용할 수 없다. 상수 객체와
  유니온 타입을 사용한다.
- 컴포넌트 파일은 `react-refresh/only-export-components` 때문에 컴포넌트 외 값을
  export하지 않는다. 상수·타입·훅은 별도 파일에 둔다.
- `any`, 근거 없는 `as`, `@ts-ignore`, `eslint-disable`로 오류를 숨기지 않는다.
  불가피한 예외는 코드 사유와 implementer 리포트에 함께 남긴다.

## 배치와 책임

- 기능 전용 코드는 기본적으로 `src/features/{feature}/`에 둔다. 빈 폴더는 만들지
  않는다. feature 내부 하위 폴더는 파일이 5개를 넘어 탐색이 어려워질 때 만든다.
- 실제 두 번째 사용처가 생길 때만 공용 위치로 옮긴다. 구현체 하나인 인터페이스,
  선점용 배럴 파일, 근거 없는 Repository/UseCase/Entity/Service 계층은 만들지 않는다.
- 컴포넌트에는 렌더링·이벤트·로컬 UI 상태만 둔다. fetch/요청 상태는 훅에, 도메인
  판정·계산·변환은 순수 함수에, 서버↔화면 변환은 데이터 경계 한 곳에 둔다.
- 상태 상수·타입·순수 함수가 분리되어 파일 수가 늘어나는 것은 lint 제약상 정상이다.

## 미확정 — 구현 전 사용자 확인

백엔드 API URL·인증, Request/Application/Mission/Dispute의 데이터 스키마와 상태값,
라우터·서버 상태 관리·UI 라이브러리·테스트 러너·경로 별칭은 모두 미확정이다.
