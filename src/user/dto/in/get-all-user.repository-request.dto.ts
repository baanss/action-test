import { OrderQuery } from "@src/common/constant/enum.constant";
import { IsNumber, IsString } from "class-validator";

export enum GetAllUserSortQuery {
  USER_ROLE = "role",
}

export class GetAllUserRepositoryReq {
  @IsString()
  employeeId: string;

  @IsString()
  name: string;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsString()
  sort: GetAllUserSortQuery;

  @IsString()
  order: OrderQuery;
}
