insert into Coupon(id, name, type, offFigure, stock) values (1, '10% 할인 쿠폰', 'PERCENTAGE', 10, 2147483647);
insert into Coupon(id, name, type, offFigure, stock) values (2, '1000원 할인 쿠폰', 'FLAT', 1000, 1);
insert into Coupon(id, name, type, offFigure, stock) values (3, '10000원 할인 쿠폰', 'FLAT', 10000, 0);

insert into Member(id, name, balance) values (31, 'psy', 0);
insert into Member(id, name, balance) values (32, 'jjm', 2147483647);
insert into Member(id, name, balance) values (33, 'kjh', 50000000);

insert into Member_Coupon(id, memberId, couponId, isUsed) values (1, 31, 1, 0);
insert into Member_Coupon(id, memberId, couponId, isUsed) values (2, 31, 2, 1);
insert into Member_Coupon(id, memberId, couponId, isUsed) values (3, 32, 3, 0);