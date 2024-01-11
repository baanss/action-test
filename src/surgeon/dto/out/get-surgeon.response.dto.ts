import { plainToInstance } from "class-transformer";
import { Surgeon } from "@src/common/entity/surgeon.entity";
import { SurgeonDto } from "@src/surgeon/dto/surgeon.dto";

export class GetSurgeonRes extends SurgeonDto {
  static from(surgeon: Surgeon): GetSurgeonRes {
    const surgeonDto = plainToInstance(GetSurgeonRes, surgeon);
    return surgeonDto;
  }
}
