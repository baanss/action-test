import { Exclude, Expose, plainToInstance } from "class-transformer";
import { RusCase } from "@src/common/entity/rus-case.entity";
import { Recipient } from "@src/common/entity/recipient.entity";
import { ClinicalInfo } from "@src/common/entity/clinical-info.entity";
import { Surgeon } from "@src/common/entity/surgeon.entity";
import { User } from "@src/common/entity/user.entity";

class RequestInfo {
  operationType: string;
  deliveryDate: string;
  age: number;
  sex: string;
  height: number;
  weight: number;
  childbirth: boolean;
  operationDate: string | null;
  memo: string | null;
  remark: string | null;
  surgeon: string | null;

  static from(clinicalInfo: ClinicalInfo, surgeon?: Surgeon): RequestInfo {
    const requestInfo = new RequestInfo();
    requestInfo.operationType = clinicalInfo.operationType;
    requestInfo.deliveryDate = clinicalInfo.deliveryDate.toISOString();
    requestInfo.age = clinicalInfo.age;
    requestInfo.sex = clinicalInfo.sex;
    requestInfo.height = clinicalInfo.height;
    requestInfo.weight = clinicalInfo.weight;
    requestInfo.childbirth = clinicalInfo.childbirth;
    requestInfo.operationDate = clinicalInfo.operationDate?.toISOString() ?? null;
    requestInfo.memo = clinicalInfo.memo;
    requestInfo.remark = clinicalInfo.remark;
    requestInfo.surgeon = surgeon?.name ?? null;

    return requestInfo;
  }
}

class UserInfo {
  id: number | null;
  name: string | null;
  email: string | null;
  phoneNumber: string;
  credit?: number | null;
  notification?: string[] | null;

  static from(user: User, withDetail?: { creditBalance: number; recipients?: Recipient[]; userEmail?: string }): UserInfo {
    const userInfo = new UserInfo();
    userInfo.id = user?.id ?? null;
    userInfo.name = user?.name ?? null;
    userInfo.email = user?.email ?? null;
    userInfo.phoneNumber = user?.phoneNumber ?? "-";
    if (withDetail) {
      userInfo.credit = withDetail.creditBalance ?? null;
      userInfo.notification = withDetail.recipients ? [...withDetail.recipients.map((recipient) => recipient?.email), withDetail.userEmail] : null;
    }

    return userInfo;
  }
}

@Exclude()
export class CreateHuctDto {
  @Expose()
  id: number;

  // config
  serverCode: string;

  // study
  huId: string;

  requestInfo: RequestInfo;
  userInfo: UserInfo | null;

  static from(rusCase: RusCase, serverCode: string, withDetail?: { creditBalance: number; recipients?: Recipient[]; userEmail?: string }): CreateHuctDto {
    const createHuctDto = plainToInstance(CreateHuctDto, rusCase);
    createHuctDto.serverCode = serverCode;
    createHuctDto.huId = rusCase.study.huId;
    createHuctDto.requestInfo = RequestInfo.from(rusCase.clinicalInfo, rusCase.surgeon);
    createHuctDto.userInfo = rusCase.user ? UserInfo.from(rusCase.user, withDetail) : null;
    return createHuctDto;
  }
}
