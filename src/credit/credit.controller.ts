import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ApiCloudAuthResponse } from "@src/common/decorator/api-cloud-auth-response.decorator";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { HCLOUD_SERVER } from "@src/common/middleware/server-auth.middleware";
import { CreditHistoryService } from "@src/credit-history/service/credit-history.service";
import { GetCreditRes, PostCreditAllocateReq, PostCreditAllocateRes, PostCreditRevokeReq, PostCreditRevokeRes } from "@src/credit/dto";

@ApiTags("credit")
@ApiOriginHeaders()
@Controller("credits")
export class CreditController {
  constructor(private readonly creditHistoryService: CreditHistoryService) {}

  @Get()
  @ApiCustomOperation({
    description: "크레딧 수 조회",
    summary: "총 크레딧 수를 조회한다.",
    tokens: [HCLOUD_SERVER],
  })
  @ApiResponse({ description: "OK", status: 200, type: GetCreditRes })
  @ApiCloudAuthResponse()
  async getTotalCredit(): Promise<GetCreditRes> {
    const totalCredit = await this.creditHistoryService.getTotalCredit();
    return { totalCredit };
  }

  @Post("allocate")
  @ApiCustomOperation({
    description: "크레딧 발행",
    summary: "크레딧을 발행한다.",
    tokens: [HCLOUD_SERVER],
  })
  @ApiResponse({ description: "OK", status: 200, type: PostCreditAllocateRes })
  @ApiCloudAuthResponse({
    examples: {
      NOT_FOUND_DATA: {
        description: "알림을 생성할 대표 계정이 존재하지 않는 경우",
        value: HutomHttpException.NOT_FOUND_DATA,
      },
      LIMIT_EXCEEDED: {
        description: "최대 요청 개수를 초과한 경우",
        value: HutomHttpException.LIMIT_EXCEEDED,
      },
    },
  })
  @HttpCode(200)
  async allocate(@Body() body: PostCreditAllocateReq): Promise<PostCreditAllocateRes> {
    const { totalCredit } = await this.creditHistoryService.createAllocate(body.quantity);
    return { totalCredit };
  }

  @Post("revoke")
  @ApiCustomOperation({
    description: "크레딧 회수",
    summary: "크레딧을 회수한다.",
    tokens: [HCLOUD_SERVER],
  })
  @ApiResponse({ description: "OK", status: 200, type: PostCreditRevokeRes })
  @ApiCloudAuthResponse({
    examples: {
      NOT_FOUND_DATA: {
        description: "알림을 생성할 대표 계정이 존재하지 않는 경우",
        value: HutomHttpException.NOT_FOUND_DATA,
      },
      LIMIT_EXCEEDED: {
        description: "최대 요청 개수를 초과한 경우",
        value: HutomHttpException.LIMIT_EXCEEDED,
      },
    },
  })
  @HttpCode(200)
  async revoke(@Body() body: PostCreditRevokeReq): Promise<PostCreditRevokeRes> {
    const { totalCredit } = await this.creditHistoryService.createRevoke(body.quantity);
    return { totalCredit };
  }
}
