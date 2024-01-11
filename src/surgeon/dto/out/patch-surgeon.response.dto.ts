import { ApiProperty } from "@nestjs/swagger";

export class PatchSurgeonRes {
  @ApiProperty({ description: "Surgeon의 DB id" })
  id: number;
}
