import * as fs from "fs";
import { Response } from "express";
import { Body, Controller, Get, HttpCode, HttpException, Logger, Param, Patch, Post, Query, Req, Res, UseGuards, UseInterceptors } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RequestWithUser } from "@src/common/interface/request.interface";
import { CreateRusCaseService } from "@src/rus-case/service/create-rus-case.service";
import { CreateHuctDto } from "@src/rus-case/dto/huct.dto";
import { RusCaseService } from "@src/rus-case/service/rus-case.service";
import { OwnRusCaseGuard } from "@src/common/guard/own-rus-case.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { hu3dMulterOption } from "@src/common/option/hu3d-multer.option";
import { UtilService } from "@src/util/util.service";
import { CoreConfig, ServerConfig } from "@src/common/config/configuration";
import { Roles } from "@src/common/guard/role.guard";
import { Role } from "@src/auth/interface/auth.interface";
import { File } from "@src/common/decorator/file.decorator";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";

import {
  GetAllRusCaseReq,
  GetAllRusCaseRes,
  GetRusCaseRes,
  PatchMatchedRusCaseBodyReq,
  PatchMatchedRusCaseQueryReq,
  PatchMatchedRusCaseRes,
  PatchRusCaseReq,
  PatchRusCaseRes,
  PostRusCaseHu3dQueryReq,
  PostRusCaseHu3dReq,
  PostRusCaseHu3dRes,
  PostRusCaseReq,
  PostRusCaseRes,
} from "@src/rus-case/dto";
import { RusCaseDto } from "@src/rus-case/dto/rus-case.dto";
import { LoggerService } from "@src/logger/logger.service";
import { LogType, OrderQuery, RusCaseSortQuery, ServiceType } from "@src/common/constant/enum.constant";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { HCLOUD_SERVER } from "@src/common/middleware/server-auth.middleware";
import { ApiCloudAuthResponse } from "@src/common/decorator/api-cloud-auth-response.decorator";
import { CloudService } from "@src/cloud/service/cloud.service";
import { CreditHistoryService } from "@src/credit-history/service/credit-history.service";

@ApiTags("rus-case")
@ApiOriginHeaders()
@Controller("rus-cases")
export class RusCaseController {
  private readonly logger = new Logger(RusCaseController.name);
  private serverConfig: ServerConfig;
  private coreConfig: CoreConfig;
  constructor(
    private readonly configService: ConfigService,
    private readonly createRusCaseService: CreateRusCaseService,
    private readonly rusCaseService: RusCaseService,
    private readonly utilService: UtilService,
    private readonly cloudService: CloudService,
    private readonly loggerService: LoggerService,
    private readonly creditHistoryService: CreditHistoryService,
  ) {
    this.serverConfig = this.configService.get<ServerConfig>("server");
    this.coreConfig = this.configService.get<CoreConfig>("core");
  }

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "RUS Case 등록",
    description: "케이스에 하나의 스터디를 등록한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiResponse({ description: "Created", status: 201, type: PostRusCaseRes })
  @ApiUserAuthResponse({
    examples: {
      INSUFFICIENT_CREDIT: {
        description: "크레딧이 1보다 작은 경우",
        value: HutomHttpException.INSUFFICIENT_CREDIT,
      },
      NOT_FOUND_STUDY_WITH_ID: {
        description: "스터디가 존재하지 않는 경우",
        value: HutomHttpException.NOT_FOUND_STUDY_WITH_ID,
      },
      NOT_FOUND_DICOM_ON_DB: {
        description: "다이콤 파일이 제거된 경우",
        value: HutomHttpException.NOT_FOUND_DICOM_ON_DB,
      },
      NOT_FOUND_DICOM_ON_DISK: {
        description: "다이콤 파일이 제거된 경우",
        value: HutomHttpException.NOT_FOUND_DICOM_ON_DISK,
      },
      DUPLICATED_RUS_CASE_ON_DB: {
        description: "Study가 이미 RusCase로 등록된 경우",
        value: HutomHttpException.DUPLICATED_RUS_CASE_ON_DB,
      },
    },
  })
  async create(@Req() req: RequestWithUser, @Body() postRusCaseReq: PostRusCaseReq): Promise<PostRusCaseRes> {
    const { recipientIds, ...rest } = postRusCaseReq;
    const { id } = await this.createRusCaseService.createOne({
      ...rest,
      userId: req.user.id,
    });
    const [huCT, dicomFilePath] = await this.rusCaseService.generateHuct(id, recipientIds);
    try {
      await this.cloudService.postRusCases(huCT, dicomFilePath);
      await this.creditHistoryService.createRusUse({ userId: req.user.id, huId: huCT.huId });
      this.loggerService.log(ServiceType.USER, req.user.employeeId, LogType.RUS_REGISTER, huCT.huId);
      return { id, isCompleted: true };
    } catch (error) {
      this.loggerService.log(ServiceType.USER, req.user.employeeId, LogType.RUS_REGISTER, `(failed) ${huCT.huId}`);
      return { id, isCompleted: false };
    }
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "모든 케이스 조회 및 검색",
    description: "모든 케이스를 조회한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiResponse({ description: "OK", status: 200, type: GetAllRusCaseRes })
  @ApiUserAuthResponse()
  async findAll(@Req() req: RequestWithUser, @Query() getAllRusCaseReq: GetAllRusCaseReq): Promise<GetAllRusCaseRes> {
    const {
      page = 1,
      limit = 20,
      sort = RusCaseSortQuery.CREATED_AT,
      order = OrderQuery.DESC,
      patientId = null,
      patientName = null,
      huId = null,
      userName = null,
      startDeliveryDate = null,
      endDeliveryDate = null,
    } = getAllRusCaseReq;

    const queryDto = {
      page,
      limit,
      sort,
      order,
      patientId,
      patientName,
      huId,
      userName,
    };

    if (startDeliveryDate || endDeliveryDate) {
      const studyDateRange = this.utilService.getDateRangeQueryParams({ startDate: startDeliveryDate, endDate: endDeliveryDate });
      queryDto["startDeliveryDate"] = studyDateRange.startDate;
      queryDto["endDeliveryDate"] = studyDateRange.endDate;
    }
    if (req.user.role === Role.ADMIN) {
      const [rusCases, rusCasesCount] = await this.rusCaseService.getManyAndCount(queryDto);
      return {
        count: rusCasesCount,
        data: RusCaseDto.fromMany(rusCases, this.serverConfig.serverUrl),
      };
    }

    const [rusCases, rusCasesCount] = await this.rusCaseService.getOwnManyAndCount(req.user.id, queryDto);
    return {
      count: rusCasesCount,
      data: RusCaseDto.fromMany(rusCases, this.serverConfig.serverUrl),
    };
  }

  @Get(":id")
  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(OwnRusCaseGuard)
  @ApiCustomOperation({
    summary: "특정 케이스 조회",
    description: "특정 케이스를 조회한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiResponse({ description: "OK", status: 200, type: GetRusCaseRes })
  @ApiUserAuthResponse({
    examples: {
      // OwnRusCaseGuard
      INVALID_REQUEST_PARAMETER: {
        description: "Request Parameter 형식이 잘못된 경우",
        value: HutomHttpException.INVALID_REQUEST_PARAMETER,
      },
      NOT_FOUND_RUS_CASE_WITH_ID: {
        description: "요청한 케이스가 존재하지 않은 경우",
        value: HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID,
      },
      FORBIDDEN_RESOURCE: {
        description: "자원에 접근 권한이 없는 경우",
        value: HutomHttpException.FORBIDDEN_RESOURCE,
      },
    },
  })
  async findOne(@Req() req: RequestWithUser, @Param("id") id: number): Promise<GetRusCaseRes> {
    // 특정 케이스를 조회한다.
    const rusCase = await this.rusCaseService.getOneById(id);
    if (!rusCase) {
      throw new HttpException(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID, HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID.statusCode);
    }
    this.loggerService.access(ServiceType.USER, req.user.employeeId, LogType.VIEW_LIST, rusCase.study.huId);
    return RusCaseDto.from(rusCase, this.serverConfig.serverUrl, this.coreConfig.serviceCode);
  }

  @Patch()
  @ApiCustomOperation({
    summary: "매칭 케이스 작업 수정",
    description: "huId와 매칭된 케이스의 작업을 수정한다. (Status, Operation Date, Delivery Date)",
    tokens: [HCLOUD_SERVER],
  })
  @ApiResponse({ description: "OK", status: 200, type: PatchMatchedRusCaseRes })
  @ApiCloudAuthResponse({
    examples: {
      NOT_FOUND_RUS_CASE_WITH_HUID: {
        description: "huId와 매칭되는 rusCase가 없는 경우",
        value: HutomHttpException.NOT_FOUND_RUS_CASE_WITH_HUID,
      },
      INVALID_RUS_CASE_STATUS_UPDATE: {
        description: "RusCase status가 이미 완료 처리(DONE|REJECT)되어서 수정할 수 없음",
        value: HutomHttpException.INVALID_RUS_CASE_STATUS_UPDATE,
      },
      // rusCaseService > cancelOne
      NOT_FOUND_RUS_CASE_WITH_ID: {
        description: "요청한 케이스가 존재하지 않은 경우",
        value: HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID,
      },
      INVALID_RUS_CASE_REJECT_REQUEST_STATUS: {
        description: "RusCase status가 이미 취소 처리(REJECT)되어서 수정할 수 없음",
        value: HutomHttpException.INVALID_RUS_CASE_REJECT_REQUEST_STATUS,
      },
      NOT_FOUND_USER_WITH_ID: {
        description: "사용자가 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_USER_WITH_ID,
      },
      NOT_FOUND_DICOM_WITH_STUDY_ID: {
        description: "Dicom 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_DICOM_WITH_STUDY_ID,
      },
    },
  })
  async updateMatchOne(@Query() query: PatchMatchedRusCaseQueryReq, @Body() body: PatchMatchedRusCaseBodyReq): Promise<PatchMatchedRusCaseRes> {
    // 매칭 케이스를 수정한다.
    const updatedRusCase = await this.rusCaseService.updateOneByHuId(query.huId, body);
    if (body.deliveryDate) {
      this.loggerService.log(ServiceType.USER, null, LogType.CHANGE_DELIVERY_DATE, query.huId);
    }
    if (body.operationDate) {
      this.loggerService.log(ServiceType.USER, null, LogType.CHANGE_OPERATION_DATE, query.huId);
    }
    return { id: updatedRusCase.id };
  }

  @Patch(":id")
  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(OwnRusCaseGuard)
  @ApiCustomOperation({
    summary: "특정 케이스 작업 취소",
    description: "특정 케이스의 작업을 취소한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiResponse({ description: "OK", status: 200, type: PatchRusCaseRes })
  @ApiUserAuthResponse({
    examples: {
      // OwnRusCaseGuard
      INVALID_REQUEST_PARAMETER: {
        description: "Request Parameter 형식이 잘못된 경우",
        value: HutomHttpException.INVALID_REQUEST_PARAMETER,
      },
      NOT_FOUND_RUS_CASE_WITH_ID: {
        description: "요청한 케이스가 존재하지 않은 경우",
        value: HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID,
      },
      FORBIDDEN_RESOURCE: {
        description: "자원에 접근 권한이 없는 경우",
        value: HutomHttpException.FORBIDDEN_RESOURCE,
      },
      // rusCaseService
      INVALID_RUS_CASE_REJECT_REQUEST_STATUS: {
        description: "rusCase 상태가 TODO인 경우에 취소할 수 있음",
        value: HutomHttpException.INVALID_RUS_CASE_REJECT_REQUEST_STATUS,
      },
      NOT_FOUND_USER_WITH_ID: {
        description: "사용자가 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_USER_WITH_ID,
      },
      FORBIDDEN_RESOURCE_HCLOUD: {
        description: "h-Space 서버에 RusCase 존재하지 않음",
        value: HutomHttpException.FORBIDDEN_RESOURCE_HCLOUD,
      },
      NOT_FOUND_RUS_CASE_HCLOUD: {
        description: "h-Space 서버에 h-Server IP 접근이 허용되지 않음(화이트리스트 등록 필요)",
        value: HutomHttpException.NOT_FOUND_RUS_CASE_HCLOUD,
      },
      NOT_FOUND_DICOM_WITH_STUDY_ID: {
        description: "Dicom 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_DICOM_WITH_STUDY_ID,
      },
    },
  })
  async updateOne(@Req() req: RequestWithUser, @Param("id") id: number, @Body() patchRusCaseReq: PatchRusCaseReq): Promise<PatchRusCaseRes> {
    // 특정 케이스를 수정한다.
    if (patchRusCaseReq.isCancelled) {
      const rusCaseId = await this.rusCaseService.cancelOne({ id, isUserRequest: true, requestorId: req.user.id });
      return { id: rusCaseId };
    }
    throw new HttpException(HutomHttpException.BAD_REQUEST, HutomHttpException.BAD_REQUEST.statusCode);
  }

  @Post(":id/hu3d")
  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(OwnRusCaseGuard)
  @UseInterceptors(FileInterceptor("file", hu3dMulterOption))
  @ApiCustomOperation({
    summary: "hu3D 업로드(특정 케이스)",
    description: "특정 케이스의 hu3D 파일을 등록한다.\n\n* 이미 등록된 hu3D 파일이 있는 경우, 기존 파일 삭제 후 hu3D 정보를 업데이트한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "hu3D 파일",
    type: PostRusCaseHu3dReq,
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: PostRusCaseHu3dRes,
  })
  @ApiUserAuthResponse({
    examples: {
      // OwnRusCaseGuard
      INVALID_REQUEST_PARAMETER: {
        description: "Request Parameter 형식이 잘못된 경우",
        value: HutomHttpException.INVALID_REQUEST_PARAMETER,
      },
      NOT_FOUND_RUS_CASE_WITH_ID: {
        description: "요청한 케이스가 존재하지 않은 경우",
        value: HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID,
      },
      FORBIDDEN_RESOURCE: {
        description: "자원에 접근 권한이 없는 경우",
        value: HutomHttpException.FORBIDDEN_RESOURCE,
      },
      // hu3dMulterOption
      PAYLOAD_TOO_LARGE: {
        description: "파일 용량이 제한 용량보다 큰 경우",
        value: HutomHttpException.PAYLOAD_TOO_LARGE,
      },
      INSUFFICIENT_STORAGE: {
        description: "디스크에 저장소 공간이 없는 경우",
        value: HutomHttpException.INSUFFICIENT_STORAGE,
      },
      INVALID_REQUEST_FILE_EXTENSION: {
        description: "파일 확장자가 잘못된 경우",
        value: HutomHttpException.INVALID_REQUEST_FILE_EXTENSION,
      },
      INVALID_REQUEST_FILE_NAME: {
        description: "파일 이름이 규칙에 맞지 않음(버전, huId 규칙)",
        value: HutomHttpException.INVALID_REQUEST_FILE_NAME,
      },
      DUPLICATED_FILE_NAME_ON_DB: {
        description: "파일이 DB에서 중복되는 경우",
        value: HutomHttpException.DUPLICATED_FILE_NAME_ON_DB,
      },
      CREATE_DATA_ERROR: {
        description: "notification 생성 에러",
        value: HutomHttpException.CREATE_DATA_ERROR,
      },
    },
  })
  @HttpCode(200)
  async updateHu3d(@Req() req: RequestWithUser, @Param("id") id: number, @File() file: Express.Multer.File): Promise<PostRusCaseHu3dRes> {
    try {
      // 특정 케이스의 hu3d 파일 정보를 추가한다.
      const updateRusCase = await this.rusCaseService.updateHu3dById(id, file, req.user.id);
      return { id: updateRusCase.id };
    } catch (error) {
      // 업로드 실패한 파일 삭제
      await fs.promises.rm(file.path);
      throw error;
    }
  }

  @Get(":id/download-hu3d")
  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(OwnRusCaseGuard)
  @ApiCustomOperation({
    summary: "hu3D 다운로드",
    description: "특정 케이스의 hu3D 파일을 다운로드한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    headers: {
      "Content-Type": {
        description: "application/octet-stream",
      },
      "Content-Disposition": {
        description: `attachment; filename="${"filename.hu3d"}"`,
      },
    },
    content: {
      "application/octet-stream": {},
    },
  })
  @ApiUserAuthResponse({
    examples: {
      // OwnRusCaseGuard
      INVALID_REQUEST_PARAMETER: {
        description: "Request Parameter 형식이 잘못된 경우",
        value: HutomHttpException.INVALID_REQUEST_PARAMETER,
      },
      NOT_FOUND_RUS_CASE_WITH_ID: {
        description: "요청한 케이스가 존재하지 않은 경우",
        value: HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID,
      },
      FORBIDDEN_RESOURCE: {
        description: "자원에 접근 권한이 없는 경우",
        value: HutomHttpException.FORBIDDEN_RESOURCE,
      },
      // getHu3dFile
      NOT_FOUND_HU3D_ON_DB: {
        description: "hu3d가 존재하지 않는 경우",
        value: HutomHttpException.NOT_FOUND_HU3D_ON_DB,
      },
      NOT_FOUND_HU3D_ON_DISK: {
        description: "hu3d가 디스크에 존재하지 않는 경우",
        value: HutomHttpException.NOT_FOUND_HU3D_ON_DISK,
      },
    },
  })
  async getHu3dFile(@Req() req: RequestWithUser, @Res() res: Response, @Param("id") id: number) {
    // hu3d 파일 다운로드
    const hu3d = await this.rusCaseService.getHu3dById(id);
    if (!hu3d?.filePath) {
      throw new HttpException(HutomHttpException.NOT_FOUND_HU3D_ON_DB, HutomHttpException.NOT_FOUND_HU3D_ON_DB.statusCode);
    }
    // 파일 존재 확인
    try {
      await fs.promises.access(hu3d.filePath);
    } catch (error) {
      throw new HttpException(HutomHttpException.NOT_FOUND_HU3D_ON_DISK, HutomHttpException.NOT_FOUND_HU3D_ON_DISK.statusCode);
    }
    // 파일 다운로드
    this.loggerService.access(ServiceType.USER, req.user.employeeId, LogType.DOWNLOAD_FILE, hu3d.fileName);
    return res.download(hu3d.filePath);
  }

  @Get(":id/download-huct")
  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(OwnRusCaseGuard)
  @ApiCustomOperation({
    summary: "huCT 다운로드",
    description: "특정 케이스의 huCT 파일을 다운로드한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    headers: {
      "Content-Type": {
        description: "application/zip",
      },
      "Content-Disposition": {
        description: `attachment; filename="${"filename.zip"}"`,
      },
    },
    content: {
      "application/zip": {},
    },
  })
  @ApiUserAuthResponse({
    examples: {
      // OwnRusCaseGuard
      INVALID_REQUEST_PARAMETER: {
        description: "Request Parameter 형식이 잘못된 경우",
        value: HutomHttpException.INVALID_REQUEST_PARAMETER,
      },
      NOT_FOUND_RUS_CASE_WITH_ID: {
        description: "요청한 케이스가 존재하지 않은 경우",
        value: HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID,
      },
      FORBIDDEN_RESOURCE: {
        description: "자원에 접근 권한이 없는 경우",
        value: HutomHttpException.FORBIDDEN_RESOURCE,
      },
      // getHuctFile
      NOT_FOUND_DICOM_ON_DB: {
        description: "파일이 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_DICOM_ON_DB,
      },
      NOT_FOUND_DICOM_ON_DISK: {
        description: "파일이 디스크 상 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_DICOM_ON_DISK,
      },
    },
  })
  async getHuctFile(@Req() req: RequestWithUser, @Res() res: Response, @Param("id") id: number) {
    // 파일 경로 조회
    const rusCase = await this.rusCaseService.getOneById(id);
    if (!rusCase) {
      throw new HttpException(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID, HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID.statusCode);
    }
    // huCT 파일 생성
    const filePath = rusCase?.study.dicom.filePath;
    if (!filePath) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DICOM_ON_DB, HutomHttpException.NOT_FOUND_DICOM_ON_DB.statusCode);
    }
    const { archive, fileName } = await this.utilService.createHuctArchive(CreateHuctDto.from(rusCase, this.coreConfig.serverCode), filePath);

    res.setHeader("Content-disposition", `attachment; filename="${fileName}"`);
    archive.pipe(res);
    this.loggerService.access(ServiceType.USER, req.user.employeeId, LogType.DOWNLOAD_FILE, fileName);
  }

  @Post("hu3d")
  @UseInterceptors(FileInterceptor("file", hu3dMulterOption))
  @ApiCustomOperation({
    summary: "hu3D 업로드(매칭 케이스)",
    description: "hu3D 파일명의 huID를 기준으로 케이스에 등록한다.\n\n* 이미 등록된 hu3D 파일이 있는 경우, 기존 파일 삭제 후 hu3D 정보를 업데이트한다.",
    roles: [HCLOUD_SERVER],
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "hu3D 파일",
    type: PostRusCaseHu3dReq,
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: PostRusCaseHu3dRes,
  })
  @ApiCloudAuthResponse({
    examples: {
      // hu3dMulterOption
      PAYLOAD_TOO_LARGE: {
        description: "파일 용량이 제한 용량보다 큰 경우",
        value: HutomHttpException.PAYLOAD_TOO_LARGE,
      },
      INSUFFICIENT_STORAGE: {
        description: "디스크에 저장소 공간이 없는 경우",
        value: HutomHttpException.INSUFFICIENT_STORAGE,
      },
      INVALID_REQUEST_FILE_EXTENSION: {
        description: "파일 확장자가 잘못된 경우",
        value: HutomHttpException.INVALID_REQUEST_FILE_EXTENSION,
      },
      INVALID_REQUEST_FILE_NAME: {
        description: "파일 이름이 규칙에 맞지 않음",
        value: HutomHttpException.INVALID_REQUEST_FILE_NAME,
      },
      NOT_FOUND_RUS_CASE_WITH_HUID: {
        description: "huId를 가지는 RUS Case가 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_RUS_CASE_WITH_HUID,
      },
      DUPLICATED_FILE_NAME_ON_DB: {
        description: "파일이 DB에서 중복되는 경우",
        value: HutomHttpException.DUPLICATED_FILE_NAME_ON_DB,
      },
    },
  })
  @HttpCode(200)
  async matchHu3d(@Query() query: PostRusCaseHu3dQueryReq, @File() file: Express.Multer.File): Promise<PostRusCaseHu3dRes> {
    try {
      const { huId } = query;
      const updateRusCase = await this.rusCaseService.updateHu3dByHuId(huId, file);
      return { id: updateRusCase.id };
    } catch (error) {
      // 업로드 실패한 파일 삭제
      await fs.promises.rm(file.path);
      throw error;
    }
  }
}
