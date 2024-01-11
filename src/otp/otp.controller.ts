import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { ApiCustomResponse } from "@src/common/decorator/api-custom-response.decorator";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { GetOtpQueryReq, GetOtpRes, PostOtpBodyReq, PostOtpRes } from "@src/otp/dto";
import { OtpService } from "@src/otp/service/otp.service";

@ApiTags("otp")
@ApiOriginHeaders()
@Controller("otps")
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post()
  @ApiCustomOperation({
    summary: "otp 생성",
    description: "임시 비밀번호 발급 후 h-Space로 이메일을 전송한다.",
  })
  @ApiResponse({ description: "Created", status: 201, type: PostOtpRes })
  @ApiCustomResponse({
    examples: {
      NOT_FOUND_DATA: {
        description: "employeeId에 매칭되는 user를 찾을 수 없음",
        value: HutomHttpException.NOT_FOUND_DATA,
      },
      UNAUTHORIZED: {
        description: "email 틀림",
        value: HutomHttpException.UNAUTHORIZED,
      },
    },
  })
  async createOne(@Body() body: PostOtpBodyReq): Promise<PostOtpRes> {
    const { employeeId, email } = body;
    const result = await this.otpService.createOne({ employeeId, email });
    return { id: result.id };
  }

  @Get()
  @ApiCustomOperation({
    summary: "otp 검사",
    description: "otp의 유효성 검사한다.",
  })
  @ApiResponse({ description: "OK", status: 200, type: GetOtpRes })
  @ApiCustomResponse({
    examples: {
      NOT_FOUND_DATA: {
        description: "유효한 otp가 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_DATA,
      },
    },
  })
  async verifyOne(@Query() query: GetOtpQueryReq): Promise<GetOtpRes> {
    const { token } = query;
    const otp = await this.otpService.getValidOne(token);
    return { userId: otp.user.id, employeeId: otp.user.employeeId, name: otp.user.name };
  }
}
