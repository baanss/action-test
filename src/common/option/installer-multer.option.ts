import * as fs from "fs";
import * as moment from "moment";
import { HttpException } from "@nestjs/common";
import { diskStorage } from "multer";
import checkDiskSpace from "check-disk-space";
import configuration from "@src/common/config/configuration";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

const MAX_SIZE = 1 * 1024 * 1024 * 1024; // 1GB

export const installerMulterOption = {
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

    // 파일 확장자 exe 지원
    if (!file?.originalname.match(/\.(exe)$/) || !file.mimetype.includes("ms")) {
      return callback(
        new HttpException(HutomHttpException.INVALID_REQUEST_FILE_EXTENSION, HutomHttpException.INVALID_REQUEST_FILE_EXTENSION.statusCode),
        false,
      );
    }

    // etc 폴더 존재하는지 검사
    const etcPath = configuration().core.etcPath;
    try {
      await fs.promises.access(etcPath);
    } catch (error) {
      await fs.promises.mkdir(etcPath, { recursive: true });
    }

    return callback(null, true);
  },

  storage: diskStorage({
    destination: async (request, file, callback) => {
      // etc 폴더에 저장
      const etcPath = configuration().core.etcPath;
      return callback(null, etcPath);
    },

    filename: (request, file, callback) => {
      return callback(null, `installer-${moment().format()}`);
    },
  }),
};
