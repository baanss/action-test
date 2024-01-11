import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Expose, plainToInstance } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @Expose()
  employeeId: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  phoneNumber?: string;

  profilePath?: string;
}

export class PostUserDto {
  @ApiProperty({ description: "생성할 계정 ID" })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: "생성할 계정 이메일" })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "생성할 계정 이름" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "생성할 계정 연락처" })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  toCreateUserDto(options: { profilePath: string }) {
    const createUserDto = plainToInstance(CreateUserDto, this);
    createUserDto.profilePath = options.profilePath;
    return createUserDto;
  }
}
