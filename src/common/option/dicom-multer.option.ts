import * as path from "path";
import checkDiskSpace from "check-disk-space";
import { diskStorage } from "multer";
import { HttpException } from "@nestjs/common";
import configuration from "@src/common/config/configuration";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export const dicomMulterOption = {
  limits: {
    fileSize: MAX_SIZE,
  },
  fileFilter: async (request, file, callback) => {
    // 파일 크기 검사
    const fileSize = parseInt(request.headers["content-length"]);
    if (fileSize >= MAX_SIZE) {
      return callback(new HttpException(HutomHttpException.PAYLOAD_TOO_LARGE, HutomHttpException.PAYLOAD_TOO_LARGE.statusCode), false);
    }

    // 저장 공간 검사
    const diskSpace = await checkDiskSpace("/");
    if (fileSize > Number(process.env.DISK_FREE_SPACE || diskSpace.free)) {
      return callback(new HttpException(HutomHttpException.INSUFFICIENT_STORAGE, HutomHttpException.INSUFFICIENT_STORAGE.statusCode), false);
    }

    // 파일 확장자 zip 지원
    if (!file.mimetype.includes("zip")) {
      return callback(
        new HttpException(HutomHttpException.INVALID_REQUEST_FILE_EXTENSION, HutomHttpException.INVALID_REQUEST_FILE_EXTENSION.statusCode),
        false
      );
    }

    return callback(null, true);
  },

  storage: diskStorage({
    destination: async (request, file, callback) => {
      const dicomPath: string = configuration().core.dicomPath;
      const uploadDir = path.join(dicomPath, "temp");
      callback(null, uploadDir);
    },
    filename: (request, file, callback) => {
      // uploadId로 이름 변경
      callback(null, `tmp-${Date.now()}-${Math.round(Math.random() * 1e9)}.zip`);
    },
  }),
};
