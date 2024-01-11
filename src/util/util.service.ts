import * as moment from "moment";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import * as archiver from "archiver";
import { HttpException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AuthConfig, CoreConfig } from "@src/common/config/configuration";
import { CreateHuctDto } from "@src/rus-case/dto/huct.dto";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { CreateStudyFileInfo, CreateStudyPatientInfo } from "@src/study/dto";
import { RusServiceCode } from "@src/common/middleware/user-auth.middleware";

@Injectable()
export class UtilService {
  private authConfig: AuthConfig;
  private coreConfig: CoreConfig;

  constructor(private readonly configService: ConfigService) {
    this.authConfig = this.configService.get<AuthConfig>("auth");
    this.coreConfig = this.configService.get<CoreConfig>("core");
  }

  hashString(target: string): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(target, this.authConfig.passwordSalt, 140137, 64, "sha512", (error: Error, derivedKey: Buffer) => {
        if (error) {
          return reject(error);
        }
        resolve(derivedKey.toString("base64"));
      });
    });
  }

  // 문자열 암호화
  private encryptString(target: string): string {
    try {
      const key = crypto.createHash("sha512").update(this.authConfig.secretKey).digest("hex").substring(0, 32);
      const encryptionIV = crypto.createHash("sha512").update(this.authConfig.secretKey).digest("hex").substring(0, 16);
      const cipher = crypto.createCipheriv("aes-256-cbc", key, encryptionIV);
      let result = cipher.update(target, "utf8", "base64");
      result += cipher.final("base64");
      return result;
    } catch (error) {
      throw new HttpException({ ...HutomHttpException.CRYPTO_ERROR, stack: error.stack }, HutomHttpException.CRYPTO_ERROR.statusCode);
    }
  }

  // 암호 복호화
  private async decryptString(target: string): Promise<string> {
    try {
      const key = crypto.createHash("sha512").update(this.authConfig.secretKey).digest("hex").substring(0, 32);
      const encryptionIV = crypto.createHash("sha512").update(this.authConfig.secretKey).digest("hex").substring(0, 16);
      const cipher = crypto.createDecipheriv("aes-256-cbc", key, encryptionIV);
      let result = cipher.update(target, "base64", "utf8");
      result += cipher.final("utf8");
      return result;
    } catch (error) {
      throw new HttpException({ ...HutomHttpException.CRYPTO_ERROR, stack: error.stack }, HutomHttpException.CRYPTO_ERROR.statusCode);
    }
  }

  /**
   * 암호화 유틸
   * 시나리오
   * 1. 데이터 생성
   * 2. 쿼리 파라미터 암호화
   * @param dto patientId, patientName
   * @returns patientId, patientName
   */
  async encryptPromise(dto: { patientId?: string; patientName?: string }): Promise<{ patientId: string | null; patientName: string | null }> {
    const { patientId = null, patientName = null } = dto;
    let encryptPatientId = patientId;
    let encryptPatientName = patientName;
    if (patientId) {
      encryptPatientId = this.encryptString(patientId);
    }
    if (patientName) {
      encryptPatientName = this.encryptString(patientName);
    }
    return { patientId: encryptPatientId, patientName: encryptPatientName };
  }

  /**
   * 복호화 유틸
   * 시나리오
   * 1. 데이터 조회
   * @param dto patientId, patientName
   * @returns patientId, patientName
   */
  async decryptPromise(dto: { patientId: string | null; patientName: string | null }): Promise<{ patientId: string | null; patientName: string | null }> {
    const { patientId = null, patientName = null } = dto;
    const result = { patientId, patientName };
    if (patientId) {
      result.patientId = await this.decryptString(patientId);
    }
    if (patientName) {
      result.patientName = await this.decryptString(patientName);
    }
    return result;
  }

  async confirmPassword(currentPassword: string, passwordToConfirm: string) {
    const hashedPasswordToConfirm = await this.hashString(passwordToConfirm);
    if (currentPassword !== hashedPasswordToConfirm) {
      throw new HttpException(HutomHttpException.FORBIDDEN_RESOURCE_INCORRECT_PASSWORD, HutomHttpException.FORBIDDEN_RESOURCE_INCORRECT_PASSWORD.statusCode);
    }
  }

  /**
   * 쿼리파라미터 날짜 범위 설정 정책
   * 1. 시작 날짜만 존재하는 경우, 종료 날짜는 현재 날짜
   * 2. 종료 날짜만 존재하는 경우, 시작 날짜는 종료 날짜의 1년 전
   * @param dto {startDate, endDate}
   * @returns {startDate, endDate}
   */
  getDateRangeQueryParams(dto: { startDate?: string; endDate?: string }): { startDate: string; endDate: string } {
    const { startDate, endDate } = dto;

    if (startDate && !endDate) {
      return { startDate, endDate: moment().toISOString() };
    }
    if (!startDate && endDate) {
      return { startDate: moment(endDate).subtract(1, "y").toISOString(), endDate };
    }
    return { startDate, endDate };
  }

  // Date 타입으로 변환
  dateTransformer(yyyymmdd = "19000101", hhmmss = "000000"): Date {
    // studyDate 정규식 검사(yyyymmdd: 숫자, 8자리)
    const yyyymmddReg = /^([0-9]{8})$/g;
    if (!yyyymmddReg.test(yyyymmdd)) {
      yyyymmdd = "19000101";
    }
    // studyTime 정규식 검사(hhmmss: 숫자, 6자리)
    const hhmmssReg = /^([0-9]{6})$/g;
    if (!hhmmssReg.test(hhmmss)) {
      hhmmss = "000000";
    }
    const yDate = Number(yyyymmdd.substring(0, 4));
    const mDate = Number(yyyymmdd.substring(4, 6)) - 1;
    const dDate = Number(yyyymmdd.substring(6, 8));
    const hTime = Number(hhmmss.substring(0, 2));
    const mTime = Number(hhmmss.substring(2, 4));
    const sTime = Number(hhmmss.substring(4, 6));
    return new Date(yDate, mDate, dDate, hTime, mTime, sTime);
  }

  parseDicom(filepath: string, huId: string): Promise<CreateStudyPatientInfo> {
    return new Promise((resolve, reject) => {
      const EXPIRED_TIMEOUT = 60 * 60 * 1000; // 60 min

      const childProcess = spawn("python3", [path.join(process.cwd(), "scripts", "parse_dicom.py"), filepath, huId], {
        timeout: EXPIRED_TIMEOUT,
      });

      let data = "";
      childProcess.stdout.on("data", (chunk) => {
        data += chunk;
      });

      let error = "";
      childProcess.stderr.on("data", (chunk) => {
        error += chunk;
      });

      childProcess.on("error", async () => {
        return reject(
          new HttpException(
            {
              ...HutomHttpException.UNEXPECTED_ERROR,
              message: error,
            },
            HutomHttpException.UNEXPECTED_ERROR.statusCode,
          ),
        );
      });

      childProcess.on("close", async (code) => {
        // 성공 응답
        if (code === 0) {
          try {
            const result = this.parseStringToJson<CreateStudyPatientInfo>(data);
            return resolve(result);
          } catch (err) {
            return reject(
              new HttpException({ ...HutomHttpException.INVALID_REQUEST_FILE_DICOM, error: err }, HutomHttpException.INVALID_REQUEST_FILE_DICOM.statusCode),
            );
          }
        }

        // 실패 응답
        if (code === 9) {
          return reject(
            new HttpException({ ...HutomHttpException.INVALID_REQUEST_FILE_DICOM, message: error }, HutomHttpException.INVALID_REQUEST_FILE_DICOM.statusCode),
          );
        }

        // 기본 에러
        if (code === 1) {
          return reject(
            new HttpException(
              {
                ...HutomHttpException.UNEXPECTED_ERROR,
                message: error,
              },
              HutomHttpException.UNEXPECTED_ERROR.statusCode,
            ),
          );
        }

        // 응답 없음(timeout)
        return reject(new HttpException({ ...HutomHttpException.REQUEST_TIMEOUT, message: error }, HutomHttpException.REQUEST_TIMEOUT.statusCode));
      });
    });
  }

  // 가명화 실행
  anonymize(filepath: string, huId: string): Promise<CreateStudyFileInfo> {
    return new Promise((resolve, reject) => {
      const EXPIRED_TIMEOUT = 60 * 60 * 1000; // 60 min
      const childProcess = spawn("python3", [path.join(process.cwd(), "scripts", "anonymize.py"), filepath, huId], {
        timeout: EXPIRED_TIMEOUT,
      });

      let data = "";
      childProcess.stdout.on("data", (chunk) => {
        data += chunk;
      });

      let error = "";
      childProcess.stderr.on("data", (chunk) => {
        error += chunk;
      });

      childProcess.on("error", async () => {
        return reject(
          new HttpException(
            {
              ...HutomHttpException.UNEXPECTED_ERROR,
              message: error,
            },
            HutomHttpException.UNEXPECTED_ERROR.statusCode,
          ),
        );
      });

      childProcess.on("close", async (code) => {
        // 성공 응답
        if (code === 0) {
          try {
            const result = this.parseStringToJson<CreateStudyFileInfo>(data);
            return resolve(result);
          } catch (err) {
            return reject(
              new HttpException({ ...HutomHttpException.INVALID_REQUEST_FILE_DICOM, error: err }, HutomHttpException.INVALID_REQUEST_FILE_DICOM.statusCode),
            );
          }
        }

        // 실패 응답
        if (code === 9) {
          return reject(
            new HttpException({ ...HutomHttpException.INVALID_REQUEST_FILE_DICOM, message: error }, HutomHttpException.INVALID_REQUEST_FILE_DICOM.statusCode),
          );
        }

        // 기본 에러
        if (code === 1) {
          return reject(
            new HttpException(
              {
                ...HutomHttpException.UNEXPECTED_ERROR,
                message: error,
              },
              HutomHttpException.UNEXPECTED_ERROR.statusCode,
            ),
          );
        }

        // 응답 없음(timeout)
        return reject(new HttpException({ ...HutomHttpException.REQUEST_TIMEOUT, message: error }, HutomHttpException.REQUEST_TIMEOUT.statusCode));
      });
    });
  }

  private parseStringToJson<T>(data: string): T {
    const replaceNoneToNull = data.replace(/None/gi, null);
    const replacedData = replaceNoneToNull.replace(/'/gi, `"`);
    const parsedData = JSON.parse(replacedData);
    return parsedData;
  }

  // huCT 파일 생성
  async createHuctArchive(createHuctDto: CreateHuctDto, filePath: string): Promise<{ archive: archiver.Archiver; fileName: string }> {
    try {
      await fs.promises.access(filePath);
    } catch (error) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DICOM_ON_DISK, HutomHttpException.NOT_FOUND_DICOM_ON_DISK.statusCode);
    }

    //아카이브 파일 = 다이콤 압축파일 + 임상정보 json파일
    const archive = archiver("zip", { zlib: { level: 9 } });
    const clinicalInfoBuffer = Buffer.from(JSON.stringify(createHuctDto, null, 4));

    archive.append(fs.createReadStream(filePath), { name: "dicom.zip" });
    archive.append(clinicalInfoBuffer, { name: "clinical-info.json" });

    archive.finalize();

    // huCT 파일 이름
    const serviceCode = this.coreConfig.serviceCode === RusServiceCode.KIDNEY ? "kidney" : "stomach";
    const fileName = path.basename(filePath).replace(".zip", `_${serviceCode}_huCT.zip`);

    return { archive, fileName };
  }

  // Generate Unique Key for Session Key & OTP Token
  generateUniqueKey() {
    const byteLength = 8; // 8 bytes = 64 bits
    const randomBytes = crypto.randomBytes(byteLength);
    const uniqueKey = randomBytes.toString("hex").slice(0, 16); // Extract the first 16 characters

    return uniqueKey;
  }
}
