import * as fs from "fs";
import { Controller, Post, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger";

import { installerMulterOption } from "@src/common/option/installer-multer.option";
import { CreateInstallerSerivce } from "@src/installer/service/create-installer.service";
import { File } from "@src/common/decorator/file.decorator";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { PostInstallerReq, PostInstallerRes } from "@src/installer/dto";
import { HCLOUD_SERVER } from "@src/common/middleware/server-auth.middleware";
import { ApiCloudAuthResponse } from "@src/common/decorator/api-cloud-auth-response.decorator";

@ApiTags("installer")
@ApiOriginHeaders()
@Controller("installers")
export class InstallerController {
  constructor(private readonly createInstallerService: CreateInstallerSerivce) {}

  @Post()
  @UseInterceptors(FileInterceptor("file", installerMulterOption))
  @ApiCustomOperation({
    summary: "설치파일 등록",
    description: "RUS Client 설치파일을 등록한다.",
    tokens: [HCLOUD_SERVER],
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "RUS Client 설치파일",
    type: PostInstallerReq,
  })
  @ApiResponse({
    status: 201,
    description: "Created",
    type: PostInstallerRes,
  })
  @ApiCloudAuthResponse()
  async create(@File() file: Express.Multer.File): Promise<PostInstallerRes> {
    try {
      // 설치파일 엔티티를 생성한다.
      const createdOne = await this.createInstallerService.createOne(file);
      return { id: createdOne.id };
    } catch (error) {
      // 업로드 실패한 파일 삭제
      await fs.promises.rm(file.path);
      throw error;
    }
  }
}
