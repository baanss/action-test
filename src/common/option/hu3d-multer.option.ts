import * as path from "path";
import * as fs from "fs";
import * as moment from "moment";
import { diskStorage } from "multer";
import checkDiskSpace from "check-disk-space";
import { HttpException } from "@nestjs/common";
import configuration from "@src/common/config/configuration";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export const hu3dMulterOption = {
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

    // 파일 확장자 hu3d 지원
    const originalFilename = file.originalname;
    const extname = path.extname(originalFilename);
    const baseFilename = path.basename(originalFilename, extname);
    if (extname !== ".hu3d" || !file.mimetype.includes("application/octet-stream")) {
      return callback(
        new HttpException(HutomHttpException.INVALID_REQUEST_FILE_EXTENSION, HutomHttpException.INVALID_REQUEST_FILE_EXTENSION.statusCode),
        false,
      );
    }

    // 파일명: ${huId}-${버전}.hu3d
    // eg. 01001ug_1-1.hu3d, 01001ug_1-2_stomach_demo.hu3d
    const pattern = new RegExp(`^${process.env.SERVER_CODE}_\\d+-\\d+`);
    if (!pattern.test(baseFilename)) {
      return callback(new HttpException(HutomHttpException.INVALID_REQUEST_FILE_NAME, HutomHttpException.INVALID_REQUEST_FILE_NAME.statusCode), false);
    }

    // hu3d 폴더가 존재하는지 검사
    const hu3dPath: string = configuration().core.hu3dPath;
    try {
      await fs.promises.access(hu3dPath);
    } catch (error) {
      await fs.promises.mkdir(hu3dPath, { recursive: true });
    }

    return callback(null, true);
  },

  storage: diskStorage({
    destination: async (request, file, callback) => {
      // RusCase 폴더에 저장
      const hu3dPath: string = configuration().core.hu3dPath;
      return callback(null, hu3dPath);
    },

    filename: (request, file, callback) => {
      return callback(null, `${moment().format()}`);
    },
  }),
};
