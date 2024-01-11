import { Response } from "express";
import { Body, Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBody, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthConfig } from "@src/common/config/configuration";
import { Roles } from "@src/common/guard/role.guard";
import { RequestWithUser } from "@src/common/interface/request.interface";
import { LogType, ServiceType } from "@src/common/constant/enum.constant";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { SERVICE_CODE } from "@src/common/middleware/server-auth.middleware";
import { ApiCustomResponse } from "@src/common/decorator/api-custom-response.decorator";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { LoggerService } from "@src/logger/logger.service";

import { LoginRes } from "@src/auth/dto/out/login-res.dto";
import { AppLoginReq, UserLoginReq } from "@src/auth/dto/in/login-req.dto";
import { AuthRes } from "@src/auth/dto/out/auth-res.dto";
import { Role } from "@src/auth/interface/auth.interface";
import { AuthService } from "@src/auth/service/auth.service";
import { SessionService } from "@src/auth/service/session.service";

@ApiTags("auth")
@ApiOriginHeaders()
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  @Post("user/login")
  @ApiCustomOperation({
    summary: "일반 사용자 로그인",
    description: "로그인 요청 후 응답의 Set-Cookie 헤더로 accessToken을 받는다.",
  })
  @ApiBody({ type: UserLoginReq })
  @ApiOkResponse({
    headers: {
      "Set-Cookie": {
        example: "accessToken",
        description: "accessToken=xxxxx; Max-Age=xxx; Path=/; Expires=Wed, 28 Sep 2022 17:08:46 GMT; HttpOnly",
        schema: { type: "string" },
      },
    },
    description: "로그인 성공",
  })
  @ApiCustomResponse({
    examples: {
      BAD_REQUEST: {
        description: "DTO 유효성 검사",
        value: HutomHttpException.BAD_REQUEST,
      },
      UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID: {
        description: "로그인 실패 - employeeId가 없거나 비활성화 처리됐거나 role이 user가 아닌 경우",
        value: HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID,
      },
      LOCKED_PASSWORD_USER: {
        description: "로그인 잠금 - 비밀번호 오류 5회 이상 누적",
        value: HutomHttpException.LOCKED_PASSWORD_USER,
      },
      UNAUTHORIZED_INVALID_PASSWORD: {
        description: "로그인 실패 - 비밀번호 틀림",
        value: HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD,
      },
      DUPLICATED_SESSION_DETECTED: {
        description: "로그인 실패 - 중복 로그인 시도 감지",
        value: HutomHttpException.DUPLICATED_SESSION_DETECTED,
      },
      PASSWORD_INIT_REQUIRED: {
        description: "비밀번호 초기 설정 미진행",
        value: HutomHttpException.PASSWORD_INIT_REQUIRED,
      },
    },
  })
  @HttpCode(200)
  async userLogin(@Res() res: Response, @Body() loginReq: UserLoginReq) {
    try {
      const { accessToken, sessionToken } = await this.authService.userLogin(loginReq);
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: Number(this.configService.get<AuthConfig>("auth").jwtExpiresIn),
      });
      res.cookie("sessionToken", sessionToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24h
      });
      this.loggerService.access(ServiceType.USER, null, LogType.LOG_IN, loginReq.employeeId);
      return res.send();
    } catch (error) {
      this.loggerService.access(ServiceType.USER, null, LogType.LOG_IN, `${loginReq.employeeId}, (failed) ${error?.getResponse()["error"]}`);
      throw error;
    }
  }

  @Post("rus-client/login")
  @ApiCustomOperation({
    summary: "RUS Client 사용자 로그인",
    description: "로그인 요청 후 응답의 바디로 accessToken을 받는다.",
    tokens: [SERVICE_CODE],
  })
  @ApiOkResponse({ type: LoginRes, description: "액세스 토큰" })
  @ApiCustomResponse({
    examples: {
      // validationPipe 검증
      BAD_REQUEST: {
        description: "DTO 유효성 검사",
        value: HutomHttpException.BAD_REQUEST,
      },
      // rusClientLogin
      UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID: {
        description: "계정 ID가 유효하지 않음",
        value: HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID,
      },
      UNAUTHORIZED_INVALID_PASSWORD: {
        description: "비밀번호 틀림",
        value: HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD,
      },
    },
  })
  @HttpCode(200)
  async rusClientLogin(@Body() loginReq: AppLoginReq): Promise<LoginRes> {
    try {
      const { accessToken } = await this.authService.rusClientLogin(loginReq);
      this.loggerService.access(ServiceType.RUS_CLIENT, null, LogType.LOG_IN, loginReq.employeeId);
      return { accessToken };
    } catch (error) {
      this.loggerService.access(ServiceType.RUS_CLIENT, null, LogType.LOG_IN, `${loginReq.employeeId}, (failed) ${error?.getResponse()["error"]}`);
      throw error;
    }
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "토큰 정보 조회",
    description: "Cookie header에 있는 accessToken을 검증하고, 토큰에 담긴 정보를 조회한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiOkResponse({ type: AuthRes, description: "조회 성공" })
  @ApiUserAuthResponse()
  async getAuth(@Req() req: RequestWithUser): Promise<AuthRes> {
    return {
      id: req.user.id,
      employeeId: req.user.employeeId,
      role: req.user.role,
      expiresIn: Math.floor(req.verifiedToken.exp - Date.now() / 1000),
      showGuide: req.user.showGuide,
      passwordSettingAt: req.user.passwordSettingAt.toISOString(),
      enableEmail: req.user.enableEmail,
    };
  }

  @Get("logout")
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "로그아웃",
    description: "Cookie의 AccessToken 및 SessionToken을 만료시킨다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiOkResponse({
    headers: {
      "Set-Cookie": {
        example: "accessToken",
        description: "accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        schema: { type: "string" },
      },
    },
    description: "로그아웃 성공",
  })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_DATA: {
        description: "session 없음",
        value: HutomHttpException.NOT_FOUND_DATA,
      },
    },
  })
  async logout(@Req() req: RequestWithUser, @Res() res: Response) {
    await this.sessionService.sessionLogout(req.user.id);
    res.clearCookie("accessToken");
    res.clearCookie("sessionToken");
    this.loggerService.access(ServiceType.USER, req.user.employeeId, LogType.LOG_OUT);
    return res.end();
  }
}
