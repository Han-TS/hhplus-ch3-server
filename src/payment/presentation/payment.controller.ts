import { BadRequestException, Body, Controller, NotFoundException, Post } from "@nestjs/common";
import { PaymentService } from "../domain/service/payment.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProcessPaymentReqDto } from "./dto/process-payment.req.dto";
import { ProcessPaymentResDto } from "./dto/process-payment.res.dto";
import { ProcessPaymentFacadeReqDto } from "../application/dto/process-payment.facade.req.dto";
import { PaymentFacade } from "../application/payment.facade";

@ApiTags("Payment Management")
@Controller("payment")
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly payemntFacade: PaymentFacade,
  ) {}

  @Post("process")
  @ApiOperation({ summary: "processPayment" })
  @ApiResponse({ status: 200, description: "200 - OK", type: ProcessPaymentResDto })
  @ApiResponse({ status: 400, description: "400 - BadRequest", type: BadRequestException })
  @ApiResponse({ status: 404, description: "404 - NotFound", type: NotFoundException })
  async processPayment(@Body() processPaymentReqDto: ProcessPaymentReqDto): Promise<ProcessPaymentResDto> {
    const processPaymentFacadeReqDto: ProcessPaymentFacadeReqDto = {
      ...processPaymentReqDto,
    };

    return await this.payemntFacade.processPayment(processPaymentFacadeReqDto);
  }
}
