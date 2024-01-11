import { IsString } from "class-validator";

export class PostEmailSleepUserReq {
  @IsString()
  serverCode: string;

  @IsString()
  targetEmail: string;

  @IsString()
  scheduledDeletionDate: string;
}
