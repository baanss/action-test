import * as moment from "moment";
import * as fs from "fs";
import { Connection, DeleteResult } from "typeorm";
import { HttpException, Injectable } from "@nestjs/common";

import { LogType, RusCaseStatus, ServiceType } from "@src/common/constant/enum.constant";
import { User } from "@src/common/entity/user.entity";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { Role } from "@src/auth/interface/auth.interface";
import { UtilService } from "@src/util/util.service";

import { UserRepository } from "@src/user/repository/user.repository";
import { CreateUserDto } from "@src/user/dto/in/post-user.dto";
import { PatchUsersMeDto } from "@src/user/dto/in/patch-users-me.dto";
import { PatchUsersMyPasswordDto } from "@src/user/dto/in/patch-users-my-password.dto";
import { PatchUsersDto } from "@src/user/dto/in/patch-users.dto";
import { GetAllUserServiceReq } from "@src/user/dto/in/get-all-user.service-request.dto";
import { DeleteAdminserviceReq, PostAdminServiceReq } from "@src/admin/dto";

import { CheckUserService } from "@src/user/service/check-user.service";
import { SessionService } from "@src/auth/service/session.service";
import { SessionRepository } from "@src/auth/repository/session.repository";
import { OtpService } from "@src/otp/service/otp.service";
import { OtpRepository } from "@src/otp/repository/otp.repository";
import { TotalCreditViewRepository } from "@src/credit-history/repository/total-credit-view.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { LoggerService } from "@src/logger/logger.service";

@Injectable()
export class UserService {
  constructor(
    private readonly connection: Connection,
    private readonly loggerService: LoggerService,
    private readonly userRepository: UserRepository,
    private readonly checkUserService: CheckUserService,
    private readonly sessionService: SessionService,
    private readonly otpService: OtpService,
    private readonly utilService: UtilService,
    private readonly rusCaseRepository: RusCaseRepository,
    private readonly totalCreditViewRepository: TotalCreditViewRepository,
  ) {}

  async getOneById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    return user;
  }

  async getManyByIds(ids: number[]): Promise<User[]> {
    const user = await this.userRepository.findByIds(ids);
    return user;
  }

  async getOneByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ email });
    return user;
  }

  async getAdmin(): Promise<User> {
    const admin = await this.userRepository.getAdmin();
    return admin;
  }

  getManyAndCount(conditions: GetAllUserServiceReq): Promise<[User[], number]> {
    const { employeeId, name, page, limit, sort = null, order = null } = conditions;
    const conditionsDto = {
      employeeId,
      name,
      page,
      limit,
      sort,
      order,
    };
    return this.userRepository.getManyAndCount(conditionsDto);
  }

  async updateMeById(id: number, patchUsersMeDto: PatchUsersMeDto): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new HttpException(HutomHttpException.NOT_FOUND_USER_WITH_ID, HutomHttpException.NOT_FOUND_USER_WITH_ID.statusCode);
    }

    // 중복 이메일, 중복 전화번호 여부 검증 후 update
    const { email, phoneNumber = null } = patchUsersMeDto;
    await this.checkUserService.canUpdateOne(email, phoneNumber);
    await this.updateOne(user, patchUsersMeDto);
  }

  async updateMyPasswordById(id: number, patchUsersMyPasswordDto: PatchUsersMyPasswordDto): Promise<User> {
    // 사용자가 존재하는지 검사
    const user = await this.userRepository.findOne(id);
    if (!user) {
      throw new HttpException(HutomHttpException.NOT_FOUND_USER_WITH_ID, HutomHttpException.NOT_FOUND_USER_WITH_ID.statusCode);
    }

    // 현재 비밀번호가 일치하는지 검사
    const hashedCurrentPassword = await this.utilService.hashString(patchUsersMyPasswordDto.current);
    if (user.password !== hashedCurrentPassword) {
      throw new HttpException(HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD, HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD.statusCode);
    }

    // 새로운 비밀번호 암호화
    const hashedNewPassword = await this.utilService.hashString(patchUsersMyPasswordDto.new);

    // 현재 & 직전 비밀번호와 동일한 비밀번호로 변경 불가
    if (user.password === hashedNewPassword || user.prevPassword === hashedNewPassword) {
      throw new HttpException(HutomHttpException.INVALID_REQUEST_BODY, HutomHttpException.INVALID_REQUEST_BODY.statusCode);
    }

    // 비밀번호 설정 시점 업데이트
    const passwordSettingAt = new Date();

    // 새로운 비밀번호로 업데이트
    await this.userRepository.update(user.id, { password: hashedNewPassword, prevPassword: user.password, passwordSettingAt });
    const result = await this.userRepository.findOne(id);

    return result;
  }

  async updateUserPasswordByOtp(newPassword: string, user: User, otpId: number): Promise<string> {
    // 새로운 비밀번호 암호화
    const hashedNewPassword = await this.utilService.hashString(newPassword);

    // 비밀번호 재 설정일 시, 현재 & 직전 비밀번호와 동일한 비밀번호로 변경 불가
    if (user.initPassword && user.password === hashedNewPassword) {
      throw new HttpException(HutomHttpException.INVALID_REQUEST_CURRENT_PASSWORD, HutomHttpException.INVALID_REQUEST_CURRENT_PASSWORD.statusCode);
    }
    if (user.initPassword && user.prevPassword === hashedNewPassword) {
      throw new HttpException(HutomHttpException.INVALID_REQUEST_PREV_PASSWORD, HutomHttpException.INVALID_REQUEST_PREV_PASSWORD.statusCode);
    }

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const userRepository = queryRunner.manager.getCustomRepository(UserRepository);
    const sessionRepository = queryRunner.manager.getCustomRepository(SessionRepository);
    const otpRepository = queryRunner.manager.getCustomRepository(OtpRepository);

    try {
      // 비밀번호 설정 시점 업데이트
      const passwordSettingAt = new Date();
      const updateDto = {
        password: hashedNewPassword,
        prevPassword: user.password,
        passwordSettingAt,
        initPassword: true, // NOTE: initPassword: 비밀번호 첫 설정 여부
        signInFailed: 0, // 비밀번호 실패 횟수 초기화
      };
      await userRepository.update(user.id, updateDto);

      // 기존 세션이 있다면 - 로그아웃 처리
      await this.sessionService.sessionLogout(user.id, sessionRepository);

      // otp 만료
      await this.otpService.expireOne(otpId, otpRepository);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return passwordSettingAt.toISOString();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }

  updateProfilePathById(id: number, profilePath: string) {
    return this.userRepository.update(id, { profilePath });
  }

  async registerUser(createUserDto: CreateUserDto, req: { employeeId: string }): Promise<number> {
    const { employeeId, email, phoneNumber = null, ...rest } = createUserDto;

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const userRepository = queryRunner.manager.getCustomRepository(UserRepository);
    const otpRepository = queryRunner.manager.getCustomRepository(OtpRepository);
    try {
      // 사용자 생성 가능한지 확인
      await this.checkUserService.canCreateOne({ employeeId, email, phoneNumber });

      // 사용자 생성
      const userId = await userRepository.createOne({
        ...rest,
        employeeId,
        email,
        phoneNumber,
        role: Role.USER,
        password: this.utilService.generateUniqueKey(), // NOTE: 임의값으로 설정
      });

      // OTP 생성
      // FIXME: otpRepository Arg 분리
      await this.otpService.createOneByAuthenticatedUser({ userId, email, or: otpRepository });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      const createdUser = await this.userRepository.findOne(userId);
      this.loggerService.access(ServiceType.USER, req.employeeId, LogType.ADD_USER, `${createdUser.employeeId}(${createdUser.role})`);

      return userId;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }

  async adminUpdateProfilePathById(id: number, profilePath: string) {
    // 사용자가 있는지 검사
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new HttpException(HutomHttpException.NOT_FOUND_USER_WITH_ID, HutomHttpException.NOT_FOUND_USER_WITH_ID.statusCode);
    }

    await this.userRepository.update(id, { profilePath });

    // 기존 프로필 이미지가 있으면 삭제
    if (user.profilePath) {
      await fs.promises.rm(user.profilePath);
    }
  }

  async adminUpdateById(id: number, patchUsersDto: PatchUsersDto): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new HttpException(HutomHttpException.NOT_FOUND_USER_WITH_ID, HutomHttpException.NOT_FOUND_USER_WITH_ID.statusCode);
    }

    // 중복 이메일 여부 검증 후 update
    const { email, phoneNumber = null } = patchUsersDto;
    await this.checkUserService.canUpdateOne(email, phoneNumber);
    await this.updateOne(user, patchUsersDto);
  }

  // 로그인 성공 시 호출. 로그인 실패 횟수 초기화 및 최종 로그인 시간 업데이트
  async handleSignInSuccess(user: User, ur?: UserRepository): Promise<void> {
    const userRepository = ur ? ur : this.userRepository;
    await userRepository.update(user.id, { signInFailed: 0, lastLogin: new Date() });
  }

  // 로그인 실패 시 호출. 로그인 실패 횟수 증가
  async handleSignInFailed(user: User): Promise<void> {
    await this.userRepository.update(user.id, { signInFailed: user.signInFailed + 1 });
  }

  // 입력된 값으로 User 데이터 업데이트
  async updateOne(
    user: User,
    update: { email?: string; name?: string; phoneNumber?: string; showGuide?: boolean; passwordSettingAt?: string; enableEmail?: boolean },
  ): Promise<void> {
    const updateDto: Partial<User> = {};
    if (update.email) {
      updateDto["email"] = update.email;
    }
    if (update.name) {
      updateDto["name"] = update.name;
    }
    if (update.phoneNumber) {
      updateDto["phoneNumber"] = update.phoneNumber;
    }
    if (update.phoneNumber === "") {
      updateDto["phoneNumber"] = null;
    }
    if (update.hasOwnProperty("showGuide")) {
      updateDto["showGuide"] = update.showGuide;
    }
    if (update.passwordSettingAt) {
      updateDto["passwordSettingAt"] = new Date(update.passwordSettingAt);
    }
    if (update.hasOwnProperty("enableEmail")) {
      updateDto["enableEmail"] = update.enableEmail;
    }

    await this.userRepository.update(user.id, updateDto);
  }

  /**
   * 계정 삭제
   * @param id number 삭제할 계정의 DB id
   * @param req {employeeId: string} 삭제를 요청한 계정 정보(employeeId)
   * @returns void
   */
  async deleteOne(id: number, req?: { employeeId: string }): Promise<void> {
    const deletedUser = await this.userRepository.findById(id);
    if (!deletedUser) {
      throw new HttpException({ ...HutomHttpException.NOT_FOUND_DATA, userId: id }, HutomHttpException.NOT_FOUND_DATA.statusCode);
    }
    const rusCase = await this.rusCaseRepository.getOne({ userId: id });
    if (rusCase && (rusCase.status === RusCaseStatus.TODO || rusCase.status === RusCaseStatus.IN_PROGRESS)) {
      throw new HttpException(
        { ...HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS, userId: id },
        HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS.statusCode,
      );
    }
    await this.userRepository.delete({ id });
    if (req) {
      this.loggerService.access(ServiceType.USER, req.employeeId, LogType.DELETE_USER, `[${deletedUser.employeeId}(${deletedUser.role})]`);
    } else {
      this.loggerService.access(ServiceType.SYSTEM, null, LogType.DELETE_USER, `[${deletedUser.employeeId}(${deletedUser.role})]`);
    }
  }

  /**
   * 휴면 계정 삭제
   * @returns Promise<void>
   */
  async deleteManyInSleepOneYear(): Promise<void> {
    const oneYearAgo = moment().subtract(365, "days").toDate();
    const sleepUsers = await this.userRepository.getManyLastLoggedInBefore(oneYearAgo);
    const deleteMany = sleepUsers.map((user) => this.deleteOne(user.id));
    const settledResult = await Promise.allSettled(deleteMany);
    settledResult.forEach((result) => {
      if (result.status === "rejected") {
        this.loggerService.access(ServiceType.SYSTEM, null, LogType.DELETE_USER, `(fail) ${result.reason.response?.error ?? result.reason}`);
      }
    });
  }

  /**
   * 대표 계정 생성
   * @param {PostAdminServiceReq} createAdminDto 대표 계정 생성에 필요한 데이터
   * @returns {{ id:number; isCreated:boolean }} 생성된 대표 계정의 DB id
   * @throws {Error} 생성에 실패한 경우 예외가 throw 된다.
   */
  async registerAdmin(createAdminDto: PostAdminServiceReq): Promise<number> {
    const { email, employeeId, phoneNumber, name } = createAdminDto;
    await this.checkUserService.canCreateOne({ employeeId, email, phoneNumber });

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const userRepository = queryRunner.manager.getCustomRepository(UserRepository);
    const otpRepository = queryRunner.manager.getCustomRepository(OtpRepository);

    try {
      const adminId = await userRepository.createOne({
        name,
        employeeId,
        email,
        phoneNumber,
        role: Role.ADMIN,
        password: this.utilService.generateUniqueKey(), // NOTE: 임의값으로 설정
      });

      // OTP 생성
      // FIXME: otpRepository Arg 분리
      await this.otpService.createOneByAuthenticatedUser({ userId: adminId, email, or: otpRepository });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      const createdAdmin = await this.userRepository.findOne(adminId);
      this.loggerService.access(ServiceType.USER, null, LogType.ADD_USER, `[${createdAdmin.employeeId}(${createdAdmin.role})]`);
      return adminId;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }

  /**
   * 대표 계정 승격.
   * @param {User} advanceTarget - 승격할 대상 사용자
   * @param {Object} dto - 승격에 필요한 데이터
   * @returns {Promise<number>} 승격된 대표 계정의 DB id
   */
  async advanceAdmin(advanceTarget: User, dto: { employeeId: string; phoneNumber: string | null; name: string }): Promise<number> {
    const { employeeId, name, phoneNumber } = dto;

    if (advanceTarget.employeeId !== employeeId) {
      await this.checkUserService.canUpdateEmployeeId(employeeId);
    }
    if (advanceTarget.phoneNumber !== phoneNumber) {
      await this.checkUserService.canUpdatePhoneNumber(phoneNumber);
    }

    await this.userRepository.updateToAdmin(advanceTarget.id, { employeeId, phoneNumber, name });
    const advancedUser = await this.userRepository.findOne(advanceTarget.id);

    this.loggerService.access(ServiceType.USER, null, LogType.ADD_USER, `[${advancedUser.employeeId}(${advancedUser.role})]`);
    return advancedUser.id;
  }

  /**
   * 대표 계정 삭제.
   * @param {Object} deleteAdminServiceReq - 삭제할 대표 계정의 정보
   * @returns {Promise<DeleteResult>} 삭제된 대표 계정에 대한 삭제 결과 객체
   * @throws {HttpException} 대표 계정 삭제에 실패한 경우 예외 throw.
   */
  async deleteAdmin(deleteAdminServiceReq: DeleteAdminserviceReq): Promise<DeleteResult> {
    const { email, employeeId } = deleteAdminServiceReq;
    const deletedAdmin = await this.userRepository.getAdmin();

    if (!deletedAdmin) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DATA, HutomHttpException.NOT_FOUND_DATA.statusCode);
    }
    if (deletedAdmin.email !== email || deletedAdmin.employeeId !== employeeId) {
      throw new HttpException(HutomHttpException.INVALID_REQUEST_BODY, HutomHttpException.INVALID_REQUEST_BODY.statusCode);
    }

    const totalCredit = await this.totalCreditViewRepository.getTotalCredit();
    if (totalCredit > 0) {
      throw new HttpException(HutomHttpException.INVALID_DELETE_ADMIN_BY_CREDIT, HutomHttpException.INVALID_DELETE_ADMIN_BY_CREDIT.statusCode);
    }

    const rusCase = await this.rusCaseRepository.getOne({ userId: deletedAdmin.id });
    if (rusCase && (rusCase.status === RusCaseStatus.TODO || rusCase.status === RusCaseStatus.IN_PROGRESS)) {
      throw new HttpException(
        { ...HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS, userId: deletedAdmin.id },
        HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS.statusCode,
      );
    }

    const result = await this.userRepository.delete({ id: deletedAdmin.id });
    this.loggerService.access(ServiceType.USER, null, LogType.DELETE_USER, `[${deletedAdmin.employeeId}(${deletedAdmin.role})]`);

    return result;
  }
}
