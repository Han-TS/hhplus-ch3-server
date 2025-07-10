insert into Member(id, name, balance) values (1, 'psy', 328000);

insert into Coupon(id, name, type, offFigure, stock) values (1, '10000원 할인 쿠폰', 'FLAT', 10000, 0);

insert into Member_Coupon(id, memberId, couponId, isUsed) values (1, 1, 1, 0);

INSERT INTO Product(id, name, stock, price) VALUES(1, '다이슨 에어랩', 2147483647, 1200000);
INSERT INTO Product(id, name, stock, price) VALUES(2, '맥세이프 무선 충전기 20W', 2, 79000);
INSERT INTO Product(id, name, stock, price) VALUES(3, '무지 라운드넥 반팔티 Free(W/M)', 15, 24900);

insert into `Order`(id, memberId, totalSales, status) values (1, 1, 2400000, "결제완료");
insert into `Order`(id, memberId, totalSales, status) values (2, 1, 328000, "결제준비");

insert into Order_Product(id, orderId, productId, amount) values (1, 1, 1, 2);
insert into Order_Product(id, orderId, productId, amount) values (2, 2, 2, 1);
insert into Order_Product(id, orderId, productId, amount) values (3, 2, 3, 10);

insert into Payment(id, orderId, memberId, couponId, paid_amount, approved_at, status) values (1, 1, 1, null, 2400000, now(), "결제완료");

insert into Product_Sales_Stat(id, productId, productName, salesDate, total_amount, total_sales) values (1, 1, '다이슨 에어랩', CURDATE(), 2, 2400000);
insert into Product_Sales_Stat(id, productId, productName, salesDate, total_amount, total_sales) values (2, 2, '맥세이프 무선 충전기 20W', CURDATE(), 1, 79000);