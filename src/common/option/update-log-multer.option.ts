import * as fs from "fs";
import * as moment from "moment";
import checkDiskSpace from "check-disk-space";
import { diskStorage } from "multer";
import { HttpException } from "@nestjs/common";
import configuration from "@src/common/config/configuration";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

const MAX_SIZE = 1 * 1024 * 1024 * 1024; // 1GB

export const updateLogMulterOption = {
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
    if (fileSize > diskSpace.free) {
      return callback(new HttpException(HutomHttpException.INSUFFICIENT_STORAGE, HutomHttpException.INSUFFICIENT_STORAGE.statusCode), false);
    }

    // 파일 확장자 .txt 지원
    if (!file?.originalname.match(/\.(txt)$/) || !file.mimetype.includes("text/plain")) {
      return callback(
        new HttpException(HutomHttpException.INVALID_REQUEST_FILE_EXTENSION, HutomHttpException.INVALID_REQUEST_FILE_EXTENSION.statusCode),
        false,
      );
    }

    // etc 디렉토리 존재하는지 검사
    const updateLogDir = configuration().core.etcPath;
    try {
      await fs.promises.access(updateLogDir);
    } catch (error) {
      await fs.promises.mkdir(updateLogDir, { recursive: true });
    }

    return callback(null, true);
  },

  storage: diskStorage({
    destination: async (request, file, callback) => {
      // udpate_log 폴더에 저장
      const updateLogDir = configuration().core.etcPath;
      return callback(null, updateLogDir);
    },

    filename: (request, file, callback) => {
      return callback(null, `updatelog-${moment().format()}`);
    },
  }),
};
