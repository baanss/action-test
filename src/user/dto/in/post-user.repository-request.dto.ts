import { IsOptional, IsString } from "class-validator";

import { Role } from "@src/auth/interface/auth.interface";

export class PostUserRepositoryReq {
  @IsString()
  employeeId: string;

  @IsString()
  password: string;

  @IsString()
  email: string;

  @IsString()
  name: string;

  @IsString()
  role: Role;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  profilePath?: string;
}
