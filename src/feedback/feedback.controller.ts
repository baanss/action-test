import { Body, Controller, Get, HttpCode, HttpException, Param, Post } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { Role } from "@src/auth/interface/auth.interface";
import { Roles } from "@src/common/guard/role.guard";
import { CreateFeedbackService } from "@src/feedback/service/create-feedback.service";
import { FeedbackService } from "@src/feedback/service/feedback.service";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ApiCloudAuthResponse } from "@src/common/decorator/api-cloud-auth-response.decorator";
import { HCLOUD_SERVER } from "@src/common/middleware/server-auth.middleware";

import { FeedbackDto } from "@src/feedback/dto/feedback.dto";
import { GetFeedbackRes, PostFeedbackReq, PostFeedbackRes } from "@src/feedback/dto";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";

@ApiTags("feedbacks")
@ApiOriginHeaders()
@Controller("feedbacks")
export class FeedbackController {
  constructor(private readonly createFeedbackService: CreateFeedbackService, private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiCustomOperation({
    summary: "특정 케이스의 피드백 등록",
    description: "전달받은 huId와 매칭되는 RusCase에 피드백을 등록한다.",
    tokens: [HCLOUD_SERVER],
  })
  @ApiResponse({ description: "OK", status: 200, type: PostFeedbackRes })
  @ApiCloudAuthResponse({
    examples: {
      NOT_FOUND_RUS_CASE_WITH_HUID: {
        description: "huId를 가진 케이스가 존재하지 않는 경우",
        value: HutomHttpException.NOT_FOUND_RUS_CASE_WITH_HUID,
      },
    },
  })
  @HttpCode(200)
  async create(@Body() postFeedbackReq: PostFeedbackReq): Promise<PostFeedbackRes> {
    const feedbackId = await this.createFeedbackService.create(postFeedbackReq);
    return { id: feedbackId };
  }

  @Get(":id")
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "특정 케이스의 피드백 조회",
    description: "특정 케이스의 피드백을 조회한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiResponse({ description: "OK", status: 200, type: GetFeedbackRes })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_FEEDBACK_WITH_ID: {
        description: "피드백이 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_FEEDBACK_WITH_ID,
      },
    },
  })
  async findOne(@Param("id") id: number): Promise<GetFeedbackRes> {
    const feedback = await this.feedbackService.getOneById(id);
    if (!feedback) {
      throw new HttpException(HutomHttpException.NOT_FOUND_FEEDBACK_WITH_ID, HutomHttpException.NOT_FOUND_FEEDBACK_WITH_ID.statusCode);
    }
    return FeedbackDto.from(feedback);
  }
}
