import * as moment from "moment";
import { HttpException, Injectable } from "@nestjs/common";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { OTP } from "@src/common/entity/otp.entity";
import { OtpRepository } from "@src/otp/repository/otp.repository";
import { UtilService } from "@src/util/util.service";
import { CloudService } from "@src/cloud/service/cloud.service";
import { UserRepository } from "@src/user/repository/user.repository";

@Injectable()
export class OtpService {
  constructor(
    private readonly otpRepository: OtpRepository,
    private readonly userRepository: UserRepository,
    private readonly utilService: UtilService,
    private readonly cloudService: CloudService,
  ) {}

  async verifyOne(token: string, userId: number): Promise<OTP> {
    const otp = await this.otpRepository.getOneByToken(token);
    if (!otp || otp.userId !== userId) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DATA, HutomHttpException.NOT_FOUND_DATA.statusCode);
    }
    if (otp.expiresIn < new Date()) {
      throw new HttpException(HutomHttpException.UNAUTHORIZED, HutomHttpException.UNAUTHORIZED.statusCode);
    }
    return otp;
  }

  async getValidOne(token: string): Promise<OTP> {
    const otp = await this.otpRepository.getOneByToken(token);
    if (!otp || moment(otp.expiresIn) < moment()) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DATA, HutomHttpException.NOT_FOUND_DATA.statusCode);
    }
    return otp;
  }

  async expireOne(id: number, or?: OtpRepository): Promise<void> {
    const otpRepository = or ? or : this.otpRepository;
    await otpRepository.delete(id);
  }

  async createOne(condition: { employeeId: string; email: string }): Promise<{ id: number }> {
    const { employeeId, email } = condition;
    const user = await this.userRepository.findByEmployeeId(employeeId);
    if (!user) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DATA, HutomHttpException.NOT_FOUND_DATA.statusCode);
    }
    if (user.email !== email) {
      throw new HttpException(HutomHttpException.UNAUTHORIZED, HutomHttpException.UNAUTHORIZED.statusCode);
    }
    const result = await this.createOneByAuthenticatedUser({ userId: user.id, email, hasExpiresIn: true });
    return { id: result.id };
  }

  async createOneByAuthenticatedUser(dto: { userId: number; email: string; hasExpiresIn?: boolean; or?: OtpRepository }): Promise<{ id: number }> {
    const { userId, email, hasExpiresIn, or } = dto;
    const otpRepository = or ? or : this.otpRepository;

    const token = this.utilService.generateUniqueKey();
    const otp = await otpRepository.upsertOne({ userId, token, hasExpiresIn });

    hasExpiresIn ? this.cloudService.postEmailPasswordReset(email, token) : this.cloudService.postEmailPasswordInit(email, token);
    return { id: otp.id };
  }
}
