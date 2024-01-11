import { Agent, AgentOptions } from "https";
import * as fs from "fs";
import { catchError, firstValueFrom, lastValueFrom } from "rxjs";
import { AxiosError } from "axios";
import * as FormData from "form-data";

import { HttpException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";

import { CloudConfig, CoreConfig, NodeEnv, ServerConfig } from "@src/common/config/configuration";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { PostCloudRejectServiceReq, PostEmailApplicationRejectReq, PostEmailPasswordResetReq, PostEmailSleepUserReq } from "@src/cloud/dto";
import { CreateNotificationService } from "@src/batch/service/create-notification.service";
import { CreateHuctDto } from "@src/rus-case/dto/huct.dto";

@Injectable()
export class CloudService {
  private readonly logger = new Logger(CreateNotificationService.name);
  private cloudConfig: CloudConfig;
  private serverConfig: ServerConfig;
  private coreConfig: CoreConfig;
  private httpsAgent: AgentOptions;

  constructor(private readonly configService: ConfigService, private readonly httpService: HttpService) {
    this.cloudConfig = this.configService.get<CloudConfig>("cloud");
    this.serverConfig = this.configService.get<ServerConfig>("server");
    this.coreConfig = this.configService.get<CoreConfig>("core");
    // 배포 환경, 인증서 설정을 위한 옵션
    this.httpsAgent = new Agent({
      rejectUnauthorized: false, // (NOTE: this will disable client verification)
      cert: fs.readFileSync(this.cloudConfig.signedCertPath),
      key: fs.readFileSync(this.cloudConfig.signedKeyPath),
      passphrase: "YYY",
      requestCert: false,
    });
  }

  // 클라우드 서버 연결 상태 확인
  async healthCheck(): Promise<string> {
    const httpsAgent = this.httpsAgent;
    const axiosOption = this.serverConfig.nodeEnv === NodeEnv.PROD ? { httpsAgent } : {};
    await firstValueFrom(
      this.httpService.get(this.cloudConfig.hcloudServerUrl, axiosOption).pipe(
        catchError(() => {
          throw new HttpException(HutomHttpException.HCLOUD_NOT_WORKING, HutomHttpException.HCLOUD_NOT_WORKING.statusCode);
        }),
      ),
    );
    return "h-Cloud server is connected";
  }

  /**
   * RUS Case 등록 요청
   * @param formData
   * @returns POST /rus-cases
   */
  async postRusCases(huCT: CreateHuctDto, filePath: string): Promise<void> {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("text", JSON.stringify(huCT));

    const url = this.cloudConfig.hcloudServerUrl + "/rus-cases";
    const configOption = {
      headers: { ...formData.getHeaders(), "X-Auth-Token": "hcloud-server" },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };
    const response = this.httpService.post<{ message: string }>(url, formData, configOption).pipe(
      catchError((error: AxiosError) => {
        this.logger.error(JSON.stringify(error));
        throw new HttpException({ ...HutomHttpException.HCLOUD_NOT_WORKING, ...error }, HutomHttpException.HCLOUD_NOT_WORKING.statusCode);
      }),
    );
    await lastValueFrom(response);
  }

  /**
   * RUS Case 취소 요청
   * @param postCloudRejectServiceReq { huId: string }
   * @returns POST /rus-cases/reject
   */
  async postRusCasesReject(postCloudRejectServiceReq: PostCloudRejectServiceReq): Promise<boolean> {
    const url = this.cloudConfig.hcloudServerUrl + "/rus-cases/reject";
    const configOption = {
      headers: { "X-Auth-Token": "hcloud-server" },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };
    await firstValueFrom(
      this.httpService.post<{ huId: string; email: string }>(url, postCloudRejectServiceReq, configOption).pipe(
        catchError((error: AxiosError) => {
          // FIXME? 얘외처리 보강
          if (error.response?.data?.statusCode === 403) {
            throw new HttpException(HutomHttpException.FORBIDDEN_RESOURCE_HCLOUD, HutomHttpException.FORBIDDEN_RESOURCE_HCLOUD.statusCode);
          }
          if (error.response?.data?.statusCode === 404) {
            throw new HttpException(HutomHttpException.NOT_FOUND_RUS_CASE_HCLOUD, HutomHttpException.NOT_FOUND_RUS_CASE_HCLOUD.statusCode);
          }
          throw error;
        }),
      ),
    );
    return true;
  }

  /**
   * 비밀번호 재설정 이메일 발송 요청
   * POST /email/password-reset (h-Space)
   * @param targetEmail 발송 요청 대상 이메일
   * @param token 사용자의 OTP 토큰
   * @returns void
   */
  async postEmailPasswordReset(targetEmail: string, token: string): Promise<void> {
    const postData = {
      serverCode: this.coreConfig.serverCode,
      targetEmail,
      redirectUrl: this.serverConfig.redirectUrl + "/reset-password?token=" + token,
    };
    const url = this.cloudConfig.hcloudServerUrl + "/email/password-reset";
    const configOption = {
      headers: { "X-Auth-Token": "hcloud-server" },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };

    const response = this.httpService.post<PostEmailPasswordResetReq>(url, postData, configOption).pipe(
      catchError((error: AxiosError) => {
        this.logger.error(JSON.stringify(error));
        throw new HttpException({ ...HutomHttpException.HCLOUD_NOT_WORKING, ...error }, HutomHttpException.HCLOUD_NOT_WORKING.statusCode);
      }),
    );
    await lastValueFrom(response);
  }

  /**
   * 가입 승인 및 계정 생성 이메일 발송 요청
   * POST /email/password-init (h-Space)
   * @param targetEmail 발송 요청 대상 이메일
   * @param token 사용자의 OTP 토큰
   * @returns void
   */
  async postEmailPasswordInit(targetEmail: string, token: string): Promise<void> {
    const postData = {
      serverCode: this.coreConfig.serverCode,
      targetEmail,
      redirectUrl: this.serverConfig.redirectUrl + "/reset-password?token=" + token,
    };
    const url = this.cloudConfig.hcloudServerUrl + "/email/password-init";
    const configOption = {
      headers: { "X-Auth-Token": "hcloud-server" },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };
    const response = this.httpService.post<PostEmailPasswordResetReq>(url, postData, configOption).pipe(
      catchError((error: AxiosError) => {
        this.logger.error(JSON.stringify(error));
        throw new HttpException({ ...HutomHttpException.HCLOUD_NOT_WORKING, ...error }, HutomHttpException.HCLOUD_NOT_WORKING.statusCode);
      }),
    );
    await lastValueFrom(response);
  }

  /**
   * 가입 거절 이메일 발송 요청
   * POST /email/reject (h-Space)
   * @param targetEmails 발송 요청 대상 이메일 배열
   * @returns void
   */
  async postEmailApplicationReject(targetEmails: string[]): Promise<void> {
    const postData = {
      serverCode: this.coreConfig.serverCode,
      targetEmails,
    };
    const url = this.cloudConfig.hcloudServerUrl + "/email/reject";
    const configOption = {
      headers: { "X-Auth-Token": "hcloud-server" },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };

    const response = this.httpService.post<PostEmailApplicationRejectReq>(url, postData, configOption).pipe(
      catchError((error: AxiosError) => {
        this.logger.error(JSON.stringify(error));
        throw new HttpException({ ...HutomHttpException.HCLOUD_NOT_WORKING, ...error }, HutomHttpException.HCLOUD_NOT_WORKING.statusCode);
      }),
    );
    await lastValueFrom(response);
  }

  /**
   * 최종 접속 시간이 335일 된 일반 사용자에게 메일 발송합니다.
   * POST /email/long-term (h-Space)
   * @param targetEmail 발송 요청 대상 이메일
   * @param scheduledDeletionDate 예정된 삭제 날짜 : yyyy-mm-dd
   * @returns void
   */
  async postEmailSleepUser(targetEmail: string, scheduledDeletionDate: string): Promise<void> {
    const postData = {
      serverCode: this.coreConfig.serverCode,
      targetEmail: targetEmail,
      scheduledDeletionDate: scheduledDeletionDate,
      redirectUrl: this.serverConfig.redirectUrl,
    };

    const url = this.cloudConfig.hcloudServerUrl + "/email/long-term";
    const configOption = {
      headers: { "X-Auth-Token": "hcloud-server" },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };

    const response = this.httpService.post<PostEmailSleepUserReq>(url, postData, configOption).pipe(
      catchError((error: AxiosError) => {
        this.logger.error(JSON.stringify(error));
        throw new HttpException({ ...HutomHttpException.HCLOUD_NOT_WORKING, ...error }, HutomHttpException.HCLOUD_NOT_WORKING.statusCode);
      }),
    );
    await lastValueFrom(response);
  }

  /**
   * PDF 로그파일 이메일 발송 요청
   * POST /email/log (h-Space)
   * @param filePath 파일 경로
   * @param targetEmail 대상 이메일
   * @param targetMonth 대상 연월
   * @returns void
   */
  async postEmailMonthlyLog(filePath: string, targetEmail: string, targetMonth: string): Promise<void> {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("serverCode", this.coreConfig.serverCode);
    formData.append("targetEmail", targetEmail);
    formData.append("targetMonth", targetMonth);

    const url = this.cloudConfig.hcloudServerUrl + "/email/log";
    const configOption = {
      headers: { ...formData.getHeaders(), "X-Auth-Token": "hcloud-server" },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };

    const response = this.httpService.post(url, formData, configOption).pipe(
      catchError((error: AxiosError) => {
        this.logger.error(JSON.stringify(error));
        throw new HttpException({ ...HutomHttpException.HCLOUD_NOT_WORKING, ...error }, HutomHttpException.HCLOUD_NOT_WORKING.statusCode);
      }),
    );
    await lastValueFrom(response);
  }
}
