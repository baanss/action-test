import { HttpException, Injectable } from "@nestjs/common";

import { UserRepository } from "@src/user/repository/user.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@Injectable()
export class CheckUserService {
  constructor(private readonly userRepository: UserRepository) {}

  async canCreateOne(dto: { employeeId: string; email: string; phoneNumber: string | null }): Promise<void> {
    const { employeeId, email, phoneNumber } = dto;
    const isEmployeeIdUsed = await this.userRepository.findOne({ employeeId });
    if (!!isEmployeeIdUsed) {
      throw new HttpException(HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID, HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID.statusCode);
    }

    const isEmailUsed = await this.userRepository.findOne({ email });
    if (!!isEmailUsed) {
      throw new HttpException(HutomHttpException.DUPLICATED_USER_EMAIL, HutomHttpException.DUPLICATED_USER_EMAIL.statusCode);
    }

    if (!phoneNumber) {
      return;
    }
    const isPhoneNumberUsed = await this.userRepository.findOne({ phoneNumber });
    if (!!isPhoneNumberUsed) {
      throw new HttpException(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER, HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.statusCode);
    }
  }

  async canUpdateOne(email: string, phoneNumber: string | null): Promise<void> {
    const isEmailUsed = await this.userRepository.findOne({ email });
    if (isEmailUsed) {
      throw new HttpException(HutomHttpException.DUPLICATED_USER_EMAIL, HutomHttpException.DUPLICATED_USER_EMAIL.statusCode);
    }

    if (!phoneNumber) {
      return;
    }
    const isPhoneNumberUsed = await this.userRepository.findOne({ phoneNumber });
    if (!!isPhoneNumberUsed) {
      throw new HttpException(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER, HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.statusCode);
    }
  }

  async canUpdateEmployeeId(employeeId: string): Promise<void> {
    const isEmployeeIdUsed = await this.userRepository.findOne({ employeeId });
    if (!!isEmployeeIdUsed) {
      throw new HttpException(HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID, HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID.statusCode);
    }
  }

  async canUpdatePhoneNumber(phoneNumber: string): Promise<void> {
    const isPhoneNumberUsed = await this.userRepository.findOne({ phoneNumber });
    if (!!isPhoneNumberUsed) {
      throw new HttpException(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER, HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.statusCode);
    }
  }
}
