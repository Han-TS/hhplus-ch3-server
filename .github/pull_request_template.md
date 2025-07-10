## 📌 PR 유형

<!-- 어떠한 변경 사항이 있는지 [x]로 체크 -->

- [ ] 버그 수정
- [ ] 새로운 기능(테스트) 추가
- [x] 코드 리팩토링 및 기능 개선
- [ ] 의존성, 문서, 빌드 관련 코드 업데이트
- [ ] 기능(테스트) 삭제
- [ ] 기타 (내용을 적어주세요):

---

## 🗒️ PR 설명

### 개요

결제 완료 시 주문 정보를 외부 데이터 플랫폼으로 전송하는 기능을 이벤트 기반으로 리팩토링했습니다.  
핵심 트랜잭션과 부가 로직(외부 연동)을 분리하여 유지보수성과 안정성을 향상시켰습니다.

### 변경 사항

- `OrderPaidEvent` 이벤트 클래스 추가
- `PaymentFacade.processPayment()` 내 `order.paid` 이벤트 발행 로직 추가
- `OrderEventListener` 구현 → `order.paid` 이벤트 수신 후 `NotifyService` 호출
- `NotifyService.sendOrderInfoToExtPlatform()` 로직 완성
- 기존 Kafka 이벤트(`pay.completed`) 구조 유지하며 `ApplicationEvent` 기반 로직 병행

---

## 🧭 의사결정 흐름

- 외부 API 연동은 핵심 결제 트랜잭션과 분리되어야 한다는 과제/실무 기준에 따라 `@OnEvent`를 활용한 비동기 처리 적용
- 이벤트 기반 분리로 코드 가독성과 재사용성을 확보함

---

## 🔗 커밋 링크

---

## ✅ Definition of Done (DoD)

- [x] 결제 트랜잭션 종료 후 `order.paid` 이벤트가 정상 발행됨
- [x] 외부 데이터 플랫폼 전송 로직이 `@OnEvent('order.paid')` 에서 수행됨
- [x] `NotifyService.sendOrderInfoToExtPlatform()` 내부에서 외부 연동 처리 수행됨
- [x] 기존 `pay.completed` Kafka 흐름과 병행하여 로직 충돌 없음 확인
- [ ] TODO - `order.paid` 이벤트 통합 테스트 추가 예정

---

## 🙋‍♂️ 리뷰 포인트(질문)

- 회사 업무로 학습을 많이 놓쳤습니다. 매니저님이 추천해주신 코드를 참고하여 흐름을 잡고 있는데 방향성이 맞는지 정도만 확인해주시면 감사하겠습니다.

---

## 🤔 이번주 KPT 회고

### Keep

- 이벤트 기반 관심사 분리 경험 축적
- 도메인 독립성과 가독성 향상

### Problem

- Kafka 이벤트와 AppEvent 로직이 병행되며 리스너 구조가 중복될 우려 있음

### Try

- 이후 Kafka 기반 이벤트도 CQRS 기준으로 리스너 통합 처리 시도

---

## 🗂 참고 자료

- 항해 플러스 백엔드 Chapter 3-3 과제 가이드
- https://docs.nestjs.com/events
- 팀 공유 슬랙 문서 [이벤트 트랜잭션 분리 전략]
