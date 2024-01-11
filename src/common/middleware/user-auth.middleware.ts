import { NextFunction, Response } from "express";
import { HttpException, Injectable, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AuthService } from "@src/auth/service/auth.service";
import { SessionService } from "@src/auth/service/session.service";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { RequestWithUser } from "@src/common/interface/request.interface";
import { AuthConfig, CoreConfig } from "@src/common/config/configuration";

export enum CustomOrigin {
  USER = "user",
  ADMIN = "admin",
  RUS_CLIENT = "rus-client",
}

export enum RusServiceCode {
  STOMACH = "sto",
  KIDNEY = "kid",
}

@Injectable()
export class UserAuthMiddleware implements NestMiddleware {
  private authHeaderPrefix = "Bearer ";
  private coreConfig: CoreConfig;

  constructor(private readonly configService: ConfigService, private readonly authService: AuthService, private readonly sessionService: SessionService) {
    this.coreConfig = this.configService.get<CoreConfig>("core");
  }

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    // x-origin 검증
    const customOrigin = req.headers["x-origin"] as CustomOrigin;
    const isValidOrigin = Object.values(CustomOrigin).includes(customOrigin);
    if (!isValidOrigin) {
      return next(new HttpException(HutomHttpException.UNAUTHORIZED_ORIGIN, HutomHttpException.UNAUTHORIZED_ORIGIN.statusCode));
    }

    let accessToken: string;
    let sessionToken: string;

    switch (customOrigin) {
      case "user":
        accessToken = req.cookies?.accessToken;
        sessionToken = req.cookies?.sessionToken;
        break;
      case "rus-client":
        const authHeader = req.headers.authorization;
        const serverAuthHeader = req.headers["x-auth-token"] ?? RusServiceCode.STOMACH;

        if (!authHeader?.startsWith(this.authHeaderPrefix)) {
          return next(new HttpException(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN, HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.statusCode));
        }
        if (serverAuthHeader !== this.coreConfig.serviceCode) {
          return next(new HttpException(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN, HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.statusCode));
        }
        accessToken = authHeader?.slice(this.authHeaderPrefix.length);
        break;
    }

    // 사용자 검증
    try {
      const [verifiedToken, authenticatedUser] = await this.authService.getAuthenticatedUser(accessToken, sessionToken, customOrigin);

      // 세션 업데이트 진행 조건문
      const shouldUpdateSession = (origin: string, method: string, baseUrl: string) => {
        // 세션 업데이트 제외 API
        const excludeEndpoints = [
          { method: "GET", path: "/auth" },
          { method: "GET", path: "/auth/logout" },
          { method: "GET", path: "/notifications/unread-count" },
        ];
        // 세션 업데이트 허용 Origin
        const isValidOrigin = origin === CustomOrigin.USER;
        const isValidEndpoint =
          excludeEndpoints.findIndex((endpoint) => {
            return method === endpoint.method && baseUrl.startsWith(endpoint.path);
          }) === -1;
        return isValidOrigin && isValidEndpoint;
      };

      if (shouldUpdateSession(customOrigin, req.method, req.baseUrl)) {
        // 사용자 JWT 업데이트
        const accessToken = this.authService.generateJwtToken(authenticatedUser);

        // Session ExpiresIn 업데이트
        await this.sessionService.updateSession(authenticatedUser);

        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          maxAge: Number(this.configService.get<AuthConfig>("auth").jwtExpiresIn),
        });
      }

      req.verifiedToken = verifiedToken;
      req.user = authenticatedUser;

      return next();
    } catch (error) {
      if (
        error.response?.error === HutomHttpException.UNAUTHORIZED_SESSION_DUPLICATED.error ||
        error.response?.error === HutomHttpException.UNAUTHORIZED_SESSION_DELETED.error
      ) {
        res.clearCookie("accessToken");
        res.clearCookie("sessionToken");
      }
      return next(error);
    }
  }
}
