import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { timestamp } from "rxjs";

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = "Internal server error";

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      message = typeof res === "string" ? res : (res as any).message || (res as any).error || "Http Exception";
    } else if (exception instanceof Error) {
      message = exception.message;

      //   Prisma 예외 추가 처리
      if ((exception as any).code === "P2003") {
        // Foreign key constraint failed
        status = HttpStatus.BAD_REQUEST;
        message = "Foreign key constraint violated.";
      } else if ((exception as any).code === "P2002") {
        status = HttpStatus.CONFLICT;
        message = "Unique constraint failed";
      } else if ((exception as any).code === "P2025") {
        status = HttpStatus.NOT_FOUND;
        message = "Record not found";
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
