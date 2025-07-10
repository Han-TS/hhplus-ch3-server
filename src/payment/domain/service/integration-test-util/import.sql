insert into Coupon(id, name, type, offFigure, stock) values (1, '10000원 할인 쿠폰', 'FLAT', 10000, 0);

insert into Member(id, name, balance) values (1, 'psy', 50000);

insert into Member_Coupon(id, memberId, couponId, isUsed) values (1, 1, 1, 0);

insert into `Order`(id, memberId, totalSales, status) values (1, 1, 2400000, "결제완료");
insert into `Order`(id, memberId, totalSales, status) values (2, 1, 79000, "결제준비");

insert into Payment(id, orderId, memberId, couponId, paid_amount, approved_at, status) values (1, 1, 1, null, 2400000, now(), "결제완료");