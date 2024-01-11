import { Connection } from "typeorm";
import { HttpException, Injectable, Logger } from "@nestjs/common";
import { Application } from "@src/common/entity/application.entity";
import { LogType, ServiceType } from "@src/common/constant/enum.constant";

import { CreateApplicationServiceReq, GetAllApplicationServiceReq, RejectApplicationServiceReq, FailedApplications } from "@src/application/dto";

import { ApplicationRepository } from "@src/application/repository/application.repository";
import { UserRepository } from "@src/user/repository/user.repository";
import { OtpRepository } from "@src/otp/repository/otp.repository";

import { LoggerService } from "@src/logger/logger.service";
import { OtpService } from "@src/otp/service/otp.service";
import { UtilService } from "@src/util/util.service";
import { CheckUserService } from "@src/user/service/check-user.service";
import { CheckApplicationService } from "@src/application/service/check-application.service";
import { CloudService } from "@src/cloud/service/cloud.service";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { Role } from "@src/auth/interface/auth.interface";

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);
  constructor(
    private readonly connection: Connection,
    private readonly applicationRepository: ApplicationRepository,
    private readonly checkUserService: CheckUserService,
    private readonly checkApplicationService: CheckApplicationService,
    private readonly cloudService: CloudService,
    private readonly utilService: UtilService,
    private readonly otpService: OtpService,
    private readonly loggerService: LoggerService,
  ) {}

  getManyAndCount(conditions: GetAllApplicationServiceReq): Promise<[Application[], number]> {
    return this.applicationRepository.getManyAndCount(conditions);
  }

  async createOne(dto: CreateApplicationServiceReq): Promise<number> {
    const { employeeId, email, phoneNumber = null } = dto;

    // 사용중인 employeeId & email & phoneNumber여부 감사
    await this.checkUserService.canCreateOne({ employeeId, email, phoneNumber });
    await this.checkApplicationService.canCreateOne(employeeId, email, phoneNumber);

    // 가입 신청서 생성
    return await this.applicationRepository.createOne(dto);
  }

  async approveOne(id: number): Promise<{ id: number; employeeId: string }> {
    // 1. 유효한 request(id) 검증
    const application = await this.applicationRepository.findOne(id);
    if (!application) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DATA, HutomHttpException.NOT_FOUND_DATA.statusCode);
    }

    // 2. 아이디, 이메일, 전화번호 중복 검사
    const { employeeId, email, phoneNumber } = application;
    try {
      await this.checkUserService.canCreateOne({ employeeId, email, phoneNumber });
    } catch (error) {
      if (error instanceof HttpException) {
        throw new HttpException({ error: error.getResponse()["error"], employeeId }, error.getStatus());
      }
      throw error;
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const userRepository = queryRunner.manager.getCustomRepository(UserRepository);
    const otpRepository = queryRunner.manager.getCustomRepository(OtpRepository);
    const applicationRepository = queryRunner.manager.getCustomRepository(ApplicationRepository);

    try {
      // 3. Register User (Approve)
      const createUserDto = application.toCreateUserDto();
      const { employeeId, email, phoneNumber = null, ...rest } = createUserDto;

      // 3-1. 사용자 생성
      const savedUserId = await userRepository.createOne({
        ...rest,
        employeeId,
        email,
        role: Role.USER,
        phoneNumber,
        password: this.utilService.generateUniqueKey(), // NOTE: 임의값으로 설정
      });

      // 3-2. OTP 생성 및 이메일 발송
      await this.otpService.createOneByAuthenticatedUser({ userId: savedUserId, email, or: otpRepository });

      // 4. Delete Application
      await applicationRepository.delete(id);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return { id: savedUserId, employeeId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }

  async approveMany(ids: number[], req: { employeeId: string }): Promise<{ ids: number[]; failed: FailedApplications[] }> {
    const savedUserIds: number[] = [];
    const savedUserEmployeeIds: string[] = [];
    const failedInfoMap: Map<string, FailedApplications> = new Map();

    const approvalPromises = ids.map((id) => this.approveOne(id));
    const results = await Promise.allSettled(approvalPromises);
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { id: savedUserId, employeeId } = result.value;

        // Approved Data 수집
        if (savedUserId && employeeId) {
          savedUserIds.push(savedUserId);
          savedUserEmployeeIds.push(employeeId);
        }
      } else {
        const reasonResponse = result.reason.response;

        if (reasonResponse === HutomHttpException.NOT_FOUND_DATA) {
          throw new HttpException(HutomHttpException.NOT_FOUND_DATA, HutomHttpException.NOT_FOUND_DATA.statusCode);
        }

        // Failed Data 수집
        if (reasonResponse?.error && reasonResponse?.employeeId) {
          const { error, employeeId } = reasonResponse;
          const existingGroup = failedInfoMap.get(error);
          if (existingGroup) {
            existingGroup.employeeIds.push(employeeId);
          } else {
            failedInfoMap.set(error, { employeeIds: [employeeId], errorCode: error });
          }
        } else {
          this.logger.log(`E: Fail to approve Application, ${result.reason}`);
          throw new HttpException({ ...HutomHttpException.UNEXPECTED_ERROR, reason: result.reason }, HutomHttpException.UNEXPECTED_ERROR.statusCode);
        }
      }
    });

    const failedInfo: FailedApplications[] = Array.from(failedInfoMap.values());

    savedUserEmployeeIds.forEach((employeeId) => {
      this.loggerService.access(ServiceType.USER, req.employeeId, LogType.ADD_USER, `${employeeId}(${Role.USER})`);
    });
    return { ids: savedUserIds, failed: failedInfo };
  }

  async rejectMany(dto: RejectApplicationServiceReq) {
    const { ids } = dto;
    const applications = await this.applicationRepository.findByIds(ids);

    // 가입 신청서 삭제
    const { affected } = await this.applicationRepository.delete(ids);

    // Reject Email 발송 요청
    const targetEmails = applications.map((application) => application.email);
    this.cloudService.postEmailApplicationReject(targetEmails);

    return { affected };
  }
}
