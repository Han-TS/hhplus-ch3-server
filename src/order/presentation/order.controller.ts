import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { OrderService } from "../domain/service/order.service";
import { OrderProductReqDto } from "./dto/order-product.req.dto";
import { OrderProductResDto } from "./dto/order-product.res.dto";
import { OrderProductCommand } from "../domain/dto/order-product.command.dto";
import { CancelOrderReqDto } from "./dto/cancel-order.req.dto";
import { CancelOrderResDto } from "./dto/cancel-order.res.dto";
import { CancelOrderCommand } from "../domain/dto/cancel-order.command.dto";
import { GetOrderCommand } from "../domain/dto/get-order.command.dto";
@ApiTags("Order Management")
@Controller("order")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get(":orderId")
  @ApiOperation({ summary: "orderProduct" })
  @ApiResponse({ status: 200, description: "200 - OK", type: OrderProductResDto })
  @ApiResponse({ status: 404, description: "404 - NotFound", type: NotFoundException })
  async getOrder(@Param("orderId", ParseIntPipe) orderId: number) {
    const getOrderCommand: GetOrderCommand = {
      orderId
    }
    return await this.orderService.getOrder(getOrderCommand);
  }

  // @Get("v2/:orderId")
  // @ApiOperation({ summary: "orderProduct" })
  // @ApiResponse({ status: 200, description: "200 - OK", type: OrderProductResDto })
  // @ApiResponse({ status: 404, description: "404 - NotFound", type: NotFoundException })
  // async getOrderV2(@Param("orderId", ParseIntPipe) orderId: number) {
  //   const getOrderCommand: GetOrderCommand = {
  //     orderId
  //   }
  //   return await this.orderService.getOrderV2(getOrderCommand);
  // }

  @Post("")
  @ApiOperation({ summary: "orderProduct" })
  @ApiResponse({ status: 200, description: "200 - OK", type: OrderProductResDto })
  @ApiResponse({ status: 404, description: "404 - NotFound", type: NotFoundException })
  async orderProduct(@Body() orderProductReqDto: OrderProductReqDto): Promise<OrderProductResDto> {
    const command: OrderProductCommand = {
      ...orderProductReqDto,
    };

    return await this.orderService.orderProduct(command);
  }

  @Post("cancel")
  @ApiOperation({ summary: "cancelOrder" })
  @ApiResponse({ status: 200, description: "OK", type: CancelOrderResDto })
  @ApiResponse({ status: 404, description: "주문을 찾을 수 없습니다." })
  async cancelOrder(@Body() cancelOrderReqDto: CancelOrderReqDto): Promise<CancelOrderResDto> {
    const command: CancelOrderCommand = {
      ...cancelOrderReqDto,
    };

    return await this.orderService.cancelOrder(command);
  }
}
