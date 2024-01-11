import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class PostInstallerRes {
  @ApiProperty({ description: "생성된 Installer DB id" })
  @IsNumber()
  id: number;
}
