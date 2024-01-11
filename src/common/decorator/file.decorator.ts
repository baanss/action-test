import { createParamDecorator, ExecutionContext, HttpException } from "@nestjs/common";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

export const File = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  if (!request?.file) {
    throw new HttpException(HutomHttpException.INVALID_REQUEST_FILE, HutomHttpException.INVALID_REQUEST_FILE.statusCode);
  }
  return request.file;
});
