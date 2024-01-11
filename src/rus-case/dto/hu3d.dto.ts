import { Exclude, Expose, plainToInstance } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Hu3d } from "@src/common/entity/hu3d.entity";

@Exclude()
export class Hu3dDto {
  @Expose()
  @ApiProperty({ description: "Hu3d DB id" })
  id: number;

  @Expose()
  @ApiProperty({ description: "파일명" })
  fileName: string;

  @Expose()
  @ApiProperty({ description: "파일 용량" })
  fileSize: number;

  @Expose()
  @ApiProperty({ description: "hu3d 버전" })
  version: number;

  @ApiProperty({ description: "파일 경로", nullable: true })
  filePath: string;

  static from(hu3d: Hu3d): Hu3dDto {
    const hu3dDto = plainToInstance(Hu3dDto, hu3d);

    hu3dDto.id = hu3d.id;
    hu3dDto.fileName = hu3d.fileName;
    hu3dDto.fileSize = hu3d.fileSize;
    hu3dDto.version = hu3d.version;
    hu3dDto.filePath = hu3d.filePath ? "valid" : null;

    return hu3dDto;
  }
}
