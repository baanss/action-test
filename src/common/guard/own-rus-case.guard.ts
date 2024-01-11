import { Injectable, CanActivate, ExecutionContext, HttpException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { Role } from "@src/auth/interface/auth.interface";
import { RusCaseService } from "@src/rus-case/service/rus-case.service";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@Injectable()
export class OwnRusCaseGuard implements CanActivate {
  constructor(private reflector: Reflector, private readonly rusCaseService: RusCaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rusCaseId = request.params.id;

    // Request Parameter 형식이 잘못된 경우
    if (isNaN(parseInt(rusCaseId))) {
      throw new HttpException(HutomHttpException.INVALID_REQUEST_PARAMETER, HutomHttpException.INVALID_REQUEST_PARAMETER.statusCode);
    }

    // 요청한 케이스가 존재하지 않은 경우
    const rusCase = await this.rusCaseService.getOneById(rusCaseId);
    if (!rusCase) {
      throw new HttpException(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID, HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID.statusCode);
    }

    // 케이스 접근 권한 검사(일반계정 요청)
    // NOTE: 대표계정은 전체 리소스 접근 가능
    if (request?.user.role === Role.USER && request?.user.id !== rusCase?.user?.id) {
      throw new HttpException(HutomHttpException.FORBIDDEN_RESOURCE, HutomHttpException.FORBIDDEN_RESOURCE.statusCode);
    }

    return true;
  }
}
