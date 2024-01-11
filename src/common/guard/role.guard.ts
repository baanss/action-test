import { Reflector } from "@nestjs/core";
import { Injectable, CanActivate, ExecutionContext, SetMetadata, HttpException } from "@nestjs/common";

import { Role } from "@src/auth/interface/auth.interface";
import { RequestWithUser } from "@src/common/interface/request.interface";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler());

    // Roles Guard 설정이 안 되어 있는 엔드포인트의 경우 PASS
    if (!requiredRoles) {
      return true;
    }

    // req.user.role 검증
    const req: RequestWithUser = context.switchToHttp().getRequest();
    if (requiredRoles.includes(req.user?.role)) {
      return true;
    } else {
      throw new HttpException(HutomHttpException.FORBIDDEN_RESOURCE, HutomHttpException.FORBIDDEN_RESOURCE.statusCode);
    }
  }
}
