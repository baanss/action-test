import { Body, Controller, Get, HttpCode, Post, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { RequestWithUser } from "@src/common/interface/request.interface";
import { Roles } from "@src/common/guard/role.guard";
import { Role } from "@src/auth/interface/auth.interface";
import { QrService } from "@src/qr/service/qr.service";
import { GetAllQrStudyReq, GetAllQrStudyRes, GetQrEchoRes, PostQrStudyReq, PostQrStudyRes } from "@src/qr/dto";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { QrStudyDto } from "@src/qr/dto/qr-study.dto";

@ApiTags("qr")
@ApiOriginHeaders()
@Controller("qr")
export class QrController {
  constructor(private readonly qrService: QrService) {}

  /**
   * QR 서비스 상태 확인(echo)
   * @returns GetQrEchoRes
   */
  @Get("echo")
  @ApiCustomOperation({
    summary: "연결 상태 확인(echo)",
    description: "h-dicom-server로부터 PACS와의 연결 상태를 확인한다.(C-Echo)",
  })
  @ApiResponse({ status: 200, description: "연결 성공", type: GetQrEchoRes })
  @ApiUserAuthResponse({
    examples: {
      SERVICE_UNAVAILABLE: {
        description: "(h-dicom-server)협상 실패",
        value: HutomHttpException.SERVICE_UNAVAILABLE,
      },
      TIMEOUT: {
        description: "(h-dicom-server)연결 시간 초과",
        value: HutomHttpException.TIMEOUT,
      },
      UNAUTHORIZED_HDICOM_APIKEY: {
        description: "(h-dicom-server)유효하지 않은 h-dicom API 인증키",
        value: HutomHttpException.UNAUTHORIZED_HDICOM_APIKEY,
      },
    },
  })
  async echo(): Promise<GetQrEchoRes> {
    const message = await this.qrService.healthCheck();
    return {
      message: message,
    };
  }

  /**
   * 스터디 검색
   * @param GetAllQrStudyReq
   * @returns GetAllQrStudyRes
   */
  @Get("studies")
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "스터디 리스트 조회 및 검색(find)",
    description: "PACS로부터 특정 환자의 Study 리스트를 조회한다.(C-Find)",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiResponse({
    status: 200,
    description: "스터디 검색 성공",
    type: GetAllQrStudyRes,
  })
  @ApiUserAuthResponse({
    examples: {
      UNEXPECTED_ERROR_DICOM_SERVER: {
        description: "h-dicom-server 서버 에러",
        value: HutomHttpException.UNEXPECTED_ERROR_DICOM_SERVER,
      },
    },
  })
  async find(@Query() getAllQrStudyReq: GetAllQrStudyReq): Promise<GetAllQrStudyRes> {
    const { studies, message } = await this.qrService.requestStudyFind(getAllQrStudyReq);
    return {
      message: message,
      count: studies.length,
      data: QrStudyDto.fromMany(studies),
    };
  }

  /**
   * CT 가져오기
   * @param PostQrStudyReq
   * @returns PostQrStudyRes
   */
  @Post("studies")
  @HttpCode(200)
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "CT Load 요청(move)",
    description: "PACS로부터 특정 환자의 Study 파일을 요청한다.(C-Move)",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiCustomOperation({ summary: "CT 가져오기" })
  @ApiResponse({
    status: 200,
    description: "CT 가져오기 성공",
    type: PostQrStudyRes,
  })
  @ApiUserAuthResponse({
    examples: {
      EXCEEDED_QR_REQUEST_MAX_COUNT: {
        description: "요청 횟수 초과",
        value: HutomHttpException.EXCEEDED_QR_REQUEST_MAX_COUNT,
      },
      DUPLICATED_QR_REQUEST_ON_DB: {
        description: "동일한 Study의 QR 요청이 존재하는 경우(기준: StudyInstanceUID)",
        value: HutomHttpException.DUPLICATED_QR_REQUEST_ON_DB,
      },
    },
  })
  async load(@Req() req: RequestWithUser, @Body() body: PostQrStudyReq): Promise<PostQrStudyRes> {
    const { studyInstanceUID, patientId, patientName, instancesCount, age, sex } = body;
    const { uploadJobId, huId } = await this.qrService.createOne({
      requestorId: req.user.id,
      studyInstanceUID,
      patientId,
      patientName,
      instancesCount,
      age,
      sex,
    });
    this.qrService.requestStudyMove(req.user.employeeId, uploadJobId, huId, studyInstanceUID);
    return { id: uploadJobId };
  }
}
