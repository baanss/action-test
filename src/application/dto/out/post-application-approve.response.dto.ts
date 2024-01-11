import { ApiProperty } from "@nestjs/swagger";

export class FailedApplications {
  @ApiProperty({ description: "가입 승인에 실패한 employeeId 배열" })
  employeeIds: string[];

  @ApiProperty({
    description: "가입 승인 실패 에러 코드",
    examples: {
      DUPLICATED_USER_EMPLOYEE_ID: { describe: "사용자 정보가 중복되는 경우(employeeId)" },
      DUPLICATED_USER_EMAIL: { describe: "사용자 정보가 중복되는 경우(email)" },
      DUPLICATED_USER_PHONE_NUMBER: { describe: "사용자 정보가 중복되는 경우(phoneNumber)" },
    },
  })
  errorCode: string;
}

class MetaDto {
  @ApiProperty({ description: "가입 승인 실패에 관한 정보", type: FailedApplications, isArray: true })
  failed: FailedApplications[];
}

export class ApproveApplicationRes {
  @ApiProperty({ description: "생성된 사용자의 DB id 배열" })
  ids: number[];

  @ApiProperty({ description: "부가 정보", type: MetaDto })
  meta: MetaDto;
}
