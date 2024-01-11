import * as moment from "moment";
import * as path from "path";
import * as fs from "fs";
import * as archiver from "archiver";

import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";

import { CoreConfig } from "@src/common/config/configuration";
import { LoggerService } from "@src/logger/logger.service";

@Injectable()
export class ServerlogService {
  private coreConfig: CoreConfig;

  constructor(private readonly configService: ConfigService, private readonly logger: LoggerService) {
    this.coreConfig = this.configService.get<CoreConfig>("core");
  }

  /**
   * 서버 로그를 Zip 파일로 압축합니다.
   * @returns 생성된 압축파일의 경로
   */
  async compressServerLogs(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        this.logger.debug("Starting compression of server logs.");

        const logsDirectory = this.coreConfig.logPath;
        const formattedDate = moment().format("YYYY-MM-DD");
        const zipFileName = `server_logs_${formattedDate}.zip`;
        const zipFilePath = path.join(path.resolve(logsDirectory, ".."), zipFileName);

        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
          this.logger.debug("Logs compressed successfully.");
          resolve(zipFilePath);
        });

        archive.on("error", (err) => {
          this.logger.error(`Error occurred while archiving files: ${err}`, err.stack);
          reject(new Error("Failed to compress logs."));
        });

        archive.pipe(output);
        archive.directory(logsDirectory, false);
        archive.finalize();
      } catch (err) {
        this.logger.error(`Error occurred during compression: ${err}`, err.stack);
        console.error("Failed to compress logs:", err);
        reject(new Error("Failed to compress logs."));
      }
    });
  }

  /**
   * Deletes a file.
   * @param filePath - Path of the file to be deleted.
   * @throws Error if failed to delete the file.
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      throw new Error(`Failed to delete file: ${err}`);
    }
  }
}
