import { ApiProperty } from "@nestjs/swagger";

export class GetOtpRes {
  @ApiProperty({ description: "user의 DB id" })
  userId: number;

  @ApiProperty({ description: "계정 ID" })
  employeeId: string;

  @ApiProperty({ description: "계정 이름" })
  name: string;
}
