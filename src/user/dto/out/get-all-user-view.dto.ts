import { Exclude, Expose, plainToInstance } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Role } from "@src/auth/interface/auth.interface";
import { User } from "@src/common/entity/user.entity";

@Exclude()
export class GetAllUserViewDto {
  @Expose()
  @ApiProperty({ description: "사용자 ID" })
  id: number;

  @Expose()
  @ApiProperty({ description: "사용자 h-Server ID" })
  employeeId: string;

  @Expose()
  @ApiProperty({ description: "사용자 이메일" })
  email: string;

  @Expose()
  @ApiProperty({ description: "사용자 이름" })
  name: string;

  @Expose()
  @ApiProperty({ description: "사용자 전화번호" })
  phoneNumber: string | null;

  @Expose()
  @ApiProperty({ description: "사용자 역할", enum: Role })
  role: Role;

  @Expose()
  @ApiProperty({ description: "마지막 접속 시간 (ISO String)" })
  lastLogin: string | null;

  @Expose()
  @ApiProperty({ description: "계정 생성 시간 (ISO String)" })
  createdAt: string;

  static fromMany(users: User[]): GetAllUserViewDto[] {
    return users.map((user) => {
      const getAllUserViewDto = plainToInstance(GetAllUserViewDto, user);

      getAllUserViewDto.id = user.id;
      getAllUserViewDto.employeeId = user.employeeId;
      getAllUserViewDto.email = user.email;
      getAllUserViewDto.name = user.name;
      getAllUserViewDto.phoneNumber = user.phoneNumber ?? null;
      getAllUserViewDto.role = user.role;
      getAllUserViewDto.lastLogin = user.lastLogin ? user.lastLogin.toISOString() : null;
      getAllUserViewDto.createdAt = user.createdAt.toISOString();

      return getAllUserViewDto;
    });
  }
}
