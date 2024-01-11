import { Body, Controller, Get, HttpCode, Post, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

import { Roles } from "@src/common/guard/role.guard";
import { RequestWithUser } from "@src/common/interface/request.interface";

import { Role } from "@src/auth/interface/auth.interface";

import { StorageStudyDto } from "@src/storage/dto/storage-study.dto";

import { StorageService } from "@src/storage/service/storage.service";
import { StudyService } from "@src/study/service/study.service";
import { UtilService } from "@src/util/util.service";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { OrderQuery, StudyStorageSortQuery } from "@src/common/constant/enum.constant";
import { CoreConfig } from "@src/common/config/configuration";

import { GetAllStorageStudyReq, GetAllStorageStudyRes, GetStorageDetailRes, PostStorageDeleteFileReq, PostStorageDeleteFileRes } from "@src/storage/dto";

@ApiTags("storage")
@ApiOriginHeaders()
@Controller("storage")
export class StorageController {
  private coreConfig: CoreConfig;
  constructor(
    private readonly configService: ConfigService,
    private readonly storageSerivce: StorageService,
    private readonly studyService: StudyService,
    private readonly utilService: UtilService,
  ) {
    this.coreConfig = this.configService.get<CoreConfig>("core");
  }

  @Get("dashboard")
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "저장소 상태 상세 조회",
    description: "저장소 용량 상태를 조회한다.\n\n* Storage Management 페이지",
    roles: [Role.ADMIN],
  })
  @ApiResponse({ description: "OK", status: 200, type: GetStorageDetailRes })
  @ApiUserAuthResponse()
  getStorageDetail(): Promise<GetStorageDetailRes> {
    // 저장소 상태를 조회한다.
    return this.storageSerivce.getStorageStatus();
  }

  @Post("delete-files")
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "파일 삭제",
    description: "파일을 삭제한다.",
    roles: [Role.ADMIN],
  })
  @ApiResponse({ description: "OK", status: 200, type: PostStorageDeleteFileRes })
  @ApiUserAuthResponse({
    examples: {
      FORBIDDEN_RESOURCE_INCORRECT_PASSWORD: {
        description: "비밀번호 틀림",
        value: HutomHttpException.FORBIDDEN_RESOURCE_INCORRECT_PASSWORD,
      },
    },
  })
  async deleteFiles(@Req() req: RequestWithUser, @Body() postStorageDeleteFileReq: PostStorageDeleteFileReq): Promise<PostStorageDeleteFileRes> {
    const { password, studyIds, types } = postStorageDeleteFileReq;
    await this.utilService.confirmPassword(req.user.password, password);

    const { success, failed } = await this.storageSerivce.deleteFiles(studyIds, types, req.user);
    return { ids: success, meta: { failed } };
  }

  @Get("studies")
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "모든 스터디 조회 및 검색",
    description:
      "모든 스터디를 조회한다.\n\n* 요청 위치: Storage Management 페이지\n\n* 조회 기준: 파일 사이즈가 0보다 큰 경우(dicom.fileSize > 0 or hu3d.fileSize > 0)",
    roles: [Role.ADMIN],
  })
  @ApiResponse({ description: "OK", status: 200, type: GetAllStorageStudyRes })
  @ApiUserAuthResponse()
  async getAllStudies(@Req() req: RequestWithUser, @Query() getAllStorageStudyReq: GetAllStorageStudyReq): Promise<GetAllStorageStudyRes> {
    const {
      huId,
      patientId,
      patientName,
      startDeliveryDate,
      endDeliveryDate,
      page = 1,
      limit = 20,
      sort = StudyStorageSortQuery.CREATED_AT,
      order = OrderQuery.DESC,
    } = getAllStorageStudyReq;

    const queryDto = {
      huId,
      patientId,
      patientName,
      page,
      limit,
      sort,
      order,
    };

    if (startDeliveryDate || endDeliveryDate) {
      const studyDateRange = this.utilService.getDateRangeQueryParams({ startDate: startDeliveryDate, endDate: endDeliveryDate });
      queryDto["startDeliveryDate"] = studyDateRange.startDate;
      queryDto["endDeliveryDate"] = studyDateRange.endDate;
    }

    const [studies, studiesCount] = await this.studyService.getManyAndCountWithFile(queryDto);
    return {
      count: studiesCount,
      data: StorageStudyDto.fromMany(studies, this.coreConfig.serviceCode),
    };
  }
}
