import { IsNumber, IsOptional, IsString } from "class-validator";

import { OrderQuery } from "@src/common/constant/enum.constant";
import { GetAllUserSortQuery } from "@src/user/dto/in/get-all-user.repository-request.dto";

export class GetAllUserServiceReq {
  @IsString()
  employeeId: string;

  @IsString()
  name: string;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsString()
  @IsOptional()
  sort?: GetAllUserSortQuery;

  @IsString()
  @IsOptional()
  order?: OrderQuery;
}
