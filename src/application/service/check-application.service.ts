import { HttpException, Injectable } from "@nestjs/common";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { ApplicationRepository } from "@src/application/repository/application.repository";

@Injectable()
export class CheckApplicationService {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async canCreateOne(employeeId: string, email: string, phoneNumber: string): Promise<void> {
    const isEmployeeIdUsed = !!(await this.applicationRepository.findOne({ employeeId }));
    if (isEmployeeIdUsed) {
      throw new HttpException(HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID, HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID.statusCode);
    }

    const isEmailUsed = !!(await this.applicationRepository.findOne({ email }));
    if (isEmailUsed) {
      throw new HttpException(HutomHttpException.DUPLICATED_USER_EMAIL, HutomHttpException.DUPLICATED_USER_EMAIL.statusCode);
    }

    const isPhoneNumberUsed = phoneNumber ? !!(await this.applicationRepository.findOne({ phoneNumber })) : false;
    if (isPhoneNumberUsed) {
      throw new HttpException(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER, HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.statusCode);
    }
  }
}
