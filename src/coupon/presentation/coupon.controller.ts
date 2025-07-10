import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post } from "@nestjs/common";
import { CouponService } from "../domain/service/coupon.service";
import { GetAllCouponsResDto } from "./dto/get-all-coupons.res.dto";
import { IssueCouponReqDto } from "./dto/issue-coupon.req.dto";
import { IssueCouponResDto } from "./dto/issue-coupon.res.dto";
import { IssueCouponCommand } from "../domain/dto/issue-coupon.command.dto";
import { UseCouponReqDto } from "./dto/use-coupon.req.dto";
import { UseCouponResDto } from "./dto/use-coupon.res.dto";
import { UseCouponCommand } from "../domain/dto/use-coupon.command.dto";
import { GetCouponsByMemberCommand } from "../domain/dto/get-coupons-by-member.command.dto";
import { GetCouponByMemberResDto } from "./dto/get-coupons-by-member.res.dto";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Coupon Management")
@Controller("coupon")
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get("all")
  @ApiOperation({ summary: "get all available coupons" })
  @ApiResponse({ status: 200, description: "200 - OK", type: GetAllCouponsResDto })
  async getAllCoupons(): Promise<GetAllCouponsResDto> {
    const coupons = await this.couponService.getAllCoupons();
    return { coupons: coupons };
  }

  @Get(":memberId")
  @ApiOperation({ summary: "get coupons (member having)" })
  @ApiParam({ name: "memberId", example: "1" })
  @ApiResponse({ status: 200, description: "200 - OK", type: GetCouponByMemberResDto })
  async getCouponsByMember(@Param("memberId", ParseIntPipe) memberId: number): Promise<GetCouponByMemberResDto> {
    const command: GetCouponsByMemberCommand = { memberId };

    const coupons = await this.couponService.getCouponsByMember(command);

    return { coupons: coupons };
  }

  // @Get("v2/:memberId")
  // @ApiOperation({ summary: "get coupons (member having)" })
  // @ApiParam({ name: "memberId", example: "1" })
  // @ApiResponse({ status: 200, description: "200 - OK", type: GetCouponByMemberResDto })
  // async getCouponsByMemberV2(@Param("memberId", ParseIntPipe) memberId: number): Promise<GetCouponByMemberResDto> {
  //   const command: GetCouponsByMemberCommand = { memberId };

  //   const coupons = await this.couponService.getCouponsByMemberV2(command);

  //   return { coupons: coupons };
  // }

  @Post("issue")
  @ApiOperation({ summary: "issueCoupon" })
  @ApiResponse({ status: 200, description: "200 - OK", type: IssueCouponResDto })
  @ApiResponse({ status: 400, description: "400 - BadRequest", type: BadRequestException })
  @ApiResponse({ status: 404, description: "404 - NotFound", type: NotFoundException })
  async issueCoupon(@Body() issueCouponReqDto: IssueCouponReqDto): Promise<IssueCouponResDto> {
    const command: IssueCouponCommand = {
      ...issueCouponReqDto,
    };

    return await this.couponService.issueCoupon(command);
  }

  @Post("use")
  @ApiOperation({ summary: "useCoupon" })
  @ApiResponse({ status: 200, description: "OK", type: UseCouponResDto })
  @ApiResponse({ status: 400, description: "400 - BadRequest", type: BadRequestException })
  @ApiResponse({ status: 404, description: "404 - NotFound", type: NotFoundException })
  async useCoupon(@Body() useCouponReqDto: UseCouponReqDto): Promise<UseCouponResDto> {
    const command: UseCouponCommand = {
      ...useCouponReqDto,
    };

    return await this.couponService.useCoupon(command);
  }
}
