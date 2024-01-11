import { RusCase } from "@src/common/entity/rus-case.entity";

export class CreateHu3dServiceReq {
  rusCaseWithStudy: RusCase;
  tempFilePath: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  requestorId?: number;
}
