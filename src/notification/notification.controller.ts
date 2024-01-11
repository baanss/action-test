import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { Roles } from "@src/common/guard/role.guard";
import { RequestWithUser } from "@src/common/interface/request.interface";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";

import { Role } from "@src/auth/interface/auth.interface";

import { NotiListView } from "@src/notification/dto/out/noti-list-view.dto";
import { GetMyNotiQuery } from "@src/notification/dto/in/get-my-noti-query";
import { GetMyNotisRes } from "@src/notification/dto/out/get-my-notis-res.dto";
import { GetUnreadCountNotiRes } from "@src/notification/dto/out/get-unread-count-noti-res.dto";

import { NotificationService } from "@src/notification/service/notification.service";

@ApiTags("notifications")
@ApiOriginHeaders()
@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "모든 알림 조회",
    description: "요청을 보낸 사용자의 알림을 N개씩 조회한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiUserAuthResponse()
  @ApiOkResponse({ type: GetMyNotisRes })
  async getAllNotifications(@Req() req: RequestWithUser, @Query() getMyNotiQuery: GetMyNotiQuery): Promise<GetMyNotisRes> {
    const { page = 1, limit = 6 } = getMyNotiQuery;
    const queryDto = {
      page,
      limit,
    };
    const [notifications, count] = await this.notificationService.getMyNotiAndCountByUserId(req.user.id, queryDto);

    return {
      data: NotiListView.from(notifications),
      count,
    };
  }

  @Get("unread-count")
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({
    summary: "읽지 않은 알림 개수 조회",
    description: "요청한 사용자의 읽지 않은 알림의 개수를 조회한다.",
    roles: [Role.USER, Role.ADMIN],
  })
  @ApiUserAuthResponse()
  @ApiOkResponse({ type: GetUnreadCountNotiRes })
  getUnreadCount(@Req() req: RequestWithUser): Promise<GetUnreadCountNotiRes> {
    return this.notificationService.getUnreadCountByUserId(req.user.id);
  }
}
