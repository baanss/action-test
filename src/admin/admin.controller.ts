import { Body, Controller, HttpCode, HttpException, Post } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ApiCloudAuthResponse } from "@src/common/decorator/api-cloud-auth-response.decorator";

import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { HCLOUD_SERVER } from "@src/common/middleware/server-auth.middleware";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { DeleteAdminReq, DeleteAdminRes, PostAdminReq, PostAdminRes } from "@src/admin/dto";

import { UserService } from "@src/user/service/user.service";
import { LoggerService } from "@src/logger/logger.service";

@ApiTags("admin")
@ApiOriginHeaders()
@Controller("admins")
export class AdminController {
  constructor(private readonly userService: UserService, private readonly loggerService: LoggerService) {}

  @Post()
  @ApiCustomOperation({
    description: "대표 계정 생성",
    summary: "대표 계정을 생성한다.",
    tokens: [HCLOUD_SERVER],
  })
  @HttpCode(200)
  @ApiOkResponse({ description: "대표 계정 생성 / 승격", type: PostAdminRes })
  @ApiCloudAuthResponse({
    examples: {
      LIMIT_EXCEEDED: {
        description: "이미 대표 계정이 존재하는 경우 (한도: 1)",
        value: HutomHttpException.LIMIT_EXCEEDED,
      },
      DUPLICATED_USER_EMPLOYEE_ID: {
        description: "사용자 정보가 중복되는 경우(employeeId)",
        value: HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID,
      },
      DUPLICATED_USER_PHONE_NUMBER: {
        description: "사용자 정보가 중복되는 경우(phoneNumber)",
        value: HutomHttpException.DUPLICATED_USER_PHONE_NUMBER,
      },
      UPDATE_DATA_ERROR: {
        description: "사용자 수정 실패",
        value: HutomHttpException.UPDATE_DATA_ERROR,
      },
    },
  })
  async createAdmin(@Body() postAdminReq: PostAdminReq): Promise<PostAdminRes> {
    const { email, employeeId, phoneNumber = null, name } = postAdminReq;
    const dto = {
      email,
      employeeId,
      phoneNumber,
      name,
    };

    // FIXME: getAdmin 검증 + getOneByEmail 검증 -> canCreateAdmin: Boolean으로 Refactor
    const adminUser = await this.userService.getAdmin();
    if (adminUser) {
      throw new HttpException(HutomHttpException.LIMIT_EXCEEDED, HutomHttpException.LIMIT_EXCEEDED.statusCode);
    }

    let result: { id: number; isCreated: boolean };
    const user = await this.userService.getOneByEmail(email);

    // 대표 계정 승격
    if (user) {
      const adminId = await this.userService.advanceAdmin(user, { employeeId, phoneNumber, name });
      result = { id: adminId, isCreated: false };
    }
    // 대표 계정 생성
    else {
      const adminId = await this.userService.registerAdmin(dto);
      result = { id: adminId, isCreated: true };
    }

    return result;
  }

  @Post("delete")
  @ApiCustomOperation({
    description: "대표 계정 삭제",
    summary: "대표 계정을 삭제한다.",
    tokens: [HCLOUD_SERVER],
  })
  @ApiOkResponse({
    type: DeleteAdminRes,
    description: "삭제된 대표 계정의 수",
  })
  @ApiCloudAuthResponse({
    examples: {
      NOT_FOUND_DATA: {
        description: "대표 계정을 찾을 수 없음",
        value: HutomHttpException.NOT_FOUND_DATA,
      },
      // TODO: 사용되는 에러 코드 교체 논의 필요. (UNAUTHORIZED)
      INVALID_REQUEST_BODY: {
        description: "입력된 email과 employeeId의 정보가 대표 계정의 정보와 일치하지 않음",
        value: HutomHttpException.INVALID_REQUEST_BODY,
      },
      INVALID_DELETE_ADMIN_BY_CREDIT: {
        description: "크레딧이 남아있을 때, 대표 계정을 삭제할 수 없음.",
        value: HutomHttpException.INVALID_DELETE_ADMIN_BY_CREDIT,
      },
      INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS: {
        description: "사용자가 요청한 RUS Case가 작업중이기 때문에 계정을 삭제할 수 없음",
        value: HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS,
      },
    },
  })
  async deleteAdmin(@Body() deleteAdminReq: DeleteAdminReq): Promise<DeleteAdminRes> {
    const { affected } = await this.userService.deleteAdmin(deleteAdminReq);
    return { affected };
  }
}
