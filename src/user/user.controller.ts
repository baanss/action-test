import * as fs from "fs";

import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, HttpCode, HttpException, Param, Patch, Post, Query, Req, UploadedFile, UseFilters, UseInterceptors } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";

import { AfterSavingProfileExceptionFilter } from "@src/common/filter/after-saving-profile-exception.filter";
import { ServerConfig } from "@src/common/config/configuration";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { Roles } from "@src/common/guard/role.guard";
import { RequestWithUser } from "@src/common/interface/request.interface";

import { Role } from "@src/auth/interface/auth.interface";
import { UserService } from "@src/user/service/user.service";
import { UtilService } from "@src/util/util.service";

import {
  GetAllUserQueryReq,
  GetAllUserSortQuery,
  PatchUsersMeDto,
  PatchUsersMyPasswordDto,
  PatchUsersIdPasswordDto,
  PatchUsersDto,
  PostUserDto,
  DeleteManyDto,
  GetAllUserRes,
  GetAllUserViewDto,
  UserDto,
  UpdateUserRes,
  UpdatePasswordRes,
  UpdateProfileRes,
  DeleteUserRes,
  PostUserRes,
} from "@src/user/dto";

import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { LoggerService } from "@src/logger/logger.service";
import { LogType, OrderQuery, ServiceType } from "@src/common/constant/enum.constant";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { ApiCustomResponse } from "@src/common/decorator/api-custom-response.decorator";
import { SERVICE_CODE } from "@src/common/middleware/server-auth.middleware";
import { CustomOrigin } from "@src/common/middleware/user-auth.middleware";
import { OtpService } from "@src/otp/service/otp.service";

@ApiTags("user")
@ApiOriginHeaders()
@Controller("users")
export class UserController {
  private serverUrl: string;

  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
    private readonly utilService: UtilService,
    private readonly loggerService: LoggerService,
  ) {
    this.serverUrl = this.configService.get<ServerConfig>("server").serverUrl;
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "모든 사용자 정보 조회 및 검색",
    description: "서비스에 등록된 모든 사용자 정보를 가져온다.",
    roles: [Role.ADMIN],
  })
  @ApiUserAuthResponse()
  @ApiResponse({ description: "OK", status: 200, type: GetAllUserRes })
  async getManyUsers(@Req() req: RequestWithUser, @Query() getAllUserQueryReq: GetAllUserQueryReq): Promise<GetAllUserRes> {
    const { employeeId, name, page = 1, limit = 20 } = getAllUserQueryReq;
    const queryDto = {
      employeeId,
      name,
      page,
      limit,
      sort: GetAllUserSortQuery.USER_ROLE,
      order: OrderQuery.ASC,
    };
    const [users, count] = await this.userService.getManyAndCount(queryDto);
    return {
      data: GetAllUserViewDto.fromMany(users),
      count,
    };
  }

  @Get("me")
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiCustomOperation({
    summary: "현재 사용자 정보 조회",
    description: "요청을 보낸 사용자의 정보를 가져온다.",
    roles: [Role.ADMIN, Role.USER, CustomOrigin.RUS_CLIENT],
    tokens: [SERVICE_CODE],
  })
  @ApiOkResponse({ type: UserDto })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_USER_WITH_ID: {
        description: "인증된 토큰의 계정이 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_USER_WITH_ID,
      },
    },
  })
  async getRequestUserMe(@Req() req: RequestWithUser): Promise<UserDto> {
    const user = await this.userService.getOneById(req.user.id);
    if (!user) {
      throw new HttpException(HutomHttpException.NOT_FOUND_USER_WITH_ID, HutomHttpException.NOT_FOUND_USER_WITH_ID.statusCode);
    }
    return UserDto.from(user);
  }

  @Patch("me")
  @Roles(Role.ADMIN, Role.USER)
  @ApiCustomOperation({
    summary: "현재 사용자 정보 변경",
    description: "요청을 보낸 사용자의 정보를 변경한다. (변경할 프로퍼티만 바디에 포함시켜주세요.)",
    roles: [Role.ADMIN, Role.USER],
  })
  @ApiBody({ type: PatchUsersMeDto })
  @ApiOkResponse({ type: UpdateUserRes })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_USER_WITH_ID: {
        value: HutomHttpException.NOT_FOUND_USER_WITH_ID,
        description: "수정할 계정이 존재하지 않음",
      },
      DUPLICATED_USER_EMAIL: {
        value: HutomHttpException.DUPLICATED_USER_EMAIL,
        description: "수정할 이메일이 이미 사용중임",
      },
      DUPLICATED_USER_PHONE_NUMBER: {
        value: HutomHttpException.DUPLICATED_USER_PHONE_NUMBER,
        description: "수정할 전화번호가 이미 사용중임",
      },
    },
  })
  async updateRequestUser(@Req() req: RequestWithUser, @Body() patchUsersMeDto: PatchUsersMeDto): Promise<UpdateUserRes> {
    await this.userService.updateMeById(req.user.id, patchUsersMeDto);
    return { id: req.user.id };
  }

  @Patch("me/password")
  @Roles(Role.ADMIN, Role.USER)
  @ApiCustomOperation({
    summary: "현재 사용자 비밀번호 변경",
    description: "요청을 보낸 사용자의 비밀번호를 변경한다.",
    roles: [Role.ADMIN, Role.USER],
  })
  @ApiOkResponse({ type: UpdateUserRes })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_USER_WITH_ID: {
        description: "수정할 계정이 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_USER_WITH_ID,
      },
      UNAUTHORIZED_INVALID_PASSWORD: {
        description: "비밀번호 틀림",
        value: HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD,
      },
      INVALID_REQUEST_BODY: {
        description: "현재 비밀번호와 동일한 비밀번호로 변경 불가",
        value: HutomHttpException.INVALID_REQUEST_BODY,
      },
    },
  })
  async updateRequestUserPassword(@Req() req: RequestWithUser, @Body() patchUsersMyPasswordDto: PatchUsersMyPasswordDto): Promise<UpdatePasswordRes> {
    try {
      const user = await this.userService.updateMyPasswordById(req.user.id, patchUsersMyPasswordDto);

      this.loggerService.access(ServiceType.USER, req.user.employeeId, LogType.CHANGE_USER_PASSWORD);
      return {
        id: req.user.id,
        meta: { passwordSettingAt: user.passwordSettingAt.toISOString() },
      };
    } catch (error) {
      this.loggerService.access(ServiceType.USER, req.user.employeeId, LogType.CHANGE_USER_PASSWORD, `(failed) ${error?.getResponse()["error"]}`);
      throw error;
    }
  }

  @Post("me/profile")
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(FileInterceptor("profile"))
  @ApiCustomOperation({
    summary: "현재 사용자 프로필 이미지 업로드",
    description: "요청을 보낸 사용자의 프로필 이미지를 업로드한다.",
    roles: [Role.ADMIN, Role.USER],
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        profile: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiOkResponse({ type: UpdateProfileRes })
  @ApiUserAuthResponse()
  async uploadProfile(@Req() req: RequestWithUser, @UploadedFile() file: Express.Multer.File): Promise<UpdateProfileRes> {
    // profilePath 업데이트
    await this.userService.updateProfilePathById(req.user.id, file.path);

    // 기존 프로필 이미지 삭제
    if (req.user.profilePath) {
      await fs.promises.rm(req.user.profilePath);
    }

    // 새로운 profileUrl 반환
    return {
      profileUrl: `${this.serverUrl}/${file.filename}`,
    };
  }

  @Post(":id/profile")
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor("profile"))
  @ApiCustomOperation({
    summary: "특정 사용자 프로필 이미지 업로드",
    description:
      "요청을 보낸 대표 계정이 특정 사용자의 프로필 이미지를 업로드한다. \
    \n- 대상 : 본인을 제외한 서비스 내의 모든 사용자",
    roles: [Role.ADMIN],
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        profile: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiOkResponse({ type: UpdateProfileRes })
  @ApiUserAuthResponse({
    examples: {
      FORBIDDEN_RESOURCE: {
        description: "자원에 접근 권한이 없음(자신의 프로필이미지는 변경할 수 없음)",
        value: HutomHttpException.FORBIDDEN_RESOURCE,
      },
      NOT_FOUND_USER_WITH_ID: {
        description: "수정할 사용자가 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_USER_WITH_ID,
      },
    },
  })
  async uploadProfileById(@Req() req: RequestWithUser, @Param("id") id: number, @UploadedFile() file: Express.Multer.File): Promise<UpdateProfileRes> {
    if (req.user.id === id) {
      throw new HttpException(
        {
          ...HutomHttpException.FORBIDDEN_RESOURCE,
          message: "`id` equals id of request user",
        },
        HutomHttpException.FORBIDDEN_RESOURCE.statusCode,
      );
    }

    // profilePath 업데이트
    await this.userService.adminUpdateProfilePathById(id, file.path);

    // 새로운 profileUrl 반환
    return {
      profileUrl: `${this.serverUrl}/${file.filename}`,
    };
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "특정 사용자 정보 조회",
    description: "특정 사용자 정보를 가져온다.",
    roles: [Role.ADMIN],
  })
  @ApiOkResponse({ type: UserDto })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_USER_WITH_ID: {
        description: "조회할 계정이 존재하지 않는 경우",
        value: HutomHttpException.NOT_FOUND_USER_WITH_ID,
      },
    },
  })
  async getRequestUser(@Param("id") id: number): Promise<UserDto> {
    const user = await this.userService.getOneById(id);
    if (!user) {
      throw new HttpException(HutomHttpException.NOT_FOUND_USER_WITH_ID, HutomHttpException.NOT_FOUND_USER_WITH_ID.statusCode);
    }
    return UserDto.from(user);
  }

  @Patch(":id")
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "특정 사용자 정보 변경",
    description:
      "해당 id의 사용자 정보를 변경한다.(변경할 프로퍼티만 포함시켜서 보내주세요.) \
    \n- 대상 : 본인을 제외한 서비스 내의 모든 사용자",
    roles: [Role.ADMIN],
  })
  @ApiBody({ type: PatchUsersDto })
  @ApiUserAuthResponse({
    examples: {
      FORBIDDEN_RESOURCE: {
        description: "처리 권한 없음",
        value: HutomHttpException.FORBIDDEN_RESOURCE,
      },
      NOT_FOUND_USER_WITH_ID: {
        description: "수정할 사용자를 찾을 수 없음",
        value: HutomHttpException.NOT_FOUND_USER_WITH_ID,
      },
      DUPLICATED_USER_EMAIL: {
        description: "사용자 정보가 중복되는 경우(email 중복)",
        value: HutomHttpException.DUPLICATED_USER_EMAIL,
      },
      DUPLICATED_USER_PHONE_NUMBER: {
        description: "사용자 정보가 중복되는 경우(phoneNumber 중복)",
        value: HutomHttpException.DUPLICATED_USER_PHONE_NUMBER,
      },
    },
  })
  @ApiOkResponse({ type: UpdateUserRes })
  async updateUser(@Req() req: RequestWithUser, @Param("id") id: number, @Body() patchUsersDto: PatchUsersDto): Promise<UpdateUserRes> {
    // 본인 정보는 수정할 수 없음
    if (req.user.id === id) {
      throw new HttpException(
        {
          ...HutomHttpException.FORBIDDEN_RESOURCE,
          message: "`id` equals id of request user",
        },
        HutomHttpException.FORBIDDEN_RESOURCE.statusCode,
      );
    }
    await this.userService.adminUpdateById(id, patchUsersDto);
    return { id };
  }

  @Patch(":id/password")
  @ApiCustomOperation({
    summary: "특정 사용자 비밀번호 재설정",
    description:
      "사용자가 발급받은 otp가 포함된 링크를 email을 통해 접근 후, 특정 사용자의 비밀번호를 재설정한다. \
    \n- 대상 : 유효한 토큰을 가지고 접근한 특정 id의 사용자 (초기설정 및 재설정)",
  })
  @ApiBody({ type: PatchUsersIdPasswordDto })
  @ApiCustomResponse({
    examples: {
      NOT_FOUND_USER_WITH_ID: {
        description: "수정할 계정이 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_USER_WITH_ID,
      },
      NOT_FOUND_DATA: {
        description: "유효한 토큰을 찾을 수 없음",
        value: HutomHttpException.NOT_FOUND_DATA,
      },
      UNAUTHORIZED: {
        description: "토큰이 만료되어 인증 불가",
        value: HutomHttpException.UNAUTHORIZED,
      },
      INVALID_REQUEST_CURRENT_PASSWORD: {
        description: "현재 비밀번호와 동일한 비밀번호로 변경 불가",
        value: HutomHttpException.INVALID_REQUEST_CURRENT_PASSWORD,
      },
      INVALID_REQUEST_PREV_PASSWORD: {
        description: "직전 비밀번호와 동일한 비밀번호로 변경 불가",
        value: HutomHttpException.INVALID_REQUEST_PREV_PASSWORD,
      },
    },
  })
  @ApiOkResponse({ type: UpdatePasswordRes })
  async updateIdUserPassword(@Param("id") id: number, @Body() patchUsersIdPasswordDto: PatchUsersIdPasswordDto): Promise<UpdatePasswordRes> {
    const { token, newPassword } = patchUsersIdPasswordDto;
    const user = await this.userService.getOneById(id);
    try {
      // 토큰 검증
      if (!user) {
        throw new HttpException(HutomHttpException.NOT_FOUND_USER_WITH_ID, HutomHttpException.NOT_FOUND_USER_WITH_ID.statusCode);
      }
      const otp = await this.otpService.verifyOne(token, user.id);

      // 비밀번호 업데이트
      const passwordSettingAt = await this.userService.updateUserPasswordByOtp(newPassword, user, otp.id);
      this.loggerService.access(ServiceType.USER, user.employeeId, LogType.RESET_USER_PASSWORD);

      return { id, meta: { passwordSettingAt } };
    } catch (error) {
      if (user) {
        this.loggerService.access(ServiceType.USER, user.employeeId, LogType.RESET_USER_PASSWORD, `(failed) ${error?.getResponse()["error"]}`);
      }
      throw error;
    }
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "사용자 생성",
    description: "새로운 사용자를 생성하여 해당 Email로 비밀번호 설정 링크를 전송한다.",
    roles: [Role.ADMIN],
  })
  @UseInterceptors(FileInterceptor("profile"))
  @UseFilters(new AfterSavingProfileExceptionFilter())
  @ApiBody({ type: PostUserDto })
  @ApiResponse({ description: "Created", status: 201, type: PostUserRes })
  @ApiUserAuthResponse({
    examples: {
      DUPLICATED_USER_EMPLOYEE_ID: {
        value: HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID,
      },
      DUPLICATED_USER_EMAIL: {
        value: HutomHttpException.DUPLICATED_USER_EMAIL,
      },
      DUPLICATED_USER_PHONE_NUMBER: {
        value: HutomHttpException.DUPLICATED_USER_PHONE_NUMBER,
      },
      CREATE_DATA_ERROR: {
        value: HutomHttpException.CREATE_DATA_ERROR,
      },
    },
  })
  async addUser(@Req() req: RequestWithUser, @Body() postUserDto: PostUserDto, @UploadedFile() file?: Express.Multer.File): Promise<PostUserRes> {
    const createUserDto = postUserDto.toCreateUserDto({
      profilePath: file?.path,
    });

    // 사용자 생성 및 메일 발송 요청
    const savedUserId = await this.userService.registerUser(createUserDto, { employeeId: req.user.employeeId });
    return { id: savedUserId };
  }

  @Post("delete")
  @Roles(Role.ADMIN)
  @HttpCode(200)
  @ApiCustomOperation({
    summary: "사용자 삭제",
    description: "대표 계정이 서비스에 등록된 일반 계정을 대상으로 삭제한다.",
    roles: [Role.ADMIN],
  })
  @ApiBody({ type: DeleteManyDto })
  @ApiOkResponse({
    type: DeleteUserRes,
    description: "요청된 모든 사용자가 정상적으로 삭제되어야 성공 응답",
  })
  @ApiUserAuthResponse({
    examples: {
      FORBIDDEN_RESOURCE_INCORRECT_PASSWORD: {
        description: "자원에 접근 권한이 없음(비밀번호 틀림)",
        value: HutomHttpException.FORBIDDEN_RESOURCE_INCORRECT_PASSWORD,
      },
      INVALID_USER_DELETE_OWN_ACCOUNT: {
        description: "본인 계정 삭제 불가",
        value: HutomHttpException.INVALID_USER_DELETE_OWN_ACCOUNT,
      },
      INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS: {
        description: "사용자가 요청한 RUS Case가 작업중이기 때문에 계정을 삭제할 수 없음",
        value: HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS,
      },
    },
  })
  async deleteMany(@Req() req: RequestWithUser, @Body() deleteManyDto: DeleteManyDto): Promise<DeleteUserRes> {
    await this.utilService.confirmPassword(req.user.password, deleteManyDto.password);
    if (deleteManyDto.ids.includes(req.user.id)) {
      throw new HttpException(HutomHttpException.INVALID_USER_DELETE_OWN_ACCOUNT, HutomHttpException.INVALID_USER_DELETE_OWN_ACCOUNT.statusCode);
    }
    const deleteMany = deleteManyDto.ids.map((id) => this.userService.deleteOne(id, { employeeId: req.user.employeeId }));
    const settledResult = await Promise.allSettled(deleteMany);
    let affected = 0;
    settledResult.forEach((result) => {
      if (result.status === "fulfilled") {
        affected += 1;
        return;
      }
      if (result.reason.response?.error === HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS.error) {
        throw new HttpException(
          HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS,
          HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS.statusCode,
        );
      }
    });
    return { affected };
  }
}
