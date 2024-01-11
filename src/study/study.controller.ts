import * as fs from "fs";
import { Body, Controller, Get, HttpException, Logger, Param, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger";

import { StudyService } from "@src/study/service/study.service";
import { UtilService } from "@src/util/util.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { dicomMulterOption } from "@src/common/option/dicom-multer.option";
import { Roles } from "@src/common/guard/role.guard";
import { Role } from "@src/auth/interface/auth.interface";
import { File } from "@src/common/decorator/file.decorator";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { ApiServerAuthResponse } from "@src/common/decorator/api-server-auth-response.decorator";
import { SERVER_CODE } from "@src/common/middleware/server-auth.middleware";
import { RequestWithUser } from "@src/common/interface/request.interface";
import { UploadJobService } from "@src/upload-job/service/upload-job.service";

import { StudyDto } from "@src/study/dto/study.dto";
import {
  CreateStudyFileInfo,
  GetAllStudyReq,
  GetAllStudyRes,
  GetStudyRes,
  PostStudyReq,
  PostStudyRes,
  PostStudyUploadFileReq,
  PostStudyUploadFileRes,
} from "@src/study/dto";
import { OwnStudyGuard } from "@src/common/guard/own-study.guard";
import { UploadJobStatus } from "@src/common/constant/enum.constant";

@ApiTags("study")
@ApiOriginHeaders()
@Controller("studies")
export class StudyController {
  private readonly logger = new Logger(StudyController.name);
  constructor(private readonly studySerivce: StudyService, private readonly uploadJobService: UploadJobService, private readonly utilService: UtilService) {}

  @Post()
  @ApiCustomOperation({
    summary: "스터디 등록",
    description: "다이콤 서버로부터 요청받은 스터디를 등록한다.",
    tokens: [SERVER_CODE],
  })
  @ApiBody({ type: PostStudyReq })
  @ApiResponse({ description: "Created", status: 201, type: PostStudyRes })
  @ApiServerAuthResponse({
    examples: {
      DUPLICATED_STUDY_WITH_HUID: {
        description: "study의 huId가 중복되는 경우",
        value: HutomHttpException.DUPLICATED_STUDY_WITH_HUID,
      },
      NOT_FOUND_DICOM_ON_DISK: {
        description: "다이콤 파일이 디스크에 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_DICOM_ON_DISK,
      },
      DUPLICATED_FILE_NAME_ON_DB: {
        description: "동일한 이름의 파일이 이미 존재하는 경우",
        value: HutomHttpException.DUPLICATED_FILE_NAME_ON_DB,
      },
    },
  })
  async createOne(@Body() body: PostStudyReq): Promise<PostStudyRes> {
    const { filePath, seriesCount, instancesCount, huId, ...rest } = body;
    const uploadJob = await this.uploadJobService.getOne({ huId });
    if (!uploadJob || uploadJob.studyId) {
      throw new HttpException(HutomHttpException.BAD_REQUEST, HutomHttpException.BAD_REQUEST.statusCode);
    }
    try {
      const study = await this.studySerivce.createOne({ ...rest, huId, uploadJobId: uploadJob.id });
      await this.studySerivce.updateFile(study.id, { filePath, seriesCount, instancesCount });
      await this.uploadJobService.updateById(uploadJob.id, { studyId: study.id, status: UploadJobStatus.DONE });

      return { id: study.id };
    } catch (error) {
      this.uploadJobService.updateById(uploadJob.id, { status: UploadJobStatus.REJECT });
      fs.rm(filePath, (error) => {
        if (error) {
          this.logger.log(`E: Failed to remove a file(path:${filePath})`);
        }
      });

      throw error;
    }
  }

  @Post("file")
  @Roles(Role.USER, Role.ADMIN)
  @UseInterceptors(FileInterceptor("file", dicomMulterOption))
  @ApiCustomOperation({
    summary: "다이콤 파일 업로드",
    description: "다이콤 파일을 업로드하여 스터디를 생성한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "다이콤 파일",
    type: PostStudyUploadFileReq,
  })
  @ApiResponse({
    status: 201,
    description: "Created",
    type: PostStudyUploadFileRes,
  })
  @ApiUserAuthResponse({
    examples: {
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
      INVALID_REQUEST_FILE_DICOM: {
        description: "압축 파일 내 읽을 수 있는 다이콤 파일이 없음",
        value: HutomHttpException.INVALID_REQUEST_FILE_DICOM,
      },
      REQUEST_TIMEOUT: {
        description: "요청이 타임아웃된 경우",
        value: HutomHttpException.REQUEST_TIMEOUT,
      },
      DUPLICATED_FILE_NAME_ON_DB: {
        description: "파일명 중복(dicom.fileName)",
        value: HutomHttpException.DUPLICATED_FILE_NAME_ON_DB,
      },
      UNEXPECTED_ERROR: {
        description: "예기치 못한 에러(가명화 스크립트)",
        value: HutomHttpException.UNEXPECTED_ERROR,
      },
    },
  })
  async createByFile(@Req() req: RequestWithUser, @File() file: Express.Multer.File): Promise<PostStudyUploadFileRes> {
    let uploadJobId: number;
    try {
      // upload-job(huId) 생성
      const { id, huId } = await this.uploadJobService.createOne({ aeMode: null, userId: req.user.id });
      uploadJobId = id;
      const parsedDicom = await this.utilService.parseDicom(file.path, huId);
      const study = await this.studySerivce.createOne({ ...parsedDicom, uploadJobId: id, huId });

      // 가명화 스크립트 실행
      this.utilService
        .anonymize(file.path, huId)
        .then((result: CreateStudyFileInfo) => {
          this.studySerivce.updateFile(study.id, { filePath: result.filePath, seriesCount: result.seriesCount, instancesCount: result.instancesCount });
          this.uploadJobService.updateById(uploadJobId, { studyId: study.id, status: UploadJobStatus.DONE });
        })
        .catch((error) => {
          this.logger.error(JSON.stringify(error));
          this.uploadJobService.updateById(uploadJobId, { status: UploadJobStatus.REJECT, message: "anonymize" });
        });

      return { id: study.id };
    } catch (error) {
      this.logger.error(JSON.stringify(error));
      this.uploadJobService.updateById(uploadJobId, { status: UploadJobStatus.REJECT, message: "parse dicom" });
      fs.rm(file.path, (error) => {
        if (error) {
          this.logger.log(`E: Failed to remove a file(path:${file.path})`);
        }
      });
      throw error;
    }
  }

  @Get()
  @Roles(Role.USER)
  @ApiCustomOperation({
    summary: "모든 스터디 조회 및 검색",
    description: "모든 스터디를 조회한다.",
    roles: [Role.USER],
    // TODO? depreacted API 제거
    deprecated: true,
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: GetAllStudyRes,
  })
  @ApiUserAuthResponse()
  async getAll(@Query() getAllStudyReq: GetAllStudyReq): Promise<GetAllStudyRes> {
    // 전체 스터디를 조회한다.
    const [studies, studiesCount] = await this.studySerivce.getManyAndCount(getAllStudyReq);
    return {
      count: studiesCount,
      studies: studies.map((study) => StudyDto.from(study)),
    };
  }

  @Get(":id")
  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(OwnStudyGuard)
  @ApiCustomOperation({
    summary: "특정 스터디 조회",
    description: "특정 스터디를 조회한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: GetStudyRes,
  })
  @ApiUserAuthResponse({
    examples: {
      // OwnStudyGuard
      INVALID_REQUEST_PARAMETER: {
        description: "Request Parameter 형식이 잘못된 경우",
        value: HutomHttpException.INVALID_REQUEST_PARAMETER,
      },
      NOT_FOUND_STUDY_WITH_ID: {
        description: "요청한 Study가 존재하지 않은 경우",
        value: HutomHttpException.NOT_FOUND_STUDY_WITH_ID,
      },
      FORBIDDEN_RESOURCE: {
        description: "자원에 접근 권한이 없는 경우",
        value: HutomHttpException.FORBIDDEN_RESOURCE,
      },
    },
  })
  async findOne(@Param("id") id: number): Promise<GetStudyRes> {
    // 특정 스터디를 조회한다.
    const study = await this.studySerivce.getOneById(id);
    return StudyDto.from(study);
  }
}
