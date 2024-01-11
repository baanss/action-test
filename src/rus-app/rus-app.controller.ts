import * as fs from "fs";
import { Response } from "express";
import { Controller, Get, HttpException, Param, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ServerConfig } from "@src/common/config/configuration";
import { RequestWithUser } from "@src/common/interface/request.interface";
import { RusCaseService } from "@src/rus-case/service/rus-case.service";
import { RusAppDetailDto } from "@src/rus-app/dto/rus-app-detail.dto";
import { InstallerService } from "@src/installer/service/installer.service";
import { UpdateLogService } from "@src/update-log/service/update-log.service";
import { InstallerDto } from "@src/installer/dto/installer.dto";
import { UpdateLogDto } from "@src/update-log/dto/update-log.dto";
import { Roles } from "@src/common/guard/role.guard";
import { Role } from "@src/auth/interface/auth.interface";
import { OwnRusCaseGuard } from "@src/common/guard/own-rus-case.guard";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { CustomOrigin } from "@src/common/middleware/user-auth.middleware";
import { GetAllRusAppRusCaseRes, GetRusAppInstallerRes, GetRusAppUpdateLogRes } from "@src/rus-app/dto";
import { LogType, ServiceType } from "@src/common/constant/enum.constant";
import { LoggerService } from "@src/logger/logger.service";
import { SERVICE_CODE } from "@src/common/middleware/server-auth.middleware";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";

@ApiTags("rus-app")
@ApiOriginHeaders()
@ApiBearerAuth()
@Controller("rus-app")
export class RusAppController {
  private serverConfig: ServerConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly rusCaseService: RusCaseService,
    private readonly installerService: InstallerService,
    private readonly updateLogService: UpdateLogService,
    private readonly loggerService: LoggerService,
  ) {
    this.serverConfig = this.configService.get<ServerConfig>("server");
  }

  @Get("rus-cases")
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "모든 케이스 조회",
    description: "hu3D 파일이 존재하는 모든 케이스를 조회한다.",
    roles: [CustomOrigin.RUS_CLIENT],
    tokens: [SERVICE_CODE],
  })
  @ApiResponse({ description: "OK", status: 200, type: GetAllRusAppRusCaseRes })
  @ApiUserAuthResponse()
  async findAll(@Req() req: RequestWithUser): Promise<GetAllRusAppRusCaseRes> {
    if (req.user.role === Role.USER) {
      const [rusCases, rusCasesCount] = await this.rusCaseService.getOwnManyAndCountWithHu3d(req.user.id);
      return {
        count: rusCasesCount,
        rusCases: RusAppDetailDto.fromMany(rusCases, this.serverConfig.serverUrl),
      };
    }
    const [rusCases, rusCasesCount] = await this.rusCaseService.getManyAndCountWithHu3d();
    return {
      count: rusCasesCount,
      rusCases: RusAppDetailDto.fromMany(rusCases, this.serverConfig.serverUrl),
    };
  }

  @Get("rus-cases/:id/download-hu3d")
  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(OwnRusCaseGuard)
  @ApiCustomOperation({
    summary: "hu3D 다운로드",
    description: "특정 케이스의 hu3D 파일을 다운로드한다.",
    roles: [CustomOrigin.RUS_CLIENT],
    tokens: [SERVICE_CODE],
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    headers: {
      "Content-Type": {
        description: "application/octet-stream",
      },
      "Content-Disposition": {
        description: `attachment; filename="${"filename.hu3d"}"`,
      },
    },
  })
  @ApiUserAuthResponse({
    examples: {
      // OwnRusCaseGuard
      INVALID_REQUEST_PARAMETER: {
        description: "Request Parameter 형식이 잘못된 경우",
        value: HutomHttpException.INVALID_REQUEST_PARAMETER,
      },
      NOT_FOUND_RUS_CASE_WITH_ID: {
        description: "요청한 케이스가 존재하지 않은 경우",
        value: HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID,
      },
      FORBIDDEN_RESOURCE: {
        description: "자원에 접근 권한이 없는 경우",
        value: HutomHttpException.FORBIDDEN_RESOURCE,
      },
      // getHu3dFile
      NOT_FOUND_HU3D_ON_DB: {
        description: "hu3D 파일이 DB에 존재하지 않는 경우",
        value: HutomHttpException.NOT_FOUND_HU3D_ON_DB,
      },
      NOT_FOUND_HU3D_ON_DISK: {
        description: "hu3D 파일이 디스크에 존재하지 않는 경우",
        value: HutomHttpException.NOT_FOUND_HU3D_ON_DISK,
      },
    },
  })
  async getHu3dFile(@Req() req: RequestWithUser, @Res() res: Response, @Param("id") id: number) {
    // hu3d 파일 다운로드
    const hu3d = await this.rusCaseService.getHu3dById(id);
    if (!hu3d?.filePath) {
      throw new HttpException(HutomHttpException.NOT_FOUND_HU3D_ON_DB, HutomHttpException.NOT_FOUND_HU3D_ON_DB.statusCode);
    }
    // 파일 존재 확인
    try {
      await fs.promises.access(hu3d.filePath);
    } catch (error) {
      throw new HttpException(HutomHttpException.NOT_FOUND_HU3D_ON_DISK, HutomHttpException.NOT_FOUND_HU3D_ON_DISK.statusCode);
    }
    // 파일 다운로드
    this.loggerService.access(ServiceType.RUS_CLIENT, req.user.employeeId, LogType.DOWNLOAD_FILE, hu3d.fileName);
    return res.download(hu3d.filePath);
  }

  @Get("installers/latest")
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "설치파일 조회",
    description: "RUS Client 설치파일을 조회한다.",
    roles: [CustomOrigin.RUS_CLIENT],
    tokens: [SERVICE_CODE],
  })
  @ApiResponse({ description: "OK", status: 200, type: GetRusAppInstallerRes })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_INSTALLER_ON_DB: {
        description: "installer 파일이 DB에 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_INSTALLER_ON_DB,
      },
    },
  })
  async getLatestInstaller(): Promise<GetRusAppInstallerRes> {
    const latestOne = await this.installerService.getLatestOne();
    if (!latestOne) {
      throw new HttpException(HutomHttpException.NOT_FOUND_INSTALLER_ON_DB, HutomHttpException.NOT_FOUND_INSTALLER_ON_DB.statusCode);
    }
    return InstallerDto.from(latestOne, `${this.serverConfig.serverUrl}/rus-app`);
  }

  @Get("installers/latest/download")
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "설치파일 다운로드",
    description: "RUS Client 설치파일을 다운로드한다.",
    roles: [CustomOrigin.RUS_CLIENT],
    tokens: [SERVICE_CODE],
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    headers: {
      "Content-Type": {
        description: "application/zip",
      },
      "Content-Disposition": {
        description: `attachment; filename="${"filename.zip"}"`,
      },
    },
  })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_INSTALLER_ON_DB: {
        description: "installer 파일이 DB에 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_INSTALLER_ON_DB,
      },
      NOT_FOUND_INSTALLER_ON_DISK: {
        description: "installer 파일이 디스크에 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_INSTALLER_ON_DISK,
      },
    },
  })
  async downloadLatestInstaller(@Req() req: RequestWithUser, @Res() res: Response) {
    // 파일 경로 조회
    const latestOne = await this.installerService.getLatestOne();
    const filePath = latestOne?.filePath;
    if (!filePath) {
      throw new HttpException(HutomHttpException.NOT_FOUND_INSTALLER_ON_DB, HutomHttpException.NOT_FOUND_INSTALLER_ON_DB.statusCode);
    }
    // 파일 존재 확인
    try {
      await fs.promises.access(filePath);
    } catch (error) {
      throw new HttpException(HutomHttpException.NOT_FOUND_INSTALLER_ON_DISK, HutomHttpException.NOT_FOUND_INSTALLER_ON_DISK.statusCode);
    }
    // 파일 다운로드
    this.loggerService.access(ServiceType.RUS_CLIENT, req.user.employeeId, LogType.DOWNLOAD_FILE, latestOne.fileName);
    return res.download(filePath);
  }

  @Get("update-logs/latest")
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "업데이트로그 조회",
    description: "RUS Client 업데이트로그를 조회한다.",
    roles: [CustomOrigin.RUS_CLIENT],
    tokens: [SERVICE_CODE],
  })
  @ApiResponse({ description: "OK", status: 200, type: GetRusAppUpdateLogRes })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_UPDATE_LOG_ON_DB: {
        description: "update-log 파일이 DB에 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_UPDATE_LOG_ON_DB,
      },
    },
  })
  async getLatestUpdateLog(): Promise<GetRusAppUpdateLogRes> {
    const latestOne = await this.updateLogService.getLatestOne();
    if (!latestOne) {
      throw new HttpException(HutomHttpException.NOT_FOUND_UPDATE_LOG_ON_DB, HutomHttpException.NOT_FOUND_UPDATE_LOG_ON_DB.statusCode);
    }
    return UpdateLogDto.from(latestOne, `${this.serverConfig.serverUrl}/rus-app`);
  }

  @Get("update-logs/latest/download")
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "업데이트로그 다운로드",
    description: "RUS Client 업데이트로그를 다운로드한다.",
    roles: [CustomOrigin.RUS_CLIENT],
    tokens: [SERVICE_CODE],
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    headers: {
      "Content-Type": {
        description: "application/zip",
      },
      "Content-Disposition": {
        description: `attachment; filename="${"filename.zip"}"`,
      },
    },
  })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_UPDATE_LOG_ON_DB: {
        description: "update-log 파일이 DB에 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_UPDATE_LOG_ON_DB,
      },
      NOT_FOUND_UPDATE_LOG_ON_DISK: {
        description: "update-log 파일이 DB에 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_UPDATE_LOG_ON_DISK,
      },
    },
  })
  async downloadLatestUpdateLog(@Req() req: RequestWithUser, @Res() res: Response) {
    // 파일 경로 조회
    const latestOne = await this.updateLogService.getLatestOne();
    const filePath = latestOne?.filePath;
    if (!filePath) {
      throw new HttpException(HutomHttpException.NOT_FOUND_UPDATE_LOG_ON_DB, HutomHttpException.NOT_FOUND_UPDATE_LOG_ON_DB.statusCode);
    }
    // 파일 존재 확인
    try {
      await fs.promises.access(filePath);
    } catch (error) {
      throw new HttpException(HutomHttpException.NOT_FOUND_UPDATE_LOG_ON_DISK, HutomHttpException.NOT_FOUND_UPDATE_LOG_ON_DISK.statusCode);
    }
    // 파일 다운로드
    this.loggerService.access(ServiceType.RUS_CLIENT, req.user.employeeId, LogType.DOWNLOAD_FILE, latestOne.fileName);
    return res.download(filePath);
  }
}
