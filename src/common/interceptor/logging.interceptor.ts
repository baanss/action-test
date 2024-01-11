import { CallHandler, ExecutionContext, HttpException, Inject, Injectable, NestInterceptor } from "@nestjs/common";
import { Logger as WinstonLogger } from "winston";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Observable, catchError, throwError, tap } from "rxjs";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: WinstonLogger
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const { method, url, ip } = context.getArgByIndex(0);
    const request = context.switchToHttp().getRequest();
    const clientIp = request.headers["x-forwarded-for"] ?? ip;

    return next.handle().pipe(
      tap(() => {
        const { statusCode = "-", message = "-" } = context.switchToHttp().getResponse();
        this.logger.info({ request: `${clientIp} ${method} ${url}`, message: `${statusCode} ${message}` });
      }),
      catchError((error) => {
        if (error instanceof HttpException) {
          this.logger.error({
            request: `${clientIp} ${method} ${url}`,
            message: `${error?.getStatus() ?? "-"} ${JSON.stringify(error.getResponse()["error"]) ?? "-"}`,
          });
        } else {
          this.logger.error({
            request: `${clientIp} ${method} ${url}`,
            message: `- ${HutomHttpException.UNEXPECTED_ERROR.error}`,
          });
        }
        return throwError(() => error);
      })
    );
  }
}
