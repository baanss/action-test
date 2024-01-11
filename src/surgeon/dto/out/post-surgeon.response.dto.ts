import { ApiProperty } from "@nestjs/swagger";

export class PostSurgeonRes {
  @ApiProperty({ description: "Surgeon의 DB id" })
  id: number;
}
