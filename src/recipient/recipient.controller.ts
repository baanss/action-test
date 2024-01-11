import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Post, Req } from "@nestjs/common";

import { Roles } from "@src/common/guard/role.guard";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { RecipientService } from "@src/recipient/service/recipient.service";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { RequestWithUser } from "@src/common/interface/request.interface";

import { GetAllRecipientRes, GetAllRecipientViewDto, PostRecipientsReq, PostRecipientsRes } from "@src/recipient/dto";
import { Role } from "@src/auth/interface/auth.interface";

@ApiTags("recipient")
@ApiOriginHeaders()
@Controller("recipients")
export class RecipientController {
  constructor(private readonly recipientService: RecipientService) {}

  @Get()
  @Roles(Role.ADMIN, Role.USER)
  @ApiCustomOperation({
    summary: "모든 Recipient 조회",
    description: "사용자의 모든 Recipient를 조회한다. (정렬 기준: 생성일, 오름차순)",
    roles: [Role.ADMIN, Role.USER],
  })
  @ApiUserAuthResponse()
  @ApiResponse({ description: "OK", status: 200, type: GetAllRecipientRes })
  async getAllRecipients(@Req() req: RequestWithUser): Promise<GetAllRecipientRes> {
    const [recipients, count] = await this.recipientService.getOwnAllAndCount(req.user.id);
    return {
      count,
      myEmail: req.user.email,
      data: GetAllRecipientViewDto.fromMany(recipients),
    };
  }

  @Post()
  @Roles(Role.ADMIN, Role.USER)
  @ApiCustomOperation({
    summary: "Recipient 생성 및 수정",
    description: "Recipient를 생성 및 수정한다.",
    roles: [Role.ADMIN, Role.USER],
  })
  @ApiUserAuthResponse({
    examples: {
      DUPLICATED_DATA: {
        description: "중복된 email값이 입력됨",
        value: HutomHttpException.DUPLICATED_DATA,
      },
    },
  })
  @ApiResponse({ description: "OK", status: 200, type: PostRecipientsRes })
  async updateRecipients(@Req() req: RequestWithUser, @Body() postRecipientsReq: PostRecipientsReq): Promise<PostRecipientsRes> {
    const { enableEmail = req.user.enableEmail, recipients = null } = postRecipientsReq;

    const requestBodyDto = {
      enableEmail,
      recipients,
    };

    const { ids, enableEmail: updatedEnableEmail } = await this.recipientService.updateOwnRecipients(req.user, requestBodyDto);
    return {
      ids,
      meta: {
        enableEmail: updatedEnableEmail,
      },
    };
  }
}
