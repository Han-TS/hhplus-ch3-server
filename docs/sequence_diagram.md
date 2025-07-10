# 시퀀스 다이어그램

- 상품 관리
    - P-1. 상품 조회
        
        ```mermaid
        sequenceDiagram
            actor User as 사용자
            participant Product as 상품
        
            User->>Product: 1. 상품 리스트 조회 요청
            Activate Product
            Product-->>User: 2. 상품 리스트 응답
            Deactivate Product
        ```
        
    - P-2. 선택 상품 조회
        
        ```mermaid
        sequenceDiagram
            actor User as 사용자
            participant Product as 상품
        
            User->>Product: 1. 선택 상품 조회 요청<br/>(productId[])
            Activate Product
        
            Activate Product
            Product->>Product: 2. 유효성 검증<br/>(상품)
            alt 검증 이상 시
                Product-->>User: 3. 에러 응답
            Deactivate Product
            else 검증 이상 무
                Product-->>User: 3. 선택 상품 응답
            end
        
            Deactivate Product
        ```
        
    - P-3. 인기 판매 상품 조회
        
        ```mermaid
        sequenceDiagram
        	actor User as 사용자
        	participant Product as 상품
            participant Order as 주문
        
            User->>Product: 1. 인기 판매 상품 조회 요청
            Activate Product
        
            Product->>Order: 2. 최근 결제 내역 조회 요청
            Activate Order
            Order-->>Product: 3. 최근 결제 내역 응답
            Deactivate Order
        
            Product-->>User: 2. 인기 판매 상품 응답
        
            Deactivate Product
        ```
        
    - P-4. 상품 재고 추가
        
        ```mermaid
        sequenceDiagram
            actor User as 사용자
            participant Product as 상품
        
            User->>Product: 1. 상품 재고 추가 요청<br/>(productId, amount)
            Activate Product
        
            Activate Product
            Product->>Product: 2. 유효성 검증<br/>(상품, 수량)
            alt 검증 이상 시
                Product-->>User: 3. 에러 응답
            Deactivate Product
            else 검증 이상 무
                Product-->>User: 3. 추가 후 상품 정보 응답
            end
        
            Deactivate Product
        ```
        
    - P-5. 상품 재고 차감
        
        ```mermaid
        sequenceDiagram
            actor User as 사용자
            participant Product as 상품
        
            User->>Product: 1. 상품 재고 차감 요청<br/>(productId, amount)
            Activate Product
        
            Activate Product
            Product->>Product: 2. 유효성 검증<br/>(상품, 수량)
            alt 검증 이상 시
                Product-->>User: 3. 에러 응답
            Deactivate Product
            else 검증 이상 무
                Product-->>User: 3. 차감 후 상품 정보 응답
            end
        
            Deactivate Product
        ```
        
- 회원 관리
    - B-1. 잔액 조회
        
        ```mermaid
        sequenceDiagram
            actor User as 사용자
            participant Member as 회원
        
            User->>Member: 1. 잔액 충전 요청<br/>(memberId)
            Activate Member
        
        		Activate Member
                 Member->>Member: 2. 유효성 검증<br/>(회원)
                 
                 alt 검증 이상 시
                     Member-->User: 3. 에러 응답
                 Deactivate Member
            else 검증 이상 무
                 Member-->>User: 3. 잔액 응답
            End
        
            Deactivate Member
        ```
        
    - B-2. 잔액 충전
        
        ```mermaid
        sequenceDiagram
        	actor User as 사용자
        	participant Member as 회원
        
        		User->>Member: 1. 잔액 충전 요청<br/>(memberId, amount)
            Activate Member
        
        			Activate Member
        			Member->>Member: 2. 유효성 검증<br/>(회원, 금액)
        
        			alt 검증 이상 시
        				Member-->User: 3. 에러 응답
        			Deactivate Member
        			else 검증 이상 무
        				Member-->>User: 3. 충전 후 잔액 응답
        			End
        			Deactivate Member
        ```
        
    - B-3. 잔액 사용
        
        ```mermaid
        sequenceDiagram
        	actor User as 사용자
        	participant Member as 회원
        
        		User->>Member: 1. 잔액 사용 요청<br/>(memberId, amount)
            Activate Member
        
                 Activate Member
                 Member->>Member: 2. 유효성 검증<br/>(회원, 금액, 잔액)
        
                 alt 검증 이상 시
                     Member-->User: 3. 에러 응답
                 Deactivate Member
            else 검증 이상 무
                 Member-->>User: 3. 차감 후 잔액 응답
            End
        
            Deactivate Member
        ```
        
- 쿠폰 관리
    - C-1. 쿠폰 조회
        
        ```mermaid
        sequenceDiagram
        	actor User as 사용자
        	participant Coupon as 쿠폰
        
            User->>Coupon: 1. 발급 가능 쿠폰 조회 요청
            Activate Coupon
        
            Coupon-->>User: 2. 쿠폰 리스트 응답
        
            Deactivate Coupon
        ```
        
    - C-2. 쿠폰 발급
        
        ```mermaid
        sequenceDiagram
        	actor User as 사용자
        	participant Coupon as 쿠폰
        
            User->>Coupon: 1. 쿠폰 발급 요청<br/>(memberId, couponId)
            Activate Coupon
        
            Activate Coupon
            Coupon->>Coupon: 2. 유효성 검증<br/>(회원, 보유 여부, 쿠폰 재고)
        
            alt 검증 이상 시
                Coupon-->>User: 3. 에러 응답
            Deactivate Coupon
            else 검증 이상 무
                Coupon-->>User: 3. 지급 후 쿠폰 정보 응답
            End
            
        
            Deactivate Coupon
        ```
        
    - C-3. 쿠폰 사용
        
        ```mermaid
        sequenceDiagram
        	actor User as 사용자
        	participant Coupon as 쿠폰
        
            User->>Coupon: 1. 쿠폰 사용 요청<br/>(memberId, couponId)
            Activate Coupon
        
            Activate Coupon
            Coupon->>Coupon: 2. 유효성 검증<br/>(회원, 보유 여부)
        
            alt 검증 이상 시
                Coupon-->>User: 3. 에러 응답
            Deactivate Coupon
            else 검증 이상 무
                Coupon-->>User: 3. 사용 후 쿠폰 정보 응답
            End
            
            Deactivate Coupon
        ```
        
    - C-4. 보유 쿠폰 조회
        
        ```mermaid
        sequenceDiagram
        	actor User as 사용자
            participant Coupon as 쿠폰
        
            User->>Coupon: 1. 보유 쿠폰 조회 요청<br/>(memberId)
            Activate Coupon
        
            Activate Coupon
        
            Coupon->>Coupon: 2. 유효성 검증<br/>(사용자)
            alt 검증 이상 시
                Coupon-->>User: 3. 에러 응답
            Deactivate Coupon
        
            else 검증 이상 무
                Coupon-->>User: 3. 보유 쿠폰 응답
        
            end
            Deactivate Coupon
        ```
        
- 주문 관리
    - O-1. 상품 주문
        
        ```mermaid
        sequenceDiagram
        	actor User as 사용자
            participant Order as 주문
            participant Product as 상품
        
            User->>Order: 1. 상품 주문 요청<br/>(memberId, productId)
            Activate Order
        
            Activate Order
        
            Order->Order: 2. 유효성 검증<br/>(사용자, 상품)
        
            alt 검증 이상 시
                Order-->>User: 3. 에러 응답
            Deactivate Order
            else 검증 이상 무
                Order->>Product: 3. 선택 상품 조회 요청<br/>(productId)
            Activate Product
            end
        
            Product-->>Order: 4. 선택 상품 응답
            Deactivate Product
        
            Activate Order
            Order->>Order: 5. 구매 가능 여부 검증<br/>(재고)
            alt 검증 이상 시
                Order-->>User: 6. 에러 응답
            Deactivate Order
            else 검증 이상 무
        		    Order-->>User: 6. 주문 정보 응답
        		end
        
            Deactivate Order
        ```
        
    - O-2. 주문 취소
        
        ```mermaid
        sequenceDiagram
            actor User as 사용자
            participant Order as 주문
            participant Product as 상품
        
            User->>Order: 1. 주문 취소 요청<br/>(orderId)
        
            Activate Order
        
            Activate Order
            Order->>Order: 2. 유효성 검증<br/>(주문)
            alt 검증 이상 시
                Order-->>User: 3. 에러 응답
            Deactivate Order
            else 검증 이상 무
                Order->>Product: 3. 재고 추가 요청<br/>(productId)
            Activate Product
            end
            
            Product-->>Order: 4. 추가 후 상품 정보 응답
            Deactivate Product
        
            Order-->>User: 5. 취소 된 주문 정보 응답
        
            Deactivate Order
        ```
        
    - O-3. 주문 결제
        
        ```mermaid
        sequenceDiagram
            actor User as 사용자
            participant Order as 주문
            participant Member as 회원
            participant Coupon as 쿠폰
            participant Product as 상품
            participant Outside as <<외부 플랫폼>>
        
            User->>Order: 1. 주문 결제 요청<br/>(orderId, couponId)
            Activate Order
        
            Activate Order
            Order->>Order: 2. 유효성 검증<br/>(주문, 쿠폰)
            alt 검증 이상 시
                Order-->>User: 3. 에러 응답
            Deactivate Order
            else 검증 이상 무
                Order->>Member: 3. 잔액 조회 요청<br/>(memberId)
            Activate Member
            end
            Member-->>Order: 4. 잔액 응답
            Deactivate Member
        
            Order->>Coupon: 5. 쿠폰 보유 여부 요청<br/>(memberId, couponId)
            Activate Coupon
            Coupon-->>Order: 6. 보유 여부 응답
            Deactivate Coupon
        
            Activate Order
            Order->>Order: 5. 쿠폰 보유 여부 및 쿠폰 적용 금액보다 잔액이 많은지 검증
            alt 검증 이상 시
                Order-->>User: 6. 에러 응답
            Deactivate Order
            else 검증 이상 무
        
            Order->>Member: 6. 잔액 사용 요청
            Activate Member
            end
            Member-->>Order: 7. 잔액 사용 후 잔액 응답
            Deactivate Member
        
            Order->>Product: 8. 상품 재고 차감 요청<br/>(productId, amount)
            Activate Product
            alt 재고 차감 실패 시
                Product-->>Order: 9. 에러 응답
                Deactivate Product
                Order->>Member: 10. 잔액 충전 요청
                Activate Member
                Member-->>Order: 11. 잔역 충전 후 잔액 응답
                Deactivate Member
                Order-->>User: 12. 에러 응답
            else 재고 차감 성공 시
                Order->>Outside: 9. 완료 된 주문 정보 전달
                Order->>Order: 10. 상품 판매 통계 테이블에 판매 내역 반영
            end
            
            Order-->>User: 11. 결제 완료 된 주문 응답
        
            Deactivate Order
        ```