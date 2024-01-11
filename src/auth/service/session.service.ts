import { HttpException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { User } from "@src/common/entity/user.entity";
import { Session } from "@src/common/entity/session.entity";
import { SessionRepository } from "@src/auth/repository/session.repository";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { AuthConfig } from "@src/common/config/configuration";
import { UtilService } from "@src/util/util.service";

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private authConfig: AuthConfig;

  constructor(private readonly sessionRepository: SessionRepository, private readonly utilService: UtilService, private readonly configService: ConfigService) {
    this.authConfig = this.configService.get<AuthConfig>("auth");
  }

  async getOneByUserId(userId: number): Promise<Session | null> {
    const result = await this.sessionRepository.findOneByUserId(userId);
    if (!result) {
      return null;
    }
    return result;
  }

  async verifySessionToken(user: User, isForced: boolean): Promise<void> {
    // 1. 강제 로그인 시 - PASS
    if (isForced) return;

    // 2. 세션이 없는 경우 - PASS
    const userSession = await this.sessionRepository.findOneByUserId(user.id);
    if (!userSession?.sessionToken) {
      return;
    }

    // 3. 세션이 있는 경우
    const currentTime = new Date();
    if (userSession.expiresIn >= currentTime) {
      // 유효 기간 이내의 세션 - 세션이 유효하다.
      throw new HttpException(HutomHttpException.DUPLICATED_SESSION_DETECTED, HutomHttpException.DUPLICATED_SESSION_DETECTED.statusCode);
    } else {
      // 유효 기간이 지난 세션 - 세션이 만료됐다.
      return;
    }
  }

  async upsertSession(user: User, sr?: SessionRepository): Promise<{ id: number; sessionToken: string }> {
    const sessionRepository = sr ? sr : this.sessionRepository;

    // Unique Key 발급
    const sessionToken = this.utilService.generateUniqueKey();

    // upsert (Insert or Update)
    const expireTime = new Date();
    expireTime.setMilliseconds(expireTime.getMilliseconds() + Number(this.authConfig.jwtExpiresIn));

    await sessionRepository.upsert({ user, sessionToken, expiresIn: expireTime }, { conflictPaths: ["user"] });
    const userSession = await sessionRepository.findOneByUserId(user.id);
    return { id: userSession.id, sessionToken };
  }

  // 세션 expiresIn Update
  async updateSession(user: User) {
    const newExpireTime = new Date();
    newExpireTime.setMilliseconds(newExpireTime.getMilliseconds() + Number(this.authConfig.jwtExpiresIn));

    const userSession = await this.sessionRepository.findOneByUserId(user.id);
    if (!userSession) {
      this.logger.error(`userId로 Session을 찾을 수 없음. userId: ${user.id}`);
      throw new HttpException(HutomHttpException.NOT_FOUND_DATA, HutomHttpException.NOT_FOUND_DATA.statusCode);
    }
    await this.sessionRepository.update(userSession.id, { expiresIn: newExpireTime });
  }

  // 세션 내부 토큰값 비우기
  async sessionLogout(userId: number, sr?: SessionRepository): Promise<void> {
    const sessionRepository = sr ? sr : this.sessionRepository;
    const session = await sessionRepository.findOneByUserId(userId);
    if (session) {
      await sessionRepository.deleteOne({ id: session.id });
    }
  }
}
