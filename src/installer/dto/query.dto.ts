import { OrderQuery } from "@src/common/constant/enum.constant";
import { Transform } from "class-transformer";
import { IsIn, IsOptional } from "class-validator";

export class InstallerQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit?: number;

  @IsOptional()
  @IsIn(["createdAt", "updatedAt"])
  sort?: string;

  @IsOptional()
  @IsIn(Object.values(OrderQuery))
  order?: string;
}
