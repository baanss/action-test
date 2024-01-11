import * as moment from "moment";
import { Response } from "express";

import { Controller, Get, Query, Req, Res } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { Role } from "@src/auth/interface/auth.interface";
import { Roles } from "@src/common/guard/role.guard";
import { RequestWithUser } from "@src/common/interface/request.interface";
import { LogType, ServiceType } from "@src/common/constant/enum.constant";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { LoggerService } from "@src/logger/logger.service";
import { UtilService } from "@src/util/util.service";

import {
  CreditHistoryCategoryQuery,
  CreditHistorySortQuery,
  GetManyCreditHistoryQueryReq,
} from "@src/credit-history/dto/in/get-many-credit-history-query.request.dto";
import { GetMyCreditHistoryQueryReq } from "@src/credit-history/dto/in/get-my-credit-history-query.request.dto";
import { GetCreditHistoryExportQueryReq } from "@src/credit-history/dto/in/get-credit-history-export-query.request.dto";

import { CreditHistoryBalanceViewDto } from "@src/credit-history/dto/out/credit-history-balance.view.dto";
import { MyCreditHistoryBalanceViewDto } from "@src/credit-history/dto/out/my-credit-history-balance.view.dto";
import { GetAllCreditHistoryRes } from "@src/credit-history/dto/out/get-all-credit-history.response.dto";
import { GetMyCreditHistoryRes } from "@src/credit-history/dto/out/get-my-credit-history.response.dto";

import { CreditHistoryService } from "@src/credit-history/service/credit-history.service";
import { CreditHistoryPagingService } from "@src/credit-history/service/credit-history-paging.service";
import { ExportCreditHistoryService } from "@src/credit-history/service/export-credit-history.service";

@ApiTags("credit-history")
@ApiOriginHeaders()
@Controller("credit-histories")
export class CreditHistoryController {
  constructor(
    private readonly creditHistoryService: CreditHistoryService,
    private readonly creditHistoryPagingService: CreditHistoryPagingService,
    private readonly exportCreditHistoryService: ExportCreditHistoryService,
    private readonly loggerService: LoggerService,
    private readonly utilService: UtilService,
  ) {}

  @Get("me")
  @Roles(Role.ADMIN, Role.USER)
  @ApiCustomOperation({
    summary: "현재 사용자 크레딧 내역 조회",
    description:
      "모든 크레딧 히스토리를 20개씩 최신순으로 가져온다.\n\n자기 자신에 의한 크레딧 내역은 ‘me’로, 다른 사용자에 의한 크레딧 내역은 ‘others’로,\n\nhutom에 의한 크레딧 내역은 ‘hutom’으로 치환 후 전달한다.",
    roles: [Role.ADMIN, Role.USER],
  })
  @ApiUserAuthResponse()
  @ApiResponse({ description: "OK", status: 200, type: GetMyCreditHistoryRes })
  async getMyCreditHistories(@Req() req: RequestWithUser, @Query() getMyCreditHistoryQueryReq: GetMyCreditHistoryQueryReq): Promise<GetMyCreditHistoryRes> {
    const { page = 1, limit = 20 } = getMyCreditHistoryQueryReq;
    const queryDto = { page, limit };
    const [creditHistories, count] = await this.creditHistoryPagingService.getManyAndCount(queryDto);

    return {
      data: MyCreditHistoryBalanceViewDto.fromMany(req.user, creditHistories),
      count,
    };
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "전체 크레딧 내역 조회 및 검색",
    description: "h-Server의 전체 크레딧 내역을 조회한다.",
    roles: [Role.ADMIN],
  })
  @ApiUserAuthResponse()
  @ApiResponse({ description: "OK", status: 200, type: GetAllCreditHistoryRes })
  async getCreditHistoryBalanceViews(
    @Req() req: RequestWithUser,
    @Query() getManyCreditHistoryQueryReq: GetManyCreditHistoryQueryReq,
  ): Promise<GetAllCreditHistoryRes> {
    const {
      page = 1,
      limit = 20,
      categories = [CreditHistoryCategoryQuery.ALL],
      sort = CreditHistorySortQuery.CREATED_AT_DESC,
      employeeId = null,
      name = null,
      startDate = null,
      endDate = null,
    } = getManyCreditHistoryQueryReq;

    const queryDto = {
      page,
      limit,
      categories,
      sort,
      employeeId,
      name,
      startDate,
      endDate,
    };

    if (startDate || endDate) {
      const createdDateRange = this.utilService.getDateRangeQueryParams({ startDate, endDate });
      queryDto["startDate"] = createdDateRange.startDate;
      queryDto["endDate"] = createdDateRange.endDate;
    }

    const [creditHistories, count] = await this.creditHistoryPagingService.getManyAndCount(queryDto);
    return {
      data: CreditHistoryBalanceViewDto.fromMany(creditHistories),
      count,
    };
  }

  @Get("export")
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "크레딧 내역 XLSX 다운로드",
    description: "크레딧 내역을 .xlsx 형식으로 추출하여 다운로드한다.\n\n(날짜 검색이 둘 다 입력되지 않은 경우 - startDate : 일년 전, endDate : 오늘)",
    roles: [Role.ADMIN],
  })
  @ApiUserAuthResponse()
  async exportToXlsx(@Req() req: RequestWithUser, @Query() getCreditHistoryExportQueryReq: GetCreditHistoryExportQueryReq, @Res() res: Response) {
    const {
      employeeId = null,
      name = null,
      categories = [CreditHistoryCategoryQuery.ALL],
      startDate = null,
      endDate = null,
      timezone = "UTC",
    } = getCreditHistoryExportQueryReq;

    const queryDto = {
      page: null,
      limit: -1, // NOTE: 모두 검색하기 위한 option
      employeeId,
      name,
      categories,
      startDate,
      endDate,
    };

    if (startDate || endDate) {
      const createdDateRange = this.utilService.getDateRangeQueryParams({ startDate, endDate });
      queryDto["startDate"] = createdDateRange.startDate;
      queryDto["endDate"] = createdDateRange.endDate;
    }

    // NOTE: 둘 다 입력되지 않은 경우 - startDate : 일년 전, endDate : 오늘
    else {
      queryDto["startDate"] = moment().subtract(1, "y").toISOString();
      queryDto["endDate"] = moment().toISOString();
    }

    const [creditHistories] = await this.creditHistoryPagingService.getManyAndCount(queryDto);
    const xlsx = await this.exportCreditHistoryService.convertToXlsx(creditHistories, { timezone });
    const filename = this.exportCreditHistoryService.createFileName();
    this.loggerService.access(ServiceType.USER, req.user.employeeId, LogType.DOWNLOAD_FILE, filename);

    res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.attachment(filename);
    return res.send(xlsx);
  }
}
