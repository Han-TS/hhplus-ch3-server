insert into Product(id, name, stock, price) values (10, '다이슨 에어랩', 121, 1200000);
insert into Product(id, name, stock, price) values (11, '애플 맥세이프 충전기 20W', 1, 790000);
insert into Product(id, name, stock, price) values (12, '무지 라운드넥 반팔티 Free(W/M)', 1500, 24900);
insert into Product(id, name, stock, price) values (13, '안경닦이 100x100', 0, 500);
insert into Product(id, name, stock, price) values (14, '미니 향균 티슈 250매', 37, 2500);
insert into Product(id, name, stock, price) values (15, '아디다스 삼선 슬리퍼 275mm', 15, 65000);
insert into Product(id, name, stock, price) values (16, '모나미 볼펜 12자루', 1000, 5900);

insert into Member(id, name, balance) values (11, 'psy', 50000);

insert into `Order`(id, memberId, totalSales, status) values (1, 11, 2400000, '결제준비');
insert into `Order`(id, memberId, totalSales, status) values (2, 11, 5500, '주문취소');

insert into Order_Product(id, orderId, productId, amount) values (1, 1, 10, 2);
insert into Order_Product(id, orderId, productId, amount) values (2, 2, 13, 1);
insert into Order_Product(id, orderId, productId, amount) values (3, 2, 14, 2);