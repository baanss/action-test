import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { ExamplesObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { HCLOUD_SERVER } from "@src/common/middleware/server-auth.middleware";

interface ApiCustomResponseOptions {
  examples?: ExamplesObject;
}

export const ApiCloudAuthResponse = (options: ApiCustomResponseOptions = {}) => {
  const { examples = null } = options;
  return applyDecorators(
    ApiResponse({
      description: `h-Cloud 서버 인증 예외처리\n\n* 요청 권한: ${HCLOUD_SERVER}\n\n* 공통 에러코드: UNAUTHORIZED_AUTH_TOKEN`,
      content: {
        "application/json": {
          examples: {
            // validationPipe 검증
            BAD_REQUEST: {
              description: "DTO 유효성 검사",
              value: HutomHttpException.BAD_REQUEST,
            },
            // HCloudServerAuthMiddleware 검증
            UNAUTHORIZED_AUTH_TOKEN: {
              description: "X-Auth-Token 정보가 잘못됨",
              value: HutomHttpException.UNAUTHORIZED_AUTH_TOKEN,
            },
            ...examples,
          },
        },
      },
    })
  );
};
