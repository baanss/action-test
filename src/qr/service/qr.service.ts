import * as moment from "moment";
import { lastValueFrom, map } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { HttpException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { QrConfig, PacsConfig, CoreConfig } from "@src/common/config/configuration";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { AeMode, LogType, ServiceType, UploadJobStatus } from "@src/common/constant/enum.constant";
import { UploadJobService } from "@src/upload-job/service/upload-job.service";
import { CreateQrServiceReq, FindStudyDto, GetAllQrStudyServiceReq, PostQrStudyServiceRes } from "@src/qr/dto";
import { LoggerService } from "@src/logger/logger.service";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";

@Injectable()
export class QrService {
  private qrConfig: QrConfig;
  private pacsConfig: PacsConfig;
  private coreConfig: CoreConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly uploadJobService: UploadJobService,
    private readonly loggerService: LoggerService,
    private readonly uploadJobRepository: UploadJobRepository,
  ) {
    this.qrConfig = this.configService.get<QrConfig>("qr");
    this.pacsConfig = this.configService.get<PacsConfig>("pacs");
    this.coreConfig = this.configService.get<CoreConfig>("core");
  }

  /**
   * QR 서버 연결 상태 확인
   */
  async healthCheck(): Promise<string> {
    try {
      const url = this.qrConfig.serverUrl + "/qr/echo";
      const configOption = {
        headers: {
          "X-Auth-Token": this.coreConfig.serverCode,
        },
        params: {
          ip: this.pacsConfig.serverHost,
          port: this.pacsConfig.serverPort,
          aet: this.pacsConfig.serverAet,
        },
      };
      const response = this.httpService.get(url, configOption).pipe(map((response) => response.data));
      await lastValueFrom(response);
      return "h-Dicom server is connected";
    } catch (error) {
      if (error.response?.data?.error_code === "UNAUTHORIZED") {
        throw new HttpException(
          { ...HutomHttpException.UNAUTHORIZED_HDICOM_APIKEY, message: error.response.data.message },
          HutomHttpException.UNAUTHORIZED_HDICOM_APIKEY.statusCode,
        );
      }
      if (error.response?.data?.error_code === "TIMEOUT") {
        throw new HttpException({ ...HutomHttpException.TIMEOUT, message: error.response.data.message }, HutomHttpException.TIMEOUT.statusCode);
      }
      if (error.response?.data?.error_code === "SERVICE_UNAVAILABLE") {
        throw new HttpException(
          { ...HutomHttpException.SERVICE_UNAVAILABLE, message: error.response.data.message },
          HutomHttpException.SERVICE_UNAVAILABLE.statusCode,
        );
      }

      throw error;
    }
  }

  /**
   * 검색
   * 다이콤서버 요청(GET /qr/studies)
   */
  async requestStudyFind(getAllQrStudyServiceReq: GetAllQrStudyServiceReq): Promise<{ message: string; studies: FindStudyDto[] }> {
    const { patientId, today, period } = getAllQrStudyServiceReq;
    const url = this.qrConfig.serverUrl + "/qr/studies";
    const decodePatinetId = decodeURIComponent(patientId);
    const configOption = {
      headers: {
        "X-Auth-Token": this.coreConfig.serverCode,
      },
      params: {
        patientId: decodePatinetId,
        ip: this.pacsConfig.serverHost,
        port: this.pacsConfig.serverPort,
        aet: this.pacsConfig.serverAet,
      },
    };
    const request = this.httpService.get(url, configOption).pipe(map((response) => response));
    try {
      const response = await lastValueFrom(request);

      const { studies, message } = response.data;
      // 검색
      const filteredStudies: FindStudyDto[] = studies.filter((study: FindStudyDto) => {
        const studyDate = moment(study.studyDate ?? "19000101");
        const todayMinusPeriodDate = moment(today).subtract(period, "days");
        return period ? studyDate.diff(todayMinusPeriodDate) >= 0 : true;
      });

      //studyFilter 날짜 내림차순 정렬
      filteredStudies.sort((a, b) => moment(b.studyDate).valueOf() - moment(a.studyDate).valueOf());

      return {
        message,
        studies: filteredStudies,
      };
    } catch (error) {
      throw new HttpException(
        { ...HutomHttpException.UNEXPECTED_ERROR_DICOM_SERVER, stack: error.stack },
        HutomHttpException.UNEXPECTED_ERROR_DICOM_SERVER.statusCode,
      );
    }
  }

  /**
   * 다이콤서버 요청(POST /qr/studies)
   */
  async requestStudyMove(requestId: string, uploadJobId: number, huId: string, studyInstanceUID: string): Promise<PostQrStudyServiceRes> {
    const uploadJobUpdateBody = { status: null, message: null };
    try {
      const url = this.qrConfig.serverUrl + "/qr/studies";
      const data = { studyInstanceUID, uploadJobId };
      const configOption = {
        headers: {
          "X-Auth-Token": this.coreConfig.serverCode,
          huId,
        },
        params: {
          ip: this.pacsConfig.serverHost,
          port: this.pacsConfig.serverPort,
          aet: this.pacsConfig.serverAet,
        },
      };
      const response = this.httpService.post(url, data, configOption).pipe(map((response) => response.data.message));
      const message = await lastValueFrom(response);

      uploadJobUpdateBody.status = UploadJobStatus.DONE;
      uploadJobUpdateBody.message = message;
      this.loggerService.access(
        ServiceType.USER,
        requestId,
        LogType.DICOM_QUERY,
        `studyInstanceUID: ${studyInstanceUID}, huId: ${huId}, result: ${uploadJobUpdateBody.status}, ${uploadJobUpdateBody.message}`,
      );
    } catch (error) {
      uploadJobUpdateBody.status = UploadJobStatus.REJECT;
      uploadJobUpdateBody.message = error.response?.data?.message ?? error.response;
      this.loggerService.access(
        ServiceType.USER,
        requestId,
        LogType.DICOM_QUERY,
        `(failed) studyInstanceUID: ${studyInstanceUID}, huId: ${huId}, result: ${uploadJobUpdateBody.status}, ${uploadJobUpdateBody.message}`,
      );
    } finally {
      await this.uploadJobService.updateById(uploadJobId, uploadJobUpdateBody);
      return uploadJobUpdateBody;
    }
  }

  async createOne(dto: CreateQrServiceReq): Promise<{ uploadJobId: number; huId: string }> {
    const { requestorId, studyInstanceUID, patientId, patientName, instancesCount, age, sex } = dto;
    const [qrJobs, count] = await this.uploadJobRepository.getQrJobsAndCount({ isDone: false, timeoutMs: this.qrConfig.timeoutMs });
    if (this.qrConfig.maxCount - count < 1) {
      throw new HttpException(HutomHttpException.EXCEEDED_QR_REQUEST_MAX_COUNT, HutomHttpException.EXCEEDED_QR_REQUEST_MAX_COUNT.statusCode);
    }
    const duplicatedQrJob = qrJobs.find((uploadJob) => uploadJob.studyInstanceUID === studyInstanceUID);
    if (duplicatedQrJob) {
      throw new HttpException(HutomHttpException.DUPLICATED_QR_REQUEST_ON_DB, HutomHttpException.DUPLICATED_QR_REQUEST_ON_DB.statusCode);
    }
    // upload-job 생성
    const { id, huId } = await this.uploadJobService.createOne({
      aeMode: AeMode.SCU,
      userId: requestorId,
      studyInstanceUID,
      patientId,
      patientName,
      instancesCount,
      age,
      sex,
    });
    return { uploadJobId: id, huId };
  }
}
