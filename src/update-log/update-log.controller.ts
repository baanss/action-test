import * as fs from "fs";
import { Controller, Post, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger";

import { File } from "@src/common/decorator/file.decorator";
import { updateLogMulterOption } from "@src/common/option/update-log-multer.option";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";

import { CreateUpdateLogService } from "@src/update-log/service/create-update-log.service";
import { PostUpdateLogReq, PostUpdateLogRes } from "@src/update-log/dto";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { HCLOUD_SERVER } from "@src/common/middleware/server-auth.middleware";

@ApiTags("update-log")
@ApiOriginHeaders()
@Controller("update-logs")
export class UpdateLogController {
  constructor(private readonly createUpdateLogService: CreateUpdateLogService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file", updateLogMulterOption))
  @ApiCustomOperation({
    summary: "업데이트로그 등록",
    description: "RUS Client 업데이트로그 파일을 등록한다.",
    tokens: [HCLOUD_SERVER],
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "RUS Client 업데이트로그 파일",
    type: PostUpdateLogReq,
  })
  @ApiResponse({
    status: 201,
    description: "Created",
    type: PostUpdateLogRes,
  })
  @ApiUserAuthResponse()
  async create(@File() file: Express.Multer.File): Promise<PostUpdateLogRes> {
    try {
      const updateLog = await this.createUpdateLogService.createOne(file);
      return { id: updateLog.id };
    } catch (error) {
      await fs.promises.rm(file.path);
      throw error;
    }
  }
}
