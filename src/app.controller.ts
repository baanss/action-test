import { Controller, Get, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiProperty, ApiResponse } from "@nestjs/swagger";

import { ServerConfig } from "@src/common/config/configuration";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomResponse } from "@src/common/decorator/api-custom-response.decorator";
import { CoreConfig } from "@src/common/config/configuration";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { RedisService } from "@src/cache/service/redis.service";
import { RedisFlag } from "@src/cache/constant/enum.constant";
import { CreditHistoryService } from "@src/credit-history/service/credit-history.service";

class GetServerStatus {
  @ApiProperty({ description: "서비스 상태", example: "running" })
  status: string;

  @ApiProperty({ description: "서비스 환경(env: SERVER_CODE)", example: "01001ug" })
  name: string;

  @ApiProperty({ description: "서비스 버전(env: APP_VERSION)", example: "v1.0.0.0" })
  version: string;

  @ApiProperty({ description: "h-Server 접속 주소(env: REDIRECT_URL)", example: "https://localhost:3030" })
  redirectUrl: string;

  @ApiProperty({ description: "총 크레딧 개수", example: 0 })
  totalCredit: number;
}

@ApiOriginHeaders()
@Controller()
@Injectable()
export class AppController {
  private serverConfig: ServerConfig;
  private coreConfig: CoreConfig;

  constructor(private cacheManager: RedisService, private readonly configService: ConfigService, private readonly creditHistoryService: CreditHistoryService) {
    this.serverConfig = this.configService.get<ServerConfig>("server");
    this.coreConfig = this.configService.get<CoreConfig>("core");
  }

  @Get()
  @ApiCustomOperation({
    summary: "서비스 연결 점검",
    description: "h-Server 서비스가 정상적으로 동작하는지 점검한다.",
  })
  @ApiResponse({
    status: 200,
    description: "OK",
  })
  async checkConnection() {
    return "Server working!";
  }

  @Get("server-status")
  @ApiCustomOperation({
    summary: "서버 상태 조회",
    description: "h-Server 서버 상태를 조회한다.",
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: GetServerStatus,
  })
  @ApiCustomResponse()
  async getServerStatus(): Promise<GetServerStatus> {
    const totalCredit = await this.creditHistoryService.getTotalCredit();
    return {
      status: "running",
      name: this.coreConfig.serverCode,
      version: this.serverConfig.appVersion,
      redirectUrl: this.serverConfig.redirectUrl,
      totalCredit,
    };
  }

  @Get("custom-exception")
  @ApiCustomOperation({
    summary: "예외처리 목록",
    description: "h-Server에서 관리되는 예외처리 목록을 조회한다.",
  })
  @ApiResponse({
    description: "Custom",
    content: {
      "application/json": {
        examples: {
          HutomHttpException: {
            description: "HutomHttpException",
            value: HutomHttpException,
          },
        },
      },
    },
  })
  @ApiUserAuthResponse()
  getCustomException() {
    return HutomHttpException;
  }

  @Get("/cache")
  async useRedis() {
    await this.cacheManager.set(RedisFlag.STORAGE_SPACE, "new-value", { ttl: 10 });
    const value = await this.cacheManager.get(RedisFlag.STORAGE_SPACE);
    console.log(value); // value
    return value;
  }
}
