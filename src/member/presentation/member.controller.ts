import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { MemberService } from "../domain/service/member.service";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ChargeBalanceControllerReqDto } from "./dto/charge-balance.req.dto";
import { ChargeBalanceControllerResDto } from "./dto/charge-balance.res.dto";
import { UseBalanceControllerReqDto } from "./dto/use-balance.req.dto";
import { UseBalanceControllerResDto } from "./dto/use-balance.res.dto";
import { GetBalanceControllerResDto } from "./dto/get-balance.res.dto";
import { ChargeBalanceCommand } from "../domain/dto/charge-balance.command.dto";
import { UseBalanceCommand } from "../domain/dto/use-balance.command.dto";
import { GetBalanceCommand } from "../domain/dto/get-balance.command.dto";

@ApiTags("Member Management")
@Controller("member")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get(":memberId")
  @ApiOperation({ summary: "getBalance" })
  @ApiParam({ name: "memberId", example: "1" })
  @ApiResponse({ status: 200, description: "200 - OK", type: GetBalanceControllerResDto })
  @ApiResponse({ status: 404, description: "404 - NotFound", type: NotFoundException })
  async getBalance(@Param("memberId", ParseIntPipe) memberId: number): Promise<GetBalanceControllerResDto> {
    const command: GetBalanceCommand = {
      memberId,
    };

    return await this.memberService.getBalance(command);
  }

  @Post("charge")
  @ApiOperation({ summary: "chargeBalance" })
  @ApiResponse({ status: 200, description: "200 - OK", type: ChargeBalanceControllerResDto })
  @ApiResponse({ status: 400, description: "400 - BadRequest", type: BadRequestException })
  @ApiResponse({ status: 404, description: "404 - NotFound", type: NotFoundException })
  async chargeBalance(
    @Body() chargeBalanceReqDto: ChargeBalanceControllerReqDto,
  ): Promise<ChargeBalanceControllerResDto> {
    const command: ChargeBalanceCommand = {
      ...chargeBalanceReqDto,
    };

    return await this.memberService.chargeBalance(command);
  }

  @Post("use")
  @ApiOperation({ summary: "useBalance" })
  @ApiResponse({ status: 200, description: "200 - OK", type: UseBalanceControllerResDto })
  @ApiResponse({ status: 400, description: "400 - BadRequest", type: BadRequestException })
  @ApiResponse({ status: 404, description: "404 - NotFound", type: NotFoundException })
  async useBalance(@Body() useBalanceReqDto: UseBalanceControllerReqDto): Promise<UseBalanceControllerResDto> {
    const command: UseBalanceCommand = {
      ...useBalanceReqDto,
    };

    return await this.memberService.useBalance(command);
  }
}
