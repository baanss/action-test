import { applyDecorators } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

interface ApiCustomOperationOptions {
  summary?: string;
  description?: string;
  roles?: string[];
  tokens?: string[];
  deprecated?: boolean;
}

export const ApiCustomOperation = (options: ApiCustomOperationOptions) => {
  const { summary = null, description = null, roles = "-", tokens = "-", deprecated = false } = options;
  return applyDecorators(
    ApiOperation({
      summary,
      description: `${description}\n\n* 사용자 권한: ${roles}\n\n* x-auth-token: ${tokens}`,
      deprecated: deprecated,
    })
  );
};
