import { IsIn, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PatchUsersDto {
  @ApiProperty({ description: "변경할 이메일", required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: "변경할 이름", required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: "변경할 전화번호", required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
