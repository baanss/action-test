import { Request, Response } from "express";
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from "@nestjs/common";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("HttpExceptionHandler");

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      this.logger.error(JSON.stringify(exception.getResponse()));
      response.status(exception.getStatus()).json(exception.getResponse());
    } else {
      this.logger.error(
        JSON.stringify({
          ...HutomHttpException.UNEXPECTED_ERROR,
          stack: exception?.stack,
          timestamp: new Date().toISOString(),
          request: `${request.method} ${request.url}`,
        }),
      );
      response.status(HutomHttpException.UNEXPECTED_ERROR.statusCode).json(HutomHttpException.UNEXPECTED_ERROR);
    }
  }
}
