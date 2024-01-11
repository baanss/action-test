import { applyDecorators } from "@nestjs/common";
import { ApiHeaders } from "@nestjs/swagger";
import { CustomOrigin, RusServiceCode } from "@src/common/middleware/user-auth.middleware";
import { HCLOUD_SERVER, SERVER_CODE, SERVICE_CODE } from "@src/common/middleware/server-auth.middleware";

export const ApiOriginHeaders = () => {
  return applyDecorators(
    ApiHeaders([
      {
        name: "X-Origin",
        description: `* ${CustomOrigin.USER}: h-Server 서비스 요청\n\n* ${CustomOrigin.RUS_CLIENT}: RUS Client 요청`,
        schema: {
          enum: [CustomOrigin.USER, CustomOrigin.RUS_CLIENT],
        },
      },
      {
        name: "X-Auth-Token",
        description: `* ${SERVICE_CODE}: RUS Client 요청[${RusServiceCode.STOMACH}(default), ${RusServiceCode.KIDNEY}]\n\n* ${SERVER_CODE}: 다이콤 서버 요청\n\n* ${HCLOUD_SERVER}: h-Cloud 서버 요청`,
        schema: {
          enum: [SERVICE_CODE, SERVER_CODE, HCLOUD_SERVER],
        },
      },
    ])
  );
};
