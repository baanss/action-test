import { Response } from "express";
import { Controller, Get, Res } from "@nestjs/common";

import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiCloudAuthResponse } from "@src/common/decorator/api-cloud-auth-response.decorator";
import { HCLOUD_SERVER } from "@src/common/middleware/server-auth.middleware";

import { ServerlogService } from "@src/server-log/service/server-log.service";

@ApiTags("server-log")
@ApiOriginHeaders()
@Controller("server-logs")
export class ServerLogController {
  constructor(private readonly serverLogService: ServerlogService) {}

  @Get("download")
  @ApiCustomOperation({
    summary: "서버 로그 다운로드",
    description: "h-Server 서버 로그를 다운로드한다.",
    tokens: [HCLOUD_SERVER],
  })
  @ApiResponse({
    status: 200,
    description: "OK",
  })
  @ApiCloudAuthResponse()
  async getServerLogs(@Res() res: Response): Promise<void> {
    try {
      const zipFilePath = await this.serverLogService.compressServerLogs();
      const fileName = zipFilePath.split("/").pop();

      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=logs.zip`,
      });

      res.download(zipFilePath, fileName, async (err) => {
        if (err) {
          console.error("Failed to send file to client:", err);
          throw new Error("Failed to send file to client");
        }

        await this.serverLogService.deleteFile(zipFilePath);
      });
    } catch (err) {
      console.error("Failed to compress logs or send file:", err);
      res.status(500).send("Failed to download server logs.");
    }
  }
}
