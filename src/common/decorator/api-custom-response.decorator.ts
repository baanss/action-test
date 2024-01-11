import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { ExamplesObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

interface ApiCustomResponseOptions {
  examples?: ExamplesObject;
}

export const ApiCustomResponse = (options: ApiCustomResponseOptions = {}) => {
  const { examples = null } = options;
  return applyDecorators(
    ApiResponse({
      description: "기본 예외처리(인증 미들웨어를 거치지 않음)",
      content: {
        "application/json": {
          examples: {
            // validationPipe 검증
            BAD_REQUEST: {
              description: "DTO 유효성 검사",
              value: HutomHttpException.BAD_REQUEST,
            },
            ...examples,
          },
        },
      },
    })
  );
};
