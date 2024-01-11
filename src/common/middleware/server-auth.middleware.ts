import { NextFunction, Request, Response } from "express";
import { HttpException, Injectable, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CoreConfig } from "@src/common/config/configuration";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { RusServiceCode } from "@src/common/middleware/user-auth.middleware";

// x-auth-token 헤더
/**
 * h-Cloud 서버
 * * 사용 위치: HCloudServerAuthMiddleware
 */
export const HCLOUD_SERVER = "hcloud-server";
/**
 * SERVER_CODE
 * * 사용 위치: Swagger 명세서(다이콤 서버)
 */
export const SERVER_CODE = process.env.SERVER_CODE;
/**
 * RUS 서비스 코드
 * * 사용 위치: Swagger 명세서(rus-client)
 */
export const SERVICE_CODE = process.env.SERVICE_CODE ?? RusServiceCode.STOMACH;

@Injectable()
export class ServerAuthMiddleware implements NestMiddleware {
  private coreConfig: CoreConfig;

  constructor(private readonly configService: ConfigService) {
    this.coreConfig = this.configService.get<CoreConfig>("core");
  }

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["x-auth-token"];

    if (authHeader !== this.coreConfig.serverCode) {
      return next(new HttpException(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN, HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.statusCode));
    }
    next();
  }
}

@Injectable()
export class HCloudServerAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["x-auth-token"];

    if (authHeader !== HCLOUD_SERVER) {
      return next(new HttpException(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN, HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.statusCode));
    }
    next();
  }
}

@Injectable()
export class RusServiceAuthMiddleware implements NestMiddleware {
  private coreConfig: CoreConfig;

  constructor(private readonly configService: ConfigService) {
    this.coreConfig = this.configService.get<CoreConfig>("core");
  }

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["x-auth-token"] ?? RusServiceCode.STOMACH;

    if (authHeader !== this.coreConfig.serviceCode) {
      return next(new HttpException(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN, HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.statusCode));
    }
    next();
  }
}
