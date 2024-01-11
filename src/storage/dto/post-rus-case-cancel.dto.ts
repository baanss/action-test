import { IsArray, IsString } from "class-validator";

export class PostRusCaseCancelDto {
  @IsArray()
  rusCaseIds: Array<number>;

  @IsString()
  password: string;
}
