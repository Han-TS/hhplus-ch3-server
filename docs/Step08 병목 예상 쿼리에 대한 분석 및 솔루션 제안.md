# Step08. 병목 예상 쿼리에 대한 분석 및 솔루션 제안 보고서

# 부제: NestJS + Prisma + MySQL 환경에서의 느린 조회 쿼리 분석 및 개선 방안

## 1. 서론

- 목적: 특정 조회 쿼리의 성능 저하 현상을 분석하고, 이를 해결하기 위한 방안을 도출하는 것이 목적이다.
- 배경: Eager Loading 사용, 통계 집계 사용, where 절에 index 없는 필드 사용 등으로 인해서 시스템의 부하가 발생할 수 있음을 예상할 수 있다. 이에 따라 해당 쿼리의 병목 구간을 분석하고 개선 방안을 모색하고자 한다.

## 2. 개념

- 병목(Bottleneck): 성능이나 처리 속도를 가장 크게 제한하고 있는 지점
병(bottle)의 목 부분처럼 좁아서 전체 흐름을 막는 부분을 의미
- Eager Loading: 데이터베이스에서 FK 로 연관된 데이터를 미리 당겨서 로딩하는 방식
- RPS(Requests per Second): 1초 동안 처리된 HTTP 요청 수
- p90: 전체 요청 중 90%가 이 시간 이하로 응답
- p95: 전체 요청 중 95%가 이 시간 이하로 응답

## 3. 예상 병목 지점

- ERD 구성
    
    ```mermaid
    erDiagram
        MEMBER ||..o{ BALANCE_HISTORY : has
        MEMBER_COUPON }|..|| COUPON : included
        MEMBER ||..|{ MEMBER_COUPON : has
        MEMBER ||..o{ PAYMENT : has
        MEMBER_COUPON |o..|| PAYMENT : has
        PAYMENT |o..|| ORDER : has
        ORDER ||..|{ ORDER_PRODUCT : includes
        PRODUCT ||..|{ ORDER_PRODUCT : included
        
        MEMBER {
            int id PK "AI"
            string name "NN"
            int balance "NN"
        }
        BALANCE_HISTORY {
            int id PK "AI"
            int memberId FK "NN"
            int amount "NN"
        }
        MEMBER_COUPON {
            int id PK "AI"
            int memberId FK "NN"
            int couponId FK "NN"
            bool isUsed "NN"
        }
        COUPON {
            int id PK "AI"
            string name "NN"
            string type "NN"
            int offFigure "NN"
            int stock "NN"
        }
        PAYMENT {
            int id PK "AI"
            int orderId FK "NN"
            int memberId FK "NN"
            int couponId FK
            string status "NN"
            int paid_amount "NN"
        }
        ORDER {
            int id PK "AI"
            int memberId "NN"
            int totalSales "NN"
            string status "NN"
            datetime createdAt "NN"
            datetime updatedAt "NN"
        }
        ORDER_PRODUCT {
            int id PK "AI"
            int orderId FK "NN"
            int productId FK "NN"
            int amount "NN"
        }
        PRODUCT {
            int id PK "AI"
            string name "NN"
            int stock "NN"
            int price "NN"
        }
        PRODUCT_SALES_STAT {
            int id PK "AI"
            int productID "NN"
            string productName "NN"
            datetime salesDate "NN"
            int total_amount "NN"
            int total_sales "NN"
        }
    ```
    

### 3-1. Eager Loading 사용

```jsx
  async getOrder(orderId: number, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    return await client.order.findUnique({
      where: { id: orderId },
      include: {
        orderProducts: {
          include: {
            product: true,
          },
        },
      },
    });
  }
  
  // MySQL 로그를 통해 확인한 쿼리
	SELECT `hhplus`.`Order`.`id`, `hhplus`.`Order`.`memberId`, `hhplus`.`Order`.`totalSales`, `hhplus`.`Order`.`status`, `hhplus`.`Order`.`createdAt`, `hhplus`.`Order`.`updatedAt` FROM `hhplus`.`Order` WHERE (`hhplus`.`Order`.`id` = ? AND 1=1) LIMIT ? OFFSET ?
	SELECT `hhplus`.`Order`.`id`, `hhplus`.`Order`.`memberId`, `hhplus`.`Order`.`totalSales`, `hhplus`.`Order`.`status`, `hhplus`.`Order`.`createdAt`, `hhplus`.`Order`.`updatedAt` FROM `hhplus`.`Order` WHERE (`hhplus`.`Order`.`id` = 1 AND 1=1) LIMIT 1 OFFSET 0
	SELECT `hhplus`.`Order`.`id`, `hhplus`.`Order`.`memberId`, `hhplus`.`Order`.`totalSales`, `hhplus`.`Order`.`status`, `hhplus`.`Order`.`createdAt`, `hhplus`.`Order`.`updatedAt` FROM `hhplus`.`Order` WHERE (`hhplus`.`Order`.`id` = 1 AND 1=1) LIMIT 1 OFFSET 0
	SELECT `hhplus`.`Order_Product`.`id`, `hhplus`.`Order_Product`.`orderId`, `hhplus`.`Order_Product`.`productId`, `hhplus`.`Order_Product`.`amount` FROM `hhplus`.`Order_Product` WHERE `hhplus`.`Order_Product`.`orderId` IN (?)
	SELECT `hhplus`.`Order_Product`.`id`, `hhplus`.`Order_Product`.`orderId`, `hhplus`.`Order_Product`.`productId`, `hhplus`.`Order_Product`.`amount` FROM `hhplus`.`Order_Product` WHERE `hhplus`.`Order_Product`.`orderId` IN (1)
	SELECT `hhplus`.`Product`.`id`, `hhplus`.`Product`.`name`, `hhplus`.`Product`.`stock`, `hhplus`.`Product`.`price` FROM `hhplus`.`Product` WHERE `hhplus`.`Product`.`id` IN (?,?)
	SELECT `hhplus`.`Product`.`id`, `hhplus`.`Product`.`name`, `hhplus`.`Product`.`stock`, `hhplus`.`Product`.`price` FROM `hhplus`.`Product` WHERE `hhplus`.`Product`.`id` IN (98,1000)
```

### 3-2. 통계 집계 사용

```jsx
async getTop5ProductByAmountLast3Days(tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    return await client.$queryRaw`
      SELECT 
        CONVERT(RANK() OVER (ORDER BY amount DESC), CHAR) AS \`rank\`,
        productId,
        productName,
        amount,
        sales
      FROM (
        SELECT 
          productId,
          productName,
          SUM(total_amount) AS amount,
          SUM(total_sales) AS sales
        FROM Product_Sales_Stat
        WHERE salesDate >= CURDATE() - INTERVAL 3 DAY
          AND salesDate < CURDATE()
        GROUP BY productId, productName
      ) AS ranked
      ORDER BY amount DESC
      LIMIT 5;
    `;
  }
	  
  // MySQL 로그를 통해 확인한 쿼리
  SELECT 
        CONVERT(RANK() OVER (ORDER BY amount DESC), CHAR) AS `rank`,
        productId,
        productName,
        amount,
        sales
      FROM (
        SELECT 
          productId,
          productName,
          SUM(total_amount) AS amount,
          SUM(total_sales) AS sales
        FROM Product_Sales_Stat
        WHERE salesDate >= CURDATE() - INTERVAL 3 DAY
          AND salesDate < CURDATE()
        GROUP BY productId, productName
      ) AS ranked
      ORDER BY amount DESC
      LIMIT 5
```

## 4. 예상 원인

### 4-1. Prisma 쿼리 변환 방식

- Prisma 는 include 를 사용하는 경우 연관관계 조회 시 SELECT 쿼리가 여러 개로 실행 됨
- 정확한 타입 보장과 중복 없는 nested object 구조를 위해, JOIN을 피하고 여러번 SELECT로 데이터를 재구성

### 4-2. MySQL 성능 이슈

- ORDER BY + LIMIT 에 인덱스가 없다면 느림

## 5. 성능 측정 방안

### K6를 이용한 http_req_duration 을 분석

<img width="1907" alt="image" src="https://github.com/user-attachments/assets/727fc57c-5909-409e-bed3-7ce56e53664d" />


## 6. 각 병목 예상 지점의 응답 속도 측정

### 6-1. Eager Loading 사용 (초당 요청 1000건)

<img width="1630" alt="image 1" src="https://github.com/user-attachments/assets/8efbcf5a-2ba8-452a-8edf-98d648289561" />


- 상품, 주문, 주문_상세 각각 데이터 1000건
- HTTP 요청 응답
평균: 537ms / 최대: 5260ms / 중앙: 176ms / 최소: 0.03ms / p90: 412ms / p95: 620ms
중앙값은 양호하지만 전체 요청 중 일부가 극단적으로 느린 경우가 있음
- 요청 수 (Requests per Second)
평균 648 RPS, 최대 1000 RPS
요청 수가 꾸준하지만, 잦은 빈도로 낮아지는 구간이 있음 (불안정한 응답 처리 가능성 시사)

### 6-2. 통계 집계 사용 (초당 요청 1000건)

<img width="1902" alt="image 2" src="https://github.com/user-attachments/assets/7850420b-1d62-40dd-8ff4-72838e193769" />


- 약 2주(17일) 간의 판매 이력 데이터 1000건
- HTTP 요청 응답
평균: 181ms / 최대: 2650ms / 중앙: 12ms / 최소: 0.04ms / p90: 709ms / p95: 943ms
일부 요청이 느리긴 하지만 평균적으로 요청이 200ms 미만에서 처리되고 있음
- 요청 수 (Requests per Second)
평균 928 RPS, 최대 1000 RPS
요청 수가 꾸준하고, 간헐적으로 낮아지는 구간이 있음

## 7. 해결 방안 제시

### 7-1. 인덱스 추가

- 정렬과 조건이 함께 쓰이는 경우 복합 인덱스를 고려

```jsx
-- createdAt과 status를 자주 조회하거나 정렬하는 경우
CREATE INDEX idx_orders_createdAt_status ON orders (createdAt, status);

model Order {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  status    String

  @@index([createdAt, status])
}
```

### 7-2. Prisma 쿼리 최적화

- include 사용 지양 → 필요한 경우 제한적으로 사용

```jsx
await prisma.user.findMany({
  include: {
    posts: true, // 모든 post 필드 포함
  }
});

// 개선 버전
await prisma.user.findMany({
  include: {
    posts: {
      select: {
        id: true,
        title: true,
      }
    }
  }
});
```

### 7-3. Raw Query 사용

- 특정 상황에서는 Prisma 대신 직접 SQL을 사용하는 것이 효율적

```jsx
const topProducts = await prisma.$queryRaw`
  SELECT p.id, p.name, SUM(o.quantity) AS total_sold
  FROM orders o
  JOIN products p ON o.product_id = p.id
  GROUP BY p.id
  ORDER BY total_sold DESC
  LIMIT 10;
`;
```

### 7-4. 캐싱 도입

- Redis 등을 사용한 조회 결과 캐싱
- 인기 판매 상품 등 변동이 크지 않은 데이터에 대해서 캐싱을 이용하면 효율적

```jsx
const cached = await redis.get("popular-products");
if (cached) {
  return JSON.parse(cached);
}

const popularProducts = await prisma.product.findMany({
  orderBy: { soldCount: 'desc' },
  take: 10,
});

await redis.set("popular-products", JSON.stringify(popularProducts), "EX", 60 * 5); // 5분 캐시
return popularProducts;
```

### 7-5. DB 구조 개선

- 반정규화 또는 Materialized View 활용을 고려함
- 별도의 조회 전용 테이블 생성

```jsx
CREATE MATERIALIZED VIEW popular_products AS
SELECT p.id, p.name, SUM(o.quantity) AS total_sold
FROM orders o
JOIN products p ON o.product_id = p.id
GROUP BY p.id;

-- 주기적으로 새로 고침 필요
REFRESH MATERIALIZED VIEW popular_products;
```

## 8. 해결 방안 적용을 통한 비교 분석

- 이전에 사용한 데이터들을 그대로 새로운 테이블에 마이그레이션 하여서 진행함

### 8-1. Eager Loading 사용 → 테이블 반정규화

- Order, Order_Product, Product 테이블을 반정규화 하여 한 테이블로 구성
- orderId 에 인덱스를 적용하여 검색 시 where 절에 orderId 사용

```jsx
// 개선된 쿼리 (MySQL 로그를 통해 확인)
SELECT 
				`hhplus`.`Order_Denorm`.`id`, 
				`hhplus`.`Order_Denorm`.`orderId`, 
				`hhplus`.`Order_Denorm`.`memberId`, 
				`hhplus`.`Order_Denorm`.`createdAt`, 
				`hhplus`.`Order_Denorm`.`productId`, 
				`hhplus`.`Order_Denorm`.`productName`, 
				`hhplus`.`Order_Denorm`.`price`, 
				`hhplus`.`Order_Denorm`.`amount`, 
				`hhplus`.`Order_Denorm`.`totalPrice` 
				FROM `hhplus`.`Order_Denorm` 
				WHERE `hhplus`.`Order_Denorm`.`orderId` = 950
```

<img width="1902" alt="image 3" src="https://github.com/user-attachments/assets/0c9a9009-1a7e-406c-82d7-7d772b61c0c2" />


| 지표 | 개선 전 | 개선 후 | 차이 |
| --- | --- | --- | --- |
| 평균 응답 시간 (mean) | 537.35 ms | 385.61 ms | **-28.2%** |
| 최대 응답 시간 (max) | 5.26 s | 3.53 s | **-32.9%** |
| 중앙값 (median) | 176.64 ms | 57.29 ms | **-67.6%** |
| p90 응답 시간 | 1.36 s | 1.13 s | **-16.9%** |
| p95 응답 시간 | 1.79 s | 1.41 s | **-21.2%** |
| 평균 RPS | 648 | 716 | **+10.5%** |
- 평균, 최대, 중앙값, p90, p95 모두 개선됨
- 특히 중앙값과 평균이 확연히 줄어듦 → 전반적인 사용자 체감 성능 대폭 향상

### 8-2. 통계 집계 사용 → Materialized View 활용 및 index 적용

- 매일 최근 3일에 대한 판매 데이터를 통해 판매량 상위 5위인 상품만 View 테이블에 추가
- date, rank 에 인덱스를 적용하여 검색 시 where 절에 date, order 절에 rank 사용

```jsx
// 개선된 쿼리 (MySQL 로그를 통해 확인)
SELECT 
        `rank`, 
        productId, 
        productName, 
        total_amount as amount, 
        total_sales as sales 
        FROM Product_Sales_Stat_View 
        WHERE date = CURDATE() 
        ORDER BY `rank`
```

<img width="1903" alt="image 4" src="https://github.com/user-attachments/assets/ad90a59c-3dea-4218-82d1-2bf9f74908df" />


| 지표 | 개선 전 | 개선 후 | 차이 |
| --- | --- | --- | --- |
| 평균 응답 시간 (mean) | 181.38 ms | 71.61 ms | -60.5% |
| 최대 응답 시간 (max) | 2.65 s | 1.06 s | -60.0% |
| 중앙값 (median) | 12.36 ms | 5.45 ms | **-55.9%** |
| p90 응답 시간 | 709.09 ms |  293.25 ms | -58.6% |
| p95 응답 시간 | 943.14 ms | 413.06 ms | -56.2% |
| 평균 RPS | 841 | 932 | +10.8% |
- 요청 처리 시간 전반이 약 55~60% 이상 개선됨
- 전체적으로 매우 효율적인 개선이라고 볼 수 있음

## 9. 결론

이번 분석을 통해 NestJS + Prisma + MySQL 환경에서의 느린 조회 쿼리가 발생하는 주요 원인을 파악하고, 이에 대한 실질적인 성능 개선 방안을 적용해보았습니다.

- Prisma의 include 사용은 직관적이지만, 복잡한 연관 관계에서 불필요한 Eager Loading이 성능 저하를 유발할 수 있습니다.
- 복잡한 통계성 쿼리는 SQL 로직 자체가 무거운 경우가 많아, 뷰(View) 혹은 반정규화된 테이블로 대체하면 효과적입니다.
- 정렬 필드, 조건 필드에 대한 인덱스 구성은 필수이며, 쿼리 조건과 정렬 조건이 일치하지 않으면 MySQL 옵티마이저가 인덱스를 제대로 활용하지 못합니다.
- Raw Query와 Materialized View, 그리고 조회 전용 테이블 구성은 읽기 성능 최적화에 매우 효과적임이 수치로 증명되었습니다.

### 성능 비교 결과

- Eager Loading 해소 및 반정규화로 인해 중앙값 67.6% 감소, 평균 응답 시간 28.2% 개선
- 통계성 쿼리 최적화는 평균 응답 시간 60.5% 감소, 전체 처리 성능(RPS) 10% 이상 향상

결론적으로, DB 설계 관점, 쿼리 실행 방식, 캐시 전략 등을 함께 고려해야 실무에서 실질적인 성능 개선을 이룰 수 있다.

이번 사례는 데이터의 성격에 따라 구조적 개선과 전략적 선택이 어떻게 성능에 영향을 미치는지를 보여주는 좋은 예시라 할 수 있다.
