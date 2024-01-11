import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

import { Role } from "@src/auth/interface/auth.interface";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ApiOriginHeaders } from "@src/common/decorator/api-headers.decorator";
import { ApiCustomOperation } from "@src/common/decorator/api-operation.decorator";
import { ApiUserAuthResponse } from "@src/common/decorator/api-user-auth-response.decorator";
import { Roles } from "@src/common/guard/role.guard";
import {
  DeleteSurgeonBodyReq,
  DeleteSurgeonRes,
  GetAllSurgeonQueryReq,
  GetAllSurgeonRes,
  GetSurgeonRes,
  PatchSurgeonBodyReq,
  PatchSurgeonRes,
  PostSurgeonReq,
  PostSurgeonRes,
} from "@src/surgeon/dto";
import { SurgeonService } from "@src/surgeon/service/surgeon.service";
import { SurgeonDto } from "@src/surgeon/dto/surgeon.dto";

@ApiTags("surgeon")
@ApiOriginHeaders()
@Controller("surgeons")
export class SurgeonController {
  constructor(private readonly surgeonService: SurgeonService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiCustomOperation({
    summary: "Surgeon 생성",
    description: "Surgeon 생성한다.",
    roles: [Role.ADMIN],
  })
  @ApiBody({ type: PostSurgeonReq })
  @ApiResponse({ description: "Created", status: 201, type: PostSurgeonRes })
  @ApiUserAuthResponse({
    examples: {
      DUPLICATED_DATA: {
        description: "name 중복된 경우",
        value: HutomHttpException.DUPLICATED_DATA,
      },
    },
  })
  async createOne(@Body() body: PostSurgeonReq): Promise<PostSurgeonRes> {
    const result = await this.surgeonService.createOne(body.name);
    return result;
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  @ApiCustomOperation({ summary: "모든 Surgeon 조회", description: "모든 Surgeon 목록을 조회한다.(기본 정렬: name, ASC)", roles: [Role.USER, Role.ADMIN] })
  @ApiResponse({ description: "OK", status: 200, type: GetAllSurgeonRes })
  @ApiUserAuthResponse()
  async getManyAndCount(@Query() query: GetAllSurgeonQueryReq): Promise<GetAllSurgeonRes> {
    const { limit = 20, page = 1 } = query;
    const [surgeons, count] = await this.surgeonService.getManyAndCount({ limit, page });
    return { count, data: SurgeonDto.fromMany(surgeons) };
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  @ApiCustomOperation({ summary: "특정 Surgeon 조회", description: "특정 Surgeon 조회한다.", roles: [Role.ADMIN] })
  @ApiResponse({ description: "OK", status: 200, type: GetSurgeonRes })
  @ApiUserAuthResponse({
    examples: {
      NOT_FOUND_DATA: {
        description: "요청한 데이터가 존재하지 않음",
        value: HutomHttpException.NOT_FOUND_DATA,
      },
    },
  })
  async getOne(@Param("id") id: number): Promise<GetSurgeonRes> {
    const surgeon = await this.surgeonService.getOneById(id);
    return GetSurgeonRes.from(surgeon);
  }

  @Patch(":id")
  @Roles(Role.ADMIN)
  @ApiCustomOperation({ summary: "특정 Surgeon 수정", description: "특정 Surgeon을 수정한다.", roles: [Role.ADMIN] })
  @ApiBody({ type: PatchSurgeonBodyReq })
  @ApiResponse({ description: "OK", status: 200, type: PatchSurgeonRes })
  @ApiUserAuthResponse({
    examples: {
      DUPLICATED_DATA: {
        description: "name 중복된 경우",
        value: HutomHttpException.DUPLICATED_DATA,
      },
      UPDATE_DATA_ERROR: {
        description: "업데이트 실패",
        value: HutomHttpException.UPDATE_DATA_ERROR,
      },
    },
  })
  async updateOne(@Param("id") id: number, @Body() body: PatchSurgeonBodyReq): Promise<PatchSurgeonRes> {
    const result = await this.surgeonService.updateOneById(id, body);
    return { id: result.id };
  }

  @Post("delete")
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiCustomOperation({ summary: "Surgeon 삭제", description: "특정 Surgeon을 삭제한다.", roles: [Role.ADMIN] })
  @ApiBody({ type: DeleteSurgeonBodyReq })
  @ApiResponse({ description: "OK", status: 200, type: DeleteSurgeonRes })
  @ApiUserAuthResponse()
  async deleteMany(@Body() body: DeleteSurgeonBodyReq): Promise<DeleteSurgeonRes> {
    const result = await this.surgeonService.deleteMany(body.ids);
    return { affected: result.affected };
  }
}
