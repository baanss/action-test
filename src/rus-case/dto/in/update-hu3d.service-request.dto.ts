import { RusCase } from "@src/common/entity/rus-case.entity";

export class UpdateHu3dServiceReq {
  rusCaseWithStudy: RusCase;
  tempFilePath: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  version: number;
  requestorId?: number;
}
