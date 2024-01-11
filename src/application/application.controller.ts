import { Body, Controller, Get, HttpCode, Post, Query, Req } from "@nestjs/common";
import { ApiOkResponse, ApiResponse, ApiTags } from "@nestjs/swagger";

import { Role } from "@src/auth/interface/auth.interface";
import { Roles } from "@src/common/guard/role.guard";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiCustomResponse } from "@src/common/decorator/api-custom-response.decorator";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { RequestWithUser } from "@src/common/interface/request.interface";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { LogType, ServiceType } from "@src/common/constant/enum.constant";

import { LoggerService } from "@src/logger/logger.service";
import { ApplicationService } from "@src/application/service/application.service";

import {
  GetAllApplicationQueryReq,
  GetApplicationDto,
  GetAllApplicationRes,
  CreateApplicationReq,
  PostApplicationDto,
  PostApplicationRejectReq,
  DeleteApplicationRes,
  PostApplicationApproveReq,
  ApproveApplicationRes,
} from "@src/application/dto";

@ApiTags("application")
@ApiOriginHeaders()
@Controller("applications")
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService, private readonly loggerService: LoggerService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "가입신청서 조회 및 검색",
    description: "일반 계정이 요청한 가입신청서를 조회한다",
    roles: [Role.ADMIN],
  })
  @ApiUserAuthResponse()
  @ApiOkResponse({ description: "OK", status: 200, type: GetAllApplicationRes })
  async getApplicationsList(@Req() req: RequestWithUser, @Query() getAllApplicationQueryReq: GetAllApplicationQueryReq): Promise<GetAllApplicationRes> {
    const { employeeId = null, name = null, page = 1, limit = 20 } = getAllApplicationQueryReq;
    const queryDto = { employeeId, name, page, limit };

    const [applications, count] = await this.applicationService.getManyAndCount(queryDto);
    return {
      data: GetApplicationDto.fromMany(applications),
      count,
    };
  }

  @Post()
  @ApiCustomOperation({
    summary: "가입신청서 생성",
    description: "일반 계정의 가입 신청서를 생성한다.",
  })
  @ApiCustomResponse({
    examples: {
      DUPLICATED_USER_EMPLOYEE_ID: {
        description: "사용자 정보가 중복되는 경우(employeeId)",
        value: HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID,
      },
      DUPLICATED_USER_EMAIL: {
        description: "사용자 정보가 중복되는 경우(email)",
        value: HutomHttpException.DUPLICATED_USER_EMAIL,
      },
      DUPLICATED_USER_PHONE_NUMBER: {
        description: "사용자 정보가 중복되는 경우(phoneNumber)",
        value: HutomHttpException.DUPLICATED_USER_PHONE_NUMBER,
      },
    },
  })
  @ApiResponse({ status: 201, description: "Created", type: PostApplicationDto })
  async createOne(@Body() createApplicationReq: CreateApplicationReq): Promise<PostApplicationDto> {
    const savedId = await this.applicationService.createOne(createApplicationReq);
    return { id: savedId };
  }

  @Post("approve")
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "가입신청서 승인 처리",
    description: "대표 계정이 가입신청서를 승인한다.",
    roles: [Role.ADMIN],
  })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_DATA: {
        description: "요청한 가입 신청서가 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_DATA,
      },
    },
  })
  @ApiResponse({ status: 200, description: "생성된 사용자의 DB id 배열과, 실패 관련 부가 정보", type: ApproveApplicationRes })
  async approveApplications(@Req() req: RequestWithUser, @Body() postApplicationApproveReq: PostApplicationApproveReq): Promise<ApproveApplicationRes> {
    const { ids } = postApplicationApproveReq;
    const { ids: savedIds, failed } = await this.applicationService.approveMany(ids, { employeeId: req.user.employeeId });

    return { ids: savedIds, meta: { failed } };
  }

  @Post("reject")
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "가입신청서 거절 처리",
    description: "대표 계정이 가입신청서를 거절한다.",
    roles: [Role.ADMIN],
  })
  @ApiUserAuthResponse()
  @ApiResponse({ status: 200, description: "거절 처리된 가입 신청서의 수", type: DeleteApplicationRes })
  rejectApplications(@Req() req: RequestWithUser, @Body() postApplicationRejectReq: PostApplicationRejectReq): Promise<DeleteApplicationRes> {
    return this.applicationService.rejectMany(postApplicationRejectReq);
  }
}
