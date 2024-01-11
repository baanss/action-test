import { Injectable, CanActivate, ExecutionContext, HttpException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { Role } from "@src/auth/interface/auth.interface";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { StudyService } from "@src/study/service/study.service";
import { UploadJobService } from "@src/upload-job/service/upload-job.service";
import { AeMode } from "@src/common/constant/enum.constant";

@Injectable()
export class OwnStudyGuard implements CanActivate {
  constructor(private reflector: Reflector, private readonly studyService: StudyService, private readonly uploadJobService: UploadJobService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const studyId = request.params.id;

    // Request Parameter 형식이 잘못된 경우
    if (isNaN(parseInt(studyId))) {
      throw new HttpException(HutomHttpException.INVALID_REQUEST_PARAMETER, HutomHttpException.INVALID_REQUEST_PARAMETER.statusCode);
    }

    // 요청한 Study가 존재하지 않은 경우
    const study = await this.studyService.getOneById(studyId);
    if (!study) {
      throw new HttpException(HutomHttpException.NOT_FOUND_STUDY_WITH_ID, HutomHttpException.NOT_FOUND_STUDY_WITH_ID.statusCode);
    }

    // 대표 계정 요청
    if (request?.user.role === Role.ADMIN) {
      return true;
    }

    // Study의 UploadJob이 존재하지 않는 경우
    if (!study.uploadJobId) {
      return true;
    }

    // Study의 UploadJob이 존재하는 경우, 접근 권한 검사
    const uploadJob = await this.uploadJobService.findById(study.uploadJobId);
    if (!uploadJob) {
      return true;
    }
    if (uploadJob.aeMode === AeMode.SCP) {
      return true;
    }
    if (!uploadJob.userId || request?.user.id === uploadJob.userId) {
      return true;
    }

    throw new HttpException(HutomHttpException.FORBIDDEN_RESOURCE, HutomHttpException.FORBIDDEN_RESOURCE.statusCode);
  }
}
