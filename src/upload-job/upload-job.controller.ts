import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { Role } from "@src/auth/interface/auth.interface";
import { LogType, OrderQuery, ServiceType, UploadJobSortQuery } from "@src/common/constant/enum.constant";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiServerAuthResponse } from "@src/common/decorator/api-server-auth-response.decorator";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { RequestWithUser } from "@src/common/interface/request.interface";
import { SERVER_CODE } from "@src/common/middleware/server-auth.middleware";
import { Roles } from "@src/common/guard/role.guard";
import { LoggerService } from "@src/logger/logger.service";
import { UtilService } from "@src/util/util.service";
import { GetAllUploadJobReq, GetAllUploadJobRes, GetUploadJobHuIdReq, GetUploadJobHuIdRes } from "@src/upload-job/dto";
import { UploadJobService } from "@src/upload-job/service/upload-job.service";
import { UploadJobViewService } from "@src/upload-job/service/upload-job.view.service";
import { UploadJobViewDto } from "@src/upload-job/dto/upload-job.view.dto";
import { UploadJobView } from "@src/common/entity/upload-job.view.entity";

@ApiTags("upload-job")
@ApiOriginHeaders()
@Controller("upload-jobs")
export class UploadJobController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly utilService: UtilService,
    private readonly uploadJobService: UploadJobService,
    private readonly uploadJobViewService: UploadJobViewService,
  ) {}

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "모든 UploadJob 조회 및 검색",
    description: "UploadJob 목록을 조회한다.\n\n- 조회 조건: dicom 파일 존재함(dicom?.filePath)",
    roles: [Role.ADMIN, Role.USER],
  })
  @ApiResponse({ description: "OK", status: 200 })
  @ApiUserAuthResponse()
  async getAllUploadJob(@Req() req: RequestWithUser, @Query() getAllUploadJobReq: GetAllUploadJobReq): Promise<GetAllUploadJobRes> {
    const {
      page = 1,
      limit = 20,
      sort = UploadJobSortQuery.CREATED_AT,
      order = OrderQuery.DESC,
      patientId = null,
      patientName = null,
      userName = null,
      startStudyDate = null,
      endStudyDate = null,
      startCreatedAt = null,
      endCreatedAt = null,
    } = getAllUploadJobReq;

    const queryDto = {
      page,
      limit,
      sort,
      order,
      patientId,
      patientName,
      userName,
    };

    if (startStudyDate || endStudyDate) {
      const studyDateRange = this.utilService.getDateRangeQueryParams({ startDate: startStudyDate, endDate: endStudyDate });
      queryDto["startStudyDate"] = studyDateRange.startDate;
      queryDto["endStudyDate"] = studyDateRange.endDate;
    }

    if (startCreatedAt || endCreatedAt) {
      const createdDateRange = this.utilService.getDateRangeQueryParams({ startDate: startCreatedAt, endDate: endCreatedAt });
      queryDto["startCreatedAt"] = createdDateRange.startDate;
      queryDto["endCreatedAt"] = createdDateRange.endDate;
    }

    let uploadJobs: UploadJobView[];
    let count: number;
    if (req.user.role === Role.ADMIN) {
      [uploadJobs, count] = await this.uploadJobViewService.getManyAndCount(queryDto);
    } else {
      [uploadJobs, count] = await this.uploadJobViewService.getOwnManyAndCount(req.user.id, queryDto);
    }
    return {
      data: uploadJobs.map((uploadJob) => {
        const status = this.uploadJobService.getStatus(uploadJob);
        return UploadJobViewDto.from({ ...uploadJob, status });
      }),
      count,
    };
  }

  @Get("hu-id")
  @ApiCustomOperation({
    summary: "huId 조회 및 생성",
    description:
      "huId를 조회한다. 없으면, 생성 후 값을 리턴한다.\n\n- 조회 조건\n\n1. uploadJob.studyInstanceUID: 일치\n\n2. uploadJob.updatedAt: 1시간 이내\n\n3. upload-job.study_id: null\n\n4. uploadJob.aeMode: not null\n\n5. uploadJob.status: not 'REJECT'\n\n6. upload-job.created_at 최소값",
    tokens: [SERVER_CODE],
  })
  @ApiResponse({ description: "OK", status: 200, type: GetUploadJobHuIdRes })
  @ApiServerAuthResponse({
    examples: {
      UPDATE_DATA_ERROR: {
        description: "upload-job 갱신되지 않은 경우",
        value: HutomHttpException.UPDATE_DATA_ERROR,
      },
    },
  })
  async getHuId(@Query() getUploadJobHuIdReq: GetUploadJobHuIdReq): Promise<GetUploadJobHuIdRes> {
    const { studyInstanceUID = null } = getUploadJobHuIdReq;
    const { huId, instancesCount, affected } = await this.uploadJobService.getOrCreateHuId(studyInstanceUID);
    this.loggerService.log(ServiceType.SYSTEM, null, LogType.DICOM_RETRIEVE, `studyInstanceUID: ${studyInstanceUID}, huId: ${huId}, affected: ${affected}`);
    return { huId, instancesCount, affected };
  }
}
