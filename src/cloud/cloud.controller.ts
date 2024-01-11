import { Controller, Get, HttpCode } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { CloudService } from "@src/cloud/service/cloud.service";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiCustomResponse } from "@src/common/decorator/api-custom-response.decorator";

import { GetCloudRes } from "@src/cloud/dto";

@ApiTags("cloud")
@ApiOriginHeaders()
@Controller("cloud")
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  /**
   * h-Space 연결 상태 확인
   * @returns GetCloudRes
   */
  @Get("echo")
  @ApiCustomOperation({
    summary: "h-Space 연결 상태 조회",
    description: "h-Space 연결 상태를 확인한다.",
  })
  @HttpCode(200)
  @ApiResponse({ status: 200, description: "h-Space 연결 성공" })
  @ApiCustomResponse({
    examples: {
      HCLOUD_NOT_WORKING: {
        description: "h-Space 서버 동작 오류",
        value: HutomHttpException.HCLOUD_NOT_WORKING,
      },
    },
  })
  async checkConnection(): Promise<GetCloudRes> {
    const message = await this.cloudService.healthCheck();
    return { message };
  }
}
