import { HttpException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Connection } from "typeorm";

import { AppLoginReq, UserLoginReq } from "@src/auth/dto/in/login-req.dto";
import { VerifiedToken } from "@src/auth/interface/auth.interface";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { CustomOrigin } from "@src/common/middleware/user-auth.middleware";

import { User } from "@src/common/entity/user.entity";
import { UserRepository } from "@src/user/repository/user.repository";
import { SessionRepository } from "@src/auth/repository/session.repository";

import { UtilService } from "@src/util/util.service";
import { SessionService } from "@src/auth/service/session.service";
import { UserService } from "@src/user/service/user.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly utilService: UtilService,
    private readonly jwtService: JwtService,
    private readonly connection: Connection,
  ) {}

  /**
   * 사용자 로그인 함수
   * 일반 계정 및 대표 계정의 로그인 처리
   * 로그인 유효성 검사 후, AccessToken과 SessionToken을 발급한다.
   * @param loginReq
   * @returns accessToken, sessionToken
   */
  async userLogin(loginReq: UserLoginReq): Promise<{ accessToken: string; sessionToken: string }> {
    const { employeeId, password, isForced = false } = loginReq;
    const user = await this.userRepository.findByEmployeeId(employeeId);

    // employeeId가 없거나 비활성화 처리된 경우
    if (!user) {
      throw new HttpException(HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID, HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID.statusCode);
    }
    // 비밀번호가 설정되지 않은 사용자(user.initPassword === false)의 경우
    if (!user.initPassword) {
      throw new HttpException(HutomHttpException.PASSWORD_INIT_REQUIRED, HutomHttpException.PASSWORD_INIT_REQUIRED.statusCode);
    }
    // 비밀번호 5번 이상 틀린 경우
    if (user.signInFailed >= 5) {
      throw new HttpException(HutomHttpException.LOCKED_PASSWORD_USER, HutomHttpException.LOCKED_PASSWORD_USER.statusCode);
    }

    // 비밀번호가 틀린 경우
    const hashedPassword = await this.utilService.hashString(password);
    if (user.password !== hashedPassword) {
      await this.userService.handleSignInFailed(user);
      const updatedUser = await this.userRepository.findByEmployeeId(employeeId);

      // 비밀번호 5번 미만 틀린 경우
      if (updatedUser.signInFailed < 5) {
        throw new HttpException(
          { ...HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD, signInFailed: updatedUser.signInFailed },
          HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD.statusCode,
        );
      }
      // 비밀번호 5번째 틀린 경우
      throw new HttpException(HutomHttpException.LOCKED_PASSWORD_USER, HutomHttpException.LOCKED_PASSWORD_USER.statusCode);
    }

    // session 검증 (중복 로그인 방지) - 강제 로그인 시도 시 PASS
    await this.sessionService.verifySessionToken(user, isForced);

    // 로그인 성공 - 성공에 따른 데이터 수정 트랜잭션
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const userRepository = queryRunner.manager.getCustomRepository(UserRepository);
    const sessionRepository = queryRunner.manager.getCustomRepository(SessionRepository);

    try {
      // 1. 비밀번호 틀린 횟수 0으로 초기화 & 최종 접속 시간 업데이트
      await this.userService.handleSignInSuccess(user, userRepository);

      // 2. 세션 upsert (Insert or Update)
      const userSession = await this.sessionService.upsertSession(user, sessionRepository);

      // 3. JWT 발급
      const accessToken = this.generateJwtToken(user);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return { accessToken, sessionToken: userSession.sessionToken };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }

  async rusClientLogin(loginReq: AppLoginReq): Promise<{ accessToken: string }> {
    const { employeeId, password } = loginReq;
    const user = await this.userRepository.findByEmployeeId(employeeId);

    // employeeId가 없는 경우
    if (!user) {
      throw new HttpException(HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID, HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID.statusCode);
    }

    const hashedPassword = await this.utilService.hashString(password);
    // 비밀번호가 틀린 경우
    if (user.password !== hashedPassword) {
      throw new HttpException(HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD, HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD.statusCode);
    }

    // 로그인 성공
    const { id, role } = user;
    const payload = { id, employeeId, role };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async getAuthenticatedUser(accessToken: string, sessionToken: string, customOrigin: CustomOrigin): Promise<[VerifiedToken, User]> {
    let verifiedToken: VerifiedToken;
    // 토큰 정보 조회
    try {
      verifiedToken = await this.jwtService.verifyAsync(accessToken);
    } catch (error) {
      throw new HttpException(HutomHttpException.UNAUTHORIZED, HutomHttpException.UNAUTHORIZED.statusCode);
    }

    // 세션 검증
    const userSession = await this.sessionRepository.findOneByUserId(verifiedToken.id);
    if (!userSession && customOrigin === CustomOrigin.USER) {
      throw new HttpException(HutomHttpException.UNAUTHORIZED_SESSION_DELETED, HutomHttpException.UNAUTHORIZED_SESSION_DELETED.statusCode);
    }

    const userSessionToken = userSession?.sessionToken;
    const validSession = (origin: CustomOrigin, sessionToken: string) => {
      const isValidOrigin = origin === CustomOrigin.RUS_CLIENT;
      const isValidUser = origin === CustomOrigin.USER && sessionToken === userSessionToken;

      return isValidOrigin || isValidUser;
    };

    if (!validSession(customOrigin, sessionToken)) {
      throw new HttpException(HutomHttpException.UNAUTHORIZED_SESSION_DUPLICATED, HutomHttpException.UNAUTHORIZED_SESSION_DUPLICATED.statusCode);
    }

    // 사용자 조회
    const user = await this.userRepository.findById(verifiedToken.id);
    if (!user) {
      throw new HttpException(HutomHttpException.NOT_FOUND_USER_WITH_ID, HutomHttpException.NOT_FOUND_USER_WITH_ID.statusCode);
    }

    return [verifiedToken, user];
  }

  generateJwtToken(user: User): string {
    return this.jwtService.sign({
      id: user.id,
      employeeId: user.employeeId,
      role: user.role,
    });
  }
}
