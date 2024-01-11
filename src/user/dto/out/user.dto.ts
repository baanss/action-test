import * as path from "path";
import { Exclude, Expose, plainToInstance, Transform } from "class-transformer";

import { ApiProperty } from "@nestjs/swagger";

import configuration from "@src/common/config/configuration";
import { User } from "@src/common/entity/user.entity";

const ServerConfig = configuration().server;

@Exclude()
export class UserDto {
  @ApiProperty({ description: "일반 사용자 DB 아이디" })
  @Expose()
  id: number;

  @ApiProperty({ description: "일반 사용자 회원 아이디" })
  @Expose()
  employeeId: string;

  @ApiProperty({ description: "일반 사용자 이메일" })
  @Expose()
  email: string;

  @ApiProperty({ description: "일반 사용자 이름" })
  @Expose()
  name: string;

  // FIXME: optional -> nullable, required
  @ApiProperty({ description: "일반 사용자 프로필 이미지 URL", required: false })
  @Expose({ name: "profilePath" })
  @Transform(({ value }) => {
    if (value) {
      return `${ServerConfig.serverUrl}/${path.basename(value)}`;
    }
  })
  profileUrl?: string;

  // FIXME: optional -> nullable, required
  @ApiProperty({ description: "일반 사용자 전화번호", required: false })
  @Expose()
  @Transform((params) => {
    if (params.value) {
      return params.value;
    }
  })
  phoneNumber?: string;

  static from(user: User) {
    return plainToInstance(UserDto, user);
  }
}
