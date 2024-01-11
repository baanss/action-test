import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { Request, Response } from "express";
import * as fs from "fs";

@Catch(HttpException)
export class AfterSavingProfileExceptionFilter implements ExceptionFilter {
  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 프로필 이미지 삭제
    if (request.file?.fieldname === "profile") {
      await fs.promises.rm(request.file.path);
    }

    response
      .status(exception.getStatus())
      .json(exception.getResponse());
  }
}
