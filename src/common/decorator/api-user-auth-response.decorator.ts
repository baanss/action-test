import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { ExamplesObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import { Role } from "@src/auth/interface/auth.interface";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

interface ApiCustomResponseOptions {
  examples?: ExamplesObject;
}

export const ApiUserAuthResponse = (options: ApiCustomResponseOptions = {}) => {
  const { examples = null } = options;
  return applyDecorators(
    ApiResponse({
      description: `사용자 인증 예외처리\n\n* 요청 권한: ${[
        Role.USER,
        Role.ADMIN,
      ]}\n\n* 공통: BAD_REQUEST, UNAUTHORIZED_ORIGIN, UNAUTHORIZED_AUTH_TOKEN, UNAUTHORIZED, UNAUTHORIZED_SESSION_DUPLICATED, NOT_FOUND_USER_WITH_ID`,
      content: {
        "application/json": {
          examples: {
            // validationPipe 검증
            BAD_REQUEST: {
              description: "DTO 유효성 검사",
              value: HutomHttpException.BAD_REQUEST,
            },
            // UserAuthModdleware
            UNAUTHORIZED_ORIGIN: {
              description: "X-Origin 정보가 잘못됨",
              value: HutomHttpException.UNAUTHORIZED_ORIGIN,
            },
            UNAUTHORIZED_AUTH_TOKEN: {
              description: "[rus-client] X-Auth-Token 정보가 잘못됨",
              value: HutomHttpException.UNAUTHORIZED_AUTH_TOKEN,
            },
            // authService.getAuthenticatedUser 검사
            UNAUTHORIZED: {
              description: "토큰 인증 오류",
              value: HutomHttpException.UNAUTHORIZED,
            },
            UNAUTHORIZED_SESSION_DUPLICATED: {
              description: "사용자의 토큰이 세션의 토큰과 불일치",
              value: HutomHttpException.UNAUTHORIZED_SESSION_DUPLICATED,
            },
            NOT_FOUND_USER_WITH_ID: {
              description: "계정이 존재하지 않음",
              value: HutomHttpException.NOT_FOUND_USER_WITH_ID,
            },
            // RoleGuard
            FORBIDDEN_RESOURCE: {
              description: "자원에 접근 권한이 없는 경우",
              value: HutomHttpException.FORBIDDEN_RESOURCE,
            },
            ...examples,
          },
        },
      },
    })
  );
};
